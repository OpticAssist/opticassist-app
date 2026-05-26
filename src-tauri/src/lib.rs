mod predictions;
mod message;
use std::io::{BufRead, BufReader, Write};
use std::sync::Mutex;
use message::{Message, send_event};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::path::{ PathBuf };
use tauri::AppHandle;
use std::{thread, time};
use tauri::ipc::Channel;
use crate::predictions::Output;

struct ModelState {
    stdin: Mutex<Option<ChildStdin>>,
    child: Mutex<Option<Child>>
}

#[tauri::command]
fn start_model(
    app: AppHandle,
    channel: Channel<Message>,
    state: tauri::State<'_, ModelState>)
    -> Result<(), String>
{
    let model_path = model_path();

    let mut model: Child;

    match Command::new(model_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn() {
        Ok(m) => {
            model = m;
        }
        Err(model_err) => {
            return Err(format!("Model failed to start: {model_err}"))
        }
    }

    let stdin = model.stdin.take().unwrap(); // real model stdin
    let stdout = model.stdout.take().unwrap();

    { // create a scope to remove the lock automatically after state is updated
        let mut stdin_state = state.stdin.lock().unwrap(); // prev stdin
        let mut child_state = state.child.lock().unwrap();
        *stdin_state = Some(stdin);
        *child_state = Some(model);
    }

    let reader = BufReader::new(stdout);

    thread::spawn(move || {
        listen_to_model(reader, channel, app);
    });
    Ok(())
}

fn listen_to_model(reader: BufReader<ChildStdout>, channel: Channel<Message>, app: AppHandle) {
    for line_result in reader.lines() {
        match line_result {
            Ok(line) => {
                if let Ok(message) = serde_json::from_str::<Message>(line.as_str()) {
                    match message {
                        Message::RawOutput(raw) => {
                            let output: Output = raw.into();
                            if channel.send(Message::Output(output)).is_err() {
                                let err = Message::Error {message: "Failed to send model output through channel".to_string()};
                                send_event(&app,err).unwrap();
                            }
                        },
                        _ => {
                            send_event(&app, message).unwrap();
                        }
                    }
                } else {
                    // send error event
                    let err = Message::Error {message: format!("Serde failed to deserialize model output: {}", line)};
                    send_event(&app, err).unwrap();
                }
            }
            Err(e) => {
                eprintln!("Failed reading stdout: {}", e);
                break;
            }
        }
    }
}

#[tauri::command]
fn send_frame(frame: String, state: tauri::State<'_, ModelState>) -> Result<(), String> {
    let mut stdin_state = state.stdin.lock().unwrap();
    if let Some(stdin) = stdin_state.as_mut() {
        let frame_obj = Message::Input {image: frame};
        let frame_json = serde_json::to_string(&frame_obj).map_err(|e| {
            format!("Serde failed to serialize frame json: {e}")
        })?;
        writeln!(stdin, "{frame_json}")
            .map_err(|e| {
                format!("Failed to write to model's stdin: {e}")
            })?;
    } else {
        return Err("Model is not running: call start_model before sending frames.".to_string())
    }
    Ok(())
}

#[tauri::command]
fn stop_model(state: tauri::State<'_, ModelState>) -> Result<(), String> {
    let mut stdin_state = state.stdin.lock().unwrap();
    let mut child_state = state.child.lock().unwrap();

    let stdin_opt = stdin_state.take();
    let child_opt = child_state.take();

    let kill_timeout_ms = 100;

    if let (Some(mut stdin), Some(mut child)) = (stdin_opt, child_opt) {
        let exit_message = Message::Status {message: "exit".to_string()};
        match serde_json::to_string(&exit_message) {
            Ok(exit_json) => {
                if let Err(write_err) = writeln!(stdin, "{exit_json}") {
                    eprintln!("Failed to send exit signal to model, killing manually: {write_err}");
                    child.kill().map_err(|e| {format!("Failed to kill the model process: {e}")})?;
                } else {
                    stdin.flush().map_err(|e| { format!("Flushing model stdin failed: {e}") })?;
                }
            }
            Err(serde_err) => {
                eprintln!("Serde failed to serialize exit json, killing manually: {serde_err}");
                child.kill().map_err(|e| {format!("Failed to kill the model process: {e}")})?;
            }
        }
        thread::sleep(time::Duration::from_millis(kill_timeout_ms));
        match child.try_wait() {
            Ok(None) => {
                eprintln!("Model did not exit after {kill_timeout_ms} ms, killing manually.");
                child.kill().map_err(|e| {format!("Failed to kill the model process: {e}")})?;
                child.wait().map_err(|e| {format!("Error while waiting for the model to exit: {e}")})?;
            }
            Err(e) => {
                return Err(format!("Error while waiting for the model to exit: {e}"));
            }
            _ => {}
        }
        Ok(())
    } else {
        Err("No model process running".to_string())
    }
}

fn model_path() -> PathBuf {
    let mut model_path = PathBuf::new();
    model_path.push("..");
    model_path.push("models");
    model_path.push("model");

    // add a .exe extension if on Windows
    #[cfg(target_os="windows")]
    model_path.set_extension("exe");

    model_path
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ModelState {
            stdin: Mutex::new(None), // initialize ModelState
            child: Mutex::new(None),
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_model, send_frame, stop_model]) // add new commands to the list
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
