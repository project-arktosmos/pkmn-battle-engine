/**
 * Teams - Team packing, unpacking, import, and export utilities
 */

import { toID } from '../utils/id';
import { Dex } from '../dex/dex';
import type { PokemonSet, StatsTable, StatID } from '../types';

/**
 * Pack a name by removing non-alphanumeric characters (but keeping case)
 */
function packName(name: string | undefined | null): string {
  if (!name) return '';
  return name.replace(/[^A-Za-z0-9]+/g, '');
}

/**
 * Unpack a name - try to find the proper name from Dex, or format it nicely
 */
function unpackName(name: string, dexTable?: { get: (name: string) => { exists: boolean; name: string } }): string {
  if (!name) return '';
  if (dexTable) {
    const obj = dexTable.get(name);
    if (obj.exists) return obj.name;
  }
  return name.replace(/([0-9]+)/g, ' $1 ').replace(/([A-Z])/g, ' $1').replace(/[ ][ ]/g, ' ').trim();
}

class TeamsClass {
  /**
   * Pack a team into a compact string format
   */
  pack(team: PokemonSet[] | null): string {
    if (!team) return '';

    const getIv = (ivs: StatsTable, s: StatID): string => {
      return ivs[s] === 31 || ivs[s] === undefined ? '' : ivs[s].toString();
    };

    let buf = '';
    for (const set of team) {
      if (buf) buf += ']';

      // name
      buf += (set.name || set.species);

      // species
      const id = packName(set.species || set.name);
      buf += `|${packName(set.name || set.species) === id ? '' : id}`;

      // item
      buf += `|${packName(set.item)}`;

      // ability
      buf += `|${packName(set.ability)}`;

      // moves
      buf += '|' + set.moves.map(packName).join(',');

      // nature
      buf += `|${set.nature || ''}`;

      // evs
      let evs = '|';
      if (set.evs) {
        evs = `|${set.evs.hp || ''},${set.evs.atk || ''},${set.evs.def || ''},` +
          `${set.evs.spa || ''},${set.evs.spd || ''},${set.evs.spe || ''}`;
      }
      if (evs === '|,,,,,') {
        buf += '|';
      } else {
        buf += evs;
      }

      // gender
      if (set.gender) {
        buf += `|${set.gender}`;
      } else {
        buf += '|';
      }

      // ivs
      let ivs = '|';
      if (set.ivs) {
        ivs = `|${getIv(set.ivs, 'hp')},${getIv(set.ivs, 'atk')},${getIv(set.ivs, 'def')},` +
          `${getIv(set.ivs, 'spa')},${getIv(set.ivs, 'spd')},${getIv(set.ivs, 'spe')}`;
      }
      if (ivs === '|,,,,,') {
        buf += '|';
      } else {
        buf += ivs;
      }

      // shiny
      if (set.shiny) {
        buf += '|S';
      } else {
        buf += '|';
      }

      // level
      if (set.level && set.level !== 100) {
        buf += `|${set.level}`;
      } else {
        buf += '|';
      }

      // happiness
      if (set.happiness !== undefined && set.happiness !== 255) {
        buf += `|${set.happiness}`;
      } else {
        buf += '|';
      }

      if (set.pokeball || set.hpType || set.gigantamax ||
        (set.dynamaxLevel !== undefined && set.dynamaxLevel !== 10) || set.teraType) {
        buf += `,${set.hpType || ''}`;
        buf += `,${packName(set.pokeball || '')}`;
        buf += `,${set.gigantamax ? 'G' : ''}`;
        buf += `,${set.dynamaxLevel !== undefined && set.dynamaxLevel !== 10 ? set.dynamaxLevel : ''}`;
        buf += `,${set.teraType || ''}`;
      }
    }

    return buf;
  }

