// script10.js - ปุ่มเปิด main.py (แก้ไขแล้ว พร้อม Debug)
(function() {
    "use strict";

    const SERVER_URL = 'http://localhost:5000';  // ถ้าใช้ IP อื่นให้เปลี่ยนที่นี่

    // ---- สร้างปุ่มลอย ----
    function createFloatingButton() {
        if (document.getElementById('script10-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'script10-btn';
        btn.innerHTML = '🚀 เปิด TTS Studio';
        btn.style.cssText = `
            position: fixed;
            bottom: 30px;
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

        // จุดสถานะ
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

        // Hover effect
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 12px 32px rgba(96, 165, 250, 0.6)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 8px 24px rgba(96, 165, 250, 0.4)';
        });

        document.body.appendChild(btn);

        // ผูก Event
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            runMainPy();
        });

        // ตรวจสอบสถานะเซิร์ฟเวอร์ทันที
        checkServerStatus();
        // และตรวจสอบทุก 15 วินาที
        setInterval(checkServerStatus, 15000);

        return btn;
    }

    // ---- ตรวจสอบสถานะเซิร์ฟเวอร์ (ใช้ GET /status) ----
    async function checkServerStatus() {
        const indicator = document.getElementById('script10-status');
        if (!indicator) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // timeout 2.5 วินาที

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
                    indicator.style.color = '#4ADE80';  // เขียว = กำลังทำงาน
                } else {
                    indicator.textContent = '●';
                    indicator.style.color = '#60A5FA';  // ฟ้า = พร้อม แต่ main ยังไม่เปิด
                }
            } else {
                indicator.textContent = '○';
                indicator.style.color = '#F87171';  // แดง = server error
            }
        } catch (error) {
            clearTimeout(timeoutId);
            indicator.textContent = '○';
            indicator.style.color = '#F87171';  // แดง = ไม่เชื่อมต่อ
        }
    }

    // ---- เรียก API เพื่อเปิด main.py ----
    async function runMainPy() {
        const btn = document.getElementById('script10-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ กำลังเปิด...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // timeout 5 วินาที

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
                    showToast('❌ ' + data.message, '#F87171');
                }
            } else {
                showToast('❌ ' + (data.message || 'เกิดข้อผิดพลาด'), '#F87171');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                showToast('⏰ หมดเวลารอตอบกลับ (server อาจไม่ตอบ)', '#F87171');
            } else {
                showToast('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ (' + SERVER_URL + ')', '#F87171');
            }
            console.error('script10.js: fetch error', error);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
            // อัปเดตสถานะอีกครั้ง
            checkServerStatus();
        }
    }

    // ---- Toast Notification ----
    function showToast(message, color = '#4ADE80') {
        const old = document.getElementById('script10-toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.id = 'script10-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
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
        }, 4000);
    }

    // ---- Inject CSS animation ----
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

    // ---- เริ่มเมื่อ DOM พร้อม ----
    function init() {
        injectStyles();
        createFloatingButton();
        console.log('✅ script10.js โหลดสำเร็จ (ปุ่มเปิด TTS Studio)');
        console.log(`🔗 เชื่อมต่อที่ ${SERVER_URL}`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();