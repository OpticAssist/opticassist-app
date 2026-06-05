import { createContext } from 'react';
import {SettingsContextType} from "../utils/types";


// this default has to be updated whenever new settings are added.
export const SettingsContext =
    createContext<SettingsContextType>(
        {
            settings:
                {
                    theme: "light"
                },
            setTheme: async () => {},
            toggleTheme: async () => {},
        }
    );