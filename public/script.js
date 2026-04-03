// ============================================================
// КОНФИГУРАЦИЯ API - АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ URL
// ============================================================

// Определяем базовый URL в зависимости от окружения
const getBaseUrl = () => {
    // На Render или любом другом хостинге
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return ''; // Пустая строка = используем текущий домен
    }
    // Локальная разработка
    return 'http://localhost:3000';
};

const API_BASE = getBaseUrl();

// Универсальная функция запросов
async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// ============================================================
// API МЕТОДЫ
// ============================================================

const API = {
    // Статистика
    async getStats() {
        return request('/api/stats');
    },
    
    // Работы
    async getWorks(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/api/works${query ? `?${query}` : ''}`);
    },
    
    async getWork(id) {
        return request(`/api/works/${id}`);
    },
    
    async createWork(data) {
        return request('/api/works', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async updateWork(id, data) {
        return request(`/api/works/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async deleteWork(id) {
        return request(`/api/works/${id}`, {
            method: 'DELETE'
        });
    },
    
    async voteWork(id, value) {
        return request(`/api/works/${id}/vote`, {
            method: 'POST',
            body: JSON.stringify({ value })
        });
    },
    
    downloadWorkUrl(id) {
        return `${API_BASE}/api/works/${id}/download`;
    },
    
    // Категории
    async getCategories(activeOnly = true) {
        return request(`/api/categories${activeOnly ? '?active=true' : ''}`);
    },
    
    async addCategory(data) {
        return request('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async updateCategory(id, data) {
        return request(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async deleteCategory(id) {
        return request(`/api/categories/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Расписание
    async getSchedule() {
        return request('/api/schedule');
    },
    
    async addScheduleItem(data) {
        return request('/api/schedule', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async deleteScheduleItem(id) {
        return request(`/api/schedule/${id}`, {
            method: 'DELETE'
        });
    },
    
    // Календарь
    async getCalendarEvents(year, month) {
        return request(`/api/calendar?year=${year}&month=${month}`);
    },
    
    // Пользователи (админ)
    async getUsers() {
        return request('/api/users');
    },
    
    async warnUser(id) {
        return request(`/api/users/${id}/warn`, {
            method: 'POST'
        });
    },
    
    async banUser(id) {
        return request(`/api/users/${id}/ban`, {
            method: 'POST'
        });
    },
    
    async unbanUser(id) {
        return request(`/api/users/${id}/unban`, {
            method: 'POST'
        });
    },
    
    // Уведомления
    async getNotifications() {
        return request('/api/notifications');
    },
    
    async markNotificationAsRead(id) {
        return request(`/api/notifications/${id}/read`, {
            method: 'POST'
        });
    },
    
    async clearNotifications() {
        return request('/api/notifications', {
            method: 'DELETE'
        });
    },
    
    // Авторизация (админ)
    async adminLogin(password) {
        return request('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
    },
    
    // Экспорт
    async exportAll() {
        return request('/api/export');
    }
};

// ============================================================
// УТИЛИТЫ
// ============================================================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Б';
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / 1048576).toFixed(1) + ' МБ';
}

function getStatusText(status) {
    const statuses = {
        'pending': '⏳ На модерации',
        'approved': '✅ Одобрено',
        'rejected': '❌ Отклонено'
    };
    return statuses[status] || status;
}

function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return classes[status] || '';
}

function showToast(message, type = 'info') {
    // Создаём toast уведомление
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// ОСНОВНАЯ ЛОГИКА САЙТА
// ============================================================

// Состояние приложения
let currentUser = null;
let currentPage = 1;
let worksCache = {};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Приложение запущено');
    console.log('📍 API URL:', API_BASE || '(текущий домен)');
    
    await loadCategories();
    await loadStats();
    await loadRecentWorks();
    await loadSchedule();
    await loadCalendar();
    await loadNotifications();
    startAutoRefresh();
    setupEventListeners();
});

// Загрузка категорий
async function loadCategories() {
    try {
        const categories = await API.getCategories(true);
        const container = document.getElementById('categories-list');
        
        if (container) {
            container.innerHTML = categories.map(cat => `
                <button class="category-btn" data-category="${cat.name}">
                    <span class="category-icon">${cat.icon}</span>
                    <span class="category-name">${escapeHtml(cat.name)}</span>
                </button>
            `).join('');
        }
        
        return categories;
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        return [];
    }
}

// Загрузка статистики
async function loadStats() {
    try {
        const stats = await API.getStats();
        
        const elements = {
            'total-works': stats.totalWorks,
            'total-users': stats.totalUsers,
            'works-today': stats.worksToday || 0,
            'votes-total': stats.totalVotes || 0
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
        
        return stats;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        return null;
    }
}

// Загрузка последних работ
async function loadRecentWorks(limit = 8) {
    try {
        const works = await API.getWorks({ limit, status: 'approved' });
        const container = document.getElementById('recent-works');
        
        if (container) {
            if (works.length === 0) {
                container.innerHTML = '<div class="no-works">Пока нет работ 😔</div>';
                return;
            }
            
            container.innerHTML = works.map(work => `
                <div class="work-card" data-id="${work._id}">
                    <h3 class="work-title">${escapeHtml(work.title)}</h3>
                    <div class="work-meta">
                        <span class="work-author">👤 ${escapeHtml(work.nickname)}</span>
                        <span class="work-category">${escapeHtml(work.category || 'Без рубрики')}</span>
                    </div>
                    <div class="work-stats">
                        <span class="work-votes">⭐ ${work.votes || 0}</span>
                        <span class="work-date">📅 ${formatDate(work.date)}</span>
                    </div>
                    <button class="view-work-btn" onclick="viewWork('${work._id}')">Подробнее</button>
                </div>
            `).join('');
        }
        
        return works;
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
        return [];
    }
}

// Загрузка расписания
async function loadSchedule() {
    try {
        const schedule = await API.getSchedule();
        const container = document.getElementById('schedule-list');
        
        if (container) {
            if (schedule.length === 0) {
                container.innerHTML = '<div class="no-schedule">Нет запланированных событий</div>';
                return;
            }
            
            container.innerHTML = schedule.map(item => `
                <div class="schedule-item ${item.isLive ? 'live' : ''}">
                    <div class="schedule-day">${escapeHtml(item.day)}</div>
                    <div class="schedule-time">${escapeHtml(item.time)}</div>
                    <div class="schedule-title">${escapeHtml(item.title)}</div>
                    ${item.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                </div>
            `).join('');
        }
        
        return schedule;
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        return [];
    }
}

// Загрузка календаря
async function loadCalendar(year = null, month = null) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    
    try {
        const events = await API.getCalendarEvents(targetYear, targetMonth);
        const container = document.getElementById('calendar-grid');
        
        if (container) {
            // Генерация календаря
            const firstDay = new Date(targetYear, targetMonth - 1, 1);
            const lastDay = new Date(targetYear, targetMonth, 0);
            const daysInMonth = lastDay.getDate();
            const startWeekday = firstDay.getDay() || 7;
            
            let html = '<div class="calendar-header">';
            html += `<button onclick="prevMonth()">◀</button>`;
            html += `<h3>${firstDay.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</h3>`;
            html += `<button onclick="nextMonth()">▶</button>`;
            html += `</div><div class="calendar-weekdays">`;
            
            const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
            weekdays.forEach(day => {
                html += `<div class="weekday">${day}</div>`;
            });
            html += `</div><div class="calendar-days">`;
            
            // Пустые ячейки
            for (let i = 1; i < startWeekday; i++) {
                html += `<div class="calendar-day empty"></div>`;
            }
            
            // Дни месяца
            for (let day = 1; day <= daysInMonth; day++) {
                const hasEvent = events.some(e => new Date(e.date).getDate() === day);
                html += `<div class="calendar-day ${hasEvent ? 'has-event' : ''}" data-day="${day}">
                            ${day}
                            ${hasEvent ? '<span class="event-dot"></span>' : ''}
                         </div>`;
            }
            
            html += `</div>`;
            container.innerHTML = html;
        }
        
        return events;
    } catch (error) {
        console.error('Ошибка загрузки календаря:', error);
        return [];
    }
}

// Просмотр работы
window.viewWork = async function(id) {
    try {
        const work = await API.getWork(id);
        const modal = document.getElementById('work-modal');
        
        if (modal) {
            document.getElementById('modal-title').textContent = work.title;
            document.getElementById('modal-body').innerHTML = `
                <div class="modal-work-info">
                    <p><strong>Автор:</strong> ${escapeHtml(work.nickname)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(work.email)}</p>
                    <p><strong>Рубрика:</strong> ${escapeHtml(work.category || '—')}</p>
                    <p><strong>Описание:</strong> ${escapeHtml(work.description || '—')}</p>
                    ${work.link ? `<p><strong>Ссылка:</strong> <a href="${work.link}" target="_blank">${escapeHtml(work.link)}</a></p>` : ''}
                    ${work.fileName ? `<p><strong>Файл:</strong> ${escapeHtml(work.fileName)} (${formatFileSize(work.fileSize)})</p>` : ''}
                    <p><strong>Голосов:</strong> ${work.votes || 0}</p>
                    <p><strong>Статус:</strong> ${getStatusText(work.status)}</p>
                    <p><strong>Дата:</strong> ${formatDateTime(work.date)}</p>
                </div>
            `;
            
            modal.style.display = 'flex';
            
            // Кнопки действий
            const actions = document.getElementById('modal-actions');
            if (actions) {
                actions.innerHTML = `
                    ${work.fileName ? `<button onclick="downloadWork('${id}')" class="btn-download">⬇️ Скачать</button>` : ''}
                    <button onclick="voteWork('${id}', 1)" class="btn-vote">⭐ Голосовать</button>
                    <button onclick="closeModal()" class="btn-close">Закрыть</button>
                `;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки работы:', error);
        showToast('Не удалось загрузить работу', 'error');
    }
};

// Голосование
window.voteWork = async function(id, value) {
    try {
        await API.voteWork(id, value);
        showToast('Голос учтён!', 'success');
        await loadRecentWorks();
    } catch (error) {
        console.error('Ошибка голосования:', error);
        showToast('Не удалось проголосовать', 'error');
    }
};

// Скачивание
window.downloadWork = function(id) {
    window.open(API.downloadWorkUrl(id), '_blank');
};

// Закрытие модального окна
window.closeModal = function() {
    const modal = document.getElementById('work-modal');
    if (modal) modal.style.display = 'none';
};

// Загрузка уведомлений
async function loadNotifications() {
    try {
        const notifications = await API.getNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notifications-badge');
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        return notifications;
    } catch (error) {
        console.error('Ошибка загрузки уведомлений:', error);
        return [];
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка уведомлений
    const notifBtn = document.getElementById('notifications-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', showNotificationsPanel);
    }
    
    // Кнопки навигации
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
        });
    });
    
    // Форма добавления работы
    const workForm = document.getElementById('add-work-form');
    if (workForm) {
        workForm.addEventListener('submit', submitWork);
    }
    
    // Поиск
    const searchInput = document.getElementById('search-works');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 500));
    }
}

// Показ страницы
function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const activePage = document.getElementById(`page-${pageName}`);
    if (activePage) {
        activePage.classList.add('active');
    }
    
    // Обновляем активную ссылку
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });
    
    // Загружаем данные для страницы
    if (pageName === 'works') {
        loadAllWorks();
    } else if (pageName === 'rating') {
        loadRating();
    }
}

// Загрузка всех работ
async function loadAllWorks(page = 1, category = 'all', search = '') {
    try {
        const params = { page, limit: 12 };
        if (category !== 'all') params.category = category;
        if (search) params.search = search;
        
        const works = await API.getWorks(params);
        const container = document.getElementById('all-works');
        
        if (container) {
            if (works.length === 0) {
                container.innerHTML = '<div class="no-works">Работ не найдено</div>';
                return;
            }
            
            container.innerHTML = works.map(work => `
                <div class="work-card">
                    <h3>${escapeHtml(work.title)}</h3>
                    <p>Автор: ${escapeHtml(work.nickname)}</p>
                    <p>⭐ ${work.votes || 0}</p>
                    <button onclick="viewWork('${work._id}')">Подробнее</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
    }
}

// Загрузка рейтинга
async function loadRating() {
    try {
        const works = await API.getWorks({ sort: '-votes', limit: 20 });
        const container = document.getElementById('rating-list');
        
        if (container) {
            if (works.length === 0) {
                container.innerHTML = '<div class="no-rating">Нет работ для рейтинга</div>';
                return;
            }
            
            container.innerHTML = works.map((work, index) => `
                <div class="rating-item">
                    <div class="rating-place">${index + 1}</div>
                    <div class="rating-info">
                        <div class="rating-title">${escapeHtml(work.title)}</div>
                        <div class="rating-author">${escapeHtml(work.nickname)}</div>
                    </div>
                    <div class="rating-votes">⭐ ${work.votes || 0}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки рейтинга:', error);
    }
}

// Отправка работы
async function submitWork(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const workData = {
        nickname: formData.get('nickname'),
        email: formData.get('email'),
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        link: formData.get('link')
    };
    
    try {
        await API.createWork(workData);
        showToast('Работа отправлена на модерацию!', 'success');
        e.target.reset();
        closeModal();
    } catch (error) {
        console.error('Ошибка отправки:', error);
        showToast('Ошибка при отправке', 'error');
    }
}

// Показать панель уведомлений
async function showNotificationsPanel() {
    const notifications = await loadNotifications();
    const panel = document.getElementById('notifications-panel');
    
    if (panel) {
        if (notifications.length === 0) {
            panel.innerHTML = '<div class="no-notifications">Нет уведомлений</div>';
        } else {
            panel.innerHTML = notifications.map(n => `
                <div class="notification ${n.read ? 'read' : 'unread'}" data-id="${n._id}">
                    <div class="notification-title">${escapeHtml(n.title)}</div>
                    <div class="notification-text">${escapeHtml(n.message)}</div>
                    <div class="notification-date">${formatDate(n.createdAt)}</div>
                </div>
            `).join('');
        }
        
        panel.style.display = 'block';
        setTimeout(() => {
            panel.style.display = 'none';
        }, 5000);
    }
}

// Поиск с debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function handleSearch(e) {
    const searchTerm = e.target.value;
    await loadAllWorks(1, 'all', searchTerm);
}

// Навигация по месяцам календаря
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

window.prevMonth = function() {
    if (currentMonth === 1) {
        currentMonth = 12;
        currentYear--;
    } else {
        currentMonth--;
    }
    loadCalendar(currentYear, currentMonth);
};

window.nextMonth = function() {
    if (currentMonth === 12) {
        currentMonth = 1;
        currentYear++;
    } else {
        currentMonth++;
    }
    loadCalendar(currentYear, currentMonth);
};

// Автообновление
let refreshInterval;

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        loadStats();
        loadNotifications();
    }, 30000); // Каждые 30 секунд
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ============================================================
// ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ДЛЯ ТОСТОВ И АНИМАЦИЙ
// ============================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .toast-info { background: #3b82f6; }
    .toast-success { background: #10b981; }
    .toast-error { background: #dc2626; }
    
    .notification {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
        cursor: pointer;
    }
    
    .notification.unread {
        background: #eff6ff;
    }
    
    .notification:hover {
        background: #f3f4f6;
    }
`;

document.head.appendChild(style);

// Экспорт для использования в других файлах
window.API = API;
window.showToast = showToast;
window.viewWork = viewWork;
window.voteWork = voteWork;
window.downloadWork = downloadWork;
window.closeModal = closeModal;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;

console.log('✅ script.js загружен и настроен');
