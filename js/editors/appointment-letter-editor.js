/**
 * Sardar Vallabhbhai Patel Party (SVPP) Platform
 * Standalone Official Appointment Letter Editor Engine
 * File: /js/editors/appointment-letter-editor.js
 */

import { SvppPhpService } from '../utils/php-api-client.js';

export const AppointmentLetterEditorEngine = {
    canvasWrapper: null,
    zoomLevel: 1.0,

    state: {
        memberName: 'Rajesh Sharma',
        fatherName: 'Ram Kumar Sharma',
        designation: 'District President - Youth Wing',
        district: 'Lucknow',
        stateName: 'Uttar Pradesh',
        refNumber: 'SVPP/HQ/2026/089',
        appointmentDate: '2026-08-25',
        validUpto: '2027-08-24',
        headerColor: '#0F2B5C',
        watermarkMode: 'subtle',
        letterBody: `We are pleased to inform you that upon the recommendation of the High Command, you have been appointed to the post of [[DESIGNATION]] for [[DISTRICT]] with immediate effect.

You are expected to work diligently towards promoting the ideology of Sardar Vallabhbhai Patel, serving the public interest, strengthening party unity, and adhering strictly to the constitutional principles of the Sardar Vallabhbhai Patel Party.`
    },

    init() {
        this.canvasWrapper = document.getElementById('letterCanvasPreview');
        if (!this.canvasWrapper) return;

        this.bindEvents();
        this.renderLetter();
        this.loadPhpTemplates();
    },

    bindEvents() {
        const inputs = ['inputMemberName', 'inputDesignation', 'inputRefNumber', 'inputAppointmentDate', 'inputValidUpto', 'selectHeaderColor', 'selectWatermarkMode', 'textareaLetterBody'];
        
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateStateFromForm());
                el.addEventListener('change', () => this.updateStateFromForm());
            }
        });

        // Zoom buttons
        const btnIn = document.getElementById('btnLetterZoomIn');
        const btnOut = document.getElementById('btnLetterZoomOut');
        const btnReset = document.getElementById('btnLetterZoomReset');

        if (btnIn) btnIn.addEventListener('click', () => this.setZoom(this.zoomLevel + 0.15));
        if (btnOut) btnOut.addEventListener('click', () => this.setZoom(this.zoomLevel - 0.15));
        if (btnReset) btnReset.addEventListener('click', () => this.setZoom(1.0));

        // PDF Download
        const btnPdf = document.getElementById('btnDownloadPdf');
        if (btnPdf) btnPdf.addEventListener('click', () => this.downloadPDF());

        // Save Template via PHP API
        const btnSavePhp = document.getElementById('btnSaveLetterTemplate');
        if (btnSavePhp) {
            btnSavePhp.addEventListener('click', async () => {
                const name = prompt('Enter a name for this Letterhead Template:', 'Official High Command Letterhead');
                if (!name) return;

                const templateData = {
                    editor_type: 'appointment_letter',
                    template_name: name,
                    orientation: 'vertical',
                    canvas_data: this.state
                };

                const res = await SvppPhpService.saveCanvasTemplate(templateData);
                if (res && res.status === 'success') {
                    alert('Appointment Letter Template saved to MySQL database!');
                    this.loadPhpTemplates();
                } else {
                    alert('Error saving template to database.');
                }
            });
        }
    },

    updateStateFromForm() {
        this.state.memberName = document.getElementById('inputMemberName')?.value || 'Rajesh Sharma';
        this.state.designation = document.getElementById('inputDesignation')?.value || 'District President';
        this.state.refNumber = document.getElementById('inputRefNumber')?.value || 'SVPP/HQ/2026/089';
        this.state.appointmentDate = document.getElementById('inputAppointmentDate')?.value || '2026-08-25';
        this.state.validUpto = document.getElementById('inputValidUpto')?.value || '2027-08-24';
        this.state.headerColor = document.getElementById('selectHeaderColor')?.value || '#0F2B5C';
        this.state.watermarkMode = document.getElementById('selectWatermarkMode')?.value || 'subtle';
        this.state.letterBody = document.getElementById('textareaLetterBody')?.value || '';

        this.renderLetter();
    },

    setZoom(level) {
        this.zoomLevel = Math.min(1.5, Math.max(0.5, parseFloat(level.toFixed(2))));
        if (this.canvasWrapper) {
            this.canvasWrapper.style.transform = `scale(${this.zoomLevel})`;
            this.canvasWrapper.style.transformOrigin = 'top center';
        }
        const label = document.getElementById('letterZoomLabel');
        if (label) label.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    },

    renderLetter() {
        if (!this.canvasWrapper) return;

        let watermarkOpacity = 0.06;
        if (this.state.watermarkMode === 'none') watermarkOpacity = 0;
        if (this.state.watermarkMode === 'prominent') watermarkOpacity = 0.12;

        const processedBody = this.state.letterBody
            .replace(/\[\[FULL_NAME\]\]/g, this.state.memberName)
            .replace(/\[\[DESIGNATION\]\]/g, this.state.designation)
            .replace(/\[\[DISTRICT\]\]/g, this.state.district)
            .replace(/\n/g, '<br/>');

        this.canvasWrapper.innerHTML = `
            <div style="position: relative; width: 794px; min-height: 1123px; background: #ffffff; padding: 40px; box-sizing: border-box; font-family: 'Outfit', sans-serif; color: #1e293b; border: 1px solid #e2e8f0; overflow: hidden; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
                
                ${watermarkOpacity > 0 ? `
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 450px; opacity: ${watermarkOpacity}; pointer-events: none; z-index: 0;">
                        <img src="images/logo.jpg" style="width: 100%; filter: grayscale(30%);" />
                    </div>
                ` : ''}

                <!-- Top Ribbon -->
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 8px; display: flex; z-index: 2;">
                    <div style="flex:1; background:#FF9933;"></div>
                    <div style="flex:1; background:#ffffff; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;"></div>
                    <div style="flex:1; background:#138808;"></div>
                </div>

                <!-- Letter Header -->
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double ${this.state.headerColor}; padding-bottom: 16px; margin-bottom: 24px;">
                        <img src="images/logo.jpg" style="width: 80px; height: 80px; border-radius: 50%; border: 2.5px solid #FF9933;" />
                        <div style="flex: 1; text-align: center; padding: 0 16px;">
                            <div style="font-size: 0.85rem; font-weight: 800; color: #FF9933; margin-bottom: 2px;">🇮🇳 NATIONAL POLITICAL PARTY</div>
                            <h1 style="margin: 0; font-size: 1.45rem; font-weight: 900; color: ${this.state.headerColor}; text-transform: uppercase;">SARDAR VALLABHBHAI PATEL PARTY</h1>
                            <div style="font-size: 0.78rem; color: #475569; margin-top: 4px;">Regd. Central Office: Indira Nagar, Lucknow, Uttar Pradesh</div>
                        </div>
                        <img src="images/logo.jpg" style="width: 70px; height: 70px; opacity: 0.75;" />
                    </div>

                    <!-- Ref & Date -->
                    <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.85rem; margin-bottom: 24px; color: #0F2B5C;">
                        <div>Ref No: ${this.state.refNumber}</div>
                        <div>Date: ${this.state.appointmentDate}</div>
                    </div>

                    <!-- Title -->
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="display: inline-block; background: ${this.state.headerColor}; color: white; padding: 6px 20px; border-radius: 20px; font-weight: 800; font-size: 1rem; letter-spacing: 1px;">OFFICIAL APPOINTMENT LETTER</span>
                    </div>

                    <!-- Recipient -->
                    <div style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">
                        <strong>To,</strong><br/>
                        <span style="font-size: 1.1rem; font-weight: 800; color: #0F2B5C;">${this.state.memberName}</span><br/>
                        District: <strong>${this.state.district}</strong> | State: <strong>${this.state.stateName}</strong>
                    </div>

                    <!-- Body -->
                    <div style="font-size: 0.92rem; line-height: 1.8; color: #334155; margin-bottom: 40px; text-align: justify;">
                        ${processedBody}
                    </div>

                    <!-- Signatures -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px;">
                        <div style="text-align: center;">
                            <img src="images/signature.png" style="height: 45px; display: block; margin: 0 auto 4px;" />
                            <div style="font-weight: 800; color: #0F2B5C; font-size: 0.85rem;">National President</div>
                            <div style="font-size: 0.75rem; color: #64748b;">SVPP High Command</div>
                        </div>
                        <div style="text-align: center; border: 2px dashed #0F2B5C; padding: 10px 18px; border-radius: 8px;">
                            <div style="font-size: 0.75rem; font-weight: 800; color: #FF9933;">VALID UPTO</div>
                            <div style="font-size: 0.9rem; font-weight: 800; color: #0F2B5C;">${this.state.validUpto}</div>
                        </div>
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
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Appointment_Letter_${this.state.memberName.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error(err);
            alert('Failed to generate PDF download.');
        }
    },

    async loadPhpTemplates() {
        const res = await SvppPhpService.getCanvasTemplates('appointment_letter');
        const selectEl = document.getElementById('selectLetterPhpTemplate');
        if (selectEl && res && res.data) {
            selectEl.innerHTML = '<option value="">-- Load Saved Template (MySQL) --</option>' + 
                res.data.map(t => `<option value="${t.id}">${t.template_name}</option>`).join('');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AppointmentLetterEditorEngine.init();
});
