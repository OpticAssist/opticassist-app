use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct RawPrediction {
    pub label: String,
    pub confidence: f32,
    pub bounding_box: [f32; 4],
    pub raw_rgb: [u8; 3]

}

impl RawPrediction {
    pub fn into_prediction(self, image_shape: [u32; 2]) -> Prediction {
        let img_height = image_shape[0] as f32;
        let img_width = image_shape[1] as f32;

        let x1 = self.bounding_box[0];
        let y1 = self.bounding_box[1];
        let x2 = self.bounding_box[2];
        let y2 = self.bounding_box[3];

        let center_x = (x1 + x2) / 2.0;
        let center_y = (y1 + y2) / 2.0;

         // finding the location of the image formatted as (left/right - top/bottom) or just middle
        // Compares the center of the object to the total width of the image.
        // The numbers can be changed, I just thought 0.25 and 0.65 are good enough.
        // If it's middle, it's just middle and if it's middle and top or bottom, it'll just top or bottom
        // added color formatted to rgb and added that to the struct as well
        let horizontal_mummy = center_x / img_width;
        let horizontal_area = if horizontal_mummy < 0.35 {
            "left"
        } else if horizontal_mummy > 0.65 {
            "right"
        } else {
            "middle"
        };


        let vertical_mummy = center_y / img_height;
        let vertical_area = if vertical_mummy < 0.35 {
            "top"
        } else if vertical_mummy > 0.65 {
            "bottom"
        } else {
            "middle"
        };


        let location = if horizontal_area == "middle" && vertical_area == "middle" {
            "center".to_string()
        } else if horizontal_area == "middle" {
            vertical_area.to_string()
        }else if vertical_area == "middle"{
            horizontal_area.to_string()
        }
        else {
            format!("{}-{}", vertical_area, horizontal_area)
        };

        let nearest_color = color::similar(self.raw_rgb);

        Prediction::new(self.label, self.confidence, location, nearest_color)

    }
}


#[derive(Serialize, Debug)]
pub struct Prediction {
    pub label: String,
    pub confidence: f32,
    pub location: String,
    pub color: String,
}

impl Prediction{
    pub fn new(label: String, confidence: f32, location: String, color: String) -> Self {
        Prediction {label, confidence, location, color}
    }
}
