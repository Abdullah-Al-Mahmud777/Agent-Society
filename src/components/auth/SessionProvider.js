"use client";

import { createContext, useContext } from "react";

const SessionContext = createContext(null);

export function SessionProvider({ user, children }) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
