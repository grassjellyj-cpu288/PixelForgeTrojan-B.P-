# main.py
import customtkinter as ctk
import pygame
from tts_frame import TTSFrame
from video_frame import VideoGeneratorFrame
from circular_button import CircularAnimatedButton  # import ปุ่มวงกลม

class TrojanStudioV2(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Premium TTS Studio V2 (Trojan)")
        self.geometry("900x600")
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("green")

        # ----- Tabview หลัก -----
        self.tabview = ctk.CTkTabview(self)
        self.tabview.pack(fill="both", expand=True, padx=20, pady=(20, 10))

        self.tabview.add("TTS")
        self.tabview.add("Video")

        self.tts_frame = TTSFrame(self.tabview.tab("TTS"))
        self.tts_frame.pack(fill="both", expand=True)

        self.video_frame = VideoGeneratorFrame(self.tabview.tab("Video"))
        self.video_frame.pack(fill="both", expand=True)

        # ----- แถวปุ่มด้านล่าง (ปุ่มปิดโปรแกรมแบบวงกลม) -----
        bottom_frame = ctk.CTkFrame(self, fg_color="transparent")
        bottom_frame.pack(pady=15)

        self.exit_btn = CircularAnimatedButton(
            bottom_frame,
            size=60,
            text="⛔",
            fg_color="#8b0000",
            hover_color="#cc0000",
            click_color="#550000",
            command=self.on_close
        )
        self.exit_btn.pack()

        self.protocol("WM_DELETE_WINDOW", self.on_close)

    def on_close(self):
        try:
            pygame.mixer.quit()
        except:
            pass
        self.destroy()

if __name__ == "__main__":
    app = TrojanStudioV2()
    app.mainloop()