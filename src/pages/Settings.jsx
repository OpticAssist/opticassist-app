import React, { useContext } from 'react'
import Sidebar from "../components/Sidebar.jsx";
import {SettingsContext} from "../context/SettingsContext.js"

export default function Settings() {

    const { settings, setTheme } = useContext(SettingsContext);

    if (!settings) {
        return null;
    }

    const getThemeButtonStyle = (themeName) => {
        return({
                backgroundColor:
                    settings.theme === themeName ? "#26213f" : "white",
                color:
                    settings.theme === themeName ? "white" : "black"
            }
        )
    }

    return (
        <div className="layout">
            <Sidebar />

            <main className="page">
                <h1>Settings</h1>
                <ul>
                    <li>
                        <h2>Theme</h2>
                        <button
                            onClick={() => setTheme("light")}
                            style={getThemeButtonStyle("light")}
                        >Light
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            style={getThemeButtonStyle("dark")}
                        >Dark
                        </button>
                    </li>
                </ul>
            </main>
        </div>
    );
}