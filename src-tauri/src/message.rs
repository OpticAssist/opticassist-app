use serde::{Serialize, Deserialize};
use crate::predictions::RawPrediction;
#[derive(Serialize, Deserialize)]
#[serde(tag="kind")]
pub enum Message {
    #[serde(rename="status")]
    Status {
        msg: String
    },
    #[serde(rename="output")]
    Output {
        image_shape: [u32; 2],
        raw_predictions: Vec<RawPrediction>
    },
    #[serde(rename="error")]
    Error {
        msg: String
    }
}