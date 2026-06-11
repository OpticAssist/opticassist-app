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
        image: Vec<u8>
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
                write!(f, "{:?}", {image})
            },
            Message::RawOutput(raw) => {write!(f, "RawOutput(image_shape: {:?}, raw_predictions: {:?})", raw.image_shape, raw.raw_predictions)},
            Message::Output(out) => {write!(f, "Output({:?})", out.predictions)}
            Message::Error {message} => {write!(f, "Error(\"{message}\")")}
        }
    }
}