// script9.js - Progress Bar สำหรับปุ่มลบพื้นหลัง พร้อมเสียงตอบกลับ

(function() {
    "use strict";

    // ---- ฟังก์ชันเล่นเสียงบี๊บ (ใช้ Web Audio API) ----
    function playBeep(frequency = 800, duration = 150, volume = 0.3) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.value = volume;
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
            oscillator.connect(gain);
            gain.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration / 1000);
        } catch (e) {
            // ถ้าเบราว์เซอร์ไม่รองรับ ก็เงียบ
        }
    }

    // ---- ฟังก์ชันพูดข้อความ (Speech Synthesis) ----
    function speakText(text, lang = 'th-TH') {
        if (!window.speechSynthesis) return;
        // ยกเลิกการพูดค้างเก่า
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;   // ความเร็วพูด
        utterance.pitch = 1.0;
        utterance.volume = 1;

        // เลือกเสียงภาษาไทย (ถ้ามี)
        const voices = window.speechSynthesis.getVoices();
        const thVoice = voices.find(v => v.lang.startsWith('th'));
        if (thVoice) utterance.voice = thVoice;

        window.speechSynthesis.speak(utterance);
    }

    // ---- ฟังก์ชันหลักเมื่อ DOM พร้อม ----
    function init() {
        const progressFill = document.getElementById('progressFill');
        const removeBtn = document.getElementById('removeBgBtn');

        if (!progressFill || !removeBtn) {
            console.warn('script9.js: ไม่พบ element (progressFill หรือ removeBgBtn)');
            return;
        }

        // ---- สร้างข้อความแสดงเปอร์เซ็นต์ (ถ้ายังไม่มี) ----
        let progressText = document.getElementById('progressText');
        if (!progressText) {
            progressText = document.createElement('span');
            progressText.id = 'progressText';
            progressText.style.cssText = `
                margin-left: 12px;
                font-size: 0.8rem;
                color: #94A3B8;
                font-weight: 500;
                min-width: 60px;
            `;
            const container = progressFill.parentElement;
            if (container) {
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.appendChild(progressText);
            }
        }

        // ---- ตัวแปรสถานะ ----
        let current = 0;
        const max = 100;
        let intervalId = null;

        function updateBar() {
            current = Math.max(0, Math.min(max, current));
            const percent = (current / max) * 100;
            progressFill.style.width = percent + '%';
            if (progressText) {
                progressText.textContent = `${Math.round(current)} / ${max}`;
            }
        }

        function startProgress() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }

            current = 0;
            updateBar();

            intervalId = setInterval(() => {
                current += 7;

                if (current >= max) {
                    current = max;
                    updateBar();

                    clearInterval(intervalId);
                    intervalId = null;

                    // ---- เสียงตอบกลับเมื่อครบ 100% ----
                    // เล่นเสียงบี๊บ 2 ครั้ง
                    playBeep(880, 120, 0.3);
                    setTimeout(() => playBeep(1100, 120, 0.3), 180);

                    // พูดข้อความ
                    speakText('ครบ 100 เปอร์เซ็นต์แล้วครับเจ้านาย');

                    // อัปเดตข้อความ
                    if (progressText) {
                        progressText.textContent = '✅ เสร็จสิ้น!';
                        progressText.style.color = '#4ADE80';
                    }

                    // รีเซ็ตหลังจาก 3 วินาที
                    setTimeout(() => {
                        if (progressText) {
                            progressText.textContent = '0 / 100';
                            progressText.style.color = '#94A3B8';
                        }
                        current = 0;
                        updateBar();
                    }, 3000);

                    return;
                }

                updateBar();
            }, 150);
        }

        // ---- ผูก Event ปุ่ม ----
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            startProgress();
        });

        console.log('✅ script9.js โหลดสำเร็จ (พร้อมเสียงตอบกลับ)');
    }

    // ---- โหลด DOM ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();