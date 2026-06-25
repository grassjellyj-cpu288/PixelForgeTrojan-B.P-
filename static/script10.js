import os
import sys
import subprocess
import signal
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

# ===============================
# Base Path
# ===============================
def get_base_path():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

BASE_DIR = get_base_path()
STATIC_DIR = os.path.join(BASE_DIR, 'static')
MAIN_PY_PATH = os.path.join(BASE_DIR, "main.py")

# ===============================
# Flask App
# ===============================
app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})

current_pid = None

# ===============================
# Process Checker (for local)
# ===============================
def is_process_alive(pid):
    try:
        if sys.platform == "win32":
            result = subprocess.run(
                ['tasklist', '/FI', f'PID eq {pid}'],
                capture_output=True,
                text=True
            )
            return str(pid) in result.stdout
        else:
            os.kill(pid, 0)
            return True
    except:
        return False

# ===============================
# Static Web Routes
# ===============================
@app.route('/')
def index():
    return send_from_directory(STATIC_DIR, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    # อนุญาตเฉพาะนามสกุลที่ปลอดภัย
    allowed_ext = ('.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp3', '.wav')
    if not filename.lower().endswith(allowed_ext):
        return jsonify({'error': 'forbidden'}), 403
    return send_from_directory(STATIC_DIR, filename)

# ===============================
# API Routes
# ===============================
@app.route('/status')
def status():
    return jsonify({
        "status": "running",
        "main_running": current_pid is not None and is_process_alive(current_pid)
    })

@app.route('/run-main')
def run_main():
    global current_pid

    # ถ้าอยู่บน Render ให้ตอบกลับว่าทำไม่ได้
    if os.getenv('RENDER'):
        return jsonify({
            "status": "error",
            "message": "ไม่สามารถเปิด main.py บน Render (ไม่มี GUI)",
            "hint": "กรุณาดาวน์โหลดโปรเจกต์และรันบนเครื่องของคุณ"
        }), 501

    if not os.path.exists(MAIN_PY_PATH):
        return jsonify({"status": "error", "message": "main.py not found"}), 404

    if current_pid and is_process_alive(current_pid):
        return jsonify({"status": "warning", "message": "already running"})

    try:
        if sys.platform == "win32":
            proc = subprocess.Popen(
                [sys.executable, MAIN_PY_PATH],
                creationflags=subprocess.CREATE_NO_WINDOW,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        else:
            proc = subprocess.Popen(
                [sys.executable, MAIN_PY_PATH],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
        current_pid = proc.pid
        return jsonify({"status": "success", "pid": proc.pid})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/kill-main')
def kill_main():
    global current_pid
    if not current_pid:
        return jsonify({"status": "warning", "message": "not running"})
    try:
        if sys.platform == "win32":
            subprocess.run(['taskkill', '/F', '/PID', str(current_pid)])
        else:
            os.kill(current_pid, signal.SIGTERM)
        current_pid = None
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# (Optional) TTS API using pyttsx3 (for local use)
@app.route('/api/tts/generate', methods=['POST'])
def tts_generate():
    # ใช้ได้เฉพาะ local (Render ไม่มีเสียง)
    if os.getenv('RENDER'):
        return jsonify({"status": "error", "message": "TTS not available on Render"}), 501
    try:
        data = request.json
        text = data.get('text', '')
        speed = int(data.get('speed', 150))
        if not text:
            return jsonify({"status": "error", "message": "no text"}), 400
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty('rate', speed)
        engine.say(text)
        engine.runAndWait()
        engine.stop()
        return jsonify({"status": "success", "message": "spoken"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ===============================
# Error Handlers
# ===============================
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

# ===============================
# Main entry point
# ===============================
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    print("=" * 50)
    print("🚀 PixelForge Server")
    print(f"📂 Base: {BASE_DIR}")
    print(f"📂 Static: {STATIC_DIR}")
    print(f"🌐 http://localhost:{port}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=debug)
