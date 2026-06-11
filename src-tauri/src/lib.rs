mod predictions;
mod message;
use std::io::{BufRead, BufReader, Write};
use std::sync::Mutex;
use message::Message;
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::path::{ PathBuf };
use std::{thread, time};
use tauri::ipc::Channel;
use crate::predictions::Output;
use std::env;

struct ModelState {
    stdin: Mutex<Option<ChildStdin>>,
    child: Mutex<Option<Child>>
}

#[tauri::command]
fn start_model(
    channel: Channel<Message>,
    state: tauri::State<'_, ModelState>)
    -> Result<(), String>
{
    let model_path = model_path();

    let mut model: Child;
    let python_command;

    if env::consts::OS == "macos" {
        python_command = "../.venv/bin/python3";
    } else {
        python_command = "python";
    }

    match Command::new(python_command)
        .arg(model_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn() {
        Ok(m) => {
            model = m;
            println!("rust: model child process successfully started")
        }
        Err(model_err) => {
            return Err(format!("Model failed to start: {model_err}"))
        }
    }

    let stdin = model.stdin.take().unwrap(); // real model stdin
    let stdout = model.stdout.take().unwrap();
    let stderr = model.stderr.take().unwrap();

    { // create a scope to remove the lock automatically after state is updated
        let mut stdin_state = state.stdin.lock().unwrap(); // prev stdin
        let mut child_state = state.child.lock().unwrap();
        *stdin_state = Some(stdin);
        *child_state = Some(model);
    }

    thread::spawn(move || {
        println!("rust: entered stdout reader thread");
        let reader = BufReader::new(stdout);
        listen_to_model(reader, channel);
    });

    thread::spawn(move || {
        println!("rust: entered stderr reader thread");
        let reader = BufReader::new(stderr);
        for line_result in reader.lines() {
            if let Ok(line) = line_result {
                println!("model stderr: {line}")
            }
        }
    });
    Ok(())
}

fn listen_to_model(reader: BufReader<ChildStdout>, channel: Channel<Message>) {
    for line_result in reader.lines() {
        match line_result {
            Ok(line) => {
                if let Ok(message) = serde_json::from_str::<Message>(line.as_str()) {
                    match message {
                        Message::RawOutput(raw) => {
                            println!("rust: Received raw output from model");
                            let output: Output = raw.into();
                            if let Err(e) = channel.send(Message::Output(output)) {
                                eprintln!("Failed to send model output through channel: {e}")
                            }
                        },
                        _ => {
                            if let Err(e) = channel.send(message) {
                                eprintln!("Failed to send non-output message through channel: {e}")
                            }
                        }
                    }
                } else {
                    let err = Message::Error {message: format!("Serde failed to deserialize model output: {}", line)};
                    if let Err(e) = channel.send(err.clone()) {
                        eprintln!("Failed to send {err} through channel: {e}",);
                    }
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
fn send_frame(frame: Vec<u8>, state: tauri::State<'_, ModelState>) -> Result<(), String> {
    println!("rust: Entered send_frame");
    let mut stdin_state = state.stdin.lock().unwrap();
    if let Some(stdin) = stdin_state.as_mut() {
        let frame_obj = Message::Input {image: frame};
        let frame_json = serde_json::to_string(&frame_obj).map_err(|e| {
            format!("Serde failed to serialize frame json: {e}")
        })?;
        println!("rust: serde converted image to json - writing to model stdin");
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

    let kill_timeout_ms = 1000;
    let mut manual_kill = false;

    if let (Some(mut stdin), Some(mut child)) = (stdin_opt, child_opt) {
        let exit_message = Message::Status {message: "exit".to_string()};
        match serde_json::to_string(&exit_message) {
            Ok(exit_json) => {
                if let Err(write_err) = writeln!(stdin, "{exit_json}") {
                    eprintln!("Failed to send exit signal to model, killing manually: {write_err}");
                    manual_kill = true;
                } else if let Err(flush_err) = stdin.flush() {
                        eprintln!("Flushing model stdin failed, killing manually: {flush_err}");
                        manual_kill = true;
                }
            }
            Err(serde_err) => {
                eprintln!("Serde failed to serialize exit json, killing manually: {serde_err}");
                manual_kill = true;
            }
        }

        if manual_kill {
            child.kill().map_err(|e| {format!("Failed to kill the model process: {e}")})?;
            println!("rust: Marked as manual kill: waiting for model process to be killed...");
            child.wait().map_err(|e| {format!("Error while waiting for the model to exit: {e}")})?;
            println!("rust: Returning Ok after model killed");
            return Ok(());
        }

        thread::sleep(time::Duration::from_millis(kill_timeout_ms));
        match child.try_wait() {
            Ok(Some(exit_status)) => {
                println!("rust: Model exited with code {exit_status}")
            }
            Ok(None) => {
                eprintln!("rust: Model did not exit after {kill_timeout_ms} ms, killing manually.");
                child.kill().map_err(|e| {format!("Failed to kill the model process: {e}")})?;
                println!("rust: Waiting for the model to be killed.");
                child.wait().map_err(|e| {format!("Error while waiting for the model to exit: {e}")})?;
                println!("rust: Model killed.")
            }
            Err(e) => {
                return Err(format!("Error while waiting for the model to exit: {e}"));
            }
        }
        Ok(())
    } else {
        Err("No model process running".to_string())
    }
}

fn model_path() -> PathBuf {
    let mut model_path = PathBuf::new();
    model_path.push("..");
    model_path.push("src-tauri");
    model_path.push("models");
    model_path.push("model.py");


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
