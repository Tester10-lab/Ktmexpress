import React, { createContext, useContext, useState } from 'react';

const TrackingDrawerContext = createContext();

export const useTrackingDrawer = () => useContext(TrackingDrawerContext);

export const TrackingDrawerProvider = ({ children }) => {
  const [trackingCode, setTrackingCode] = useState(null);
  const [shopData, setShopData] = useState(null);

  const openTracking = (code) => {
    setTrackingCode(code);
    setShopData(null);
  };

  const openShopTracking = (shopName, packages) => {
    setShopData({ shopName, packages });
    setTrackingCode(null);
  };

  const closeTracking = () => {
    setTrackingCode(null);
    setShopData(null);
  };

  return (
    <TrackingDrawerContext.Provider value={{ trackingCode, shopData, openTracking, openShopTracking, closeTracking }}>
      {children}
    </TrackingDrawerContext.Provider>
  );
};
