// script10.js - ปุ่มเปิด TTS Studio (รองรับ Local + Render)
(function() {
    "use strict";

    const SERVER_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : window.location.origin;

    const TIMEOUT_MS = 5000;
    const CHECK_INTERVAL = 15000;
    const IS_RENDER = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    // ========== สร้างปุ่ม ==========
    function createFloatingButton() {
        if (document.getElementById('script10-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'script10-btn';
        btn.innerHTML = IS_RENDER ? '🎙️ TTS Studio (Web)' : '🚀 เปิด TTS Studio';
        btn.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 30px;
            z-index: 9999;
            padding: 14px 24px;
            background: linear-gradient(135deg, #60A5FA, #A78BFA);
            color: white;
            border: none;
            border-radius: 40px;
            font-size: 1rem;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(96, 165, 250, 0.4);
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const indicator = document.createElement('span');
        indicator.id = 'script10-status';
        indicator.textContent = '●';
        indicator.style.cssText = `
            font-size: 0.8rem;
            margin-right: 4px;
            color: #facc15;
            transition: color 0.3s ease;
        `;
        btn.prepend(indicator);

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 12px 32px rgba(96, 165, 250, 0.6)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 8px 24px rgba(96, 165, 250, 0.4)';
        });

        document.body.appendChild(btn);

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (IS_RENDER) {
                openTTSWeb();
            } else {
                runMainPy();
            }
        });

        return btn;
    }

    // ========== TTS Web (Render) ==========
    function openTTSWeb() {
        // ถ้ามี Modal อยู่แล้ว ให้แสดง
        const existing = document.getElementById('tts-web-modal');
        if (existing) {
            existing.style.display = 'block';
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'tts-web-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: #1E293B;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            max-width: 500px;
            width: 90%;
            color: white;
            font-family: 'Inter', sans-serif;
        `;
        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h2 style="margin:0; font-size:1.5rem;">🎙️ TTS Studio (Web)</h2>
                <button id="close-tts-modal" style="background:none; border:none; color:#94A3B8; font-size:1.5rem; cursor:pointer;">✕</button>
            </div>
            <textarea id="tts-text-input" rows="4" style="width:100%; padding:12px; background:#0F172A; color:white; border:1px solid #334155; border-radius:8px; font-size:1rem; resize:vertical;">สวัสดีครับ ยินดีต้อนรับสู่ TTS Studio บนเว็บ</textarea>
            <div style="margin:12px 0;">
                <label>ความเร็ว: <span id="speed-label">1.0</span></label>
                <input type="range" id="tts-speed" min="0.5" max="2" step="0.1" value="1.0" style="width:100%;">
            </div>
            <button id="tts-speak-btn" style="width:100%; padding:12px; background:linear-gradient(135deg,#60A5FA,#A78BFA); border:none; border-radius:8px; color:white; font-size:1rem; font-weight:600; cursor:pointer;">🔊 พูด</button>
            <div id="tts-status" style="margin-top:12px; padding:12px; background:#0F172A; border-radius:8px; border-left:4px solid #60A5FA; font-size:0.9rem;">✅ พร้อมใช้งาน</div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-tts-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // ปิดเมื่อคลิกด้านนอก (optional)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        // ปุ่มพูด
        document.getElementById('tts-speak-btn').addEventListener('click', function() {
            const text = document.getElementById('tts-text-input').value.trim();
            const speed = parseFloat(document.getElementById('tts-speed').value);
            const statusEl = document.getElementById('tts-status');

            if (!text) {
                statusEl.textContent = '⚠️ กรุณาพิมพ์ข้อความ';
                statusEl.style.borderLeftColor = '#FACC15';
                return;
            }
            if (!window.speechSynthesis) {
                statusEl.textContent = '❌ เบราว์เซอร์ไม่รองรับ Speech Synthesis';
                statusEl.style.borderLeftColor = '#F87171';
                return;
            }

            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'th-TH';
            utterance.rate = speed;
            utterance.pitch = 1;

            const voices = window.speechSynthesis.getVoices();
            const thVoice = voices.find(v => v.lang.startsWith('th'));
            if (thVoice) utterance.voice = thVoice;

            utterance.onstart = () => {
                statusEl.textContent = '⏳ กำลังพูด...';
                statusEl.style.borderLeftColor = '#60A5FA';
            };
            utterance.onend = () => {
                statusEl.textContent = '✅ พูดเสร็จเรียบร้อย';
                statusEl.style.borderLeftColor = '#4ADE80';
            };
            utterance.onerror = (e) => {
                statusEl.textContent = '❌ ข้อผิดพลาด: ' + e.error;
                statusEl.style.borderLeftColor = '#F87171';
            };
            window.speechSynthesis.speak(utterance);
        });

        // อัปเดตความเร็ว
        document.getElementById('tts-speed').addEventListener('input', function() {
            document.getElementById('speed-label').textContent = parseFloat(this.value).toFixed(1);
        });

        // โหลดเสียงล่วงหน้า
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }

    // ========== เรียก /run-main (Local) ==========
    async function runMainPy() {
        const btn = document.getElementById('script10-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '⏳ กำลังเปิด...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const res = await fetch(`${SERVER_URL}/run-main`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (res.ok) {
                const color = data.status === 'success' ? '#4ADE80' : data.status === 'warning' ? '#FACC15' : '#F87171';
                showToast((data.status === 'success' ? '✅ ' : '⚠️ ') + data.message, color);
            } else {
                showToast('❌ ' + (data.message || 'Server error'), '#F87171');
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                showToast('⏰ เซิร์ฟเวอร์ไม่ตอบกลับ (หมดเวลา) กรุณาเปิด server.exe', '#F87171');
            } else {
                showToast('❌ ' + err.message, '#F87171');
            }
        } finally {
            btn.innerHTML = original;
            btn.disabled = false;
            btn.style.opacity = '1';
            checkServerStatus();
        }
    }

    // ========== ตรวจสอบสถานะ ==========
    async function checkServerStatus() {
        const indicator = document.getElementById('script10-status');
        if (!indicator) return;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(`${SERVER_URL}/status`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                indicator.textContent = '●';
                indicator.style.color = data.main_running ? '#4ADE80' : '#60A5FA';
            } else {
                indicator.textContent = '○';
                indicator.style.color = '#F87171';
            }
        } catch {
            clearTimeout(timeoutId);
            indicator.textContent = '○';
            indicator.style.color = '#F87171';
        }
    }

    // ========== Toast ==========
    function showToast(msg, color = '#4ADE80') {
        const old = document.getElementById('script10-toast');
        if (old) old.remove();
        const toast = document.createElement('div');
        toast.id = 'script10-toast';
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed;
            bottom: 160px;
            right: 30px;
            z-index: 10000;
            padding: 14px 24px;
            background: #1E293B;
            color: white;
            border-left: 6px solid ${color};
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            font-family: 'Inter', sans-serif;
            font-size: 0.95rem;
            font-weight: 500;
            max-width: 350px;
            animation: slideIn 0.3s ease;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // ========== CSS animation ==========
    function injectStyles() {
        if (document.getElementById('script10-styles')) return;
        const style = document.createElement('style');
        style.id = 'script10-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // ========== เริ่มต้น ==========
    function init() {
        injectStyles();
        createFloatingButton();
        checkServerStatus();
        setInterval(checkServerStatus, CHECK_INTERVAL);
        console.log('✅ script10.js loaded (Render:', IS_RENDER, ')');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
