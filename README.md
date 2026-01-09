# @pokemon-omnilink/arktosmos-showdown

A standalone Pokemon battle simulator - a complete extraction of battle logic without external dependencies.

## Features

- Complete turn-based Pokemon battle simulation
- Type effectiveness and damage calculations
- Status conditions (burn, paralysis, sleep, freeze, poison, toxic)
- Ability effects and triggering
- STAB, critical hits, and secondary move effects
- Pokemon switching mechanics
- Battle streams for real-time event handling
- Team packing/unpacking utilities
- Full Pokemon data access (Dex)

## Installation

```bash
npm install @pokemon-omnilink/arktosmos-showdown
```

## Usage

### Basic Battle

```typescript
import { Battle, BattleStream, getPlayerStreams, Teams, Dex } from '@pokemon-omnilink/arktosmos-showdown';

// Create a battle stream
const stream = new BattleStream();
const streams = getPlayerStreams(stream);

// Start the battle
stream.write('>start {"formatid":"gen9randombattle"}');

// Add players with teams
const team1 = Teams.pack([{
  species: 'Pikachu',
  ability: 'Static',
  moves: ['thunderbolt', 'quickattack', 'irontail', 'voltswitch'],
  level: 50,
}]);

const team2 = Teams.pack([{
  species: 'Charizard',
  ability: 'Blaze',
  moves: ['flamethrower', 'airslash', 'dragonpulse', 'roost'],
  level: 50,
}]);

stream.write(`>player p1 {"name":"Player 1","team":"${team1}"}`);
stream.write(`>player p2 {"name":"Player 2","team":"${team2}"}`);
```

### Using the Dex

```typescript
import { Dex } from '@pokemon-omnilink/arktosmos-showdown';

// Get Pokemon data
const pikachu = Dex.species.get('pikachu');
console.log(pikachu.baseStats); // { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }

// Get move data
const thunderbolt = Dex.moves.get('thunderbolt');
console.log(thunderbolt.basePower); // 90
console.log(thunderbolt.type); // 'Electric'

// Get ability data
const staticAbility = Dex.abilities.get('static');
console.log(staticAbility.name); // 'Static'

// Get type effectiveness
const typeChart = Dex.types.get('Electric');
console.log(typeChart.damageTaken); // { Ground: 1, ... }
```

### Team Packing/Unpacking

```typescript
import { Teams } from '@pokemon-omnilink/arktosmos-showdown';

// Create a team
const team = [{
  species: 'Garchomp',
  ability: 'Rough Skin',
  item: 'Choice Scarf',
  nature: 'Jolly',
  evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
  moves: ['earthquake', 'outrage', 'stoneedge', 'firefang'],
}];

// Pack team to string format
const packed = Teams.pack(team);

// Unpack back to object
const unpacked = Teams.unpack(packed);
```

### Deterministic RNG

```typescript
import { PRNG } from '@pokemon-omnilink/arktosmos-showdown';

// Create PRNG with seed for reproducible battles
const prng = new PRNG([1, 2, 3, 4]);

// Generate random numbers
const random = prng.next(); // 0-1 float
const damage = prng.randomChance(85, 100); // 85% chance
```

### ID Normalization

```typescript
import { toID } from '@pokemon-omnilink/arktosmos-showdown';

toID('Pikachu');        // 'pikachu'
toID('Mr. Mime');       // 'mrmime'
toID('Flamethrower');   // 'flamethrower'
```

## API Reference

### Core Exports

| Export | Description |
|--------|-------------|
| `Battle` | Main battle simulation class |
| `BattleStream` | Stream-based battle interface |
| `getPlayerStreams` | Get player input/output streams |
| `PRNG` | Seeded pseudo-random number generator |
| `Dex` | Pokemon data access (species, moves, abilities, items, etc.) |
| `Teams` | Team packing/unpacking utilities |
| `toID` | Normalize strings to IDs |

### Type Exports

The package exports TypeScript types for all data structures:

- `PokemonSet` - Pokemon team member definition
- `SpeciesData`, `MoveData`, `AbilityData`, `ItemData` - Data types
- `StatsTable`, `BoostsTable` - Stat structures
- `TypeName`, `StatusName`, `NatureName` - String literal types
- And more...

## Compatibility

- **Node.js**: CommonJS and ESM supported
- **Browser**: Works with any modern bundler (Vite, Webpack, esbuild, etc.)
- **TypeScript**: Full type definitions included

## License

MIT
