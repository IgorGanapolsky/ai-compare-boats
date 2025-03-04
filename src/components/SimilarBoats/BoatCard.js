import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';
import FeatureList from './FeatureList';

/**
 * Format match percentage for display
 * @param {number} score - Match score
 * @returns {string} - Formatted percentage
 */
const formatMatchPercentage = (score) => {
    if (typeof score !== 'number' || isNaN(score)) return '0%';
    return `${Math.round(score)}%`;
};

/**
 * Get CSS class based on match percentage
 * @param {number} score - Match score
 * @returns {string} - CSS class name
 */
const getMatchScoreClass = (score) => {
    if (typeof score !== 'number' || isNaN(score)) return styles.lowMatch;
    if (score >= 80) return styles.highMatch;
    if (score >= 60) return styles.mediumMatch;
    return styles.lowMatch;
};

/**
 * Get ARIA label for boat card
 * @param {Object} boat - Boat data
 * @returns {string} - ARIA label
 */
const getBoatAriaLabel = (boat) => {
    let label = `Select ${boat.name} for comparison`;

    if (boat.matchScore) {
        const roundedScore = Math.round(boat.matchScore);
        label += `, ${roundedScore}% match`;
    }

    return label;
};

/**
 * BoatCard component for displaying a boat in the similar boats grid
 * 
 * @param {Object} props Component props
 * @param {Object} props.boat Boat data
 * @param {boolean} props.selected Whether this boat is selected
 * @param {Function} props.onSelect Function to call when boat is selected
 * @param {Function} props.onImageError Function to call when image fails to load
 * @param {boolean} props.hasImageError Whether image has failed to load
 * @returns {JSX.Element} Rendered component
 */
const BoatCard = ({
    boat,
    selected,
    onSelect,
    onImageError,
    hasImageError
}) => {
    return (
        <button
            className={`${styles.boatCard} ${selected ? styles.selectedCard : ''}`}
            onClick={onSelect}
            aria-pressed={selected}
            aria-label={getBoatAriaLabel(boat)}
            type="button"
        >
            <div className={styles.boatImageContainer}>
                <img
                    src={hasImageError ? 'https://via.placeholder.com/300x200?text=No+Image' : boat.imageUrl}
                    alt={boat.name}
                    className={styles.boatImage}
                    onError={onImageError}
                />
                <div className={styles.matchBadge}>
                    <span className={getMatchScoreClass(boat.matchScore)}>
                        {formatMatchPercentage(boat.matchScore)} Match
                    </span>
                </div>
            </div>

            <div className={styles.boatInfo}>
                <h3>{boat.name}</h3>
                <div className={styles.priceLocation}>
                    {boat.price && (
                        <div className={styles.price}>
                            ${typeof boat.price === 'number' ? boat.price.toLocaleString() : boat.price}
                        </div>
                    )}
                    {boat.location && <div className={styles.location}>{boat.location}</div>}
                </div>

                <div className={styles.specGrid}>
                    <div className={styles.specItem}>
                        <div className={styles.specLabel}>Length</div>
                        <div className={styles.specValue}>{boat.length} ft</div>
                    </div>
                    <div className={styles.specItem}>
                        <div className={styles.specLabel}>Type</div>
                        <div className={styles.specValue}>{boat.type}</div>
                    </div>

                    {boat.engine && (
                        <div className={styles.specItem}>
                            <div className={styles.specLabel}>Engine</div>
                            <div className={styles.specValue}>{boat.engine}</div>
                        </div>
                    )}

                    {boat.hullMaterial && (
                        <div className={styles.specItem}>
                            <div className={styles.specLabel}>Hull</div>
                            <div className={styles.specValue}>{boat.hullMaterial}</div>
                        </div>
                    )}
                </div>

                {boat.features && boat.features.length > 0 && (
                    <div className={styles.featuresSection}>
                        <div className={styles.sectionOval}>Features</div>
                        <FeatureList features={boat.features} maxInitialFeatures={3} />
                    </div>
                )}
            </div>
        </button>
    );
};

BoatCard.propTypes = {
    boat: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        imageUrl: PropTypes.string,
        matchScore: PropTypes.number,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        location: PropTypes.string,
        length: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        type: PropTypes.string,
        engine: PropTypes.string,
        hullMaterial: PropTypes.string,
        features: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    selected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    onImageError: PropTypes.func.isRequired,
    hasImageError: PropTypes.bool
};

BoatCard.defaultProps = {
    selected: false,
    hasImageError: false
};

export default BoatCard; 