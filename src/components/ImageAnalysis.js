import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { findSimilarBoats, compareBoats } from '../services/boatDatabaseService';

function BoatCard({ boat, onSelect, isSelected }) {
  return (
    <div 
      className={`boat-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(boat)}
    >
      <div className="boat-header">
        <div className="boat-title">
          <h3>{boat.name}</h3>
          <div className="location">{boat.location || 'Location not specified'}</div>
        </div>
        <div className="match-percentage">
          {boat.similarity?.total}% Match
        </div>
      </div>

      <div className="boat-specs">
        <div className="spec-group">
          <span className="spec-icon">📏</span>
          <span>{boat.length} ft</span>
          <span className="spec-icon">🚢</span>
          <span>{boat.type}</span>
        </div>
        <div className="spec-group">
          <span className="spec-icon">⚙️</span>
          <span>{boat.engine}</span>
          <span className="spec-icon">🛠️</span>
          <span>{boat.hullMaterial}</span>
        </div>
      </div>

      <div className="feature-tags">
        {boat.features.slice(0, 4).map((feature, index) => (
          <span key={index} className="feature-tag">{feature}</span>
        ))}
        {boat.features.length > 4 && (
          <span className="more-tag">+{boat.features.length - 4} more</span>
        )}
      </div>
    </div>
  );
}

function DetailedComparison({ uploadedBoat, selectedBoat, similarity }) {
  const calculateLengthMatch = (len1, len2) => {
    const diff = Math.abs(len1 - len2);
    const percentage = Math.max(0, 100 - (diff * 5));
    return {
      diff: `${diff} ft difference`,
      match: `${percentage.toFixed(1)}% match`
    };
  };

  const getCommonFeatures = () => {
    return uploadedBoat.features.filter(f => 
      selectedBoat.features.includes(f)
    );
  };

  const getUniqueFeatures = (boat1, boat2) => {
    return boat1.features.filter(f => 
      !boat2.features.includes(f)
    );
  };

  const commonFeatures = getCommonFeatures();
  const uniqueToUploaded = getUniqueFeatures(uploadedBoat, selectedBoat);
  const uniqueToSelected = getUniqueFeatures(selectedBoat, uploadedBoat);
  const featureMatchRate = (commonFeatures.length / Math.max(uploadedBoat.features.length, selectedBoat.features.length) * 100).toFixed(1);
  const lengthComparison = calculateLengthMatch(uploadedBoat.length, selectedBoat.length);

  return (
    <div className="detailed-comparison">
      <h2>Detailed Comparison</h2>
      
      <div className="key-specifications">
        <h3>Key Specifications</h3>
        <div className="specs-grid">
          <div className="spec-item">
            <div className="spec-label">Length</div>
            <div className="spec-values">
              <span>{uploadedBoat.length} ft</span>
              <span>{selectedBoat.length} ft</span>
            </div>
            <div className="spec-comparison">
              {lengthComparison.diff}
              <span className="length-match-percentage">({lengthComparison.match})</span>
            </div>
          </div>

          <div className="spec-item">
            <div className="spec-label">Engine</div>
            <div className="spec-values">
              <span>{uploadedBoat.engine}</span>
            </div>
            <div className="spec-comparison">
              Different Configuration
            </div>
          </div>

          <div className="spec-item">
            <div className="spec-label">Hull Material</div>
            <div className="spec-values">
              <span>{uploadedBoat.hullMaterial}</span>
            </div>
            <div className="spec-comparison">
              Different Material
            </div>
          </div>

          <div className="spec-item">
            <div className="spec-label">Type</div>
            <div className="spec-values">
              <span>{uploadedBoat.type}</span>
              <span>{selectedBoat.type}</span>
            </div>
            <div className="spec-comparison type-comparison">
              Similar Category
            </div>
          </div>
        </div>
      </div>

      <div className="features-analysis">
        <h3>Features Analysis</h3>
        
        <div className="features-summary">
          <div className="summary-item">
            <div className="summary-label">Feature Match Rate</div>
            <div className="summary-value">{featureMatchRate}%</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Common Features</div>
            <div className="summary-value">{commonFeatures.length}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Unique Features</div>
            <div className="summary-value">{uniqueToUploaded.length + uniqueToSelected.length}</div>
          </div>
        </div>

        <div className="features-detail">
          <div className="common-features">
            <h4>Common Features</h4>
            <div className="feature-list">
              {commonFeatures.map((feature, index) => (
                <span key={index} className="feature-tag common">{feature}</span>
              ))}
            </div>
          </div>

          <div className="unique-features">
            <div className="unique-to-boat">
              <h4>Unique to {uploadedBoat.name || 'Uploaded Boat'}</h4>
              <div className="feature-list">
                {uniqueToUploaded.map((feature, index) => (
                  <span key={index} className="feature-tag unique-uploaded">{feature}</span>
                ))}
              </div>
            </div>

            <div className="unique-to-boat">
              <h4>Unique to {selectedBoat.name}</h4>
              <div className="feature-list">
                {uniqueToSelected.map((feature, index) => (
                  <span key={index} className="feature-tag unique-selected">{feature}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageAnalysis() {
  const [uploadedBoat, setUploadedBoat] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [similarBoats, setSimilarBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    // Mock boat data from image analysis
    const mockBoat = {
      type: 'Sailboat',
      length: 38,
      features: [
        'Two cabins',
        'One head',
        'Self-tacking jib',
        'Electric winches',
        'Bow thruster'
      ]
    };

    setUploadedBoat(mockBoat);
    const similar = await findSimilarBoats(mockBoat);
    setSimilarBoats(similar);
    
    // Reset selected boat and comparison when uploading new image
    setSelectedBoat(null);
    setComparisonResult(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  const handleBoatSelect = async (boat) => {
    setSelectedBoat(boat);
    if (uploadedBoat) {
      const result = compareBoats(uploadedBoat, boat);
      setComparisonResult(result);
    }
  };

  return (
    <div className="image-analysis">
      <div className="upload-section">
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          {uploadedImage ? (
            <img src={uploadedImage} alt="Uploaded boat" className="preview-image" />
          ) : (
            <p>Drop a boat image here, or click to select</p>
          )}
        </div>
      </div>

      {similarBoats.length > 0 && (
        <div className="similar-boats">
          <h2>Similar Boats</h2>
          <div className="boat-grid">
            {similarBoats.map(boat => (
              <BoatCard
                key={boat.id}
                boat={boat}
                onSelect={handleBoatSelect}
                isSelected={selectedBoat?.id === boat.id}
              />
            ))}
          </div>
        </div>
      )}

      {comparisonResult && selectedBoat && uploadedBoat && (
        <DetailedComparison
          uploadedBoat={uploadedBoat}
          selectedBoat={selectedBoat}
          similarity={comparisonResult}
        />
      )}
    </div>
  );
}

export default ImageAnalysis;
