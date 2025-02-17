const sampleBoats = [
    {
        id: 4,
        name: 'Yamaha T60LB High Thrust',
        type: 'Outboard Motor',
        year: 2021,
        length: null, // Not applicable for outboard motors
        engine: 'Yamaha T60LB High Thrust Four Stroke',
        totalPower: '60hp',
        engineHours: null, // Assuming new or unspecified
        hullMaterial: null, // Not applicable
        dimensions: {
            shaftLength: '20in',
            weight: '262 lbs',
        },
        tanks: null, // Not applicable
        features: [
            'High thrust design',
            'Electronic Fuel Injection (EFI)',
            'Remote mechanical steering',
            'Electric and manual start',
            '16-amp alternator',
        ],
        price: 9400,
        location: 'United States',
        dealership: 'Sonny\'s Marine',
        imageUrl: '/engines/yamaha-t60lb-1.jpg',
    },
    {
        id: 5,
        name: 'Sun Tracker Bass Buggy 16 XL Select',
        type: 'Pontoon Boat',
        year: 2025,
        length: 18.42, // 18 feet 5 inches
        engine: 'Mercury ELPT FourStroke',
        totalPower: '20hp (standard), up to 50hp (max recommended)',
        engineHours: 0, // Assuming new
        hullMaterial: 'Aluminum',
        dimensions: {
            deckLength: '16ft',
            deckWidth: '8ft',
            pontoonLogLength: '16ft 7in',
            pontoonLogDiameter: '24in',
            interiorDepth: '24in',
        },
        tanks: {
            fuel: '6gal',
        },
        features: [
            'Seating for up to 7 passengers',
            '7\' bimini top for shade',
            'Bluetooth-compatible AM/FM stereo with 2 speakers',
            'Integrated rod holders',
            'Drink holders',
            'Easy towing capability',
        ],
        price: 22745,
        location: 'Spokane Valley, WA',
        dealership: 'Spokane Valley Marine',
        imageUrl: '/boats/sun-tracker-bass-buggy-16-xl-select-1.jpg',
    },
    {
        id: 6,
        name: 'Cabo 43 Convertible',
        type: 'Sport Fishing Yacht',
        year: 2008,
        length: 43,
        engine: 'Twin MAN V8-900CRM 2848LE 423',
        totalPower: '1800hp',
        engineHours: 4550,
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '46ft',
            beam: '15ft 1in',
            maxDraft: '4ft 4in',
            dryWeight: '33,500 lbs',
        },
        tanks: {
            freshWater: '100gal',
            fuel: '700gal',
            holding: '28gal',
        },
        features: [
            'Flybridge with helm station',
            'Spacious cockpit for fishing',
            'Luxurious interior with two staterooms',
            'Full galley',
            'Advanced navigation equipment',
            'Air conditioning',
            'Generator',
        ],
        price: 499000,
        location: 'Virginia Beach, VA',
        dealership: 'Bluewater Yacht Sales',
        imageUrl: '/boats/cabo-43-convertible-1.jpg',
    },
    {
        id: 7,
        name: 'Montara Naxos Tritoon',
        type: 'Pontoon Boat',
        year: 2023,
        length: 28.08, // 28 feet 1 inch
        engine: 'Single Mercury Verado',
        totalPower: '300hp',
        engineHours: 0, // Assuming new
        hullMaterial: 'Aluminum',
        dimensions: {
            beam: '8ft 6in',
            draft: '1ft 5in (engine up)',
            dryWeight: '4,863 lbs (without engine)',
        },
        tanks: {
            fuel: '73gal',
        },
        features: [
            'Stern lounge layout with open center walkway',
            'Generously sized rear lounge seat',
            'Seating capacity for up to 15 persons',
            'Modern design with luxury finishes',
            'Suitable for various water activities',
        ],
        price: 154900,
        location: 'Loudon, TN',
        dealership: 'Montara Boats',
        imageUrl: '/boats/montara-naxos-tritoon-1.jpg',
    },
    {
        id: 8,
        name: 'Jeanneau Yacht 65',
        type: 'Cruiser',
        year: 2025,
        length: 67.08, // Length overall with bowsprit
        engine: 'Volvo Penta D4',
        totalPower: '175hp',
        engineHours: 0, // Assuming new
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '67.08ft',
            hullLength: '64.08ft',
            beam: '18.08ft',
            draft: '7.17ft',
        },
        tanks: {
            freshWater: '264gal',
            fuel: '218gal',
        },
        features: [
            'Easily managed sloop rig with stay-sail option',
            'Multiple configurations from 2 master cabins and 2 heads to 3 cabins with 3 heads',
            'High-quality, yacht-grade finishes',
            'Walk-around decks',
            'Hard chine hull',
            'Customizable interior layouts',
        ],
        price: null, // Price not specified in the provided data
        location: 'Italy',
        dealership: 'Jeanneau Official Dealer',
        imageUrl: '/boats/jeanneau-yacht-65-1.jpg',
    },
    {
        id: 9,
        name: 'Fountaine Pajot Samana 59',
        type: 'Sailing Catamaran',
        year: 2025,
        length: 61.6, // Length overall
        engine: 'Twin Engines',
        totalPower: '220hp (standard), up to 300hp (optional)',
        engineHours: 0, // Assuming new
        hullMaterial: 'Fiberglass Reinforced Plastic (FRP)',
        dimensions: {
            lengthOverall: '61.6ft',
            beam: '31ft',
            draft: '5.41ft',
        },
        tanks: {
            freshWater: '304gal',
            fuel: '317gal',
        },
        features: [
            'Available in 4 to 6 cabin layouts',
            'Spacious flybridge with lounge area',
            'Large cockpit designed for entertaining',
            'Modern galley with high-end appliances',
            'Luxurious owner’s suite with en-suite bathroom',
            'High-performance sailing capabilities',
        ],
        price: null, // Price not specified in the provided data
        location: 'France',
        dealership: 'Fountaine Pajot Official Dealer',
        imageUrl: '/boats/fountaine-pajot-samana-59-1.jpg',
    },
    {
        id: 10,
        name: 'Lift & Slip House',
        type: 'Floating House',
        year: 2019,
        length: null, // Not specified
        engine: null, // Not applicable
        totalPower: null, // Not applicable
        engineHours: null, // Not applicable
        hullMaterial: 'Aluminum framing with MDPE flotation',
        dimensions: {
            bedrooms: 3,
            bathrooms: 2,
        },
        tanks: null, // Not specified
        features: [
            'Sleeps up to 8 with sleeper sofa',
            'Patented high-strength MDPE flotation',
            'Heavy-duty aluminum framing with stainless steel fasteners',
            'Spacious living area with modern amenities',
            'Full kitchen with appliances',
            'Ideal for waterfront living or vacation rental',
        ],
        price: null, // Price not specified in the provided data
        location: 'Jamestown, United States',
        dealership: 'Lift & Slip House Sales',
        imageUrl: '/boats/lift-slip-house-1.jpg',
    },
];

export default sampleBoats;
