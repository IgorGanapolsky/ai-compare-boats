import React, { memo } from 'react';
import styles from './styles.module.css';
import { useBoatSize } from '../../hooks/useBoatSize';

const BoatImage = memo(({ boat }) => (
    <img
        src={boat.imageUrl || '/placeholder-boat.jpg'}
        alt={boat.name || 'Boat'}
        className={styles.boatImage}
        onError={(e) => {
            e.target.src = '/placeholder-boat.jpg';
        }}
        loading="lazy"
    />
));
BoatImage.displayName = 'BoatImage';

const MatchRateDisplay = memo(({ matchRate }) => (
    <div className={styles.matchRateDisplay} role="status" aria-label={`Match rate: ${matchRate}%`}>
        <div className={styles.matchCircle} data-match={matchRate >= 75 ? "high" : matchRate >= 50 ? "medium" : "low"}>
            <span>{matchRate}%</span>
            <span className={styles.matchLabel}>Match</span>
        </div>
    </div>
));
MatchRateDisplay.displayName = 'MatchRateDisplay';

const DetailItem = memo(({ label, value }) => (
    <div className={styles.detailItem}>
        <span className={styles.detailLabel}>{label}:</span>
        <span className={styles.detailValue}>{value || 'N/A'}</span>
    </div>
));
DetailItem.displayName = 'DetailItem';

const BoatDetails = memo(({ boat, showPrice, showLocation }) => {
    const { getBoatSize } = useBoatSize();

    return (
        <div className={styles.boatDetails}>
            <div className={styles.sectionOval}>Specifications</div>
            <div className={styles.detailsGrid}>
                <DetailItem label="Size" value={getBoatSize(boat)} />
                <DetailItem label="Type" value={boat.type} />
                <DetailItem label="Engine" value={boat.engine} />
                <DetailItem label="Hull" value={boat.hullMaterial} />
                {showPrice && (
                    <DetailItem
                        label="Price"
                        value={boat.price ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(boat.price) : undefined}
                    />
                )}
                {showLocation && <DetailItem label="Location" value={boat.location} />}
            </div>
        </div>
    );
});
BoatDetails.displayName = 'BoatDetails';

export const BoatColumn = memo(({ boat, title, matchRate, showPrice, showLocation, hideMatchRate = false }) => (
    <div className={styles.boatColumn}>
        <div className={styles.boatHeader}>
            <h3>{title}</h3>
            {matchRate && !hideMatchRate && <MatchRateDisplay matchRate={matchRate} />}
            <BoatImage boat={boat} />
            <h4>{boat.name || 'Your boat'}</h4>
        </div>
        <BoatDetails
            boat={boat}
            showPrice={showPrice}
            showLocation={showLocation}
        />
    </div>
));
BoatColumn.displayName = 'BoatColumn'; 