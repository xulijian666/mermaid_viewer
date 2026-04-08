use std::fs;
use std::path::PathBuf;

use rfd::FileDialog;
use resvg::tiny_skia;
use resvg::usvg;

fn render_svg_to_png(svg: String, output_path: String) -> Result<String, String> {
  // 将前端传入的 SVG 文本转换为 PNG，便于离屏导出高分辨率图片。
  let opt = usvg::Options::default();
  let rtree = usvg::Tree::from_str(&svg, &opt).map_err(|e| format!("SVG 解析失败: {e}"))?;

  let size = rtree.size().to_int_size();
  let mut pixmap =
    tiny_skia::Pixmap::new(size.width(), size.height()).ok_or("创建位图缓冲区失败")?;

  let mut pixmap_mut = pixmap.as_mut();
  resvg::render(&rtree, tiny_skia::Transform::default(), &mut pixmap_mut);

  let path = PathBuf::from(output_path);
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {e}"))?;
  }

  pixmap
    .save_png(&path)
    .map_err(|e| format!("写入 PNG 文件失败: {e}"))?;

  Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn export_png(svg: String, output_path: String) -> Result<String, String> {
  render_svg_to_png(svg, output_path)
}

#[tauri::command]
fn export_png_with_dialog(svg: String) -> Result<String, String> {
  // 商业桌面体验：弹出系统保存对话框，由用户选择导出路径。
  let file_path = FileDialog::new()
    .set_title("导出 PNG")
    .set_file_name("diagram.png")
    .add_filter("PNG 图片", &["png"])
    .save_file();

  let Some(path) = file_path else {
    return Err("用户取消导出".to_string());
  };

  render_svg_to_png(svg, path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![export_png, export_png_with_dialog])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
