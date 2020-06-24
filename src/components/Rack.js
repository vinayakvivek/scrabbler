import React from 'react';
import { observer } from 'mobx-react'
import { useStore } from '../store'
import { LETTER_SCORES } from '../service/square';

const Rack = () => {
  const store = useStore();
  const rack = store.rack;

  const renderRack = () => {
    const tiles = [];
    for (const letter of rack) {
      const score = letter.blank ? 0 : LETTER_SCORES[letter.value];
      tiles.push(
        <div className={`square`}>
          <div>
            <p className="value">{letter.value}</p>
            <p className="score">{score}</p>
          </div>
        </div>
      )
    }
    return tiles;
  }

  return (
    <div className='rack'>
      { renderRack() }
    </div>
  )
}

export default observer(Rack);
