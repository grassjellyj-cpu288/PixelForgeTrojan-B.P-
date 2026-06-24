# server.py (แก้ไขให้ใช้โฟลเดอร์ของ exe)
import os
import sys
import subprocess
import signal
from flask import Flask, jsonify
from flask_cors import CORS

# ฟังก์ชันหา base path (ตำแหน่งที่วาง exe หรือสคริปต์)
def get_base_path():
    if getattr(sys, 'frozen', False):
        # ถ้ารันเป็น exe ให้ใช้โฟลเดอร์ของ exe (ไม่ใช่ _MEIPASS)
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))

BASE_DIR = get_base_path()
MAIN_PY_PATH = os.path.join(BASE_DIR, "main.py")

# ตรวจสอบ main.py
if not os.path.exists(MAIN_PY_PATH):
    print(f"⚠️ ไม่พบ main.py ในโฟลเดอร์: {BASE_DIR}")
else:
    print(f"✅ พบ main.py ที่ {MAIN_PY_PATH}")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

current_pid = None

def is_process_alive(pid):
    try:
        if sys.platform == "win32":
            result = subprocess.run(['tasklist', '/FI', f'PID eq {pid}'], capture_output=True, text=True)
            return str(pid) in result.stdout
        else:
            os.kill(pid, 0)
            return True
    except:
        return False

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'running',
        'message': 'Server is ready',
        'main_running': current_pid is not None and is_process_alive(current_pid)
    })

@app.route('/run-main', methods=['GET'])
def run_main():
    global current_pid

    if not os.path.exists(MAIN_PY_PATH):
        return jsonify({'status': 'error', 'message': f'main.py not found at {MAIN_PY_PATH}'}), 404

    if current_pid is not None and is_process_alive(current_pid):
        return jsonify({
            'status': 'warning',
            'message': f'main.py is already running (PID: {current_pid})'
        })

    try:
        if sys.platform == "win32":
            proc = subprocess.Popen(
                [sys.executable, MAIN_PY_PATH],
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            proc = subprocess.Popen(
                [sys.executable, MAIN_PY_PATH],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
        current_pid = proc.pid
        return jsonify({
            'status': 'success',
            'message': f'main.py started (PID: {proc.pid})'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/kill-main', methods=['GET'])
def kill_main():
    global current_pid
    if current_pid is None:
        return jsonify({'status': 'warning', 'message': 'No process running'})

    try:
        if sys.platform == "win32":
            subprocess.run(['taskkill', '/F', '/PID', str(current_pid)], capture_output=True)
        else:
            os.kill(current_pid, signal.SIGTERM)
        current_pid = None
        return jsonify({'status': 'success', 'message': 'main.py terminated'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Trojan Studio Web Server (v2.0 - EXE ready)")
    print(f"📂 Base folder: {BASE_DIR}")
    print(f"📄 main.py path: {MAIN_PY_PATH}")
    print("🌐 Server running at http://localhost:5000")
    print("📌 Endpoints: /status, /run-main, /kill-main")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)