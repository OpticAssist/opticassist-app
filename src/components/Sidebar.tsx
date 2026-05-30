import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCamera, faGear} from "@fortawesome/free-solid-svg-icons"
import React from "react";
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeIcon from "./ThemeIcon.tsx"

import { SettingsContext } from "../context/SettingsContext.ts";

const Sidebar = () => {
    const {toggleTheme} = useContext(SettingsContext);
    const navigate = useNavigate();
    return(
        <div className="sidebar">
            <div className="sidebar-item">
                <button onClick={() => navigate("/")}>[logo]</button>
                <span className="tooltip">Back to Home</span>
            </div>
            <div className="sidebar-item">
                <button onClick={toggleTheme}><ThemeIcon/></button>
                <span className="tooltip">Toggle Theme</span>
            </div>
            <div className="sidebar-item">
                <button onClick={() => navigate("/camera")}><FontAwesomeIcon icon={faCamera}/></button>
                <span className="tooltip">Start Optic Assist</span>
            </div>
            <div className="sidebar-item">
                <button onClick={() => navigate("/settings")}><FontAwesomeIcon icon={faGear}/></button>
                <span className="tooltip">Settings</span>
            </div>
        </div>
    )
}

export default Sidebar;