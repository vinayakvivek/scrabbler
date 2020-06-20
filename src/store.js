import React from 'react';
import { useLocalStore } from 'mobx-react';
import { init } from './service/init';


const StoreContext = React.createContext();

export const StoreProvider = ({ children }) => {
  const store = useLocalStore(() => ({
    size: { numRows: 15, numCols: 15 },
    board: {},
    posInFocus: { x: 0, y: 0 },
    setFocus: (pos) => {
      store.posInFocus = pos;
    }
  }))

  init(store);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  )
}

export const useStore = () => React.useContext(StoreContext);
