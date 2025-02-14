import React from 'react';
import ImageAnalysis from './components/ImageAnalysis';
import NavBar from './components/NavBar';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <div className="logo">BoatFinder</div>
          <div className="header-icons">
            <button className="icon-button" aria-label="Help">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6024 18.3334 10C18.3334 5.39763 14.6024 1.66667 10 1.66667C5.39765 1.66667 1.66669 5.39763 1.66669 10C1.66669 14.6024 5.39765 18.3333 10 18.3333Z" stroke="#6B7280" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.57501 7.5C7.77093 6.94306 8.15764 6.47342 8.66664 6.17428C9.17564 5.87513 9.77409 5.76578 10.3559 5.86559C10.9378 5.96541 11.4657 6.26794 11.8459 6.71961C12.2261 7.17128 12.4342 7.74294 12.4333 8.33334C12.4333 10 9.93335 10.8333 9.93335 10.8333" stroke="#6B7280" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 14.1667H10.0083" stroke="#6B7280" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="icon-button" aria-label="User account">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 17.5V15.8333C16.6667 14.9493 16.3155 14.1014 15.6904 13.4763C15.0653 12.8512 14.2174 12.5 13.3334 12.5H6.66671C5.78265 12.5 4.93481 12.8512 4.30968 13.4763C3.68456 14.1014 3.33337 14.9493 3.33337 15.8333V17.5" stroke="#6B7280" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.99996 9.16667C11.8409 9.16667 13.3333 7.67428 13.3333 5.83333C13.3333 3.99238 11.8409 2.5 9.99996 2.5C8.15901 2.5 6.66663 3.99238 6.66663 5.83333C6.66663 7.67428 8.15901 9.16667 9.99996 9.16667Z" stroke="#6B7280" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      <NavBar />
      <main className="main-content">
        <ImageAnalysis />
      </main>
    </div>
  );
}

export default App;
