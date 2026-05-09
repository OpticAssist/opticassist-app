import React, {useContext, useState} from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import "../App.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
library.add(fas, far, fab)

import { SettingsContext } from "../context/SettingsContext.js";
export default function Home() {
    const navigate = useNavigate();
    const {settings, toggleTheme} = useContext(SettingsContext);
    console.log("Settings object:", settings)
    if (!settings) return null;

    const getThemeIcon = () => {
        console.log(settings.theme)
        return settings.theme === "light"
            ? <FontAwesomeIcon icon="fa-solid fa-sun"/>
            : <FontAwesomeIcon icon="fa-solid fa-moon"/>
    }

    return (
        <main className="container">
            <h1>Optic Assist</h1>
            <div className="menu-row">
                <div>
                    <button onClick={toggleTheme}>{getThemeIcon()}</button>
                    <p>Toggle Theme</p>
                </div>
                <div>
                    <button><FontAwesomeIcon icon="fa-solid fa-camera"/></button>
                    <p>Start Optic Assist</p>
                </div>
                <div>
                    <button onClick={() => navigate("/settings")}><FontAwesomeIcon icon="fa-solid fa-gear"/></button>
                    <p>Settings</p>
                </div>


            </div>
        </main>
    );
}
