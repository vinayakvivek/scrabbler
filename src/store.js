import React from 'react';
import { useLocalStore } from 'mobx-react';
import { init } from './service/init';

init();

const StoreContext = React.createContext();

export const StoreProvider = ({ children }) => {
  const store = useLocalStore(() => ({
    size: { numRows: 15, numCols: 15 },
    board: {}
  }))

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  )
}

export const useStore = () => React.useContext(StoreContext);