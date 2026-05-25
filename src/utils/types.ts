export interface Prediction {
    label: string;
    confidence: number;
    location: string;
    color: string;
}

// export type Message =
//     { kind: "status", message: string } |
//     { kind: "error", image_shape: [number, number], raw_predictions}