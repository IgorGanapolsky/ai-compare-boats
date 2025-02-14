import React from 'react';
import ImageAnalysis from './components/ImageAnalysis';
import NavBar from './components/NavBar';
import './App.css';

function App() {
  return (
    <div className="App">
      <NavBar />
      <main className="main-content">
        <ImageAnalysis />
      </main>
    </div>
  );
}

export default App;
