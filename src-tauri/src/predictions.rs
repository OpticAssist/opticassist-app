use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct RawPrediction {
    label: String,
    confidence: f32,
    bounding_box: [f32; 4]
}

#[derive(Serialize, Debug)]
pub struct Prediction {
    label: String,
    confidence: f32,
    location: String,
}

impl From<RawPrediction> for Prediction {
    fn from(value: RawPrediction) -> Self {
        todo!()
    }
}
