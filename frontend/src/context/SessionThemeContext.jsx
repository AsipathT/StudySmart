import React, { createContext, useContext, useState } from 'react';

const SessionThemeContext = createContext();

export const SessionThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = () => setIsDark(prev => !prev);
  return (
    <SessionThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </SessionThemeContext.Provider>
  );
};

export const useSessionTheme = () => useContext(SessionThemeContext);
