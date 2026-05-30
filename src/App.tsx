import React from "react";
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";
import Home from "./pages/Home.tsx"
import Settings from "./pages/Settings.tsx"
import Camera from "./pages/Camera.tsx";
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
