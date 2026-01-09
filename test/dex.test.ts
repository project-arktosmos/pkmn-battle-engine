import { describe, it, expect } from 'vitest';
import { Dex } from '../src/index';

describe('Dex API - Pokedex', () => {
  describe('Species', () => {
    it('should get Pikachu species data', () => {
      const pikachu = Dex.species.get('Pikachu');
      expect(pikachu).toBeDefined();
      expect(pikachu.name).toBe('Pikachu');
      expect(pikachu.num).toBe(25);
      expect(pikachu.types).toEqual(['Electric']);
      expect(pikachu.baseStats).toBeDefined();
      expect(pikachu.baseStats.hp).toBe(35);
      expect(pikachu.baseStats.atk).toBe(55);
    });

    it('should get Charizard species data', () => {
      const charizard = Dex.species.get('Charizard');
      expect(charizard).toBeDefined();
      expect(charizard.name).toBe('Charizard');
      expect(charizard.num).toBe(6);
      expect(charizard.types).toEqual(['Fire', 'Flying']);
      expect(charizard.abilities).toBeDefined();
    });

    it('should handle case-insensitive species lookup', () => {
      const mewtwo1 = Dex.species.get('Mewtwo');
      const mewtwo2 = Dex.species.get('mewtwo');
      const mewtwo3 = Dex.species.get('MEWTWO');
      expect(mewtwo1.name).toBe(mewtwo2.name);
      expect(mewtwo2.name).toBe(mewtwo3.name);
    });

    it('should get legendary Pokemon', () => {
      const rayquaza = Dex.species.get('Rayquaza');
      expect(rayquaza).toBeDefined();
      expect(rayquaza.name).toBe('Rayquaza');
      expect(rayquaza.types).toEqual(['Dragon', 'Flying']);
    });

    it('should return non-existent for invalid species', () => {
      const invalid = Dex.species.get('InvalidPokemon123');
      expect(invalid.exists).toBe(false);
    });

    it('should get all species', () => {
      const allSpecies = Dex.species.all();
      expect(allSpecies).toBeDefined();
      expect(Array.isArray(allSpecies)).toBe(true);
      expect(allSpecies.length).toBeGreaterThan(800);
    });
  });

  describe('Moves', () => {
    it('should get Thunderbolt move data', () => {
      const thunderbolt = Dex.moves.get('Thunderbolt');
      expect(thunderbolt).toBeDefined();
      expect(thunderbolt.name).toBe('Thunderbolt');
      expect(thunderbolt.type).toBe('Electric');
      expect(thunderbolt.basePower).toBe(90);
      expect(thunderbolt.accuracy).toBe(100);
      expect(thunderbolt.category).toBe('Special');
    });

    it('should have PP data for all moves', () => {
      const razorLeaf = Dex.moves.get('Razor Leaf');
      expect(razorLeaf.exists).toBe(true);
      expect(razorLeaf.pp).toBe(25);

      const bodySlam = Dex.moves.get('Body Slam');
      expect(bodySlam.exists).toBe(true);
      expect(bodySlam.pp).toBe(15);

      const razorLeaf2 = Dex.moves.get('razorleaf');
      expect(razorLeaf2.exists).toBe(true);
      expect(razorLeaf2.pp).toBe(25);

      const thunderbolt = Dex.moves.get('Thunderbolt');
      expect(thunderbolt.pp).toBe(15);

      const thunderboltById = Dex.moves.get('thunderbolt');
      expect(thunderboltById.exists).toBe(true);
      expect(thunderboltById.pp).toBe(15);
    });

    it('should get physical move data', () => {
      const tackle = Dex.moves.get('Tackle');
      expect(tackle).toBeDefined();
      expect(tackle.name).toBe('Tackle');
      expect(tackle.type).toBe('Normal');
      expect(tackle.category).toBe('Physical');
    });

    it('should get status move data', () => {
      const toxic = Dex.moves.get('Toxic');
      expect(toxic).toBeDefined();
      expect(toxic.name).toBe('Toxic');
      expect(toxic.type).toBe('Poison');
      expect(toxic.category).toBe('Status');
    });

    it('should handle move aliases', () => {
      // The base 'hiddenpower' id maps to Hidden Power Water in the data
      const hiddenPower = Dex.moves.get('Hidden Power');
      expect(hiddenPower).toBeDefined();
      expect(hiddenPower.exists).toBe(true);
      expect(hiddenPower.name).toContain('Hidden Power');
    });

    it('should return non-existent for invalid moves', () => {
      const invalid = Dex.moves.get('InvalidMove123');
      expect(invalid.exists).toBe(false);
    });

    it('should get all moves', () => {
      const allMoves = Dex.moves.all();
      expect(allMoves).toBeDefined();
      expect(Array.isArray(allMoves)).toBe(true);
      expect(allMoves.length).toBeGreaterThan(800);
    });
  });

  describe('Abilities', () => {
    it('should get Static ability data', () => {
      const staticAbility = Dex.abilities.get('Static');
      expect(staticAbility).toBeDefined();
      expect(staticAbility.name).toBe('Static');
      expect(staticAbility.desc || staticAbility.shortDesc).toBeDefined();
    });

    it('should get Blaze ability data', () => {
      const blaze = Dex.abilities.get('Blaze');
      expect(blaze).toBeDefined();
      expect(blaze.name).toBe('Blaze');
    });

    it('should get hidden abilities', () => {
      const speedBoost = Dex.abilities.get('Speed Boost');
      expect(speedBoost).toBeDefined();
      expect(speedBoost.name).toBe('Speed Boost');
    });

    it('should return non-existent for invalid abilities', () => {
      const invalid = Dex.abilities.get('InvalidAbility123');
      expect(invalid.exists).toBe(false);
    });

    it('should get all abilities', () => {
      const allAbilities = Dex.abilities.all();
      expect(allAbilities).toBeDefined();
      expect(Array.isArray(allAbilities)).toBe(true);
      expect(allAbilities.length).toBeGreaterThan(200);
    });
  });

  describe('Items', () => {
    it('should get Leftovers item data', () => {
      const leftovers = Dex.items.get('Leftovers');
      expect(leftovers).toBeDefined();
      expect(leftovers.name).toBe('Leftovers');
      expect(leftovers.desc || leftovers.shortDesc).toBeDefined();
    });

    it('should get held item data', () => {
      const choiceScarf = Dex.items.get('Choice Scarf');
      expect(choiceScarf).toBeDefined();
      expect(choiceScarf.name).toBe('Choice Scarf');
    });

    it('should get berry data', () => {
      const sitrusBerry = Dex.items.get('Sitrus Berry');
      expect(sitrusBerry).toBeDefined();
      expect(sitrusBerry.name).toBe('Sitrus Berry');
      expect(sitrusBerry.isBerry).toBe(true);
    });

    it('should return non-existent for invalid items', () => {
      const invalid = Dex.items.get('InvalidItem123');
      expect(invalid.exists).toBe(false);
    });

    it('should get all items', () => {
      const allItems = Dex.items.all();
      expect(allItems).toBeDefined();
      expect(Array.isArray(allItems)).toBe(true);
      expect(allItems.length).toBeGreaterThan(500);
    });
  });

  describe('Types', () => {
    it('should get type effectiveness data', () => {
      const electric = Dex.types.get('Electric');
      expect(electric).toBeDefined();
      expect(electric.name).toBe('Electric');
      expect(electric.damageTaken).toBeDefined();
    });

    it('should check type effectiveness', () => {
      const effectiveness = Dex.getEffectiveness('Water', 'Fire');
      expect(effectiveness).toBeGreaterThan(0); // Super effective
    });

    it('should get all types', () => {
      const allTypes = Dex.types.all();
      expect(allTypes).toBeDefined();
      expect(Array.isArray(allTypes)).toBe(true);
      expect(allTypes.length).toBeGreaterThanOrEqual(18);
    });
  });

  describe('Formats', () => {
    it('should get format data', () => {
      const gen9ou = Dex.formats.get('gen9ou');
      expect(gen9ou).toBeDefined();
      expect(gen9ou.name).toContain('OU');
    });

    it('should support random battle format', () => {
      const randomBattle = Dex.formats.get('gen9randombattle');
      expect(randomBattle).toBeDefined();
    });
  });

  describe('Natures', () => {
    it('should get Adamant nature data', () => {
      const adamant = Dex.natures.get('Adamant');
      expect(adamant).toBeDefined();
      expect(adamant.name).toBe('Adamant');
      expect(adamant.plus).toBe('atk');
      expect(adamant.minus).toBe('spa');
    });

    it('should get neutral nature data', () => {
      const hardy = Dex.natures.get('Hardy');
      expect(hardy).toBeDefined();
      expect(hardy.name).toBe('Hardy');
      expect(hardy.plus).toBeUndefined();
      expect(hardy.minus).toBeUndefined();
    });

    it('should get all natures', () => {
      const allNatures = Dex.natures.all();
      expect(allNatures).toBeDefined();
      expect(Array.isArray(allNatures)).toBe(true);
      expect(allNatures.length).toBe(25);
    });
  });
});

