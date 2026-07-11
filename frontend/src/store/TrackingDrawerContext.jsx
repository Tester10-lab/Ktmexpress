import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TrackingDrawerContext = createContext();

export const useTrackingDrawer = () => useContext(TrackingDrawerContext);

export const TrackingDrawerProvider = ({ children }) => {
  const [trackingCode, setTrackingCode] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle deep-linking on mount and URL changes
  useEffect(() => {
    if (location.pathname.startsWith('/tracking/') && location.pathname.length > 10) {
      const code = location.pathname.split('/')[2];
      if (code && code !== trackingCode) {
        setTrackingCode(code);
      }
    } else if (trackingCode && !location.pathname.startsWith('/tracking/')) {
      // If we navigate away, close the drawer
      setTrackingCode(null);
    }
  }, [location.pathname]);

  const openTracking = (code) => {
    setTrackingCode(code);
    navigate(`/tracking/${code}`, { replace: false });
  };

  const closeTracking = () => {
    setTrackingCode(null);
    if (location.pathname.startsWith('/tracking/')) {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <TrackingDrawerContext.Provider value={{ trackingCode, openTracking, closeTracking }}>
      {children}
    </TrackingDrawerContext.Provider>
  );
};
