mod predictions;
pub use predictions::{ RawPrediction, Prediction };
use std::process::Command;
use std::env::consts::OS;
use std::path::{ PathBuf };
use std::convert::From;

#[tauri::command]
fn process_frame(frame_b64: String) -> Result<Prediction, String> {
    let mut model_path = PathBuf::new();
    model_path.push("..");
    model_path.push("models");
    model_path.push("model");
    if OS == "windows" {
        model_path.set_extension("exe");
    }

    let model_output =
        Command::new(model_path).arg(frame_b64).output()
            .map_err(|e| {e.to_string()})?;

    let json_str = String::from_utf8_lossy(&model_output.stdout).to_string();

    let raw_obj: RawPrediction = serde_json::from_str(json_str.as_str())
        .map_err(|e| {e.to_string()})?;

    let prediction: Prediction = raw_obj.into();

    Ok(prediction)
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
