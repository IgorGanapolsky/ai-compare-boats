import React from 'react';

const BoatCard = ({ boat, isSelected, onSelect, similarityScore }) => {
  const {
    name,
    type,
    length,
    price,
    year,
    engineType,
    features = []
  } = boat;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      onClick={() => onSelect(boat)}
      style={{
        border: `2px solid ${isSelected ? '#1976d2' : '#ddd'}`,
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#f5f9ff' : 'white',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#1976d2',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✓
        </div>
      )}

      {similarityScore !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: isSelected ? '40px' : '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '14px'
          }}
        >
          {Math.round(similarityScore * 100)}% Match
        </div>
      )}

      <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{name}</h3>
      
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
        <strong>Type:</strong> {type}
      </div>
      
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
        <strong>Length:</strong> {length} feet
      </div>
      
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
        <strong>Price:</strong> {formatPrice(price)}
      </div>
      
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
        <strong>Year:</strong> {year}
      </div>
      
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
        <strong>Engine:</strong> {engineType}
      </div>

      {features.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            <strong>Features:</strong>
          </div>
          <ul style={{ 
            margin: '4px 0 0 20px',
            padding: 0,
            fontSize: '14px',
            color: '#666'
          }}>
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BoatCard;
