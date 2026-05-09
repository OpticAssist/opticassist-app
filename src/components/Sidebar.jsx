import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React from "react";
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeIcon from "./ThemeIcon.jsx"

import { SettingsContext } from "../context/SettingsContext.js";

const Sidebar = () => {
    const {_, toggleTheme} = useContext(SettingsContext);
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
                    <button><FontAwesomeIcon icon="fa-solid fa-camera"/></button>
                    <span className="tooltip">Start Optic Assist</span>
                </div>
                <div className="sidebar-item">
                    <button onClick={() => navigate("/settings")}><FontAwesomeIcon icon="fa-solid fa-gear"/></button>
                    <span className="tooltip">Settings</span>
                </div>
        </div>
    )
}

export default Sidebar;