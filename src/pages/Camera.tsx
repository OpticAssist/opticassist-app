import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import Sidebar from "../components/Sidebar";
import {startModel, sendFrame, stopModel} from "../utils/commands"
import {Message, messageToString} from "../utils/types";

export default function Camera() {
    const webcamRef = useRef<Webcam>(null);
    const intervalRef = useRef<number>(null);
    const [cameraReady, setCameraReady] = useState<boolean>(false);
    const [message, setMessage] = useState<Message>();
    const [modelReady, setModelReady] = useState<boolean>(false);
    const [outputReady, setOutputReady] = useState<boolean>(false);

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

            console.log("Captured image");
            let jpeg_prefix = "data:image/jpeg;base64,"
        let modelInput = imageSrc;
            if(imageSrc.startsWith(jpeg_prefix)){
                modelInput = imageSrc.substring(jpeg_prefix.length);
            }
            if (modelReady) {
                sendFrame(modelInput)
                    .catch((e: string) => console.error(e));
            } else {
                console.log("Took screenshot, but model wasn't ready. Skipping frame.")
            }
        }, [modelReady]
    );

    const speak = (text: string) => {
        return new Promise<void>((resolve, reject) => {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (err_event) => {
                reject(err_event.error)
            }

                window.speechSynthesis.speak(utterance);
        });
    }

    const beginCapturing = () => {
        if (intervalRef.current) return;

        // @ts-ignore
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
    }, [cameraReady, capture]);

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
                    case "output":
                        setOutputReady(true);
                        const processPredictions = async () => {
                            for(const p of m.predictions) {
                                let text: string;

                                if (p.label === "person") {
                                    text = `There is a person at the ${p.location}`
                                } else if(["a", "e", "i", "o", "u"].includes(p.color.charAt(0))) {
                                    text = `There is an ${p.color} ${p.label} at the ${p.location}, ${(p.confidence * 100).toFixed(2)}% confidence.`;
                                } else {
                                    text = `There is a ${p.color} ${p.label} at the ${p.location}, ${(p.confidence * 100).toFixed(2)}% confidence.`;
                                }

                                try {
                                    await speak(text);
                                } catch (e) {
                                    console.error("Speaking failed:", e);
                                }
                            }
                        };
                        let _ = processPredictions();
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
        <div className = {outputReady?"cam":"no-cam"}>
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
        </div>
            <h1>Model Output: </h1>
            {!message? <p> No Output </p>:<p>{messageToString(message)}</p>}
        </div>
    );
}