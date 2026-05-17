mod predictions;
mod message;
use predictions::{ RawPrediction, Prediction };
use message::Message;
use std::process::Command;
use std::path::{ PathBuf };

#[tauri::command]
fn process_frame(frame_b64: String) -> Result<Vec<Prediction>, String> {
    // get expected model path at models/model(.exe)
    let mut model_path = PathBuf::new();
    model_path.push("..");
    model_path.push("models");
    model_path.push("model");

    // add a .exe extension if on Windows
    #[cfg(target_os="windows")]
    model_path.set_extension("exe");

    // send base64 input to the model and retrieve its output
    let model_output =
        Command::new(model_path).arg(frame_b64).output()
            .map_err(|e| {e.to_string()})?;

    // get JSON string from python's stdout
    let json_str = String::from_utf8_lossy(&model_output.stdout).to_string();

    // convert string data to a Message
    let message: Message = serde_json::from_str(json_str.as_str())
        .map_err(|e| {e.to_string()})?;

    match message {
        Message::Status {msg} => {todo!()},
        Message::Output {image_shape, raw_predictions} => {
            let mut predictions: Vec<Prediction> = Vec::new();
            for rp in raw_predictions {
                predictions.push(rp.into_prediction(image_shape));
            }
            Ok(predictions)
        },
        Message::Error {msg} => {Err(msg)},
    }
    }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![process_frame])
        // commands added here with .invoke_handler(tauri::generate_handler![function_name])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
