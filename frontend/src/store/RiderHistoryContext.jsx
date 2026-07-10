import React, { createContext, useContext } from 'react';

const RiderHistoryContext = createContext({
  openRiderHistory: () => {}
});

export function RiderHistoryProvider({ children }) {
  return (
    <RiderHistoryContext.Provider value={{
      openRiderHistory: () => console.log('RiderHistoryProvider missing')
    }}>
      {children}
    </RiderHistoryContext.Provider>
  );
}

export const useRiderHistory = () => useContext(RiderHistoryContext);
