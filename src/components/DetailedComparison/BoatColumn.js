import React from 'react';
import styles from './styles.module.css';
import { useBoatSize } from '../../hooks/useBoatSize';

const BoatImage = React.memo(({ boat }) => (
    <img
        src={boat.imageUrl || '/placeholder-boat.jpg'}
        alt={boat.name || 'Boat'}
        className={styles.boatImage}
        onError={(e) => e.target.src = '/placeholder-boat.jpg'}
    />
));

const MatchRateDisplay = ({ matchRate }) => (
    <div className={styles.matchRateDisplay}>
        <div className={styles.matchCircle} data-match={matchRate >= 75 ? "high" : matchRate >= 50 ? "medium" : "low"}>
            <span>{matchRate}%</span>
            <span className={styles.matchLabel}>Match</span>
        </div>
    </div>
);

const BoatDetails = ({ boat, showPrice, showLocation }) => {
    const { getBoatSize } = useBoatSize();

    return (
        <div className={styles.boatDetails}>
            <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Size:</span>
                <span className={styles.detailValue}>{getBoatSize(boat)}</span>
            </div>
            <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Type:</span>
                <span className={styles.detailValue}>{boat.type || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Engine:</span>
                <span className={styles.detailValue}>{boat.engine || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Hull:</span>
                <span className={styles.detailValue}>{boat.hullMaterial || 'N/A'}</span>
            </div>
            {showPrice && (
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Price:</span>
                    <span className={styles.detailValue}>
                        {boat.price
                            ? `$${new Intl.NumberFormat('en-US').format(boat.price)}`
                            : 'N/A'}
                    </span>
                </div>
            )}
            {showLocation && (
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Location:</span>
                    <span className={styles.detailValue}>{boat.location || 'N/A'}</span>
                </div>
            )}
        </div>
    );
};

export const BoatColumn = ({ boat, title, matchRate, showPrice, showLocation }) => (
    <div className={styles.boatColumn}>
        <div className={styles.boatHeader}>
            <h3>{title}</h3>
            {matchRate && <MatchRateDisplay matchRate={matchRate} />}
            <BoatImage boat={boat} />
            <h4>{boat.name || 'Your boat'}</h4>
        </div>
        <BoatDetails
            boat={boat}
            showPrice={showPrice}
            showLocation={showLocation}
        />
    </div>
); 