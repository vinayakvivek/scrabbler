import React from 'react'
import { observer } from "mobx-react";
import { useStore } from '../store'
import Square from './Square';

const Board = () => {

  const store = useStore();
  const { numRows, numCols } = store.size;
  const board = store.board;

  const renderBoard = () => {
    const rows = [];
    for (const row of board) {
      const squares = []
      for (const square of row) {
        squares.push(
          <Square
            key={squares.length}
            data={{...square }}
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
