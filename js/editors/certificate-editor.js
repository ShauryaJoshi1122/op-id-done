/**
 * Sardar Vallabhbhai Patel Party (SVPP) & Thamarai Foundation
 * Standalone Award & Certificate of Honor Studio Engine
 * File: /js/editors/certificate-editor.js
 */

import { SvppPhpService } from '../utils/php-api-client.js';

export const CertificateEditorEngine = {
    canvasWrapper: null,
    zoomLevel: 1.0,

    state: {
        recipientName: 'Shri Rajesh Sharma',
        awardTitle: 'CERTIFICATE OF HONOR & APPRECIATION',
        reason: 'In recognition of outstanding dedication, exemplary leadership, and selfless public service towards strengthening the Sardar Vallabhbhai Patel Party.',
        awardDate: '25th August 2026',
        certificateNo: 'SVPP-CERT-2026-9041',
        themeColor: '#B45309', // Gold/Bronze
        sealStyle: 'gold-seal'
    },

    init() {
        this.canvasWrapper = document.getElementById('certificateCanvasPreview');
        if (!this.canvasWrapper) return;

        this.bindEvents();
        this.renderCertificate();
        this.loadPhpTemplates();
    },

    bindEvents() {
        const inputs = ['inputRecipientName', 'inputAwardTitle', 'textareaReason', 'inputAwardDate', 'selectCertTheme'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateFromForm());
                el.addEventListener('change', () => this.updateFromForm());
            }
        });

        // Zoom controls
        const btnIn = document.getElementById('btnCertZoomIn');
        const btnOut = document.getElementById('btnCertZoomOut');
        const btnReset = document.getElementById('btnCertZoomReset');
        if (btnIn) btnIn.addEventListener('click', () => this.setZoom(this.zoomLevel + 0.15));
        if (btnOut) btnOut.addEventListener('click', () => this.setZoom(this.zoomLevel - 0.15));
        if (btnReset) btnReset.addEventListener('click', () => this.setZoom(1.0));

        // PDF Download
        const btnPdf = document.getElementById('btnDownloadCertPdf');
        if (btnPdf) btnPdf.addEventListener('click', () => this.downloadPDF());

        // Save to Database
        const btnSave = document.getElementById('btnSaveCertTemplate');
        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const name = prompt('Enter a template name for this Award Certificate:', 'Gold Honor Certificate');
                if (!name) return;

                const res = await SvppPhpService.saveCanvasTemplate({
                    editor_type: 'certificate',
                    template_name: name,
                    orientation: 'horizontal',
                    canvas_data: this.state
                });

                if (res && res.status === 'success') {
                    alert('Certificate template saved to database!');
                    this.loadPhpTemplates();
                } else {
                    alert('Error saving certificate template.');
                }
            });
        }
    },

    updateFromForm() {
        this.state.recipientName = document.getElementById('inputRecipientName')?.value || 'Shri Rajesh Sharma';
        this.state.awardTitle = document.getElementById('inputAwardTitle')?.value || 'CERTIFICATE OF HONOR';
        this.state.reason = document.getElementById('textareaReason')?.value || '';
        this.state.awardDate = document.getElementById('inputAwardDate')?.value || '25th August 2026';
        this.state.themeColor = document.getElementById('selectCertTheme')?.value || '#B45309';

        this.renderCertificate();
    },

    setZoom(level) {
        this.zoomLevel = Math.min(1.5, Math.max(0.5, parseFloat(level.toFixed(2))));
        if (this.canvasWrapper) {
            this.canvasWrapper.style.transform = `scale(${this.zoomLevel})`;
            this.canvasWrapper.style.transformOrigin = 'top center';
        }
        const label = document.getElementById('certZoomLabel');
        if (label) label.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    },

    renderCertificate() {
        if (!this.canvasWrapper) return;

        this.canvasWrapper.innerHTML = `
            <div style="position: relative; width: 900px; height: 635px; background: #fffdfa; border: 12px double ${this.state.themeColor}; padding: 36px; box-sizing: border-box; font-family: 'Outfit', sans-serif; color: #1e293b; box-shadow: 0 15px 45px rgba(0,0,0,0.3); overflow: hidden;">
                
                <!-- Inner Border Frame -->
                <div style="position: absolute; inset: 12px; border: 2px solid ${this.state.themeColor}; pointer-events: none;"></div>

                <!-- Top Emblem & Header -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="images/logo.jpg" style="width: 75px; height: 75px; border-radius: 50%; border: 2px solid #FF9933; margin-bottom: 8px;" />
                    <div style="font-size: 0.85rem; font-weight: 800; color: #FF9933; letter-spacing: 2px;">SARDAR VALLABHBHAI PATEL PARTY</div>
                    <h1 style="margin: 4px 0 0; font-size: 1.8rem; font-weight: 900; color: ${this.state.themeColor}; font-family: 'Playfair Display', serif; letter-spacing: 1px;">
                        ${this.state.awardTitle}
                    </h1>
                </div>

                <!-- Recipient Presentation -->
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 0.95rem; color: #64748b; font-style: italic;">This certificate is proudly presented to</div>
                    <div style="font-size: 2.1rem; font-weight: 900; color: #0F2B5C; margin: 10px 0; border-bottom: 2px solid #e2e8f0; display: inline-block; padding: 0 24px 4px;">
                        ${this.state.recipientName}
                    </div>
                </div>

                <!-- Reason Citation -->
                <div style="text-align: center; max-width: 700px; margin: 0 auto 36px; font-size: 0.95rem; line-height: 1.7; color: #334155;">
                    ${this.state.reason}
                </div>

                <!-- Bottom Footer (Date, Seal, Signatures) -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 20px;">
                    <div>
                        <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">DATE OF ISSUANCE</div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: #0F2B5C;">${this.state.awardDate}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">ID: ${this.state.certificateNo}</div>
                    </div>

                    <!-- Seal -->
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: radial-gradient(circle, #fbbf24 0%, #b45309 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 0.7rem; text-align: center; box-shadow: 0 4px 15px rgba(180,83,9,0.4); border: 3px solid #ffffff;">
                        OFFICIAL<br/>SEAL
                    </div>

                    <div style="text-align: center;">
                        <img src="images/signature.png" style="height: 40px; display: block; margin: 0 auto 4px;" />
                        <div style="font-weight: 800; color: #0F2B5C; font-size: 0.85rem;">National President</div>
                        <div style="font-size: 0.75rem; color: #64748b;">SVPP Central Committee</div>
                    </div>
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
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape format
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`SVPP_Award_Certificate_${this.state.recipientName.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error(err);
            alert('PDF generation failed');
        }
    },

    async loadPhpTemplates() {
        const res = await SvppPhpService.getCanvasTemplates('certificate');
        const selectEl = document.getElementById('selectCertPhpTemplate');
        if (selectEl && res && res.data) {
            selectEl.innerHTML = '<option value="">-- Load Saved Certificate Template (MySQL) --</option>' + 
                res.data.map(t => `<option value="${t.id}">${t.template_name}</option>`).join('');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CertificateEditorEngine.init();
});
