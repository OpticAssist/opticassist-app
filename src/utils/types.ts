export interface SettingsContextType {
    settings: Settings;
    setTheme: (theme: "light" | "dark") => Promise<void>;
    toggleTheme: () => Promise<void>;
}

export interface Settings {
    theme: "light" | "dark";
}

export interface Prediction {
    label: string;
    confidence: number;
    location: string;
    color: string;
}

export type Message =
    { kind: "status", message: string } |
    { kind: "input", image: String } |
    { kind: "output", predictions: Prediction[] } |
    { kind: "error", message: string };

export function messageToString(message: Message): string {
    switch (message.kind){
        case "status":
            return `Status("${message.message}")`
        case "output":
            return `Output(${message.predictions})`;
        case "error":
            return `Error("${message.message}")`
        default:
            return `Unexpected "${message.kind}"}`
    }
}