import {invoke} from "@tauri-apps/api/core";
import { Channel } from "@tauri-apps/api/core";


export async function startModel() {
    const outputChannel = new Channel();

    outputChannel.onmessage = () => {

    }

    const startup_status = await invoke("start_model", {})
}

// export async function processFrame(frameB64: string) {
//     const predictions: [Prediction] = await invoke("process_frame", {frameB64: frameB64})
//     return predictions;
// }