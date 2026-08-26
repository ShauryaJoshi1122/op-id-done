/**
 * Sardar Vallabhbhai Patel Party (SVPP) Platform
 * Standalone Digital ID Card Studio & Drag-and-Drop Canvas Editor Engine
 * File: /js/editors/id-card-editor.js
 */

import { SvppPhpService } from '../utils/php-api-client.js';

export const IdCardEditorEngine = {
    canvasElement: null,
    zoomLevel: 1.0,
    showGridGuides: false,
    activeSide: 'front', // 'front' or 'back'
    selectedElementId: null,

    // Initial default layout elements
    frontElements: [
        { id: 'photo', type: 'media', tag: '[[MEMBER_PHOTO]]', label: 'Member Photo', x: 34, y: 16, width: 95, height: 115, borderRadius: 12 },
        { id: 'name', type: 'text', tag: '[[FULL_NAME]]', label: 'Full Name', x: 8, y: 53, fontSize: 16, fontWeight: '800', color: '#0F2B5C', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' },
        { id: 'designation', type: 'text', tag: '[[DESIGNATION]]', label: 'Party Designation', x: 8, y: 62, fontSize: 13, fontWeight: '700', color: '#ffffff', badgePill: 'navy-pill' },
        { id: 'member_no', type: 'text', tag: '[[MEMBER_NO]]', label: 'Member ID No', x: 8, y: 72, fontSize: 11, fontWeight: '700', color: '#475569' },
        { id: 'district', type: 'text', tag: '[[DISTRICT]]', label: 'District / State', x: 8, y: 80, fontSize: 11, fontWeight: '600', color: '#334155' },
        { id: 'qr', type: 'media', tag: '[[QR_CODE]]', label: 'Verification QR Code', x: 74, y: 72, width: 62, height: 62, borderRadius: 6 }
    ],

    backElements: [
        { id: 'back_header', type: 'text', tag: 'TERMS & INSTRUCTIONS', label: 'Card Terms Header', x: 10, y: 12, fontSize: 13, fontWeight: '800', color: '#0F2B5C' },
        { id: 'father_name', type: 'text', tag: 'Father/Spouse: [[FATHER_NAME]]', label: 'Father/Spouse Name', x: 10, y: 25, fontSize: 11, fontWeight: '600', color: '#334155' },
        { id: 'blood_group', type: 'text', tag: 'Blood Group: [[BLOOD_GROUP]]', label: 'Blood Group', x: 10, y: 35, fontSize: 11, fontWeight: '600', color: '#dc2626' },
        { id: 'address', type: 'text', tag: 'Address: [[ADDRESS]]', label: 'Address Line', x: 10, y: 45, fontSize: 10, fontWeight: '500', color: '#475569' },
        { id: 'emergency_phone', type: 'text', tag: 'HQ Helpline: 9451733981', label: 'Helpline Contact', x: 10, y: 72, fontSize: 11, fontWeight: '700', color: '#138808' },
        { id: 'signature', type: 'media', tag: '[[FOUNDER_SIGNATURE]]', label: 'Auth Signature', x: 62, y: 78, width: 85, height: 40, borderRadius: 0 }
    ],

    init(containerId = 'idCardCanvasContainer') {
        this.canvasElement = document.getElementById(containerId);
        if (!this.canvasElement) return;

        this.bindEvents();
        this.renderCanvas();
        this.loadPhpTemplates();
    },

    bindEvents() {
        // Toggle side
        const btnFront = document.getElementById('btnIdCardSideFront');
        const btnBack = document.getElementById('btnIdCardSideBack');
        if (btnFront) btnFront.addEventListener('click', () => this.switchSide('front'));
        if (btnBack) btnBack.addEventListener('click', () => this.switchSide('back'));

        // Toggle Grid
        const btnGrid = document.getElementById('btnIdCardToggleGrid');
        if (btnGrid) {
            btnGrid.addEventListener('click', () => {
                this.showGridGuides = !this.showGridGuides;
                btnGrid.style.background = this.showGridGuides ? '#2563eb' : '#1e293b';
                btnGrid.style.color = this.showGridGuides ? '#ffffff' : '#38bdf8';
                this.renderCanvas();
            });
        }

        // Zoom controls
        const btnZoomIn = document.getElementById('btnIdCardZoomIn');
        const btnZoomOut = document.getElementById('btnIdCardZoomOut');
        const btnZoomReset = document.getElementById('btnIdCardZoomReset');

        if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.setZoom(this.zoomLevel + 0.15));
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.setZoom(this.zoomLevel - 0.15));
        if (btnZoomReset) btnZoomReset.addEventListener('click', () => this.setZoom(1.0));

        // Save Template via PHP API
        const btnSavePhpTemplate = document.getElementById('btnSavePhpTemplate');
        if (btnSavePhpTemplate) {
            btnSavePhpTemplate.addEventListener('click', async () => {
                const name = prompt('Enter a name for this ID Card Canvas Template:', 'Official Custom ID Template');
                if (!name) return;

                const templateData = {
                    editor_type: 'id_card',
                    template_name: name,
                    orientation: 'vertical',
                    canvas_data: {
                        front: this.frontElements,
                        back: this.backElements
                    }
                };

                const res = await SvppPhpService.saveCanvasTemplate(templateData);
                if (res && res.status === 'success') {
                    alert('Template saved successfully to MySQL database!');
                    this.loadPhpTemplates();
                } else {
                    alert('Error saving template to database.');
                }
            });
        }
    },

    switchSide(side) {
        this.activeSide = side;
        const btnFront = document.getElementById('btnIdCardSideFront');
        const btnBack = document.getElementById('btnIdCardSideBack');
        if (btnFront) btnFront.classList.toggle('active', side === 'front');
        if (btnBack) btnBack.classList.toggle('active', side === 'back');
        this.renderCanvas();
    },

    setZoom(level) {
        this.zoomLevel = Math.min(1.8, Math.max(0.6, parseFloat(level.toFixed(2))));
        if (this.canvasElement) {
            this.canvasElement.style.transform = `scale(${this.zoomLevel})`;
            this.canvasElement.style.transformOrigin = 'top center';
        }
        const zoomLabel = document.getElementById('idCardZoomLabel');
        if (zoomLabel) zoomLabel.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    },

    renderCanvas() {
        if (!this.canvasElement) return;

        const elements = this.activeSide === 'front' ? this.frontElements : this.backElements;

        this.canvasElement.innerHTML = elements.map(el => {
            const isSelected = el.id === this.selectedElementId;
            const ff = el.fontFamily || "'Outfit', sans-serif";
            const tt = el.textTransform || 'none';
            const pill = el.badgePill || 'none';

            let pillBg = 'transparent';
            let pillColor = el.color || '#0f172a';
            let pillPadding = '2px 6px';
            let pillRadius = '4px';

            if (pill === 'navy-pill') { pillBg = '#0F2B5C'; pillColor = '#ffffff'; pillPadding = '4px 10px'; pillRadius = '12px'; }
            else if (pill === 'saffron-pill') { pillBg = '#FF9933'; pillColor = '#ffffff'; pillPadding = '4px 10px'; pillRadius = '12px'; }
            else if (pill === 'gold-pill') { pillBg = '#fbbf24'; pillColor = '#78350f'; pillPadding = '4px 10px'; pillRadius = '12px'; }
            else if (pill === 'dark-pill') { pillBg = '#0f172a'; pillColor = '#ffffff'; pillPadding = '4px 10px'; pillRadius = '12px'; }

            const style = `
                position: absolute;
                left: ${el.x}%;
                top: ${el.y}%;
                font-size: ${el.fontSize || 12}px;
                font-weight: ${el.fontWeight || '600'};
                font-family: ${ff};
                text-transform: ${tt};
                color: ${pillColor};
                background: ${isSelected ? 'rgba(56,189,248,0.3)' : pillBg};
                padding: ${pillPadding};
                border-radius: ${pillRadius};
                border: ${isSelected ? '2px solid #38bdf8' : '1px dashed rgba(37,99,235,0.4)'};
                box-shadow: ${isSelected ? '0 0 10px rgba(56,189,248,0.8)' : 'none'};
                white-space: nowrap;
                cursor: move;
                z-index: ${isSelected ? 20 : 5};
            `;

            return `<div class="id-editor-item" data-id="${el.id}" style="${style}">${el.label || el.tag}</div>`;
        }).join('');

        if (this.showGridGuides) {
            const grid = document.createElement('div');
            grid.style.cssText = 'position: absolute; inset: 0; pointer-events: none; z-index: 100;';
            grid.innerHTML = `
                <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; border-left: 1px dashed rgba(56,189,248,0.7);"></div>
                <div style="position: absolute; left: 0; right: 0; top: 50%; height: 1px; border-top: 1px dashed rgba(56,189,248,0.7);"></div>
            `;
            this.canvasElement.appendChild(grid);
        }
    },

    async loadPhpTemplates() {
        const res = await SvppPhpService.getCanvasTemplates('id_card');
        const selectEl = document.getElementById('selectPhpTemplate');
        if (selectEl && res && res.data) {
            selectEl.innerHTML = '<option value="">-- Load Saved Template (MySQL) --</option>' + 
                res.data.map(t => `<option value="${t.id}">${t.template_name} (${t.created_at || 'Saved'})</option>`).join('');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    IdCardEditorEngine.init();
});
