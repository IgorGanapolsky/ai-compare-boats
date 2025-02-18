const sampleBoats = [
    {
        id: 4,
        name: 'Axopar 37XC Cross Cabin',
        type: 'Sports Cruiser',
        year: 2025,
        length: 37.9, // Length in feet
        engine: 'Twin Mercury V8 FourStroke 300hp',
        totalPower: '600hp',
        engineHours: 0, // New boat
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '37ft 9in',
            beam: '11ft',
            maxDraft: '2ft 9in',
            dryWeight: '8,311 lbs',
        },
        tanks: {
            fuel: '193 gal',
            freshWater: 'N/A',
            holding: 'N/A',
        },
        features: [
            'Fully enclosed weather-proofed cabin',
            'Spacious foredeck and aft deck areas',
            'Advanced navigation electronics',
            'Comfortable seating for multiple passengers',
            'Versatile interior layout with sleeping accommodations',
            'Efficient fuel consumption',
            'Modern design with panoramic windows',
            'Ample storage compartments',
            'Optional aft cabin for additional berths',
            'Swim platform with ladder',
        ],
        price: 472311, // USD
        location: 'Tampa, FL',
        dealership: 'Seattle Yachts',
        imageUrl: 'assets/boats/axopar-37xc-cross-cabin-2025.png',
    },
    {
        id: 5,
        name: 'Boston Whaler 345 Conquest',
        type: 'Express Cruiser',
        year: 2013,
        length: 35.92, // Length in feet
        engine: 'Triple Mercury Verado 300hp',
        totalPower: '900hp',
        engineHours: 500, // Example value
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '35ft 11in',
            beam: '11ft 8in',
            maxDraft: '22in',
            dryWeight: '14,200 lbs',
        },
        tanks: {
            fuel: '400 gal',
            freshWater: '45 gal',
            holding: '20 gal',
        },
        features: [
            'Integrated hardtop with windshield',
            'Spacious cabin with galley and head',
            'Sleeping accommodations for 6',
            'Fishing amenities including rod holders and livewell',
            'Air conditioning',
            'Generator',
            'Advanced navigation electronics',
            'Ample storage compartments',
            'Cockpit seating with adjustable configurations',
            'Swim platform with ladder',
        ],
        price: 279900, // USD
        location: 'Dania Beach, FL',
        dealership: 'HMY Yacht Sales',
        imageUrl: '/boats/boston-whaler-345-conquest-2013.png',
    },
    {
        id: 6,
        name: 'Cabo 35 Express',
        type: 'Express Cruiser',
        year: 2002,
        length: 37.5, // Length in feet
        engine: 'Twin Caterpillar 3126',
        totalPower: '900hp',
        engineHours: 1300, // Example value
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '37ft 6in',
            beam: '13ft',
            maxDraft: '3ft',
            dryWeight: '19,500 lbs',
        },
        tanks: {
            fuel: '400 gal',
            freshWater: '100 gal',
            holding: '11 gal',
        },
        features: [
            'Spacious cockpit with fishing amenities',
            'L-shaped galley with Corian counters',
            'Private head with shower',
            'Sleeps 4 in cabin',
            'Ample storage compartments',
            'Hardtop with enclosure',
            'Navigation electronics',
            'Air conditioning',
            'Generator',
            'Teak interior cabinetry',
        ],
        price: 149000, // USD
        location: 'Lighthouse Point, FL',
        dealership: 'McKay Yacht Sales Inc.',
        imageUrl: 'assets/boats/cabo-35-express-2002.png',
    },
    {
        id: 7,
        name: 'Yamaha AR250',
        type: 'Jet Boat',
        year: 2023,
        length: 24.5, // Length in feet
        engine: 'Twin 1.8L High Output Yamaha Marine Engines',
        totalPower: '360hp',
        engineHours: 0, // Assuming new
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '24ft 6in',
            beam: '8ft 6in',
            maxDraft: '1ft 7in',
            dryWeight: '4,021 lbs',
        },
        tanks: {
            fuel: '75 gal',
        },
        features: [
            'Seating capacity for 12',
            'Integrated swim platform',
            'Bimini top for sun protection',
            'Connext 7-inch touchscreen display',
            'Marine stereo with Bluetooth capability',
            'Bow filler cushions',
            'Snap-in marine-grade flooring',
            'Adjustable captain\'s chair with flip-up bolster',
            'Ample storage compartments',
            'Trailer with swing-away tongue',
        ],
        price: 74999, // USD
        location: 'Polk City, IA',
        dealership: 'Hicklin\'s Water Edge Marine',
        imageUrl: 'assets/boats/yamaha-ar250-2023.png',
    },
    {
        id: 8,
        name: 'Cabo 43 Convertible',
        type: 'Sport Fishing',
        year: 2008,
        length: 43, // Length in feet
        engine: 'Twin MAN V8-900CRM 2848LE 423',
        totalPower: '1800hp',
        engineHours: 4550,
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '43ft',
            beam: '15ft 1in',
            maxDraft: '4ft 4in',
            dryWeight: '33,500 lbs',
        },
        tanks: {
            fuel: '700 gal',
            freshWater: '100 gal',
            holding: '28 gal',
        },
        features: [
            'Spacious salon with entertainment center',
            'Fully equipped galley with modern appliances',
            'Two staterooms with ample storage',
            'Flybridge with helm station and seating',
            'Large cockpit with fishing amenities',
            'Air conditioning and heating systems',
            'Generator for auxiliary power',
            'Navigation electronics including radar and GPS',
            'Autopilot system',
            'Premium sound system',
        ],
        price: 499000, // USD
        location: 'Virginia Beach, VA',
        dealership: 'Bluewater Yacht Sales',
        imageUrl: 'assets/boats/cabo-43-convertible-2008.png',
    },
    {
        id: 9,
        name: 'Cobalt R8 Surf',
        type: 'Bowrider',
        year: 2021,
        length: 27.83,
        engine: 'Volvo Penta V8-380 Forward Drive',
        totalPower: '380hp',
        engineHours: 0,
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '27ft 10in',
            beam: '8ft 6in',
            maxDraft: '3ft',
            dryWeight: '6,700 lbs'
        },
        tanks: {
            fuel: '80 gal',
            freshWater: '10 gal'
        },
        features: [
            'Cobalt Surf System with 2,300 lbs ballast capacity',
            'Forward-facing drive for enhanced safety',
            'Spacious bow and cockpit with yacht-certified seating',
            'Premium sound system',
            'Touchscreen Garmin navigation',
            'Swim platform with ladder',
            'Bimini top for sun protection',
            'Dual batteries with switch',
            'LED interior lighting',
            'Stainless steel ski tow pylon'
        ],
        price: 189900,
        location: 'Sagaponack, NY',
        dealership: 'Strong\'s Marine',
        imageUrl: 'assets/boats/cobalt-r8-surf-2021.png'
    },
    {
        id: 10,
        name: 'Everglades 395cc',
        type: 'Center Console',
        year: 2024,
        length: 39,
        engine: 'Triple Yamaha 425 XTO',
        totalPower: '1,275hp',
        engineHours: 0,
        hullMaterial: 'Fiberglass',
        dimensions: {
            lengthOverall: '42.2ft',
            beam: '12ft',
            maxDraft: '3.83ft',
            dryWeight: '19,600lbs'
        },
        tanks: {
            fuel: '600gal',
            freshWater: '50gal',
            holding: 'Not specified'
        },
        features: [
            'Air-conditioned mezzanine and helm seating',
            'Concealed head with rain-style shower',
            '76-inch standing headroom in cabin',
            'Teak shower grate floor',
            'Full-length bunk with filler cushion',
            'Wood-grained storage cabinet with solid surface top',
            'Microwave oven',
            'Seakeeper 3 gyroscopic stabilizer',
            'Electric windlass with remote',
            'Stainless steel plow anchor with chain and rode'
        ],
        price: 889683,
        location: 'Beaufort, NC',
        dealership: 'Bluewater Yacht Sales',
        imageUrl: 'assets/boats/everglades-395cc-2024.png'
    },
    {
        id: 11,
        name: 'Yamaha WaveRunner GP HO with Audio',
        type: 'Personal Watercraft',
        year: 2024,
        length: 11,
        engine: '1.9L High Output Yamaha Marine Engine',
        totalPower: '180hp',
        engineHours: 0,
        hullMaterial: 'NanoXcel2',
        dimensions: {
            lengthOverall: '131.9in',
            beam: '50in',
            height: '47.2in',
            dryWeight: '714lbs'
        },
        tanks: {
            fuel: '18.5gal'
        },
        features: [
            'Factory-installed integrated audio system',
            'Connext 4.3-inch touchscreen with security and drive control',
            'Race-inspired seat for enhanced ergonomics',
            'RiDE dual throttle control system',
            'Custom integrated GP audio system',
            'Available in Black/Cyan and Black/Torch Red color schemes'
        ],
        price: 15899,
        location: 'Various Dealerships',
        dealership: 'Yamaha Authorized Dealers',
        imageUrl: 'assets/boats/yamaha-waverunner-gp-ho-2024.png'
    }
];

export default sampleBoats;
