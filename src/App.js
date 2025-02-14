import React from 'react';
import NavBar from './components/NavBar';
import ImageAnalysis from './components/ImageAnalysis';
import './App.css';

function App() {
  return (
    <div className="App">
      <NavBar />
      <main>
        <ImageAnalysis />
      </main>
    </div>
  );
}

export default App;
