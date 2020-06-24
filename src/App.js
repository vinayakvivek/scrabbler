import React from 'react';
import './App.css';
import Board from './components/Board';
import { StoreProvider } from './store';
import Rack from './components/Rack';

function App() {
  return (
    <div className="App">
      <h1>Scrabble</h1>
      <StoreProvider>
        <Board/>
        <br/>
        <hr/>
        <Rack/>
      </StoreProvider>
    </div>
  );
}

export default App;
