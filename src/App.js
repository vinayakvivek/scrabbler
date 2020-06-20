import React from 'react';
import './App.css';
import Board from './components/Board';
import { StoreProvider } from './store';

function App() {
  return (
    <div className="App">
      <h1>Scrabble</h1>
      <StoreProvider>
        <Board/>
      </StoreProvider>
    </div>
  );
}

export default App;
