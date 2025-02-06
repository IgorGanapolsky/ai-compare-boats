import React from 'react';
import ImageAnalysis from './components/ImageAnalysis';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Boat Image Analysis</h1>
      </header>
      <main>
        <ImageAnalysis />
      </main>
    </div>
  );
}

export default App;
