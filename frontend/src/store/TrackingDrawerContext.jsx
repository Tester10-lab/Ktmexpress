import React, { createContext, useContext, useState } from 'react';

const TrackingDrawerContext = createContext();

export const useTrackingDrawer = () => useContext(TrackingDrawerContext);

export const TrackingDrawerProvider = ({ children }) => {
  const [trackingCode, setTrackingCode] = useState(null);

  const openTracking = (code) => {
    setTrackingCode(code);
  };

  const closeTracking = () => {
    setTrackingCode(null);
  };

  return (
    <TrackingDrawerContext.Provider value={{ trackingCode, openTracking, closeTracking }}>
      {children}
    </TrackingDrawerContext.Provider>
  );
};
