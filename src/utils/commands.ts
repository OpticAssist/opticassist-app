import { invoke } from "@tauri-apps/api/core";
import { Channel } from "@tauri-apps/api/core";
import { Message } from "./types";

export async function startModel(onMessage: (msg: Message) => void) {
    const outputChannel = new Channel<Message>();

    // (msg: Message) => {
    //     switch(msg.kind) {
    //         case "output":
    //             predictions=msg.predictions;
    //             break;
    //         default:
    //             console.error(`Expected output from channel, received ${msg.kind}`);
    //     }
    // }

    outputChannel.onmessage = onMessage;

    return await invoke("start_model", {channel: outputChannel})
}

export async function sendFrame(frame: string) {
    return await invoke("send_frame", { frame: frame });
}

export async function stopModel() {
    return await invoke("stop_model")
}