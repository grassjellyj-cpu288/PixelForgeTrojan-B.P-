// ============================================================
// script10.js - ปุ่มเปิด TTS Studio (พร้อมระบบแจ้งเตือน)
// รองรับทั้ง Localhost และ Render
// ============================================================

(function() {
    "use strict";

    // ==========================================================
    // กำหนดค่า
    // ==========================================================

    // ใช้ URL เดียวกับที่เปิดหน้าเว็บ (relative) หรือ localhost:5000
    const SERVER_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : window.location.origin;   // ถ้าอยู่บน Render ให้ใช้ origin เดียว

    const TIMEOUT_MS = 5000;        // 5 วินาที
    const CHECK_INTERVAL = 15000;   // ตรวจสอบสถานะทุก 15 วินาที

    // ==========================================================
    // สร้างปุ่มลอย (ถ้ายังไม่มี)
    // ==========================================================

    function createFloatingButton() {
        if (document.getElementById('script10-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'script10-btn';
        btn.innerHTML = '🚀 เปิด TTS Studio';
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
            letter-spacing: 0.3px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        // จุดสถานะ (ตัวบ่งชี้)
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

        // เอฟเฟกต์ Hover
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 12px 32px rgba(96, 165, 250, 0.6)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 8px 24px rgba(96, 165, 250, 0.4)';
        });

        document.body.appendChild(btn);

        // ผูก Event คลิก
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            runMainPy();
        });

        return btn;
    }

    // ==========================================================
    // ฟังก์ชันตรวจสอบสถานะเซิร์ฟเวอร์
    // ==========================================================

    async function checkServerStatus() {
        const indicator = document.getElementById('script10-status');
        if (!indicator) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(`${SERVER_URL}/status`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.main_running) {
                    indicator.textContent = '●';
                    indicator.style.color = '#4ADE80'; // เขียว = กำลังทำงาน
                } else {
                    indicator.textContent = '●';
                    indicator.style.color = '#60A5FA'; // ฟ้า = พร้อม
                }
            } else {
                indicator.textContent = '○';
                indicator.style.color = '#F87171'; // แดง = server error
            }
        } catch (error) {
            clearTimeout(timeoutId);
            indicator.textContent = '○';
            indicator.style.color = '#F87171'; // แดง = ไม่เชื่อมต่อ
        }
    }

    // ==========================================================
    // ฟังก์ชันเปิด main.py (เรียก API /run-main)
    // ==========================================================

    async function runMainPy() {
        const btn = document.getElementById('script10-btn');
        const originalText = btn.innerHTML;

        // เปลี่ยนสถานะปุ่ม (กำลังโหลด)
        btn.innerHTML = '⏳ กำลังเปิด...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(`${SERVER_URL}/run-main`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();

            if (response.ok) {
                if (data.status === 'success') {
                    showToast('✅ ' + data.message, '#4ADE80');
                } else if (data.status === 'warning') {
                    showToast('⚠️ ' + data.message, '#FACC15');
                } else {
                    showToast('❌ ' + (data.message || 'เกิดข้อผิดพลาด'), '#F87171');
                }
            } else {
                showToast('❌ ' + (data.message || 'Server error'), '#F87171');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                showToast('⏰ เซิร์ฟเวอร์ไม่ตอบกลับ (หมดเวลา) กรุณาตรวจสอบว่า server.exe เปิดอยู่', '#F87171');
            } else {
                showToast('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์: ' + error.message, '#F87171');
            }
            console.error('script10.js: fetch error', error);
        } finally {
            // คืนค่าปุ่ม
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
            // อัปเดตสถานะอีกครั้ง
            checkServerStatus();
        }
    }

    // ==========================================================
    // Toast Notification (แจ้งเตือนแบบลอย)
    // ==========================================================

    function showToast(message, color = '#4ADE80') {
        // ลบ Toast เก่าถ้ามี
        const old = document.getElementById('script10-toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.id = 'script10-toast';
        toast.textContent = message;
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

        // ลบอัตโนมัติหลังจาก 5 วินาที
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // ==========================================================
    // เพิ่ม CSS animation (ถ้ายังไม่มี)
    // ==========================================================

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

    // ==========================================================
    // เริ่มต้นเมื่อ DOM พร้อม
    // ==========================================================

    function init() {
        injectStyles();
        createFloatingButton();
        // ตรวจสอบสถานะครั้งแรก
        checkServerStatus();
        // ตรวจสอบซ้ำทุก 15 วินาที
        setInterval(checkServerStatus, CHECK_INTERVAL);
        console.log('✅ script10.js โหลดสำเร็จ (SERVER_URL =', SERVER_URL, ')');
    }

    // รอให้ DOM พร้อม
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
