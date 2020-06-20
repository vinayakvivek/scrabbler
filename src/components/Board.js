import React from 'react'
import { observer } from "mobx-react";
import { useStore } from '../store'
import Square from './Square';

const Board = () => {

  const store = useStore();
  const { numRows, numCols } = store.size;
  const board = store.board;

  const createRow = () => {
    const squares = [];
    for (let i = 0; i < numCols; ++i) {
      squares.push(<Square key={i} reward="N"/>);
    }
    return squares;
  }

  const createBoard = () => {
    const rows = []
    for (let i = 0; i < numRows; ++i) {
      rows.push(<div className="row" key={i}>{ createRow() }</div>);
    }
    return rows;
  }

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
