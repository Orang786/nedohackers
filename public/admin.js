// ================================================================
// ADMIN.JS — Админ-панель (с встроенным API)
// ================================================================

// ===== ВСТРОЕННЫЙ API МОДУЛЬ =====
window.API = (function() {
    // Автоматическое определение URL
    var BASE = (function() {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return '';
        }
        return 'http://localhost:3000';
    })();

    function request(method, path, body, isFormData) {
        var opts = { method: method, headers: {} };
        if (body) {
            if (isFormData) {
                opts.body = body;
            } else {
                opts.headers['Content-Type'] = 'application/json';
                opts.body = JSON.stringify(body);
            }
        }
        return fetch(BASE + path, opts).then(function(res) {
            if (!res.ok) {
                return res.json().catch(function() { return {}; }).then(function(err) {
                    throw new Error(err.message || 'HTTP ' + res.status);
                });
            }
            return res.json();
        });
    }

    return {
        getStats: function() { return request('GET', '/api/stats'); },
        getWorks: function(params) {
            params = params || {};
            var parts = [];
            if (params.limit) parts.push('limit=' + params.limit);
            if (params.status) parts.push('status=' + params.status);
            if (params.search) parts.push('search=' + encodeURIComponent(params.search));
            var qs = parts.length ? '?' + parts.join('&') : '';
            return request('GET', '/api/works' + qs);
        },
        getWork: function(id) { return request('GET', '/api/works/' + id); },
        updateWork: function(id, data) { return request('PUT', '/api/works/' + id, data); },
        deleteWork: function(id) { return request('DELETE', '/api/works/' + id); },
        downloadWorkUrl: function(id) { return BASE + '/api/works/' + id + '/download'; },
        getUsers: function() { return request('GET', '/api/admin/users'); },
        warnUser: function(id) { return request('POST', '/api/admin/users/' + id + '/warn'); },
        banUser: function(id) { return request('POST', '/api/admin/users/' + id + '/ban'); },
        unbanUser: function(id) { return request('POST', '/api/admin/users/' + id + '/unban'); },
        getCategories: function(activeOnly) {
            var q = activeOnly ? '?active=true' : '';
            return request('GET', '/api/categories' + q);
        },
        addCategory: function(data) { return request('POST', '/api/categories', data); },
        updateCategory: function(id, data) { return request('PUT', '/api/categories/' + id, data); },
        deleteCategory: function(id) { return request('DELETE', '/api/categories/' + id); },
        getSchedule: function() { return request('GET', '/api/schedule'); },
        addScheduleItem: function(data) { return request('POST', '/api/schedule', data); },
        deleteScheduleItem: function(id) { return request('DELETE', '/api/schedule/' + id); },
        adminLogin: function(password) { return request('POST', '/api/admin/login', { password: password }); },
        exportAll: function() { return request('GET', '/api/admin/export'); }
    };
})();

console.log('✅ API загружен, методы:', Object.keys(window.API));

// ===== АВТОРИЗАЦИЯ =====
(function () {
var overlay = document.getElementById('auth-overlay');
var layout = document.getElementById('admin-layout');
var form = document.getElementById('auth-form');
var error = document.getElementById('auth-error');

if (sessionStorage.getItem('nh_admin_auth') === 'true') {
    overlay.style.display = 'none';
    layout.style.display = 'flex';
    initAdmin();
    return;
}

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var pwd = document.getElementById('auth-password').value;
    try {
        await API.adminLogin(pwd);
        sessionStorage.setItem('nh_admin_auth', 'true');
        overlay.style.display = 'none';
        layout.style.display = 'flex';
        initAdmin();
    } catch (err) {
        error.textContent = '❌ Неверный пароль';
    }
});
})();

function initAdmin() {
setupTabs();
setupMobileMenu();
loadDashboard();
loadWorks();
loadUsers();
loadCategories();
loadSchedule();
setupFilters();
setupCategoryForm();
setupScheduleForm();
setupExport();
}

// ===== TABS =====
function setupTabs() {
document.querySelectorAll('.sidebar-link').forEach(function (link) {
link.addEventListener('click', function (e) {
e.preventDefault();
var tab = this.getAttribute('data-tab');
document.querySelectorAll('.sidebar-link').forEach(function (l) { l.classList.remove('active'); });
this.classList.add('active');
document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
document.getElementById('tab-' + tab).classList.add('active');
document.getElementById('sidebar').classList.remove('open');
});
});
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
document.getElementById('mobile-menu-btn').addEventListener('click', function () {
document.getElementById('sidebar').classList.toggle('open');
});
}

