import React from 'react';

const ComparisonResult = ({ result, boats }) => {
  if (!result || !boats || boats.length !== 2) return null;

  const [boat1, boat2] = boats;
  const similarityPercentage = (result.similarityScore * 100).toFixed(1);

  return (
    <div className="comparison-result" style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h2>Comparison Results</h2>
      
      <div className="similarity-score">
        <h3>Similarity Score: {similarityPercentage}%</h3>
      </div>

      <div className="key-differences">
        <h3>Key Differences</h3>
        
        <div className="price-comparison">
          <h4>Price Difference</h4>
          <p>${Math.abs(result.comparison.priceDifference).toLocaleString()}</p>
        </div>

        <div className="length-comparison">
          <h4>Length Difference</h4>
          <p>{result.comparison.lengthDifference} feet</p>
        </div>

        <div className="unique-features">
          <h4>Unique Features</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h5>{boat1.name}</h5>
              <ul>
                {result.comparison.uniqueFeatures.boat1.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5>{boat2.name}</h5>
              <ul>
                {result.comparison.uniqueFeatures.boat2.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonResult;
