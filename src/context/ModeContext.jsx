import React, { createContext, useContext, useState } from "react";

const ModeContext = createContext(null);

export function ModeProvider({ children }) {
  const [mode, setMode] = useState("aprendizaje"); // 'aprendizaje' | 'evaluacion' | 'libre'
  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