// ===== DASHBOARD =====
async function loadDashboard() {
try {
var s = await API.getStats();
document.getElementById('stat-total-works').textContent = s.totalWorks;
document.getElementById('stat-pending').textContent = s.pendingWorks;
document.getElementById('stat-approved').textContent = s.approvedWorks;
document.getElementById('stat-rejected').textContent = s.rejectedWorks;
document.getElementById('stat-users').textContent = s.totalUsers;
document.getElementById('stat-banned').textContent = s.bannedUsers;
document.getElementById('pending-badge').textContent = s.pendingWorks;

    // Последние работы
    var works = await API.getWorks({ limit: 5 });
    var tbody = document.getElementById('dashboard-recent-body');
    tbody.innerHTML = '';

    if (works.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--admin-text-dim);padding:2rem;">Работ пока нет</td></tr>';
        return;
    }

    works.forEach(function (w) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>#' + (w._id || '').slice(-6) + '</td>' +
            '<td>' + esc(w.nickname) + '</td>' +
            '<td>' + esc(w.title) + '</td>' +
            '<td><span class="badge badge-' + w.status + '">' + statusText(w.status) + '</span></td>' +
            '<td>' + formatDate(w.date) + '</td>';
        tbody.appendChild(tr);
    });
} catch (err) {
    console.error('Dashboard error:', err);
}
}

