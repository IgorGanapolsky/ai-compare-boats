const boats = [
  {
    id: 1,
    name: 'Beneteau Oceanis 40.1',
    type: 'Cruising Sailboat',
    year: 2023,
    price: 425000,
    location: 'Annapolis, MD',
    length: 40,
    engine: 'Single Yanmar 45hp',
    hullMaterial: 'Fiberglass',
    weight: {
      dry: 16500
    },
    dimensions: {
      beam: 13.9,
      draft: 7.2,
      cabinHeadroom: 6.5
    },
    tanks: {
      fuel: 52,
      water: 87,
      holding: 21
    },
    features: [
      'Three cabins',
      'Two heads',
      'Full standing package',
      'Self-tacking jib',
      'Electric winches',
      'Bow thruster',
      'Teak cockpit floor',
      'Shore power',
      'Hot water system',
      'LED lighting'
    ]
  },
  {
    id: 2,
    name: 'Sea Ray 320 Sundancer',
    type: 'Express Cruiser',
    year: 2024,
    price: 325900,
    location: 'Miami, FL',
    length: 32,
    engine: 'Twin MerCruiser 350hp',
    hullMaterial: 'Fiberglass',
    weight: {
      dry: 13800
    },
    dimensions: {
      beam: 11.42,
      draft: 3.58,
      cabinHeadroom: 6.33
    },
    tanks: {
      fuel: 200,
      water: 40,
      holding: 28
    },
    features: [
      'Cabin with sleeping quarters',
      'Full galley',
      'Air conditioning',
      'GPS navigation',
      'Swimming platform',
      'Fish boxes',
      'Rod holders',
      'Fold-down rear bench'
    ]
  },
  {
    id: 3,
    name: 'Regal 36 XO',
    type: 'Sport Yacht',
    year: 2024,
    price: 495000,
    location: 'Seattle, WA',
    length: 36,
    engine: 'Twin Yamaha 425hp',
    hullMaterial: 'Fiberglass',
    weight: {
      dry: 15000
    },
    dimensions: {
      beam: 11.5,
      draft: 3.3,
      cabinHeadroom: 6.4
    },
    tanks: {
      fuel: 250,
      water: 45,
      holding: 30
    },
    features: [
      'Cabin with sleeping quarters',
      'Full galley',
      'Air conditioning',
      'GPS navigation',
      'Deck design',
      'Light hull',
      'Swimming platform',
      'Navigation equipment'
    ]
  }
];

function calculateSimilarity(boat1, boat2) {
  // Type similarity (40% of total score)
  let typeScore = boat1.type === boat2.type ? 40 :
    isSimilarType(boat1.type, boat2.type) ? 30 :
    isRelatedType(boat1.type, boat2.type) ? 20 : 10;

  // Length similarity (30% of total score)
  const lengthDiff = Math.abs(boat1.length - boat2.length);
  const lengthScore = lengthDiff === 0 ? 30 :
    lengthDiff <= 2 ? 25 :
    lengthDiff <= 5 ? 20 :
    lengthDiff <= 8 ? 15 :
    lengthDiff <= 10 ? 10 : 5;

  // Feature similarity (30% of total score)
  const commonFeatures = boat1.features.filter(f => 
    boat2.features.includes(f)
  );
  const featureScore = Math.round((commonFeatures.length / Math.max(boat1.features.length, boat2.features.length)) * 30);

  return {
    total: typeScore + lengthScore + featureScore,
    typeScore,
    lengthScore,
    featureScore,
    commonFeatures
  };
}

function isSimilarType(type1, type2) {
  const categories = {
    sailing: ['sailboat', 'sailing yacht', 'sail'],
    motor: ['motor yacht', 'powerboat', 'cruiser'],
    luxury: ['yacht', 'cruiser', 'motor yacht'],
    sport: ['speedboat', 'center console', 'bowrider']
  };

  type1 = type1.toLowerCase();
  type2 = type2.toLowerCase();

  return Object.values(categories).some(types => 
    types.includes(type1) && types.includes(type2)
  );
}

function isRelatedType(type1, type2) {
  const powerTypes = ['motor yacht', 'powerboat', 'cruiser', 'speedboat', 'center console', 'bowrider'];
  return powerTypes.includes(type1.toLowerCase()) && powerTypes.includes(type2.toLowerCase());
}

export function getAllBoats() {
  return boats;
}

export function findSimilarBoats(uploadedBoat) {
  return boats
    .map(boat => ({
      ...boat,
      similarity: calculateSimilarity(uploadedBoat, boat)
    }))
    .sort((a, b) => b.similarity.total - a.similarity.total);
}

export function compareBoats(boat1, boat2) {
  return calculateSimilarity(boat1, boat2);
}
