import React, { useContext } from 'react';
import { SettingsContext } from "../context/SettingsContext.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons"

const ThemeIcon = () => {
    const {settings} = useContext(SettingsContext);
    if (!settings) return null;
    return settings.theme === "light"
        ? <FontAwesomeIcon icon={faSun}/>
        : <FontAwesomeIcon icon={faMoon}/>
}

export default ThemeIcon;