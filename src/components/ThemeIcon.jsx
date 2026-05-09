import React, { useContext } from 'react';
import { SettingsContext } from "../context/SettingsContext.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

const ThemeIcon = () => {
    const {settings, toggleTheme} = useContext(SettingsContext);
    if (!settings) return null;
    return settings.theme === "light"
        ? <FontAwesomeIcon icon="fa-solid fa-sun"/>
        : <FontAwesomeIcon icon="fa-solid fa-moon"/>
}

export default ThemeIcon;