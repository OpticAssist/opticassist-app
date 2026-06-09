let filteredLabel:string[] = [];
let labelColors:string[] = [];

    function displayFilter(): string {
    let result:string[] = [];
        for (const label of filteredLabel) {
            if(!result.includes(label)){
                result.push(labelColors[filteredLabel.indexOf(label)] +" "+ label);
            }else{
                result[result.indexOf(label)] = label.concat(" (multiple)")
            }
        }
        return result.join(", ");
}
export interface SettingsContextType {
    settings: Settings;
    setTheme: (theme: "light" | "dark") => Promise<void>;
    toggleTheme: () => Promise<void>;
    setCaptureRate: (rate: number) => Promise<void>;
}

export interface Settings {
    theme: "light" | "dark";
    captureRate: number;
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
            filteredLabel = message.predictions.map((p)=>{
                return p.label;
            });
            labelColors = message.predictions.map((p)=>{
                return p.color;
            });
             return `Output[${displayFilter()}]`;



        case "error":
            return `Error("${message.message}")`
        default:
            return `Unexpected "${message.kind}"}`
    }
}