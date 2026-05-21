const UNIT_GROUPS = {
  mass: {
    g: 1,
    kg: 1000,
  },
  volume: {
    ml: 1,
    liters: 1000,
  },
  count: {
    pcs: 1,
    portion: 1,
  },
};

function findUnitGroup(unit) {
  return Object.values(UNIT_GROUPS).find((group) => group[unit]);
}

export function convertQuantity(quantity, fromUnit, toUnit) {
  const amount = Number(quantity || 0);
  if (fromUnit === toUnit) return amount;

  const fromGroup = findUnitGroup(fromUnit);
  const toGroup = findUnitGroup(toUnit);

  if (!fromGroup || fromGroup !== toGroup || !toGroup[toUnit]) {
    throw new Error(`Cannot convert ${fromUnit} to ${toUnit}. Use matching units for this ingredient.`);
  }

  return (amount * fromGroup[fromUnit]) / toGroup[toUnit];
}

export default {
  convertQuantity,
};
