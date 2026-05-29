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