  /**
   * Unpack a packed team string back to PokemonSet array
   */
  unpack(buf: string): PokemonSet[] | null {
    if (!buf) return null;
    if (typeof buf !== 'string') return buf as any;

    // Handle JSON format
    if (buf.startsWith('[') && buf.endsWith(']')) {
      try {
        buf = this.pack(JSON.parse(buf));
      } catch {
        return null;
      }
    }

    const team: PokemonSet[] = [];
    let i = 0;
    let j = 0;

    // Limit to 24 Pokemon max
    for (let count = 0; count < 24; count++) {
      const set: PokemonSet = {} as PokemonSet;
      team.push(set);

      // name
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      set.name = buf.substring(i, j);
      i = j + 1;

      // species
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      set.species = unpackName(buf.substring(i, j), Dex.species) || set.name;
      i = j + 1;

      // item
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      set.item = unpackName(buf.substring(i, j), Dex.items);
      i = j + 1;

      // ability
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      const ability = buf.substring(i, j);
      const species = Dex.species.get(set.species);
      if (['', '0', '1', 'H', 'S'].includes(ability)) {
        set.ability = species.abilities[(ability || '0') as keyof typeof species.abilities] || '';
      } else {
        set.ability = unpackName(ability, Dex.abilities);
      }
      i = j + 1;

      // moves
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      set.moves = buf.substring(i, j).split(',').slice(0, 24).map(name => unpackName(name, Dex.moves));
      i = j + 1;

      // nature
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      set.nature = unpackName(buf.substring(i, j), Dex.natures);
      i = j + 1;

      // evs
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      if (j !== i) {
        const evs = buf.substring(i, j).split(',').slice(0, 6);
        set.evs = {
          hp: Number(evs[0]) || 0,
          atk: Number(evs[1]) || 0,
          def: Number(evs[2]) || 0,
          spa: Number(evs[3]) || 0,
          spd: Number(evs[4]) || 0,
          spe: Number(evs[5]) || 0,
        };
      }
      i = j + 1;

      // gender
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      if (i !== j) set.gender = buf.substring(i, j);
      i = j + 1;

      // ivs
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      if (j !== i) {
        const ivs = buf.substring(i, j).split(',').slice(0, 6);
        set.ivs = {
          hp: ivs[0] === '' ? 31 : Number(ivs[0]) || 0,
          atk: ivs[1] === '' ? 31 : Number(ivs[1]) || 0,
          def: ivs[2] === '' ? 31 : Number(ivs[2]) || 0,
          spa: ivs[3] === '' ? 31 : Number(ivs[3]) || 0,
          spd: ivs[4] === '' ? 31 : Number(ivs[4]) || 0,
          spe: ivs[5] === '' ? 31 : Number(ivs[5]) || 0,
        };
      }
      i = j + 1;

      // shiny
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      if (i !== j) set.shiny = true;
      i = j + 1;

      // level
      j = buf.indexOf('|', i);
      if (j < 0) return null;
      if (i !== j) set.level = parseInt(buf.substring(i, j));
      i = j + 1;

      // happiness and misc
      j = buf.indexOf(']', i);
      let misc;
      if (j < 0) {
        if (i < buf.length) misc = buf.substring(i).split(',').slice(0, 6);
      } else {
        if (i !== j) misc = buf.substring(i, j).split(',').slice(0, 6);
      }
      if (misc) {
        set.happiness = misc[0] ? Number(misc[0]) : 255;
        set.hpType = misc[1] || '';
        set.pokeball = unpackName(misc[2] || '', Dex.items);
        set.gigantamax = !!misc[3];
        set.dynamaxLevel = misc[4] ? Number(misc[4]) : 10;
        set.teraType = misc[5];
      }
      if (j < 0) break;
      i = j + 1;
    }

    return team;
  }

  /**
   * Export a team to human-readable Pokemon Showdown format
   */
  export(team: PokemonSet[], options?: { hideStats?: boolean }): string {
    let output = '';
    for (const set of team) {
      output += this.exportSet(set, options) + '\n';
    }
    return output;
  }

