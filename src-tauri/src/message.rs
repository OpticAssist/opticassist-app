use std::fmt;
use std::fmt::Formatter;
use serde::{Serialize, Deserialize};
use crate::predictions::{Output, RawOutput};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag="kind")]
pub enum Message {
    #[serde(rename="status")]
    Status {
        message: String
    },
    #[serde(rename="input")]
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

impl fmt::Display for Message {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Message::Status {message} => {write!(f, "Status(\"{message}\")")},
            Message::Input { image } => {
                let max_chars = 20;
                let truncated = if image.chars().count() > max_chars {
                    &image[..max_chars]
                } else {
                    image.as_str()
                };
                write!(f, "Input({truncated}...)")
            },
            Message::RawOutput(raw) => {write!(f, "RawOutput(image_shape: {:?}, raw_predictions: {:?})", raw.image_shape, raw.raw_predictions)},
            Message::Output(out) => {write!(f, "Output({:?})", out.predictions)}
            Message::Error {message} => {write!(f, "Error(\"{message}\")")}
        }
    }
}