import {invoke} from "@tauri-apps/api/core";

type Prediction = {
    label: string;
    confidence: number;
    location: string;
};

export async function processFrame(frameB64: string) {
    const predictions: [Prediction] = await invoke("process_frame", {frameB64: frameB64})
    return predictions;
}