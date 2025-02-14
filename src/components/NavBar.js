import React from 'react';
import './NavBar.css';

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <a href="/" className="logo">
          BoatFinder
        </a>
        <div className="nav-buttons">
          <button className="nav-button" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3333 13.3333L16.6667 16.6667M15 8.33333C15 11.555 12.555 14 9.33333 14C6.11167 14 3.66667 11.555 3.66667 8.33333C3.66667 5.11167 6.11167 2.66667 9.33333 2.66667C12.555 2.66667 15 5.11167 15 8.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="nav-button" aria-label="Account">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3333 5.83333C13.3333 7.67428 11.8409 9.16667 10 9.16667C8.15905 9.16667 6.66667 7.67428 6.66667 5.83333C6.66667 3.99238 8.15905 2.5 10 2.5C11.8409 2.5 13.3333 3.99238 13.3333 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11.6667C6.77834 11.6667 4.16667 14.2783 4.16667 17.5H15.8333C15.8333 14.2783 13.2217 11.6667 10 11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
