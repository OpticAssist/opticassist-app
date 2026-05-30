import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import Sidebar from "../components/Sidebar.jsx";
import {startModel, sendFrame, stopModel} from "../utils/commands.ts"
import {Message, messageToString} from "../utils/types.ts";

export default function Camera() {
    const webcamRef = useRef<Webcam>(null);
    const intervalRef = useRef<number>(null);
    const [cameraReady, setCameraReady] = useState<boolean>(false);
    const [modelReady, setModelReady] = useState<boolean>(false);
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
            if (modelReady) {
                sendFrame(imageSrc)
                    .catch((e: string) => console.error(e));
            } else {
                console.log("Took screenshot, but model wasn't ready. Skipping frame.")
            }
        }, []
    );

    const beginCapturing = () => {
        if (intervalRef.current) return;

        intervalRef.current = setInterval(() => {
            capture();
        }, 2000);
    };

    useEffect(() => {
        if (!cameraReady) return;

        const timeout = setTimeout(() => {
            beginCapturing();
        }, 1000);

        return () => {
            clearTimeout(timeout);

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [cameraReady]);

    // start the model
    useEffect(() => {
        startModel(
            (m) => {
                switch(m.kind) {
                    case "status":
                        if(m.message === "200 OK") {
                            setModelReady(true)
                        }
                        break;
                }
                setMessage(m)
            }
        ).catch((e: string) => {
            console.error(e)
        })
    }, [cameraReady])

    // stop the model
    useEffect(() => {
        return () => {
            stopModel().catch((e) => console.error(e))
            setModelReady(false);
        }
    }, [])

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