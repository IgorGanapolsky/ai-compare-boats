/**
 * Calculate feature similarity between two sets of features using fuzzy matching
 * @param {string[]} features1 First set of features
 * @param {string[]} features2 Second set of features
 * @returns {number} Similarity score (0-100)
 */
export function calculateFeatureSimilarity(features1, features2) {
  if (!features1.length || !features2.length) return 0;

  const matches = features1.filter(feature1 => 
    features2.some(feature2 => fuzzyMatch(feature1, feature2))
  );

  // Calculate weighted score based on proportion of matches
  const matchRatio = (matches.length * 2) / (features1.length + features2.length);
  return Math.round(matchRatio * 100);
}

/**
 * Perform fuzzy matching between two strings
 * @param {string} str1 First string
 * @param {string} str2 Second string
 * @returns {boolean} True if strings match within threshold
 */
function fuzzyMatch(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return true;

  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) return true;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  // Allow for some fuzzy matching based on string length
  const threshold = Math.min(3, Math.floor(maxLength * 0.3));
  return distance <= threshold;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 First string
 * @param {string} str2 Second string
 * @returns {number} Edit distance between strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,  // substitution
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1       // insertion
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate weighted similarity score based on type, length, and features
 * @param {Object} scores Individual component scores
 * @returns {number} Overall weighted score (0-100)
 */
export function calculateOverallSimilarity(scores) {
  return Math.round(
    (scores.type * 0.4) +      // Type similarity: 40%
    (scores.length * 0.3) +    // Length similarity: 30%
    (scores.features * 0.3)    // Feature similarity: 30%
  );
}