// ===== WORKS =====
async function loadWorks(filterStatus, filterCategory, search) {
try {
var params = {};
if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
if (filterCategory && filterCategory !== 'all') params.category = filterCategory;
if (search) params.search = search;

    var works = await API.getWorks(params);
    var tbody = document.getElementById('works-table-body');
    var emptyEl = document.getElementById('works-empty');
    tbody.innerHTML = '';

    if (works.length === 0) { emptyEl.style.display = 'block'; return; }
    emptyEl.style.display = 'none';

    works.forEach(function (w) {
        var id = w._id;
        var shortId = id.slice(-6);
        var fileHtml = w.fileName
            ? '<span style="color:var(--admin-blue);font-size:0.8rem;">' + esc(w.fileName) + '</span>'
            : '<span style="color:var(--admin-text-dim);">—</span>';

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>#' + shortId + '</td>' +
            '<td>' + esc(w.nickname) + '</td>' +
            '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(w.title) + '</td>' +
            '<td>' + esc(w.category || '—') + '</td>' +
            '<td>' + fileHtml + '</td>' +
            '<td><span class="badge badge-' + w.status + '">' + statusText(w.status) + '</span></td>' +
            '<td>' + formatDate(w.date) + '</td>' +
            '<td>' +
                '<button class="action-btn" onclick="viewWork(\'' + id + '\')">👁️</button>' +
                (w.fileName ? '<button class="action-btn btn-download" onclick="downloadWork(\'' + id + '\')">⬇️</button>' : '') +
                (w.status === 'pending' ? '<button class="action-btn btn-approve" onclick="approveWork(\'' + id + '\')">✅</button><button class="action-btn btn-reject" onclick="rejectWork(\'' + id + '\')">❌</button>' : '') +
                '<button class="action-btn btn-delete" onclick="deleteWorkAdmin(\'' + id + '\')">🗑️</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
} catch (err) {
    console.error('Works error:', err);
}
}

async function viewWork(id) {
try {
var w = await API.getWork(id);
var modal = document.getElementById('work-modal');
document.getElementById('modal-title').textContent = '📄 ' + w.title;

    document.getElementById('modal-body').innerHTML =
        detail('Автор', w.nickname) + detail('Email', w.email) +
        detail('Рубрика', w.category) + detail('Описание', w.description) +
        detail('Ссылка', w.link ? '<a href="' + esc(w.link) + '" target="_blank" style="color:var(--admin-blue);">' + esc(w.link) + '</a>' : 'Нет') +
        detail('Файл', (w.fileName || 'Не прикреплён') + (w.fileSize ? ' (' + formatSize(w.fileSize) + ')' : '')) +
        detail('Голосов', w.votes || 0) +
        detail('Статус', '<span class="badge badge-' + w.status + '">' + statusText(w.status) + '</span>') +
        detail('Дата', formatDate(w.date));

    var actions = document.getElementById('modal-actions');
    actions.innerHTML = '';

    if (w.status === 'pending') {
        actions.innerHTML += '<button class="action-btn btn-approve" onclick="approveWork(\'' + id + '\');closeModal();">✅ Одобрить</button>';
        actions.innerHTML += '<button class="action-btn btn-reject" onclick="rejectWork(\'' + id + '\');closeModal();">❌ Отклонить</button>';
    }
    if (w.fileName) {
        actions.innerHTML += '<button class="action-btn btn-download" onclick="downloadWork(\'' + id + '\')">⬇️ Скачать</button>';
    }
    actions.innerHTML += '<button class="action-btn btn-delete" onclick="deleteWorkAdmin(\'' + id + '\');closeModal();">🗑️ Удалить</button>';

    modal.style.display = 'flex';
    document.getElementById('modal-close').onclick = closeModal;
} catch (err) {
    alert('Ошибка: ' + err.message);
}
}

function closeModal() { document.getElementById('work-modal').style.display = 'none'; }

async function approveWork(id) {
try { await API.updateWork(id, { status: 'approved' }); refreshAll(); } catch (e) { alert(e.message); }
}

async function rejectWork(id) {
try { await API.updateWork(id, { status: 'rejected' }); refreshAll(); } catch (e) { alert(e.message); }
}

async function deleteWorkAdmin(id) {
if (!confirm('Удалить работу?')) return;
try { await API.deleteWork(id); refreshAll(); } catch (e) { alert(e.message); }
}

function downloadWork(id) {
window.open(API.downloadWorkUrl(id), '_blank');
}

// ===== USERS =====
async function loadUsers() {
try {
var users = await API.getUsers();
var tbody = document.getElementById('users-table-body');
var emptyEl = document.getElementById('users-empty');
tbody.innerHTML = '';

    if (users.length === 0) { emptyEl.style.display = 'block'; return; }
    emptyEl.style.display = 'none';

    users.forEach(function (u) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>#' + (u._id || '').slice(-6) + '</td>' +
            '<td>' + esc(u.nickname) + '</td>' +
            '<td>' + esc(u.email) + '</td>' +
            '<td>' + (u.worksCount || 0) + '</td>' +
            '<td>' + (u.warnings || 0) + '</td>' +
            '<td><span class="badge ' + (u.banned ? 'badge-banned' : 'badge-active') + '">' + (u.banned ? 'Бан' : 'Активен') + '</span></td>' +
            '<td>' +
                '<button class="action-btn btn-warn" onclick="warnUserAdmin(\'' + u._id + '\')">⚠️</button>' +
                (u.banned
                    ? '<button class="action-btn btn-unban" onclick="unbanUserAdmin(\'' + u._id + '\')">🔓</button>'
                    : '<button class="action-btn btn-ban" onclick="banUserAdmin(\'' + u._id + '\')">🚫</button>') +
            '</td>';
        tbody.appendChild(tr);
    });
} catch (err) {
    console.error('Users error:', err);
}
}

async function warnUserAdmin(id) {
try { await API.warnUser(id); refreshAll(); } catch (e) { alert(e.message); }
}

async function banUserAdmin(id) {
if (!confirm('Забанить?')) return;
try { await API.banUser(id); refreshAll(); } catch (e) { alert(e.message); }
}

async function unbanUserAdmin(id) {
try { await API.unbanUser(id); refreshAll(); } catch (e) { alert(e.message); }
}

// ===== CATEGORIES =====
async function loadCategories() {
try {
var cats = await API.getCategories();
var tbody = document.getElementById('categories-table-body');
tbody.innerHTML = '';

    cats.forEach(function (c) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>#' + (c._id || '').slice(-6) + '</td>' +
            '<td style="font-size:1.5rem;">' + c.icon + '</td>' +
            '<td>' + esc(c.name) + '</td>' +
            '<td><span class="badge" style="background:rgba(255,255,255,0.05);color:var(--admin-text-dim);border:1px solid var(--admin-border);">' + c.tag + '</span></td>' +
            '<td><span class="badge ' + (c.active ? 'badge-active' : 'badge-rejected') + '">' + (c.active ? 'Да' : 'Нет') + '</span></td>' +
            '<td>' +
                '<button class="action-btn" onclick="toggleCategory(\'' + c._id + '\',' + !c.active + ')">' + (c.active ? '🔴' : '🟢') + '</button>' +
                '<button class="action-btn btn-delete" onclick="deleteCategoryAdmin(\'' + c._id + '\')">🗑️</button>' +
            '</td>';
        tbody.appendChild(tr);
    });

    // Фильтр категорий
    var filterCat = document.getElementById('filter-category');
    if (filterCat) {
        var val = filterCat.value;
        filterCat.innerHTML = '<option value="all">Все рубрики</option>';
        cats.forEach(function (c) {
            filterCat.innerHTML += '<option value="' + c.name + '">' + c.icon + ' ' + c.name + '</option>';
        });
        filterCat.value = val;
    }
} catch (err) {
    console.error('Categories error:', err);
}
}

