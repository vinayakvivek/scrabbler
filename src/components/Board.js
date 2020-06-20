import React, { useEffect } from 'react'
import { observer } from "mobx-react";
import { useStore } from '../store'
import Square from './Square';

const Board = () => {

  const store = useStore();
  const board = store.board;
  const posInFocus = store.posInFocus;

  const isInFocus = (pos) => {
    return posInFocus.x === pos.x && posInFocus.y === pos.y;
  }

  const renderBoard = () => {
    const rows = [];
    for (const row of board) {
      const squares = []
      for (const square of row) {
        squares.push(
          <Square
            key={squares.length}
            data={{...square, focus: isInFocus(square.pos) }}
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
