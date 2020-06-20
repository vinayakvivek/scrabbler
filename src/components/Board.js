import React from 'react'
import { observer } from "mobx-react";
import { useStore } from '../store'
import Square from './Square';

const Board = () => {

  const store = useStore();
  const { numRows, numCols } = store.size;

  const createRow = () => {
    const squares = [];
    for (let i = 0; i < numCols; ++i) {
      squares.push(<Square key={i}/>);
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

  return (
    <div className="board">
      { createBoard() }
    </div>
  )
}

export default observer(Board);
