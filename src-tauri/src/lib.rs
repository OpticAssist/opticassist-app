// commands here with #[tauri::command] before function def

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        // commands added here with .invoke_handler(tauri::generate_handler![function_name])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
