import React from 'react';
import styles from './styles.module.css';

export const ComparisonHeader = ({ onClose }) => (
    <div className={styles.popupHeader}>
        <h2>Detailed Comparison</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
    </div>
); 