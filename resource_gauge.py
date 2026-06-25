# resource_gauge.py
import customtkinter as ctk

class ResourceGauge(ctk.CTkFrame):
    def __init__(self, master, name="Resource", max_value=100):
        super().__init__(master)

        self.max_value = max_value
        self.current_value = 0

        self.configure(height=70)

        self.label = ctk.CTkLabel(
            self,
            text=name,
            font=ctk.CTkFont(size=14, weight="bold")
        )
        self.label.pack(anchor="w", padx=10, pady=(5, 0))

        self.value_label = ctk.CTkLabel(
            self,
            text=f"0 / {self.max_value}",
            text_color="gray"
        )
        self.value_label.pack(anchor="w", padx=10)

        self.bar_bg = ctk.CTkFrame(
            self,
            fg_color="#2b2b2b",
            height=18,
            corner_radius=8
        )
        self.bar_bg.pack(fill="x", padx=10, pady=8)

        self.fill = ctk.CTkFrame(
            self.bar_bg,
            fg_color="#f1c40f",
            height=18,
            corner_radius=8
        )
        self.fill.place(relwidth=0.0, relheight=1)

    def set(self, value):
        self.current_value = max(0, min(int(value), self.max_value))
        ratio = self.current_value / self.max_value
        self.fill.place(relwidth=ratio, relheight=1)
        self.value_label.configure(text=f"{self.current_value} / {self.max_value}")

    def reset(self):
        self.set(0)