import React, {useContext} from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCamera, faGear} from "@fortawesome/free-solid-svg-icons"

import { SettingsContext } from "../context/SettingsContext";
import ThemeIcon from "../components/ThemeIcon";
export default function Home() {
    const navigate = useNavigate();
    const {settings, toggleTheme} = useContext(SettingsContext);
    console.log("Settings object:", settings)
    if (!settings) return null;

    return (
        <main className="home">
            <h1>Optic Assist</h1>
            <div className="menu-row">
                <div>
                    <button onClick={toggleTheme}>{<ThemeIcon/>}</button>
                    <p>Toggle Theme</p>
                </div>
                <div>
                    <button onClick={() => navigate("/camera")}><FontAwesomeIcon icon={faCamera}/></button>
                    <p>Start Optic Assist</p>
                </div>
                <div>
                    <button onClick={() => navigate("/settings")}><FontAwesomeIcon icon={faGear}/></button>
                    <p>Settings</p>
                </div>


            </div>
        </main>
    );
}
