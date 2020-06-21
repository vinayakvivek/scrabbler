import React from 'react'
import { observer } from "mobx-react";
import { useStore } from '../store'
import Square from './Square';

const Board = () => {

  const store = useStore();
  const { numRows, numCols } = store.size;

  const renderBoard = () => {
    const rows = [];
    for (let x = 1; x <= numRows; ++x) {
      const squares = []
      for (let y = 1; y <= numCols; ++y) {
        const pos = {x, y};
        squares.push(
          <Square
            key={squares.length}
            pos={pos}
          />
        )
      }
      rows.push(<div className="row" key={rows.length}>{ squares }</div>);
    }
    return rows;
  }

  return (
    <div className="board">
      { renderBoard() }
    </div>
  )
}

export default observer(Board);
