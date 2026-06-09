import React from 'react'
import {LazyStore} from "@tauri-apps/plugin-store";
import {ReactNode, useEffect} from 'react';
import { useState } from 'react';
import { SettingsContext } from "./SettingsContext"
import {Settings} from "../utils/types";

const store = new LazyStore("settings.json");

// if you are changing this, also change the one in SettingsContext.ts
const DEFAULT_SETTINGS: Settings = {
    theme: "light",
    captureRate: 2000
}

async function getSettings(): Promise<Settings> {
    return (await store.get("settings")) ?? DEFAULT_SETTINGS
}

interface SettingsProviderProps {
    children: ReactNode
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
    useEffect(() => {
        async function loadSettings() {
            const settingsObj = await getSettings();
            setSettings(settingsObj);
            document.documentElement.setAttribute("data-theme", settingsObj.theme);
            console.log("initial theme:", settingsObj.theme)

        }

        void loadSettings()
    }, [])

    const setTheme = async (theme: "light" | "dark") => {
        const updated = {...settings, theme}
        setSettings(updated);
        const root = document.documentElement;
        root.setAttribute("data-theme", updated.theme)
        await store.set("settings", updated);
    }

    const toggleTheme = async () => {
        const updatedTheme = settings.theme === "light" ? "dark" : "light";
        const updatedSettings: Settings = {
            ...settings, theme: updatedTheme
        };
        setSettings(updatedSettings);
        const root = document.documentElement;
        root.setAttribute("data-theme", updatedTheme);
        await store.set("settings", updatedSettings);
    }

    const setCaptureRate = async (rate: number) => {
        const updated = {...settings, captureRate: rate};
        setSettings(updated);
        await store.set("settings", updated);
    }


    return(
        <SettingsContext.Provider value={{settings, setTheme, toggleTheme, setCaptureRate}}>
        {children}
        </SettingsContext.Provider>);
}