  /**
   * Export a single Pokemon set
   */
  exportSet(set: PokemonSet, { hideStats }: { hideStats?: boolean } = {}): string {
    let out = '';

    // Name and species
    if (set.name && set.name !== set.species) {
      out += `${set.name} (${set.species})`;
    } else {
      out += set.species;
    }
    if (set.gender === 'M') out += ' (M)';
    if (set.gender === 'F') out += ' (F)';
    if (set.item) out += ` @ ${set.item}`;
    out += '  \n';

    if (set.ability) {
      out += `Ability: ${set.ability}  \n`;
    }

    // Details
    if (set.level && set.level !== 100) {
      out += `Level: ${set.level}  \n`;
    }
    if (set.shiny) {
      out += 'Shiny: Yes  \n';
    }
    if (typeof set.happiness === 'number' && set.happiness !== 255 && !isNaN(set.happiness)) {
      out += `Happiness: ${set.happiness}  \n`;
    }
    if (set.pokeball) {
      out += `Pokeball: ${set.pokeball}  \n`;
    }
    if (set.hpType) {
      out += `Hidden Power: ${set.hpType}  \n`;
    }
    if (typeof set.dynamaxLevel === 'number' && set.dynamaxLevel !== 10 && !isNaN(set.dynamaxLevel)) {
      out += `Dynamax Level: ${set.dynamaxLevel}  \n`;
    }
    if (set.gigantamax) {
      out += 'Gigantamax: Yes  \n';
    }
    if (set.teraType) {
      out += `Tera Type: ${set.teraType}  \n`;
    }

    // Stats
    if (!hideStats) {
      if (set.evs) {
        const stats = Dex.stats.ids()
          .map(stat => set.evs[stat] ? `${set.evs[stat]} ${Dex.stats.shortNames[stat]}` : '')
          .filter(Boolean);
        if (stats.length) {
          out += `EVs: ${stats.join(' / ')}  \n`;
        }
      }
      if (set.nature) {
        out += `${set.nature} Nature  \n`;
      }
      if (set.ivs) {
        const stats = Dex.stats.ids()
          .map(stat => (set.ivs[stat] !== 31 && set.ivs[stat] !== undefined) ?
            `${set.ivs[stat] || 0} ${Dex.stats.shortNames[stat]}` : '')
          .filter(Boolean);
        if (stats.length) {
          out += `IVs: ${stats.join(' / ')}  \n`;
        }
      }
    }

    // Moves
    for (let move of set.moves) {
      if (move.startsWith('Hidden Power ') && move.charAt(13) !== '[') {
        move = `Hidden Power [${move.slice(13)}]`;
      }
      out += `- ${move}  \n`;
    }

    return out;
  }

  /**
   * Import a team from various formats (JSON, packed, or Showdown text format)
   */
  import(buffer: string, aggressive?: boolean): PokemonSet[] | null {
    const sanitize = aggressive ? toID : Dex.getName;

    // Handle JSON format
    if (buffer.startsWith('[')) {
      try {
        const team = JSON.parse(buffer);
        if (!Array.isArray(team)) throw new Error('Team should be an Array');
        for (const set of team) {
          set.name = sanitize(set.name);
          set.species = sanitize(set.species);
          set.item = sanitize(set.item);
          set.ability = sanitize(set.ability);
          set.gender = sanitize(set.gender);
          set.nature = sanitize(set.nature);
          const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
          if (set.evs) {
            for (const statid of Object.keys(evs) as StatID[]) {
              if (typeof set.evs[statid] === 'number') evs[statid] = set.evs[statid];
            }
          }
          set.evs = evs;
          const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
          if (set.ivs) {
            for (const statid of Object.keys(ivs) as StatID[]) {
              if (typeof set.ivs[statid] === 'number') ivs[statid] = set.ivs[statid];
            }
          }
          set.ivs = ivs;
          if (!Array.isArray(set.moves)) {
            set.moves = [];
          } else {
            set.moves = set.moves.map(sanitize);
          }
        }
        return team;
      } catch {
        // Fall through to text parsing
      }
    }

    const lines = buffer.split('\n');

    const sets: PokemonSet[] = [];
    let curSet: PokemonSet | null = null;

    while (lines.length && !lines[0]) lines.shift();
    while (lines.length && !lines[lines.length - 1]) lines.pop();

    // Check for packed format
    if (lines.length === 1 && lines[0].includes('|')) {
      return this.unpack(lines[0]);
    }

    for (let line of lines) {
      line = line.trim();
      if (line === '' || line === '---') {
        curSet = null;
      } else if (line.startsWith('===')) {
        // Team backup format; ignore
      } else if (!curSet) {
        curSet = {
          name: '',
          species: '',
          item: '',
          ability: '',
          gender: '',
          nature: '',
          evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 100,
          moves: [],
        };
        sets.push(curSet);
        this.parseExportedTeamLine(line, true, curSet, aggressive);
      } else {
        this.parseExportedTeamLine(line, false, curSet, aggressive);
      }
    }

    return sets;
  }

