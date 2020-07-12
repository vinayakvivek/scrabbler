import React from 'react';
import { useLocalStore } from 'mobx-react';
import { resetBoard } from './service/utils';
import boardData from './service/boards/empty.json';


const StoreContext = React.createContext();

export const StoreProvider = ({ children }) => {
  const store = useLocalStore(() => ({
    size: { numRows: 15, numCols: 15 },
    board: {},
    posInFocus: { x: 1, y: 1 },
    rack: [],
    status: 0,
    setFocus: (pos) => {
      store.posInFocus = pos;
    },
    setScore: (pos, score) => {
      store.board[pos.x][pos.y].score = score;
    },
    setTile: (pos, l) => {
      store.board[pos.x][pos.y].setTile(l);
      store.posInFocus = pos;
    }
  }))

  resetBoard(store, boardData);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  )
}

export const useStore = () => React.useContext(StoreContext);
