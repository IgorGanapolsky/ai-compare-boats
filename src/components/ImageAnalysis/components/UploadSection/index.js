import React from 'react';
import styles from './styles.module.css';

const UploadSection = ({ getRootProps, getInputProps, isDragActive }) => {
  return (
    <div {...getRootProps()} className={styles.dropzone}>
      <input {...getInputProps()} />
      <div className={styles.content}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 16.2091 19.2091 18 17 18M7 10C4.79086 10 3 11.7909 3 14C3 16.2091 4.79086 18 7 18M7 10C8.01445 10 8.94069 10.3776 9.64582 11M12 21V13M12 13L15 16M12 13L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {isDragActive ? (
          <p className={styles.text}>Drop the image here...</p>
        ) : (
          <>
            <p className={styles.text}>Drag and drop a boat image here</p>
            <p className={styles.subtext}>or click to select from your computer</p>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadSection;
