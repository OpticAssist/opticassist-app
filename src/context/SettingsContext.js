import { createContext } from 'react';

// this default has to be updated whenever new settings are added.
export const SettingsContext = createContext({theme: "light"});