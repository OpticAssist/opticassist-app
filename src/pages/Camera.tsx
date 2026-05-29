import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import Sidebar from "../components/Sidebar.jsx";
import {startModel, sendFrame, stopModel} from "../utils/commands.ts"
import {Message, messageToString} from "../utils/types.ts";

export default function Camera() {
    const webcamRef = useRef<Webcam>(null);
    const intervalRef = useRef<number>(null);

    const [cameraReady, setCameraReady] = useState(false);
    const [message, setMessage] = useState<Message>();

    const capture = useCallback(() => {
            if (!webcamRef.current) {
                console.log("No webcam ref");
                return;
            }

            const imageSrc = webcamRef.current.getScreenshot();

            if (!imageSrc) {
                console.log("Screenshot not ready");
                return;
            }

            console.log("Captured image:", imageSrc);
            let prediction;
            processFrame(imageSrc)
                .then((p) => {prediction = p})
                .catch((e) => {console.error("Processing frame failed:", e)})
            console.log("Prediction object:", prediction)
        }, []
    );


    const beginCapturing = () => {
        if (intervalRef.current) return;

        intervalRef.current = setInterval(() => {
            capture();
        }, 2000);
    };

    useEffect(() => {
        if (cameraReady) {
            // small delay so video frames exist
            setTimeout(() => {
                beginCapturing();
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [cameraReady, capture]);

    return (
        <div className="layout">
            <Sidebar />

            <Webcam
                ref={webcamRef}
                mirrored={true}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                    facingMode: "user",
                    width: 640,
                    height: 480
                }}
                onUserMedia={() => {
                    console.log("Camera ready, starting model");
                    startModel((m) => {
                        setMessage(m);

                    })
                    setCameraReady(true);
                }}
                onUserMediaError={(err) => {
                    console.error("Camera error:", err);
                }}
            />
            <h1>Model Output: </h1>
             {!message? <p> No Output </p>:<p>{messageToString(message)}</p>}
        </div>
    );
}