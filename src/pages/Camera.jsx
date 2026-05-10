
import React, {useState} from "react";
import Webcam from "react-webcam"
import { useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar.jsx"

export default function Camera() {
    const webcamRef = useRef(null);
    const intervalRef = useRef(null);
    const [cameraReady, setCameraReady] = useState(false);

    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if(!imageSrc) {
            console.log("Screenshot not ready")
            return;
        }
        console.log("Captured image:", imageSrc)
    }

    const beginCapturing = () => {
        if(intervalRef.current) return;

        intervalRef.current = setInterval(() => {
            capture();
        }, 2000);
    };

    useEffect(() => {
        return () => {
            if(intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    console.log("mediaDevices:", navigator.mediaDevices);
    console.log("getUserMedia:", navigator.mediaDevices?.getUserMedia)
    console.log(window.location.origin)
    return(
        <div className="layout">
            <Sidebar />
            <Webcam
                mirrored={true}
                ref={webcamRef}
                audio={false}
                videoConstraints={{facingMode: "user"}}
                onUserMedia={() => {
                    console.log("Camera ready");
                    setCameraReady(true);
                    beginCapturing();
                }}
                onUserMediaError={(err) => {
                    console.error("Camera error:", err)
                }}
                screenshotFormat={"image/jpeg"}>
            </Webcam>
        </div>
    )
}