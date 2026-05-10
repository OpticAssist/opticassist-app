import React from "react";
// import { invoke } from "@tauri-apps/api/core";
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";
import Home from "./pages/Home.jsx"
import Settings from "./pages/Settings.jsx"
import Camera from "./pages/Camera.jsx";
function App() {
   return (
       <Router>
           <Routes>
               <Route path="/" element={<Home/>}/>
               <Route path="/settings" element={<Settings/>}/>
               <Route path="/camera" element={<Camera/>}/>
           </Routes>
       </Router>
   )
}

export default App;
