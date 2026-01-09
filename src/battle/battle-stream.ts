/**
 * BattleStream - Stream-based battle interface
 *
 * Provides an async stream interface for interacting with battles.
 */

import { ObjectReadWriteStream, ObjectReadStream } from './streams';
import { Battle, extractChannelMessages, type BattleOptions, type PlayerOptions } from './battle';
import { Teams } from '../teams/teams';
import type { SideID, PRNGSeed } from '../types';

/**
 * Split a string at the first occurrence of delimiter
 */
function splitFirst(str: string, delimiter: string, limit = 1): string[] {
  const result: string[] = [];
  while (result.length < limit) {
    const index = str.indexOf(delimiter);
    if (index >= 0) {
      result.push(str.slice(0, index));
      str = str.slice(index + delimiter.length);
    } else {
      result.push(str);
      str = '';
    }
  }
  result.push(str);
  return result;
}

/**
 * BattleStream - main stream interface for battles
 */
export class BattleStream extends ObjectReadWriteStream<string> {
  debug: boolean;
  noCatch: boolean;
  replay: boolean | 'spectator';
  keepAlive: boolean;
  battle: Battle | null;

  constructor(options: {
    debug?: boolean;
    noCatch?: boolean;
    keepAlive?: boolean;
    replay?: boolean | 'spectator';
  } = {}) {
    super();
    this.debug = !!options.debug;
    this.noCatch = !!options.noCatch;
    this.replay = options.replay || false;
    this.keepAlive = !!options.keepAlive;
    this.battle = null;
  }

  override _write(chunk: string): void {
    if (this.noCatch) {
      this._writeLines(chunk);
    } else {
      try {
        this._writeLines(chunk);
      } catch (err: any) {
        this.pushError(err, true);
        return;
      }
    }
    if (this.battle) this.battle.sendUpdates();
  }

  private _writeLines(chunk: string): void {
    for (const line of chunk.split('\n')) {
      if (line.startsWith('>')) {
        const [type, message] = splitFirst(line.slice(1), ' ');
        this._writeLine(type, message);
      }
    }
  }

  private pushMessage(type: string, data: string): void {
    if (this.replay) {
      if (type === 'update') {
        if (this.replay === 'spectator') {
          const channelMessages = extractChannelMessages(data, [0]);
          this.push(channelMessages[0].join('\n'));
        } else {
          const channelMessages = extractChannelMessages(data, [-1]);
          this.push(channelMessages[-1].join('\n'));
        }
      }
      return;
    }
    this.push(`${type}\n${data}`);
  }

  private _writeLine(type: string, message: string): void {
    switch (type) {
      case 'start': {
        const options: BattleOptions = JSON.parse(message);
        options.send = (t: string, data: string | string[]) => {
          if (Array.isArray(data)) data = data.join('\n');
          this.pushMessage(t, data);
          if (t === 'end' && !this.keepAlive) this.pushEnd();
        };
        if (this.debug) options.debug = true;
        this.battle = new Battle(options);
        break;
      }
      case 'player': {
        const [slot, optionsText] = splitFirst(message, ' ');
        const options: PlayerOptions = JSON.parse(optionsText);
        this.battle!.setPlayer(slot as SideID, options);
        break;
      }
      case 'p1':
      case 'p2':
      case 'p3':
      case 'p4':
        if (message === 'undo') {
          this.battle!.undoChoice(type as SideID);
        } else {
          this.battle!.choose(type as SideID, message);
        }
        break;
      case 'forcewin':
      case 'forcetie':
        this.battle!.win(type === 'forcewin' ? message as SideID : null);
        if (message) {
          this.battle!.inputLog.push(`>forcewin ${message}`);
        } else {
          this.battle!.inputLog.push(`>forcetie`);
        }
        break;
      case 'forcelose':
        this.battle!.lose(message as SideID);
        this.battle!.inputLog.push(`>forcelose ${message}`);
        break;
      case 'reseed':
        this.battle!.resetRNG(message as PRNGSeed | string);
        this.battle!.inputLog.push(`>reseed ${this.battle!.prng.getSeed()}`);
        break;
      case 'requestlog':
        this.push(`requesteddata\n${this.battle!.inputLog.join('\n')}`);
        break;
      case 'requestteam': {
        message = message.trim();
        const slotNum = parseInt(message.slice(1)) - 1;
        if (isNaN(slotNum) || slotNum < 0) {
          throw new Error(`Team requested for slot ${message}, but that slot does not exist.`);
        }
        const side = this.battle!.sides[slotNum];
        const team = Teams.pack(side.pokemon.map(p => p.set));
        this.push(`requesteddata\n${team}`);
        break;
      }
      case 'version':
      case 'version-origin':
        // Ignore version messages
        break;
      default:
        throw new Error(`Unrecognized command ">${type} ${message}"`);
    }
  }

  protected override _writeEnd(): void {
    if (!this.atEOF) this.pushEnd();
    this._destroy();
  }

  protected override _destroy(): void {
    if (this.battle) this.battle.destroy();
  }
}

/**
 * Split a BattleStream into separate player streams
 */
export function getPlayerStreams(stream: BattleStream) {
  const streams = {
    omniscient: new ObjectReadWriteStream<string>(),
    spectator: new ObjectReadStream<string>(),
    p1: new ObjectReadWriteStream<string>(),
    p2: new ObjectReadWriteStream<string>(),
    p3: new ObjectReadWriteStream<string>(),
    p4: new ObjectReadWriteStream<string>(),
  };

  // Override write methods to forward to main stream
  const originalOmniscientWrite = streams.omniscient._write.bind(streams.omniscient);
  streams.omniscient._write = (data: string) => {
    stream.write(data);
    originalOmniscientWrite(data);
  };

  const createPlayerWrite = (playerId: SideID) => {
    return (data: string) => {
      stream.write(data.replace(/(^|\n)/g, `$1>${playerId} `));
    };
  };

  (streams.p1 as any)._write = createPlayerWrite('p1');
  (streams.p2 as any)._write = createPlayerWrite('p2');
  (streams.p3 as any)._write = createPlayerWrite('p3');
  (streams.p4 as any)._write = createPlayerWrite('p4');

  // Process messages from main stream
  (async () => {
    try {
      for await (const chunk of stream) {
        const [type, data] = splitFirst(chunk, '\n');

        switch (type) {
          case 'update': {
            const channelMessages = extractChannelMessages(data, [-1, 0, 1, 2, 3, 4]);
            streams.omniscient.push(channelMessages[-1].join('\n'));
            streams.spectator.push(channelMessages[0].join('\n'));
            streams.p1.push(channelMessages[1].join('\n'));
            streams.p2.push(channelMessages[2].join('\n'));
            streams.p3.push(channelMessages[3].join('\n'));
            streams.p4.push(channelMessages[4].join('\n'));
            break;
          }
          case 'sideupdate': {
            const [side, sideData] = splitFirst(data, '\n');
            const sideStream = streams[side as keyof typeof streams];
            if (sideStream && 'push' in sideStream) {
              sideStream.push(sideData);
            }
            break;
          }
          case 'end':
            // End of battle
            break;
        }
      }
    } catch (err) {
      // Stream error
    }

    // Close all streams
    for (const s of Object.values(streams)) {
      s.pushEnd();
    }
  })().catch(err => {
    for (const s of Object.values(streams)) {
      s.pushError(err, true);
    }
  });

  return streams;
}
