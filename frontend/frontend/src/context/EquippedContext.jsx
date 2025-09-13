import React, { createContext, useContext, useState } from 'react';

// Default values
const EquippedContext = createContext({
  equippedPig: 'pink',
  setEquippedPig: () => {},
  equippedCosmetic: null,
  setEquippedCosmetic: () => {},
});

export function EquippedProvider({ children }) {
  const [equippedPig, setEquippedPig] = useState('pink');
  const [equippedCosmetic, setEquippedCosmetic] = useState(null);

  return (
    <EquippedContext.Provider value={{ equippedPig, setEquippedPig, equippedCosmetic, setEquippedCosmetic }}>
      {children}
    </EquippedContext.Provider>
  );
}

export function useEquipped() {
  return useContext(EquippedContext);
}
