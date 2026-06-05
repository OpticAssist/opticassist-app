import React from "react";
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";
import Home from "./pages/Home"
import Settings from "./pages/Settings"
import Camera from "./pages/Camera";
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