describe('Salamence lookup', () => {
  it('should find Salamence with proper capitalization', () => {
    const species = Dex.species.get('Salamence');
    expect(species.name).toBe('Salamence');
    expect(species.num).toBe(373);
  });

  it('should find salamence with lowercase', () => {
    const species = Dex.species.get('salamence');
    expect(species.name).toBe('Salamence');
  });
});

describe('Dex API - Cache and Edge Cases', () => {
  describe('Cache hits', () => {
    it('should return cached item on second lookup', () => {
      // First lookup populates cache
      const item1 = Dex.items.get('Leftovers');
      // Second lookup should hit cache
      const item2 = Dex.items.get('Leftovers');
      expect(item1).toBe(item2);
    });

    it('should return cached condition on second lookup', () => {
      const cond1 = Dex.conditions.get('brn');
      const cond2 = Dex.conditions.get('brn');
      expect(cond1).toBe(cond2);
    });

    it('should return cached format on second lookup', () => {
      const fmt1 = Dex.formats.get('gen9ou');
      const fmt2 = Dex.formats.get('gen9ou');
      expect(fmt1).toBe(fmt2);
    });
  });

  describe('Conditions API', () => {
    it('should get all conditions', () => {
      const allConditions = Dex.conditions.all();
      expect(allConditions).toBeDefined();
      expect(Array.isArray(allConditions)).toBe(true);
      expect(allConditions.length).toBeGreaterThan(0);
    });

    it('should get paralysis condition', () => {
      const par = Dex.conditions.get('par');
      expect(par.exists).toBe(true);
      expect(par.name).toBeDefined();
    });
  });

  describe('Formats API', () => {
    it('should get all formats', () => {
      const allFormats = Dex.formats.all();
      expect(allFormats).toBeDefined();
      expect(Array.isArray(allFormats)).toBe(true);
      expect(allFormats.length).toBeGreaterThan(0);
    });
  });

  describe('Types API', () => {
    it('should check if name is valid type', () => {
      expect(Dex.types.isName('Fire')).toBe(true);
      expect(Dex.types.isName('Electric')).toBe(true);
      expect(Dex.types.isName('InvalidType')).toBe(false);
    });
  });

  describe('getName utility', () => {
    it('should capitalize first letter of each word', () => {
      expect(Dex.getName('pikachu')).toBe('Pikachu');
      expect(Dex.getName('thunder wave')).toBe('Thunder Wave');
      expect(Dex.getName('MEGA CHARIZARD')).toBe('Mega Charizard');
    });

    it('should handle empty string', () => {
      expect(Dex.getName('')).toBe('');
    });

    it('should handle hyphenated names', () => {
      expect(Dex.getName('porygon-z')).toBe('Porygon Z');
    });
  });

  describe('Stats utility', () => {
    it('should return all stat IDs', () => {
      const ids = Dex.stats.ids();
      expect(ids).toEqual(['hp', 'atk', 'def', 'spa', 'spd', 'spe']);
    });

    it('should have short names for all stats', () => {
      expect(Dex.stats.shortNames.hp).toBe('HP');
      expect(Dex.stats.shortNames.atk).toBe('Atk');
      expect(Dex.stats.shortNames.spa).toBe('SpA');
    });

    it('should get stat ID from various names', () => {
      expect(Dex.stats.getID('HP')).toBe('hp');
      expect(Dex.stats.getID('Attack')).toBe('atk');
      expect(Dex.stats.getID('SpA')).toBe('spa');
      expect(Dex.stats.getID('Speed')).toBe('spe');
      expect(Dex.stats.getID('invalid')).toBeNull();
    });
  });

  describe('Type effectiveness edge cases', () => {
    it('should handle immunity (return -Infinity)', () => {
      // Ghost vs Normal
      const effectiveness = Dex.getEffectiveness('Ghost', 'Normal');
      expect(effectiveness).toBe(-Infinity);
    });

    it('should handle dual type immunity', () => {
      // Ground vs Electric/Flying (Zapdos-like) - Ground is immune
      const effectiveness = Dex.getEffectiveness('Ground', ['Electric', 'Flying']);
      expect(effectiveness).toBe(-Infinity);
    });

    it('should check immunity correctly', () => {
      // Electric vs Ground - immune
      expect(Dex.getImmunity('Electric', 'Ground')).toBe(false);
      // Electric vs Water - not immune
      expect(Dex.getImmunity('Electric', 'Water')).toBe(true);
    });

    it('should handle non-existent type in getImmunity', () => {
      // Should return true (not immune) for non-existent types
      expect(Dex.getImmunity('Electric', 'InvalidType')).toBe(true);
    });
  });
});
