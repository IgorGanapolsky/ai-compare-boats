import * as tf from '@tensorflow/tfjs';
import { load } from '@tensorflow-models/universal-sentence-encoder';

let model = null;

export const initializeModel = async () => {
  if (!model) {
    model = await load();
  }
  return model;
};

export const calculateSimilarityScore = async (boat1, boat2) => {
  const model = await initializeModel();
  
  // Create feature strings for comparison
  const boat1Features = `${boat1.type} ${boat1.length} ${boat1.features.join(' ')} ${boat1.description}`;
  const boat2Features = `${boat2.type} ${boat2.length} ${boat2.features.join(' ')} ${boat2.description}`;
  
  // Get embeddings
  const embeddings = await model.embed([boat1Features, boat2Features]);
  const embedding1 = await embeddings.array();
  
  // Calculate cosine similarity
  const similarity = tf.tensor1d(embedding1[0])
    .dot(tf.tensor1d(embedding1[1]))
    .div(
      tf.tensor1d(embedding1[0])
        .norm()
        .mul(tf.tensor1d(embedding1[1]).norm())
    );
  
  const score = await similarity.array();
  return score;
};

export const compareBoats = async (boat1, boat2) => {
  const similarityScore = await calculateSimilarityScore(boat1, boat2);
  
  // Compare numerical features
  const priceDiff = Math.abs(boat1.price - boat2.price);
  const lengthDiff = Math.abs(parseFloat(boat1.length) - parseFloat(boat2.length));
  
  // Find unique features
  const uniqueFeatures1 = boat1.features.filter(f => !boat2.features.includes(f));
  const uniqueFeatures2 = boat2.features.filter(f => !boat1.features.includes(f));
  
  return {
    similarityScore,
    comparison: {
      priceDifference: priceDiff,
      lengthDifference: lengthDiff,
      uniqueFeatures: {
        boat1: uniqueFeatures1,
        boat2: uniqueFeatures2
      }
    }
  };
};
