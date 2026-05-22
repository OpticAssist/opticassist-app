mod predictions;
mod message;
use std::io::{BufRead, BufReader, Write};
use std::sync::Mutex;
use message::{Message, send_event};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::path::{ PathBuf };
use tauri::AppHandle;
use tauri::ipc::Channel;

struct ModelState {
    stdin: Mutex<Option<ChildStdin>>
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
        *stdin_state = Some(stdin);
    }

    send_event(&app, Message::Status {message: "loading".to_string()}).unwrap();

    let reader = BufReader::new(stdout);

    std::thread::spawn(move || {
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
                        Message::Output { .. } => {
                            if channel.send(message).is_err() {
                                let err = Message::Error {message: "failed to send model output through channel".to_string()};
                                send_event(&app,err).unwrap();
                            }
                        },
                        _ => {
                            send_event(&app, message).unwrap();
                        }
                    }
                } else {
                    // send error event
                    let err = Message::Error {message: format!("serde failed to deserialize model output: {}", line)};
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
        writeln!(stdin, "{frame}")
            .map_err(|e| {
                format!("failed to write to model's stdin: {e}")
            })?;
    } else {
        return Err("model is not running: call start_model before sending frames.".to_string())
    }
    Ok(())
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
            stdin: Mutex::new(None) // initialize ModelState
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_model, send_frame]) // add new commands to the list
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