function setupCategoryForm() {
document.getElementById('add-category-form').addEventListener('submit', async function (e) {
e.preventDefault();
try {
await API.addCategory({
icon: document.getElementById('cat-icon').value.trim(),
name: document.getElementById('cat-name').value.trim(),
tag: document.getElementById('cat-tag').value
});
this.reset();
refreshAll();
} catch (err) { alert(err.message); }
});
}

async function toggleCategory(id, active) {
try { await API.updateCategory(id, { active: active }); refreshAll(); } catch (e) { alert(e.message); }
}

async function deleteCategoryAdmin(id) {
if (!confirm('Удалить категорию?')) return;
try { await API.deleteCategory(id); refreshAll(); } catch (e) { alert(e.message); }
}

// ===== SCHEDULE =====
async function loadSchedule() {
try {
var schedule = await API.getSchedule();
var tbody = document.getElementById('schedule-table-body');
tbody.innerHTML = '';

    schedule.forEach(function (s) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>#' + (s._id || '').slice(-6) + '</td>' +
            '<td>' + esc(s.day) + '</td>' +
            '<td>' + esc(s.title) + '</td>' +
            '<td>' + esc(s.time) + '</td>' +
            '<td>' + (s.isLive ? '<span class="badge badge-live">● LIVE</span>' : '—') + '</td>' +
            '<td>' + (s.date || '—') + '</td>' +
            '<td><button class="action-btn btn-delete" onclick="deleteScheduleAdmin(\'' + s._id + '\')">🗑️</button></td>';
        tbody.appendChild(tr);
    });
} catch (err) {
    console.error('Schedule error:', err);
}
}

function setupScheduleForm() {
document.getElementById('add-schedule-form').addEventListener('submit', async function (e) {
e.preventDefault();
try {
await API.addScheduleItem({
day: document.getElementById('sch-day').value.trim(),
title: document.getElementById('sch-title').value.trim(),
description: document.getElementById('sch-desc').value.trim(),
time: document.getElementById('sch-time').value.trim(),
date: document.getElementById('sch-date').value,
isLive: document.getElementById('sch-live').checked
});
this.reset();
refreshAll();
} catch (err) { alert(err.message); }
});
}

async function deleteScheduleAdmin(id) {
if (!confirm('Удалить событие?')) return;
try { await API.deleteScheduleItem(id); refreshAll(); } catch (e) { alert(e.message); }
}

// ===== FILTERS =====
function setupFilters() {
var status = document.getElementById('filter-status');
var category = document.getElementById('filter-category');
var search = document.getElementById('filter-search');

function apply() {
    loadWorks(status.value, category.value, search.value);
}

status.addEventListener('change', apply);
category.addEventListener('change', apply);

var searchTimeout;
search.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(apply, 300);
});
}

// ===== EXPORT =====
function setupExport() {
var tabDashboard = document.getElementById('tab-dashboard');
if (tabDashboard) {
var exportBtn = document.createElement('button');
exportBtn.className = 'admin-btn btn-add';
exportBtn.textContent = '💾 Экспорт всех данных (JSON)';
exportBtn.style.marginTop = '1rem';
exportBtn.addEventListener('click', async function () {
try {
var data = await API.exportAll();
var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url;
a.download = 'nedohackers-export-' + new Date().toISOString().split('T')[0] + '.json';
a.click();
URL.revokeObjectURL(url);
} catch (e) { alert('Ошибка экспорта: ' + e.message); }
});
tabDashboard.appendChild(exportBtn);
}
}

// ===== REFRESH =====
function refreshAll() {
loadDashboard();
loadWorks(
document.getElementById('filter-status').value,
document.getElementById('filter-category').value,
document.getElementById('filter-search').value
);
loadUsers();
loadCategories();
loadSchedule();
}

// ===== UTILS =====
function esc(str) {
if (!str) return '';
var div = document.createElement('div');
div.textContent = str;
return div.innerHTML;
}

function statusText(s) {
return { pending: '⏳ Ожидает', approved: '✅ Одобрено', rejected: '❌ Отклонено' }[s] || s;
}

function formatDate(d) {
if (!d) return '—';
return new Date(d).toLocaleDateString('ru-RU');
}

function formatSize(bytes) {
if (!bytes) return '0';
if (bytes < 1024) return bytes + ' Б';
if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' КБ';
return (bytes / 1048576).toFixed(1) + ' МБ';
}

function detail(label, value) {
return '<div class="detail-row"><span class="detail-label">' + label + ':</span><span class="detail-value">' + value + '</span></div>';
}
