import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import Sidebar from "../components/Sidebar.tsx";
import {startModel, sendFrame, stopModel} from "../utils/commands.ts"

export default function Camera() {
    return(
        <>
        <Sidebar />


        </>
    )
}