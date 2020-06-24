import React from 'react';
import { useLocalStore } from 'mobx-react';
import { init } from './service/init';


const StoreContext = React.createContext();

export const StoreProvider = ({ children }) => {
  const store = useLocalStore(() => ({
    size: { numRows: 15, numCols: 15 },
    board: {},
    posInFocus: { x: 1, y: 1 },
    rack: [],
    setFocus: (pos) => {
      store.posInFocus = pos;
    },
    setScore: (pos, score) => {
      store.board[pos.x][pos.y].score = score;
    }
  }))

  init(store);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  )
}

export const useStore = () => React.useContext(StoreContext);
