import React, { createContext, useContext } from 'react';

const TrackingDrawerContext = createContext({
  openTracking: () => {},
  openShopPickups: () => {}
});

export function TrackingDrawerProvider({ children }) {
  return (
    <TrackingDrawerContext.Provider value={{
      openTracking: () => console.log('TrackingDrawerProvider missing'),
      openShopPickups: () => console.log('TrackingDrawerProvider missing')
    }}>
      {children}
    </TrackingDrawerContext.Provider>
  );
}

export const useTrackingDrawer = () => useContext(TrackingDrawerContext);