  /**
   * Parse a single line from an exported team
   */
  private parseExportedTeamLine(line: string, isFirstLine: boolean, set: PokemonSet, aggressive?: boolean): void {
    if (isFirstLine) {
      let item;
      [line, item] = line.split(' @ ');
      if (item) {
        set.item = item;
        if (toID(set.item) === 'noitem') set.item = '';
      }
      if (line.endsWith(' (M)')) {
        set.gender = 'M';
        line = line.slice(0, -4);
      }
      if (line.endsWith(' (F)')) {
        set.gender = 'F';
        line = line.slice(0, -4);
      }
      if (line.endsWith(')') && line.includes('(')) {
        const [name, species] = line.slice(0, -1).split('(');
        set.species = Dex.species.get(species).name;
        set.name = name.trim();
      } else {
        set.species = Dex.species.get(line).name;
        set.name = '';
      }
    } else if (line.startsWith('Trait: ')) {
      line = line.slice(7);
      set.ability = aggressive ? toID(line) : line;
    } else if (line.startsWith('Ability: ')) {
      line = line.slice(9);
      set.ability = aggressive ? toID(line) : line;
    } else if (line === 'Shiny: Yes') {
      set.shiny = true;
    } else if (line.startsWith('Level: ')) {
      line = line.slice(7);
      set.level = +line;
    } else if (line.startsWith('Happiness: ')) {
      line = line.slice(11);
      set.happiness = +line;
    } else if (line.startsWith('Pokeball: ')) {
      line = line.slice(10);
      set.pokeball = aggressive ? toID(line) : line;
    } else if (line.startsWith('Hidden Power: ')) {
      line = line.slice(14);
      set.hpType = aggressive ? toID(line) : line;
    } else if (line.startsWith('Tera Type: ')) {
      line = line.slice(11);
      set.teraType = aggressive ? line.replace(/[^a-zA-Z0-9]/g, '') : line;
    } else if (line === 'Gigantamax: Yes') {
      set.gigantamax = true;
    } else if (line.startsWith('EVs: ')) {
      line = line.slice(5);
      const evLines = line.split('/');
      set.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      for (const evLine of evLines) {
        const [statValue, statName] = evLine.trim().split(' ');
        const statid = Dex.stats.getID(statName);
        if (!statid) continue;
        set.evs[statid] = parseInt(statValue);
      }
    } else if (line.startsWith('IVs: ')) {
      line = line.slice(5);
      const ivLines = line.split('/');
      set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
      for (const ivLine of ivLines) {
        const [statValue, statName] = ivLine.trim().split(' ');
        const statid = Dex.stats.getID(statName);
        if (!statid) continue;
        let value = parseInt(statValue);
        if (isNaN(value)) value = 31;
        set.ivs[statid] = value;
      }
    } else if (/^[A-Za-z]+ (N|n)ature/.test(line)) {
      let natureIndex = line.indexOf(' Nature');
      if (natureIndex === -1) natureIndex = line.indexOf(' nature');
      if (natureIndex === -1) return;
      line = line.substring(0, natureIndex);
      if (line !== 'undefined') set.nature = aggressive ? toID(line) : line;
    } else if (line.startsWith('-') || line.startsWith('~')) {
      line = line.slice(line.charAt(1) === ' ' ? 2 : 1);
      if (line.startsWith('Hidden Power [')) {
        const hpType = line.slice(14, -1);
        line = 'Hidden Power ' + hpType;
        if (!set.ivs && Dex.types.isName(hpType)) {
          set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
          const typeData = Dex.types.get(hpType);
          const hpIVs = typeData.HPivs || {};
          for (const statid of Object.keys(hpIVs) as StatID[]) {
            set.ivs[statid] = hpIVs[statid] as number;
          }
        }
      }
      if (line === 'Frustration' && set.happiness === undefined) {
        set.happiness = 0;
      }
      set.moves.push(line);
    }
  }
}

export const Teams = new TeamsClass();
