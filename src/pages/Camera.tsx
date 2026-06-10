import React, {useState, useRef, useEffect, useCallback, useContext} from "react";
import Webcam from "react-webcam";
import Sidebar from "../components/Sidebar";
import {startModel, sendFrame, stopModel} from "../utils/commands"
import {Message, messageToString} from "../utils/types";
import {SettingsContext} from "../context/SettingsContext";

export default function Camera() {
    const {settings} = useContext(SettingsContext);
    const previousPredictionsRef = useRef<Set<string>>(new Set());
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
            console.log("Available voices:", window.speechSynthesis.getVoices())
            // window.speechSynthesis.cancel();

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
        console.log("Starting capture interval")
        if (intervalRef.current) return;
        intervalRef.current = setInterval(() => {
            capture();
        }, settings.captureRate);
        speak("Welcome to optic assist. Please wait momentarily as the model loads.").catch((e)=>(console.error("Intro failed: "+e)));

    };

    useEffect(() => {
        if (!cameraReady || !modelReady) return;

        const timeout = setTimeout(() => {
            beginCapturing();
        }, 5000);

        return () => {
            clearTimeout(timeout);

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [cameraReady, modelReady, capture]);

    // start the model
    useEffect(() => {
        startModel(
            (m) => {
                switch(m.kind) {
                    case "status":
                        if(m.message === "200 OK") {
                            console.log("Got 200 OK");
                            setModelReady(true);
                        }
                        break;
                    case "output":
                        setOutputReady(true);
                        const currentPredictions = new Map(
                            m.predictions.map((p) => {
                                if (p.label === "person") {
                                    return [`person:${p.location}`,`There is a person at the ${p.location}`]
                                } else if(["a", "e", "i", "o", "u"].includes(p.color.charAt(0))) {
                                    return [`${p.label}:${p.location}`, `There is an ${p.color} ${p.label} at the ${p.location}, ${(p.confidence * 100).toFixed(2)}% confidence.`]
                                } else {
                                    return [`${p.label}:${p.location}`, `There is a ${p.color} ${p.label} at the ${p.location}, ${(p.confidence * 100).toFixed(2)}% confidence.`]
                                }
                            }
                        ));

                        console.log(`Current predictions: ${currentPredictions}`);

                        const processPredictions = async () => {

                            try {
                                for (const key of [...previousPredictionsRef.current]) {
                                    if (!currentPredictions.has(key)) {
                                        const [label, location] = key.split(":");
                                        await speak(`${label} at the ${location} has left field of view.`)
                                    }

                                    previousPredictionsRef.current.delete(key);
                                }

                                for (const [key, text] of currentPredictions.entries()) {

                                    if (!previousPredictionsRef.current.has(key)) {
                                        previousPredictionsRef.current.add(key);
                                        await speak(text);
                                    }
                                }
                            } catch (e) {
                               console.error("Speaking failed:", e)
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
    }, [/*cameraReady, modelReady*/])

    // stop the model
    useEffect(() => {
        return () => {
            speak("Thank you for using Optic Assist.").catch((e) => console.error(e))
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