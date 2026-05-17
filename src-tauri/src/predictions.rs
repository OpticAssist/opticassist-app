use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct RawPrediction {
    pub label: String,
    pub confidence: f32,
    pub bounding_box: [f32; 4]
}

impl RawPrediction {
    pub fn into_prediction(self, image_shape: [u32; 2]) -> Prediction {
        todo!()
    }
}

#[derive(Serialize, Debug)]
pub struct Prediction {
    pub label: String,
    pub confidence: f32,
    pub location: String,
}
