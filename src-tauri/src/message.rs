use serde::{Serialize, Deserialize};
use tauri::{AppHandle, Emitter};
use crate::predictions::RawPrediction;

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag="kind")]
pub enum Message {
    #[serde(rename="status")]
    Status {
        message: String
    },
    #[serde(rename="output")]
    Output {
        image_shape: [u32; 2],
        raw_predictions: Vec<RawPrediction>
    },
    #[serde(rename="error")]
    Error {
        message: String
    }
}

#[derive(Debug)]
pub enum EventError {
    InvalidVariant {
        message: String
    },
}

pub fn send_event(app: AppHandle, event: Message) -> Result<(), EventError> {
    match &event {
        Message::Status { .. } => {
            if let Err(_) = app.emit("status", event) {
                eprintln!("failed to send status event to JS");
            } else {
                println!("sent status event to JS");
            }
            Ok(())
        },
        Message::Output { .. } => {
            Err(EventError::InvalidVariant {message: "unexpected Message::Output: model output should be sent through channels".to_string()})
        },
        Message::Error { .. } => {
            if let Err(_) = app.emit("model-message", event) {
                eprintln!("failed to send model failure event to JS");
            } else {
                println!("sent model failure event to JS");
            }
            Ok(())
        }
    }
}