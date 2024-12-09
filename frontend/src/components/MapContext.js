import React, { createContext, useState } from "react";

export const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [mapCenter, setMapCenter] = useState({ location: [49.45, 11.09], zoom: 10 });

  return (
    <MapContext.Provider value={{ mapCenter, setMapCenter }}>
      {children}
    </MapContext.Provider>
  );
};
