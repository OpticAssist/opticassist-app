import React, {useContext, useState} from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { SettingsContext } from "./context/SettingsContext.js";
function App() {
    const {settings, toggleTheme} = useContext(SettingsContext);
    console.log("Settings object:", settings)
    if (!settings) return null;

    const getThemeIcon = () => {
        console.log(settings.theme)
        return settings.theme === "light"
            ? <i className="fa-solid fa-sun"></i>
            : <i className="fa-solid fa-moon"></i>
    }

  return (
    <main className="container">
      <h1>Optic Assist</h1>
        <button onClick={toggleTheme}>{getThemeIcon()}</button>
    </main>
  );
}

export default App;
