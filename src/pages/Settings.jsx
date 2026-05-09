import React from 'react'
import Sidebar from "../components/Sidebar.jsx";

export default function Settings() {
    return (
        <div className="layout">
            <Sidebar />

            <main className="page">
                <h1>Settings</h1>
            </main>
        </div>
    );
}