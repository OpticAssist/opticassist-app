mod predictions;
mod message;
use predictions::{ Prediction };
use std::io::{BufRead, BufReader};
use message::{Message, send_event};
use std::process::{Child, Command, Stdio};
use std::path::{ PathBuf };
use tauri::{AppHandle, Emitter};
use crate::message::EventError;

#[tauri::command]
fn run_model(app: AppHandle) {
    let mut model_path = PathBuf::new();
    model_path.push("..");
    model_path.push("models");
    model_path.push("model");

    // add a .exe extension if on Windows
    #[cfg(target_os="windows")]
    model_path.set_extension("exe");

    let mut model: Child;

    match Command::new(model_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn() {
        Ok(m) => {
            model = m;
        }
        Err(model_err) => {
            let err_obj = Message::Error {message: format!("Model failed to start: {model_err}")};
            send_event(app, err_obj).unwrap();
            return;
        }
    }

    let stdin = model.stdin.as_mut().unwrap();
    let stdout = model.stdout.take().unwrap();

    if let Err(_) = app.emit("status", Message::Status {message: "loading".to_string()}) {
        eprintln!("failed to send loading status event to JS");
    } else {
        println!("sent loading status event to JS");
    }

    let reader = BufReader::new(stdout);

    std::thread::spawn(move || {
        for line_result in reader.lines() {
            match line_result {
                Ok(line) => {
                    if let Ok(message) = serde_json::from_str::<Message>(line.as_str()) {
                        match message {
                            _ => {todo!()}
                        }
                    } else {
                        // send error event
                    }
                }
                Err(e) => {
                    eprintln!("Failed reading stdout: {}", e);
                    break;
                }
            }
        }

    });



todo!()
}

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
        Message::Status {message} => {todo!()},
        Message::Output {image_shape, raw_predictions} => {
            let mut predictions: Vec<Prediction> = Vec::new();
            for rp in raw_predictions {
                predictions.push(rp.into_prediction(image_shape));
            }
            Ok(predictions)
        },
        Message::Error {message} => {Err(message)},
    }
    }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![process_frame, run_model])
        // commands added here with .invoke_handler(tauri::generate_handler![function_name])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
