const sampleBoats = [
  {
    id: 1,
    name: 'Sea Ray 320 Sundancer',
    type: 'Cruiser',
    year: 2004,
    length: 32,
    engine: 'MerCruiser 6.2 MPI',
    totalPower: '640hp',
    engineHours: 610,
    hullMaterial: 'Fiberglass',
    dimensions: {
      nominalLength: '32ft',
      lengthOverall: '35.42ft',
      maxDraft: '3.58ft',
      beam: '11.42ft',
      cabinHeadroom: '6.33ft'
    },
    tanks: {
      freshWater: '40gal',
      fuel: '200gal',
      holding: '28gal'
    },
    features: [
      'Center console design',
      'T-top',
      'Triple engines',
      'White hull',
      'Navigation equipment',
      'Fish boxes',
      'Rod holders',
      'Fold-down rear bench',
      'Cabin with sleeping quarters',
      'Full galley',
      'Air conditioning',
      'GPS navigation'
    ],
    price: 68500,
    location: 'Arnold, MD',
    dealership: 'Chesapeake Yacht Center',
    imageUrl: '/boats/sea-ray-320-1.jpg'
  },
  {
    id: 2,
    name: 'Boston Whaler 280 Outrage',
    type: 'Center Console',
    year: 2020,
    length: 28,
    engine: 'Twin Mercury 300hp',
    totalPower: '600hp',
    engineHours: 150,
    hullMaterial: 'Fiberglass',
    dimensions: {
      nominalLength: '28ft',
      lengthOverall: '27.10ft',
      beam: '9.6ft',
      draft: '22in'
    },
    tanks: {
      freshWater: '30gal',
      fuel: '186gal',
      holding: '6.5gal'
    },
    features: [
      'Center console design',
      'T-top',
      'Twin engines',
      'White hull',
      'Navigation equipment',
      'Fish boxes',
      'Rod holders',
      'Fold-down rear bench',
      'Integrated hardtop',
      'Deluxe leaning post',
      'Raw water washdown',
      'Anchor windlass'
    ],
    price: 225000,
    location: 'Miami, FL',
    dealership: 'Miami Marine Group',
    imageUrl: '/boats/boston-whaler-280-1.jpg'
  },
  {
    id: 3,
    name: 'Beneteau Oceanis 40.1',
    type: 'Sailboat',
    year: 2022,
    length: 40,
    engine: 'Single Yanmar 45hp',
    totalPower: '45hp',
    engineHours: 50,
    hullMaterial: 'Fiberglass',
    dimensions: {
      nominalLength: '40ft',
      lengthOverall: '39.3ft',
      beam: '13.9ft',
      draft: '7.2ft'
    },
    tanks: {
      freshWater: '190gal',
      fuel: '50gal',
      holding: '21gal'
    },
    features: [
      'Three cabins',
      'Two heads',
      'Full standing package',
      'Self-tacking jib',
      'Electric winches',
      'Bow thruster',
      'Furling mainsail',
      'Teak cockpit floor',
      'Cockpit table',
      'Shore power',
      'Hot water system',
      'LED lighting'
    ],
    price: 389000,
    location: 'Annapolis, MD',
    dealership: 'Annapolis Yacht Sales',
    imageUrl: '/boats/beneteau-oceanis-1.jpg'
  }
];

export default sampleBoats;
