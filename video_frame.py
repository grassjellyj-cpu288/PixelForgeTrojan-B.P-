# video_frame.py
import os
import subprocess
import shutil
import sys
import threading
import time
from tkinter import filedialog, messagebox
import customtkinter as ctk
from PIL import Image
from resource_gauge import ResourceGauge

class VideoGeneratorFrame(ctk.CTkFrame):
    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)

        self.img_path = None
        self.audio_path = None
        self.bg_path = None
        self.bg_opacity = 100
        self.dest_folder = ""

        self.selected_resolution = "1280x720"
        self.selected_bitrate = "2M"
        self.selected_effect = "none"
        self.effect_param = ""

        self.build_ui()
        self.check_ffmpeg()

    def build_ui(self):
        title = ctk.CTkLabel(self, text="🎬 Video Generator", font=ctk.CTkFont(size=20, weight="bold"))
        title.pack(pady=15)

        # รูปหลัก
        img_frame = ctk.CTkFrame(self)
        img_frame.pack(fill="x", padx=20, pady=5)
        self.img_btn = ctk.CTkButton(img_frame, text="🖼 เลือกรูปภาพ", command=self.choose_image, width=120)
        self.img_btn.pack(side="left", padx=5)
        self.img_label = ctk.CTkLabel(img_frame, text="⏳ ยังไม่เลือกรูป", text_color="gray")
        self.img_label.pack(side="left", padx=10)

        # เสียง
        audio_frame = ctk.CTkFrame(self)
        audio_frame.pack(fill="x", padx=20, pady=5)
        self.audio_btn = ctk.CTkButton(audio_frame, text="🎵 เลือกไฟล์เสียง", command=self.choose_audio, width=120)
        self.audio_btn.pack(side="left", padx=5)
        self.audio_label = ctk.CTkLabel(audio_frame, text="⏳ ยังไม่เลือกเสียง", text_color="gray")
        self.audio_label.pack(side="left", padx=10)

        # พื้นหลัง
        bg_frame = ctk.CTkFrame(self)
        bg_frame.pack(fill="x", padx=20, pady=5)
        self.bg_btn = ctk.CTkButton(bg_frame, text="🖼 เลือกพื้นหลัง", command=self.choose_background, width=120)
        self.bg_btn.pack(side="left", padx=5)
        self.bg_label = ctk.CTkLabel(bg_frame, text="⏳ ไม่มีพื้นหลัง", text_color="gray")
        self.bg_label.pack(side="left", padx=10)

        # ความโปร่งแสง
        opacity_frame = ctk.CTkFrame(self)
        opacity_frame.pack(fill="x", padx=20, pady=5)
        ctk.CTkLabel(opacity_frame, text="🔆 ความโปร่งแสงพื้นหลัง:").pack(side="left", padx=5)
        self.opacity_slider = ctk.CTkSlider(opacity_frame, from_=0, to=100, command=self.update_opacity)
        self.opacity_slider.set(100)
        self.opacity_slider.pack(side="left", padx=10, fill="x", expand=True)
        self.opacity_label = ctk.CTkLabel(opacity_frame, text="100%")
        self.opacity_label.pack(side="left", padx=5)

        # ความละเอียด
        res_frame = ctk.CTkFrame(self)
        res_frame.pack(fill="x", padx=20, pady=5)
        ctk.CTkLabel(res_frame, text="📐 ความละเอียด:").pack(side="left", padx=5)
        self.res_combo = ctk.CTkComboBox(
            res_frame,
            values=["640x480", "854x480", "1280x720", "1920x1080", "2560x1440"],
            command=self.on_resolution_change
        )
        self.res_combo.set("1280x720")
        self.res_combo.pack(side="left", padx=10)

        # บิตเรท
        bitrate_frame = ctk.CTkFrame(self)
        bitrate_frame.pack(fill="x", padx=20, pady=5)
        ctk.CTkLabel(bitrate_frame, text="⚡ บิตเรทวิดีโอ:").pack(side="left", padx=5)
        self.bitrate_combo = ctk.CTkComboBox(
            bitrate_frame,
            values=["1M", "2M", "4M", "6M", "8M", "10M"],
            command=self.on_bitrate_change
        )
        self.bitrate_combo.set("2M")
        self.bitrate_combo.pack(side="left", padx=10)

        # เอฟเฟกต์
        effect_frame = ctk.CTkFrame(self)
        effect_frame.pack(fill="x", padx=20, pady=5)
        ctk.CTkLabel(effect_frame, text="🎨 เอฟเฟกต์:").pack(side="left", padx=5)
        self.effect_combo = ctk.CTkComboBox(
            effect_frame,
            values=[
                "ไม่มี", "ซูมเข้า", "ซูมออก", "หมุน",
                "เบลอ", "ชาร์ป", "ซีเปีย", "ขาวดำ", "กลับสี",
                "เร่งความเร็ว", "ช้าลง"
            ],
            command=self.on_effect_change
        )
        self.effect_combo.set("ไม่มี")
        self.effect_combo.pack(side="left", padx=10)

        # พารามิเตอร์เพิ่มเติม
        param_frame = ctk.CTkFrame(self)
        param_frame.pack(fill="x", padx=20, pady=5)
        ctk.CTkLabel(param_frame, text="🔧 พารามิเตอร์เพิ่มเติม:").pack(side="left", padx=5)
        self.param_entry = ctk.CTkEntry(param_frame, placeholder_text="เช่น องศา, ระดับ, ความเร็ว", width=150)
        self.param_entry.pack(side="left", padx=10, fill="x", expand=True)
        self.param_entry.bind("<KeyRelease>", self.on_param_change)

        # ปุ่มสร้าง
        self.create_btn = ctk.CTkButton(
            self,
            text="▶ สร้างวิดีโอ",
            command=self.start_create,
            fg_color="#10b981",
            hover_color="#059669",
            font=ctk.CTkFont(size=15, weight="bold")
        )
        self.create_btn.pack(pady=10, padx=20, fill="x")

        # โฟลเดอร์บันทึก
        dest_frame = ctk.CTkFrame(self)
        dest_frame.pack(fill="x", padx=20, pady=5)
        self.dest_btn = ctk.CTkButton(dest_frame, text="📁 เลือกโฟลเดอร์บันทึก", command=self.choose_dest_folder, width=150)
        self.dest_btn.pack(side="left", padx=5)
        self.dest_label = ctk.CTkLabel(dest_frame, text="⚠️ กรุณาเลือกโฟลเดอร์", text_color="#f87171")
        self.dest_label.pack(side="left", padx=10)

        self.resource = ResourceGauge(self, "Video Generator", 100)
        self.resource.pack(fill="x", padx=20, pady=10)

        self.status = ctk.CTkLabel(self, text="🟢 กำลังตรวจสอบ FFmpeg...", text_color="gray")
        self.status.pack(pady=5)

    # ---------- Callbacks ----------
    def on_resolution_change(self, choice):
        self.selected_resolution = choice

    def on_bitrate_change(self, choice):
        self.selected_bitrate = choice

    def on_effect_change(self, choice):
        effect_map = {
            "ไม่มี": "none",
            "ซูมเข้า": "zoom_in",
            "ซูมออก": "zoom_out",
            "หมุน": "rotate",
            "เบลอ": "blur",
            "ชาร์ป": "sharpen",
            "ซีเปีย": "sepia",
            "ขาวดำ": "grayscale",
            "กลับสี": "invert",
            "เร่งความเร็ว": "speed_up",
            "ช้าลง": "slow_down"
        }
        self.selected_effect = effect_map.get(choice, "none")
        hint = ""
        if self.selected_effect in ["zoom_in", "zoom_out"]:
            hint = "ความเร็วซูม (เช่น 0.0015)"
        elif self.selected_effect == "rotate":
            hint = "องศา (เช่น 10)"
        elif self.selected_effect in ["blur", "sharpen"]:
            hint = "ระดับความเข้ม (เช่น 5)"
        elif self.selected_effect in ["speed_up", "slow_down"]:
            hint = "อัตราเร็ว (เช่น 1.5 หรือ 0.5)"
        self.param_entry.delete(0, "end")
        self.param_entry.insert(0, hint if hint else "")

    def on_param_change(self, event):
        self.effect_param = self.param_entry.get()

    # ---------- helper UI ----------
    def ui(self, fn):
        self.after(0, fn)

    def set_status(self, text):
        self.ui(lambda: self.status.configure(text=text))

    def set_resource(self, v):
        self.ui(lambda: self.resource.set(v))

    def update_opacity(self, value):
        self.bg_opacity = int(value)
        self.opacity_label.configure(text=f"{self.bg_opacity}%")

    def check_ffmpeg(self):
        if shutil.which('ffmpeg') is None:
            self.set_status("❌ ไม่พบ FFmpeg ในระบบ กรุณาติดตั้งและเพิ่ม PATH")
            self.create_btn.configure(state="disabled")
        else:
            self.set_status("🟢 พร้อมทำงาน (พบ FFmpeg)")

    # ---------- เลือกไฟล์ ----------
    def choose_image(self):
        file_path = filedialog.askopenfilename(
            title="เลือกไฟล์รูปภาพหลัก",
            filetypes=[("Image files", "*.png *.jpg *.jpeg *.bmp *.gif *.webp")]
        )
        if file_path:
            self.img_path = file_path
            self.img_label.configure(text=f"✅ {os.path.basename(file_path)}")

    def choose_audio(self):
        file_path = filedialog.askopenfilename(
            title="เลือกไฟล์เสียง",
            filetypes=[("Audio files", "*.mp3 *.wav *.aac *.m4a *.flac *.ogg")]
        )
        if file_path:
            self.audio_path = file_path
            self.audio_label.configure(text=f"✅ {os.path.basename(file_path)}")

    def choose_background(self):
        file_path = filedialog.askopenfilename(
            title="เลือกภาพพื้นหลัง",
            filetypes=[("Image files", "*.png *.jpg *.jpeg *.bmp *.gif *.webp")]
        )
        if file_path:
            self.bg_path = file_path
            self.bg_label.configure(text=f"✅ {os.path.basename(file_path)}")

    def choose_dest_folder(self):
        folder = filedialog.askdirectory(title="เลือกโฟลเดอร์บันทึกวิดีโอ")
        if folder:
            self.dest_folder = folder
            self.dest_label.configure(text=f"📂 {folder}", text_color="#34d399")

    # ---------- สร้างวิดีโอ ----------
    def start_create(self):
        if not self.img_path or not self.audio_path:
            messagebox.showwarning("⚠️", "กรุณาเลือกรูปหลักและเสียงก่อน")
            return
        if not self.dest_folder:
            messagebox.showwarning("⚠️", "กรุณาเลือกโฟลเดอร์บันทึกก่อน")
            return
        if not os.path.exists(self.dest_folder):
            try:
                os.makedirs(self.dest_folder)
            except Exception as e:
                messagebox.showerror("ข้อผิดพลาด", f"ไม่สามารถสร้างโฟลเดอร์ {self.dest_folder}\n{str(e)}")
                return

        self.create_btn.configure(state="disabled")
        self.set_status("⏳ กำลังเตรียมภาพ...")
        self.set_resource(10)
        threading.Thread(target=self.run_ffmpeg, daemon=True).start()

    def run_ffmpeg(self):
        try:
            input_image = self.img_path
            temp_image = None

            if self.bg_path:
                self.set_status("⏳ กำลังผสมภาพพื้นหลัง...")
                self.set_resource(20)

                bg = Image.open(self.bg_path).convert("RGBA")
                fg = Image.open(self.img_path).convert("RGBA")
                bg = bg.resize(fg.size, Image.LANCZOS)
                alpha = self.bg_opacity / 100.0
                blended = Image.blend(bg, fg, alpha)
                temp_image = "temp_composite.png"
                blended.save(temp_image)
                input_image = temp_image

            width, height = map(int, self.selected_resolution.split('x'))
            bitrate = self.selected_bitrate
            filter_str = self.build_filter_effect(width, height)

            self.set_status("⏳ กำลังประมวลผลวิดีโอ...")
            self.set_resource(40)

            timestamp = int(time.time())
            output_path = os.path.join(self.dest_folder, f"output_{timestamp}.mp4")

            cmd = [
                "ffmpeg",
                "-loop", "1",
                "-i", input_image,
                "-i", self.audio_path,
                "-c:v", "libx264",
                "-tune", "stillimage",
                "-vf", filter_str,
                "-s", f"{width}x{height}",
                "-b:v", bitrate,
                "-c:a", "aac",
                "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-shortest",
                output_path,
                "-y"
            ]

            self.set_resource(60)
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='ignore',
                check=False
            )

            if temp_image and os.path.exists(temp_image):
                os.remove(temp_image)

            if result.returncode != 0:
                error_lines = result.stderr.strip().split('\n')
                error_msg = error_lines[-1] if error_lines else "Unknown error"
                self.ui(lambda: self.set_status(f"❌ ข้อผิดพลาด: {error_msg}"))
                self.ui(lambda: self.create_btn.configure(state="normal"))
                self.ui(lambda: self.resource.reset())
                return

            self.set_resource(100)
            self.ui(lambda: self.set_status("✅ สร้างวิดีโอสำเร็จ!"))
            self.ui(lambda: self.create_btn.configure(state="normal"))
            self.ui(lambda: self.open_file(output_path))

        except Exception as e:
            self.ui(lambda: self.set_status(f"❌ ข้อผิดพลาด: {str(e)}"))
            self.ui(lambda: self.create_btn.configure(state="normal"))
            self.ui(lambda: self.resource.reset())

    def build_filter_effect(self, width, height):
        effect = self.selected_effect
        param = self.effect_param.strip()
        base = f"scale={width}:{height}"

        if effect == "none":
            return base
        elif effect == "zoom_in":
            speed = float(param) if param else 0.0015
            return f"zoompan=z='min(zoom+{speed},1.5)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',{base}"
        elif effect == "zoom_out":
            speed = float(param) if param else 0.0015
            return f"zoompan=z='max(zoom-{speed},0.5)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',{base}"
        elif effect == "rotate":
            angle = float(param) if param else 5
            return f"rotate={angle}*PI/180:fillcolor=black:ow=rotw({angle}):oh=roth({angle}),{base}"
        elif effect == "blur":
            strength = float(param) if param else 10
            return f"boxblur={strength}:1,{base}"
        elif effect == "sharpen":
            strength = float(param) if param else 1.0
            return f"unsharp=5:5:{strength}:5:5:0.0,{base}"
        elif effect == "sepia":
            return f"colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,{base}"
        elif effect == "grayscale":
            return f"hue=s=0,{base}"
        elif effect == "invert":
            return f"negate,{base}"
        elif effect == "speed_up":
            speed = float(param) if param else 1.5
            return f"setpts={1/speed}*PTS,{base}"
        elif effect == "slow_down":
            speed = float(param) if param else 0.5
            return f"setpts={1/speed}*PTS,{base}"
        else:
            return base

    def open_file(self, filepath):
        try:
            if sys.platform == "win32":
                os.startfile(filepath)
            elif sys.platform == "darwin":
                subprocess.run(["open", filepath])
            else:
                subprocess.run(["xdg-open", filepath])
        except Exception:
            messagebox.showinfo(
                "เปิดไฟล์",
                f"ไม่สามารถเปิดไฟล์วิดีโอได้โดยอัตโนมัติ\nไฟล์ถูกบันทึกที่: {os.path.abspath(filepath)}"
            )