import Dexie from 'dexie';

const DB_NAME = 'BoatsComparisonDB';
const DB_VERSION = 1; // Update database version

class BoatsDatabase extends Dexie {
  constructor() {
    super(DB_NAME);

    // Define database schema
    this.version(DB_VERSION).stores({
      boats: '++id, name, type, length, engine, hullMaterial',
      features: '++id, boatId, name, [boatId+name]'
    });

    // Define tables
    this.boats = this.table('boats');
    this.features = this.table('features');
  }

  async clearDatabase() {
    try {
      console.log('Clearing database...');
      // Use a transaction to ensure both tables are cleared atomically
      await this.transaction('rw', this.boats, this.features, async () => {
        await Promise.all([
          this.boats.clear(),
          this.features.clear()
        ]);
      });
      console.log('Database cleared successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }

  async deleteDatabase() {
    try {
      await this.delete();
    } catch (error) {
      console.error('Error deleting database:', error);
      throw error;
    }
  }

  async resetDatabase() {
    try {
      await this.delete();
      await this.open();
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  // Calculate similarity score between boat characteristics
  calculateSimilarityScore(uploadedBoat, dbBoat) {
    try {
      let score = 0;
      let maxScore = 0;

      // Type match (highest weight)
      if (uploadedBoat.boatType === dbBoat.type) {
        score += 40;
      }
      maxScore += 40;

      // Features match
      const dbFeatures = new Set(dbBoat.features?.map(f => f.toLowerCase()) || []);
      for (const feature of (uploadedBoat.features || [])) {
        if (dbFeatures.has(feature.toLowerCase())) {
          score += 10;
        }
        maxScore += 10;
      }

      // Specifications match
      const specs = uploadedBoat.specifications || {};

      // Length match
      if (specs.approximateLength && dbBoat.length) {
        const lengthRange = specs.approximateLength.match(/\d+/g)?.map(Number) || [];
        if (lengthRange.length > 0) {
          const avgLength = lengthRange.reduce((a, b) => a + b, 0) / lengthRange.length;
          const dbLength = parseFloat(dbBoat.length);

          if (!isNaN(dbLength) && !isNaN(avgLength)) {
            // If within 5 feet
            if (Math.abs(avgLength - dbLength) <= 5) {
              score += 20;
            }
            // If within 10 feet
            else if (Math.abs(avgLength - dbLength) <= 10) {
              score += 10;
            }
          }
        }
      }
      maxScore += 20;

      // Engine type match
      if (specs.engineType && dbBoat.engine) {
        if (dbBoat.engine.toLowerCase().includes(specs.engineType.toLowerCase())) {
          score += 20;
        }
      }
      maxScore += 20;

      // Hull material match
      if (specs.hullMaterial && dbBoat.hullMaterial) {
        if (dbBoat.hullMaterial.toLowerCase() === specs.hullMaterial.toLowerCase()) {
          score += 10;
        }
      }
      maxScore += 10;

      // Convert to percentage and ensure it's between 0 and 100
      return Math.min(100, Math.max(0, (maxScore > 0 ? (score / maxScore) * 100 : 0)));
    } catch (error) {
      console.error('Error calculating similarity score:', error);
      return 0;
    }
  }

  async findSimilarBoats(uploadedBoatAnalysis, limit = 5) {
    if (!uploadedBoatAnalysis) {
      console.warn('No boat analysis provided');
      return [];
    }

    try {
      console.log('Finding similar boats based on analysis:', uploadedBoatAnalysis);

      // Get all boats with their features in a single transaction
      const boats = await this.transaction('r', [this.boats, this.features], async () => {
        const allBoats = await this.boats.toArray();
        const boatFeatures = await this.features.toArray();

        // Group features by boat
        const boatFeaturesMap = boatFeatures.reduce((map, feature) => {
          if (!map[feature.boatId]) {
            map[feature.boatId] = [];
          }
          map[feature.boatId].push(feature.name);
          return map;
        }, {});

        return allBoats.map(boat => ({
          ...boat,
          features: boatFeaturesMap[boat.id] || []
        }));
      });

      // Calculate similarity scores
      const boatsWithScores = boats.map(boat => ({
        ...boat,
        similarityScore: this.calculateSimilarityScore(uploadedBoatAnalysis, boat)
      }));

      // Sort by similarity score and return top matches
      return boatsWithScores
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding similar boats:', error);
      return [];
    }
  }

  async getBoatWithFeatures(id) {
    try {
      return await this.transaction('r', [this.boats, this.features], async () => {
        const boat = await this.boats.get(id);
        if (!boat) return null;

        const features = await this.features
          .where('boatId')
          .equals(id)
          .toArray();

        return {
          ...boat,
          features: features.map(f => f.name)
        };
      });
    } catch (error) {
      console.error('Error getting boat with features:', error);
      throw error;
    }
  }

  async addBoat(boat) {
    try {
      console.log('Adding boat:', boat);
      const id = await this.boats.add({
        name: boat.name,
        type: boat.type,
        length: boat.length,
        engine: boat.engine,
        hullMaterial: boat.hullMaterial
      });

      if (boat.features && boat.features.length > 0) {
        await Promise.all(boat.features.map(feature =>
          this.features.add({
            boatId: id,
            name: feature
          })
        ));
      }

      return id;
    } catch (error) {
      console.error('Error adding boat:', error);
      throw error;
    }
  }

  async getAllBoats() {
    try {
      return await this.transaction('r', [this.boats, this.features], async () => {
        const boats = await this.boats.toArray();
        const boatFeatures = await this.features.toArray();

        // Group features by boat
        const boatFeaturesMap = boatFeatures.reduce((map, feature) => {
          if (!map[feature.boatId]) {
            map[feature.boatId] = [];
          }
          map[feature.boatId].push(feature.name);
          return map;
        }, {});

        return boats.map(boat => ({
          ...boat,
          features: boatFeaturesMap[boat.id] || []
        }));
      });
    } catch (error) {
      console.error('Error getting all boats:', error);
      throw error;
    }
  }

  async reset() {
    try {
      await this.delete();
      const db = new BoatsDatabase();
      await db.open();
      return db;
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
}

// Create and open the database
const db = new BoatsDatabase();

export default db;
