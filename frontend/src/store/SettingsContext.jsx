import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import brandLogo from '../assets/logo.png';

const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
  const [logoUrl] = useState(brandLogo);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshSettings = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    api.get('/public/settings')
      .then(res => {
        if (res.data.success && res.data.data?.logoUrl) {
          // Update favicon dynamically to use the bundled logo
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = brandLogo;
        }
      })
      .catch(err => console.error("Failed to fetch settings", err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  return (
    <SettingsContext.Provider value={{ logoUrl, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
