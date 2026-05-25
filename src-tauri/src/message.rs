use serde::{Serialize, Deserialize};
use tauri::{AppHandle, Emitter};
use crate::predictions::{Output, RawOutput};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag="kind")]
pub enum Message {
    #[serde(rename="status")]
    Status {
        message: String
    },
    Input {
        image: String
    },
    #[serde(rename="raw_output")]
    #[serde(skip_serializing)]
    RawOutput(RawOutput),
    #[serde(rename="output")]
    Output(Output),
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

/*
sends a Message event to the frontend, fails when receiving invalid input
 */
pub fn send_event(app: &AppHandle, event: Message) -> Result<(), EventError> {
    match &event {
        Message::Status { .. } => {
            if let Err(_) = app.emit("status", event) {
                eprintln!("failed to send status event to JS");
            } else {
                println!("sent status event to JS");
            }
            Ok(())
        },
        Message::Input { .. } => {
            Err(EventError::InvalidVariant {message: "unexpected Message::Input: model input should not be sent to the frontend".to_string()})
        }
        Message::RawOutput { .. } => {
            Err(
                EventError::InvalidVariant
                {
                    message: "unexpected Message::RawOutput: RawOutput should be converted to Output and sent by channel"
                    .to_string()
                }
            )
        },
        Message::Output { .. } => {
            Err(
                EventError::InvalidVariant
                {
                    message: "unexpected Message::Output: model output should be sent by channel"
                        .to_string()
                }
            )
        }
        Message::Error { .. } => {
            if let Err(_) = app.emit("error", event) {
                eprintln!("failed to send model failure event to JS");
            } else {
                println!("sent model failure event to JS");
            }
            Ok(())
        }
    }
}