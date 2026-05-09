import {LazyStore} from "@tauri-apps/plugin-store";
import { useEffect } from 'react';
import { useState } from 'react';
import { SettingsContext } from "./SettingsContext.js"

const store = new LazyStore("settings.json");

// if you are changing this, also change the one in SettingsContext.js
const DEFAULT_SETTINGS = {
    theme: "light"
}

async function getSettings() {
    return (await store.get("settings")) ?? DEFAULT_SETTINGS
}

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS)
    useEffect(() => {
        async function loadSettings() {
            const settingsObj = await getSettings();
            setSettings(settingsObj);
            document.documentElement.setAttribute("data-theme", settingsObj.theme);
            console.log("initial theme: ", settingsObj.theme)

        }

        loadSettings();
    }, [])

    const toggleTheme = async () => {
        const updatedTheme = settings.theme === "light" ? "dark" : "light";
        const updatedSettings = {
            ...settings, theme: updatedTheme
        };
        setSettings(updatedSettings);
        const root = document.documentElement;
        root.setAttribute("data-theme", updatedTheme);
        await store.set("settings", updatedSettings);
    }


    return(
        <SettingsContext.Provider value={{settings, toggleTheme}}>
        {children}
        </SettingsContext.Provider>);
}