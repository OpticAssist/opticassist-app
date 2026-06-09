import React, { useContext } from 'react'
import Sidebar from "../components/Sidebar";
import {SettingsContext} from "../context/SettingsContext"

export default function Settings() {

    const { settings, setTheme, setCaptureRate } = useContext(SettingsContext);

    if (!settings) {
        return null;
    }

    const getThemeButtonStyle = (themeName: "light" | "dark") => {
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
                    <li>
                        <h2>Capture Rate</h2>
                        <p>Default: 2000ms</p>
                        <input
                            type="range"
                            id="capture-rate"
                            name="capture-rate"
                            min="1000"
                            max="20000"
                            value={settings.captureRate}
                            step="500"
                            onChange={(e) => setCaptureRate(Number(e.target.value))}
                        />
                        <label htmlFor="capture-rate">{settings.captureRate}</label>
                    </li>
                </ul>
            </main>
        </div>
    );
}