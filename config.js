// config.js
const API_CONFIG = {
    // Автоматически определяем базовый URL
    baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'  // Локальная разработка
        : 'https://ваш-проект.onrender.com',  // Замените на ваш Render URL
    
    // Или можно так (если API на том же домене)
    // baseURL: ''
};

// Ваш API объект
const API = {
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.baseURL}${endpoint}`;
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },
    
    // Методы API
    async getStats() {
        return this.request('/api/stats');
    },
    
    async getWorks(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/works${query ? `?${query}` : ''}`);
    },
    
    async getWork(id) {
        return this.request(`/api/works/${id}`);
    },
    
    async updateWork(id, data) {
        return this.request(`/api/works/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async deleteWork(id) {
        return this.request(`/api/works/${id}`, {
            method: 'DELETE'
        });
    },
    
    async getCategories() {
        return this.request('/api/categories');
    },
    
    async getSchedule() {
        return this.request('/api/schedule');
    },
    
    async getNotifications() {
        return this.request('/api/notifications');
    },
    
    async clearNotifications() {
        return this.request('/api/notifications', {
            method: 'DELETE'
        });
    },
    
    downloadWorkUrl(id) {
        return `${API_CONFIG.baseURL}/api/works/${id}/download`;
    },
    
    // Добавьте остальные методы...
};

// Экспортируем
window.API = API;
