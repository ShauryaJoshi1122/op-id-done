/**
 * Sardar Vallabhbhai Patel Party (SVPP) Platform
 * Standalone VVIP Rally Pass & Media Press Badge Studio Engine
 * File: /js/editors/press-badge-editor.js
 */

import { SvppPhpService } from '../utils/php-api-client.js';

export const PressBadgeEditorEngine = {
    canvasWrapper: null,
    zoomLevel: 1.0,

    state: {
        passHolderName: 'Priya Verma',
        clearanceLevel: 'VIP PRESS MEDIA',
        eventTitle: 'MEGA LUCKNOW RALLY 2026',
        zoneAccess: 'ZONE-A (STAGE & STAGE BEHIND)',
        passId: 'VIP-2026-8809',
        headerRibbonColor: '#dc2626', // Red/Security Alert
        validDate: '26th August 2026'
    },

    init() {
        this.canvasWrapper = document.getElementById('badgeCanvasPreview');
        if (!this.canvasWrapper) return;

        this.bindEvents();
        this.renderBadge();
        this.loadPhpTemplates();
    },

    bindEvents() {
        const inputs = ['inputPassHolder', 'selectClearance', 'inputEventTitle', 'inputZoneAccess', 'inputPassId', 'selectRibbonColor'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateFromForm());
                el.addEventListener('change', () => this.updateFromForm());
            }
        });

        // Zoom controls
        const btnIn = document.getElementById('btnBadgeZoomIn');
        const btnOut = document.getElementById('btnBadgeZoomOut');
        const btnReset = document.getElementById('btnBadgeZoomReset');
        if (btnIn) btnIn.addEventListener('click', () => this.setZoom(this.zoomLevel + 0.15));
        if (btnOut) btnOut.addEventListener('click', () => this.setZoom(this.zoomLevel - 0.15));
        if (btnReset) btnReset.addEventListener('click', () => this.setZoom(1.0));

        // PDF Download
        const btnPdf = document.getElementById('btnDownloadBadgePdf');
        if (btnPdf) btnPdf.addEventListener('click', () => this.downloadPDF());

        // Save to Database
        const btnSave = document.getElementById('btnSaveBadgeTemplate');
        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const name = prompt('Enter template name for this Pass Badge:', 'Rally VIP Media Pass');
                if (!name) return;

                const res = await SvppPhpService.saveCanvasTemplate({
                    editor_type: 'press_badge',
                    template_name: name,
                    orientation: 'vertical',
                    canvas_data: this.state
                });

                if (res && res.status === 'success') {
                    alert('Pass Badge template saved to MySQL database!');
                    this.loadPhpTemplates();
                } else {
                    alert('Error saving pass badge template.');
                }
            });
        }
    },

    updateFromForm() {
        this.state.passHolderName = document.getElementById('inputPassHolder')?.value || 'Priya Verma';
        this.state.clearanceLevel = document.getElementById('selectClearance')?.value || 'VIP PRESS MEDIA';
        this.state.eventTitle = document.getElementById('inputEventTitle')?.value || 'MEGA LUCKNOW RALLY 2026';
        this.state.zoneAccess = document.getElementById('inputZoneAccess')?.value || 'ZONE-A';
        this.state.passId = document.getElementById('inputPassId')?.value || 'VIP-2026-8809';
        this.state.headerRibbonColor = document.getElementById('selectRibbonColor')?.value || '#dc2626';

        this.renderBadge();
    },

    setZoom(level) {
        this.zoomLevel = Math.min(1.8, Math.max(0.6, parseFloat(level.toFixed(2))));
        if (this.canvasWrapper) {
            this.canvasWrapper.style.transform = `scale(${this.zoomLevel})`;
            this.canvasWrapper.style.transformOrigin = 'top center';
        }
        const label = document.getElementById('badgeZoomLabel');
        if (label) label.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    },

    renderBadge() {
        if (!this.canvasWrapper) return;

        this.canvasWrapper.innerHTML = `
            <div style="position: relative; width: 340px; height: 530px; background: #0f172a; border-radius: 16px; border: 2px solid #334155; box-shadow: 0 20px 50px rgba(0,0,0,0.7); overflow: hidden; color: white; font-family: 'Outfit', sans-serif;">
                
                <!-- Lanyard Hole Clip -->
                <div style="width: 50px; height: 10px; background: #020617; border-radius: 6px; margin: 8px auto 0; border: 1px solid #334155;"></div>

                <!-- Top Security Clearance Ribbon -->
                <div style="background: ${this.state.headerRibbonColor}; padding: 10px; text-align: center; font-weight: 900; font-size: 1.1rem; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(0,0,0,0.4); margin-top: 8px;">
                    ${this.state.clearanceLevel}
                </div>

                <!-- Event Title Header -->
                <div style="text-align: center; padding: 12px 16px 6px;">
                    <div style="font-size: 0.7rem; color: #FF9933; font-weight: 800; letter-spacing: 1.5px;">SARDAR VALLABHBHAI PATEL PARTY</div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: #f8fafc; margin-top: 2px;">${this.state.eventTitle}</div>
                </div>

                <!-- Holder Photo / Icon & Name -->
                <div style="text-align: center; padding: 10px 16px;">
                    <div style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid ${this.state.headerRibbonColor}; margin: 0 auto 10px; overflow: hidden; background: #1e293b; display: flex; align-items: center; justify-content: center;">
                        <img src="images/logo.jpg" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                    
                    <div style="font-size: 1.25rem; font-weight: 900; color: #ffffff;">${this.state.passHolderName}</div>
                    <div style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; margin-top: 2px;">ID: ${this.state.passId}</div>
                </div>

                <!-- Zone Access Clearance Box -->
                <div style="margin: 0 16px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 10px; text-align: center;">
                    <div style="font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 1px;">CLEARANCE PERMISSION:</div>
                    <div style="font-size: 0.88rem; font-weight: 900; color: #fbbf24; margin-top: 2px;">${this.state.zoneAccess}</div>
                </div>

                <!-- Bottom Verification Footer with Barcode mockup -->
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #1e293b; padding: 10px 16px; border-top: 1px solid #334155; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <div style="font-size: 0.65rem; color: #94a3b8;">DATE VALID: ${this.state.validDate}</div>
                        <div style="font-size: 0.65rem; color: #22c55e; font-weight: 700;">● SECURITY VERIFIED</div>
                    </div>
                    <div style="font-family: monospace; font-size: 1.2rem; letter-spacing: 2px; color: #e2e8f0; background: #000; padding: 2px 6px; border-radius: 4px;">|||| ||| |||</div>
                </div>
            </div>
        `;
    },

    async downloadPDF() {
        const el = this.canvasWrapper.querySelector('div');
        if (!el) return;

        try {
            const canvas = await window.html2canvas(el, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', [100, 160]);

            pdf.addImage(imgData, 'JPEG', 0, 0, 100, 160);
            pdf.save(`Rally_Pass_${this.state.passHolderName.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error(err);
            alert('PDF export failed.');
        }
    },

    async loadPhpTemplates() {
        const res = await SvppPhpService.getCanvasTemplates('press_badge');
        const selectEl = document.getElementById('selectBadgePhpTemplate');
        if (selectEl && res && res.data) {
            selectEl.innerHTML = '<option value="">-- Load Saved Badge Template (MySQL) --</option>' + 
                res.data.map(t => `<option value="${t.id}">${t.template_name}</option>`).join('');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PressBadgeEditorEngine.init();
});
