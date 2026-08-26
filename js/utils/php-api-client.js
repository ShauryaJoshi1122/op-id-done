/**
 * Sardar Vallabhbhai Patel Party (SVPP) Platform
 * Unified Client Utility for PHP & MySQL Backend REST API Endpoints
 */

export const PHP_API_CONFIG = {
    // PHP Base URL relative to domain
    baseUrl: '/php/api',
    isPhpBackendAvailable: true
};

/**
 * Universal PHP REST API Request Helper
 * @param {string} endpoint - API file name (e.g. 'members.php', 'login.php')
 * @param {string} method - HTTP method ('GET', 'POST', 'PUT', 'DELETE')
 * @param {object|null} body - Optional payload object
 * @param {object|null} queryParams - Optional URL search params
 */
export async function callPhpApi(endpoint, method = 'GET', body = null, queryParams = null) {
    try {
        let url = `${PHP_API_CONFIG.baseUrl}/${endpoint}`;

        if (queryParams) {
            const search = new URLSearchParams(queryParams).toString();
            url += `?${search}`;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            method: method.toUpperCase(),
            headers
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[PHP API ${endpoint}] Server returned status ${response.status}:`, errorText);
            return {
                status: 'error',
                code: response.status,
                message: `Server returned HTTP ${response.status}`,
                data: null
            };
        }

        const json = await response.json();
        return json;
    } catch (err) {
        console.warn(`[PHP API ${endpoint}] Network or parse exception:`, err);
        return {
            status: 'error',
            message: err.message || 'PHP API endpoint unreachable',
            data: null
        };
    }
}

/**
 * PHP & MySQL API Client Wrapper Services
 */
export const SvppPhpService = {
    // 1. Members Service
    async getMembers(search = '') {
        const query = search ? { search } : null;
        return await callPhpApi('members.php', 'GET', null, query);
    },

    async getMemberByIdentifier(identifier) {
        return await callPhpApi('members.php', 'GET', null, { member_number: identifier });
    },

    async createMember(memberData) {
        return await callPhpApi('members.php', 'POST', memberData);
    },

    async updateMember(id, updateData) {
        return await callPhpApi('members.php', 'PUT', { id, ...updateData });
    },

    // 2. Authentication Service
    async loginAdmin(email, password) {
        return await callPhpApi('login.php', 'POST', { type: 'admin', email, password });
    },

    async verifyMemberLogin(identifier) {
        return await callPhpApi('login.php', 'POST', { type: 'member', identifier });
    },

    // 3. Applications Service
    async submitMembershipApplication(appData) {
        return await callPhpApi('applications.php', 'POST', appData);
    },

    async getPendingApplications() {
        return await callPhpApi('applications.php', 'GET', null, { status: 'pending' });
    },

    async updateApplicationStatus(id, action) {
        return await callPhpApi('applications.php', 'PUT', { id, action });
    },

    // 4. Grievances Service
    async submitGrievance(grievanceData) {
        return await callPhpApi('grievances.php', 'POST', grievanceData);
    },

    async getGrievanceByTicket(problemNumber) {
        return await callPhpApi('grievances.php', 'GET', null, { problem_number: problemNumber });
    },

    // 5. Digital ID Cards Service
    async verifyDigitalCard(cardNumberOrMemberId) {
        return await callPhpApi('cards.php', 'GET', null, { card_number: cardNumberOrMemberId });
    },

    async issueCard(memberId) {
        return await callPhpApi('cards.php', 'POST', { member_id: memberId });
    },

    // 6. Appointment Letters Service
    async issueAppointmentLetter(letterData) {
        return await callPhpApi('appointment_letters.php', 'POST', letterData);
    },

    async getAppointmentLetter(refNumber) {
        return await callPhpApi('appointment_letters.php', 'GET', null, { ref_number: refNumber });
    },

    // 7. Settings Service
    async getSettings() {
        return await callPhpApi('settings.php', 'GET');
    },

    async updateSettings(settingsData) {
        return await callPhpApi('settings.php', 'POST', settingsData);
    },

    // 8. Editor Canvas Templates Service (MySQL)
    async getCanvasTemplates(editorType = 'id_card') {
        return await callPhpApi('editors.php', 'GET', null, { editor_type: editorType });
    },

    async saveCanvasTemplate(templateData) {
        return await callPhpApi('editors.php', 'POST', templateData);
    },

    async deleteCanvasTemplate(id) {
        return await callPhpApi('editors.php', 'DELETE', null, { id });
    }
};
