// The equipment slot. A unit wears one of these at a time, next to the weapon: rings, shields,
// gems, the staves that are not weapons and a few relics (fe3h.com, /equipment). A shield's weight
// adds to the weapon's, and what Str/5 does not cover comes off attack speed and avoid.

export const EQUIPMENT = new Set([
  'Accuracy Ring', 'Critical Ring', 'Evasion Ring', 'Speed Ring', 'March Ring', 'Goddess Ring', 'Prayer Ring',
  'Experience Gem', 'Knowledge Gem', 'Rafail Gem', 'Fetters of Dromi', 'Chalice of Beginnings',
  'Healing Staff', 'Magic Staff', 'Caduceus Staff', 'Thyrsus',
  'Black Eagles Pendant', 'Blue Lion Brooch', 'Golden Deer Bracelet', 'White Dragon Scarf',
  'Leather Shield', 'Iron Shield', 'Steel Shield', 'Silver Shield', 'Talisman Shield', 'Hexlock Shield',
  'Aegis Shield', 'Ochain Shield', 'Seiros Shield', 'Aurora Shield', 'Kadmos Shield', 'Lampos Shield',
]);

/**
 * When two of the plan's accessories want the same unit, the one higher here keeps her and the
 * other goes on down its own order (`who`). First what only one unit can use well (Thyrsus with
 * its Crest, the gem Byleth needs for Brawl, Hapi's Caduceus), last the rings anyone can wear.
 */
export const ACCESSORY_ORDER = [
  'Thyrsus', 'Knowledge Gem', 'Caduceus Staff', 'Prayer Ring', 'Fetters of Dromi', 'March Ring',
  'Aurora Shield', 'Speed Ring', 'Healing Staff', 'Magic Staff', 'Experience Gem', 'Goddess Ring', 'Accuracy Ring',
];
