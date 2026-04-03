// ================================================================
//  NEDOHACKERS — SCRIPT.JS (API версия)
//  Все вызовы идут на сервер через fetch
// ================================================================

// ================================================================
//  API MODULE — обёртка над fetch-запросами к серверу
// ================================================================
var API = (function () {

    // ← АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ URL (работает везде!)
    var BASE = (function() {
        // На Render или любом другом хостинге
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return ''; // Пустая строка = используем текущий домен
        }
        // Локальная разработка
        return 'http://localhost:3000';
    })();

    // ---------- helpers ----------
    function getVisitorId() {
        var id = localStorage.getItem('nh_visitor_id');
        if (!id) {
            id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem('nh_visitor_id', id);
        }
        return id;
    }

    function request(method, path, body, isFormData) {
        var opts = { method: method, headers: {} };

        if (body) {
            if (isFormData) {
                // FormData — браузер сам поставит Content-Type с boundary
                opts.body = body;
            } else {
                opts.headers['Content-Type'] = 'application/json';
                opts.body = JSON.stringify(body);
            }
        }

        return fetch(BASE + path, opts).then(function (res) {
            if (!res.ok) {
                return res.json().catch(function () { return {}; }).then(function (err) {
                    throw new Error(err.message || 'HTTP ' + res.status);
                });
            }
            return res.json();
        });
    }

    // ---------- public API ----------
    return {
        getVisitorId: getVisitorId,

        // Статистика
        getStats: function () {
            return request('GET', '/api/stats');
        },

        // Категории
        getCategories: function (activeOnly) {
            var q = activeOnly ? '?active=true' : '';
            return request('GET', '/api/categories' + q);
        },

        // Расписание
        getSchedule: function () {
            return request('GET', '/api/schedule');
        },

        // Работы  (params: { limit, status, search })
        getWorks: function (params) {
            params = params || {};
            var parts = [];
            if (params.limit)  parts.push('limit='  + params.limit);
            if (params.status) parts.push('status=' + params.status);
            if (params.search) parts.push('search=' + encodeURIComponent(params.search));
            var qs = parts.length ? '?' + parts.join('&') : '';
            return request('GET', '/api/works' + qs);
        },

        // Создать работу (FormData с файлом)
        createWork: function (formData) {
            return request('POST', '/api/works', formData, true);
        },

        // Голосование
        voteWork: function (workId, visitorId) {
            return request('POST', '/api/works/' + workId + '/vote', { visitorId: visitorId });
        },

        // Профиль
        getProfile: function (nickname) {
            return request('GET', '/api/profile/' + encodeURIComponent(nickname));
        },

        // Проверка бана
        checkBan: function (nickname) {
            return request('GET', '/api/ban/' + encodeURIComponent(nickname));
        },

        // Streak
        updateStreak: function (nickname) {
            return request('POST', '/api/streak/' + encodeURIComponent(nickname));
        },

        // Календарь
        getCalendarEvents: function (year, month) {
            return request('GET', '/api/calendar?year=' + year + '&month=' + month);
        },

        // Уведомления
        getNotifications: function () {
            return request('GET', '/api/notifications');
        },

        clearNotifications: function () {
            return request('DELETE', '/api/notifications');
        }
    };
})();

// ============================================================
//  УТИЛИТЫ
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU');
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Б';
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

function timeAgo(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'сейчас';
    if (mins < 60) return mins + ' мин';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' ч';
    return Math.floor(hours / 24) + ' дн';
}

// Сохранение текущего ника (используется как "сессия")
function getCurrentNickname() {
    return localStorage.getItem('nh_current_nickname') || '';
}

function setCurrentNickname(name) {
    localStorage.setItem('nh_current_nickname', name);
}


// ============================================================
//  1. PRELOADER
// ============================================================
window.addEventListener('load', function () {
    setTimeout(function () {
        var preloader = document.getElementById('preloader');
        if (preloader) preloader.classList.add('hidden');
    }, 3000);
});


// ============================================================
//  2. MATRIX RAIN
// ============================================================
(function () {
    var canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var chars = 'アイウエオカキクケコNEDOHACKERS01{}[];:<>!@#$%^&*';
    var fontSize = 14;
    var columns = Math.floor(canvas.width / fontSize);
    var drops = [];
    for (var i = 0; i < columns; i++) drops[i] = 1;

    function draw() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        var color = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#00ff41';
        ctx.fillStyle = color;
        ctx.font = fontSize + 'px monospace';
        for (var i = 0; i < drops.length; i++) {
            var text = chars[Math.floor(Math.random() * chars.length)];
            ctx.globalAlpha = Math.random() * 0.5 + 0.1;
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            ctx.globalAlpha = 1;
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(draw, 45);

    window.addEventListener('resize', function () {
        columns = Math.floor(canvas.width / fontSize);
        drops = [];
        for (var i = 0; i < columns; i++) drops[i] = 1;
    });
})();


// ============================================================
//  3. SCROLL PROGRESS
// ============================================================
(function () {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        if (h > 0) bar.style.width = (window.scrollY / h * 100) + '%';
    });
})();


// ============================================================
//  4. CUSTOM CURSOR
// ============================================================
(function () {
    if (window.innerWidth <= 768) return;
    var cursor = document.getElementById('custom-cursor');
    var dot = document.getElementById('custom-cursor-dot');
    if (!cursor || !dot) return;

    document.addEventListener('mousemove', function (e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
    });

    function bind() {
        document.querySelectorAll('a,button,input,textarea,select,.category-card,.schedule-card,.link-card,.faq-item,.stat-item,.terminal-toggle,.chat-toggle,.theme-btn,.podium-card,.countdown-item,.step-item,.recent-item,.cal-day,.file-upload-area,.vote-btn,.blog-card,.timeline-content,.achievement').forEach(function (el) {
            el.addEventListener('mouseenter', function () { cursor.classList.add('hover'); });
            el.addEventListener('mouseleave', function () { cursor.classList.remove('hover'); });
        });
    }

    document.addEventListener('mousedown', function () { cursor.classList.add('click'); });
    document.addEventListener('mouseup', function () { cursor.classList.remove('click'); });

    bind();
    new MutationObserver(bind).observe(document.body, { childList: true, subtree: true });
})();


// ============================================================
//  5. SCROLL REVEAL
// ============================================================
(function () {
    var selectors = '.section-header,.category-card,.schedule-card,.link-card,.faq-item,.stat-item,.submit-form,.countdown-timer,.podium-card,.leaderboard,.step-item,.calendar-wrapper,.recent-works,.profile-card,.voting-card,.timeline-item,.blog-card';

    function addClasses() {
        document.querySelectorAll(selectors).forEach(function (el) {
            if (!el.classList.contains('reveal')) el.classList.add('reveal');
        });
    }

    function check() {
        var windowH = window.innerHeight;
        var delay = 0;
        document.querySelectorAll('.reveal').forEach(function (el) {
            if (el.getBoundingClientRect().top < windowH - 80 && !el.classList.contains('visible')) {
                delay += 50;
                setTimeout(function () { el.classList.add('visible'); }, delay);
            }
        });
    }

    window.addEventListener('scroll', function () { addClasses(); check(); });
    window.addEventListener('load', function () { setTimeout(function () { addClasses(); check(); }, 3200); });
})();


// ============================================================
//  6. TOAST NOTIFICATIONS
// ============================================================
function showToast(type, title, message) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span><div class="toast-content"><h4>' + title + '</h4><p>' + message + '</p></div>';
    container.appendChild(toast);
    setTimeout(function () {
        toast.classList.add('toast-hiding');
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, 400);
    }, 4000);
}

window.addEventListener('load', function () {
    setTimeout(function () { showToast('info', '👋 Добро пожаловать!', 'Открой терминал (⌨) и введи help'); }, 3500);
});


// ============================================================
//  7. LIVE STATS FROM API
// ============================================================
(function () {
    function update() {
        API.getStats().then(function (s) {
            var el = function (id) { return document.getElementById(id); };
            if (el('live-works')) el('live-works').textContent = s.totalWorks;
            if (el('live-users')) el('live-users').textContent = s.totalUsers;
            if (el('live-approved')) el('live-approved').textContent = s.approvedWorks;
        }).catch(function () {});
    }

    window.addEventListener('load', function () { setTimeout(update, 3300); });
    setInterval(update, 5000);
})();


// ============================================================
//  8. DYNAMIC CATEGORIES FROM API
// ============================================================
(function () {
    function render() {
        API.getCategories(true).then(function (cats) {
            var grid = document.getElementById('categories-grid');
            var select = document.getElementById('category');
            if (!grid) return;

            grid.innerHTML = '';
            cats.forEach(function (c) {
                var card = document.createElement('div');
                card.className = 'category-card';
                card.innerHTML = '<span class="category-icon">' + c.icon + '</span><h3>' + escapeHtml(c.name) + '</h3><span class="category-tag tag-' + c.tag + '">' + c.tag + '</span>';
                grid.appendChild(card);
            });

            if (select) {
                var cur = select.value;
                select.innerHTML = '<option value="" disabled selected>Выбери рубрику...</option>';
                cats.forEach(function (c) {
                    var opt = document.createElement('option');
                    opt.value = c.name;
                    opt.textContent = c.icon + ' ' + c.name;
                    select.appendChild(opt);
                });
                if (cur) select.value = cur;
            }
        }).catch(function () {});
    }

    window.addEventListener('load', function () { setTimeout(render, 3300); });
    window.addEventListener('focus', render);
    window.renderCategories = render;
})();


// ============================================================
//  9. DYNAMIC SCHEDULE FROM API
// ============================================================
(function () {
    function render() {
        API.getSchedule().then(function (schedule) {
            var grid = document.getElementById('schedule-grid');
            if (!grid) return;
            grid.innerHTML = '';

            if (schedule.length === 0) {
                grid.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;grid-column:1/-1;">Расписание пока не заполнено</p>';
                return;
            }

            schedule.forEach(function (s) {
                var card = document.createElement('div');
                card.className = 'schedule-card';
                card.innerHTML =
                    '<div class="schedule-date"><span class="date-badge">' + escapeHtml(s.day) + '</span>' +
                    (s.isLive ? '<span class="live-badge">● LIVE</span>' : '') + '</div>' +
                    '<h3>' + escapeHtml(s.title) + '</h3>' +
                    '<p>' + escapeHtml(s.description) + '</p>' +
                    '<span class="schedule-time">' + escapeHtml(s.time) + '</span>';
                grid.appendChild(card);
            });
        }).catch(function () {});
    }

    window.addEventListener('load', function () { setTimeout(render, 3300); });
    window.addEventListener('focus', render);
    window.renderSchedule = render;
})();


// ============================================================
//  10. FILE UPLOAD (Drag & Drop)
// ============================================================
(function () {
    var area = document.getElementById('file-upload-area');
    var input = document.getElementById('file-input');
    var content = document.getElementById('file-upload-content');
    var preview = document.getElementById('file-upload-preview');
    var nameEl = document.getElementById('file-name');
    var sizeEl = document.getElementById('file-size');
    var removeBtn = document.getElementById('file-remove');
    if (!area || !input) return;

    var allowedExt = ['.py','.js','.c','.cpp','.h','.rs','.go','.zip','.rar','.7z','.tar','.gz','.txt','.md','.json','.html','.css','.sh','.bat','.rb','.java','.kt'];
    var maxSize = 150 * 1024 * 1024;

    area.addEventListener('dragover', function (e) { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', function () { area.classList.remove('dragover'); });
    area.addEventListener('drop', function (e) {
        e.preventDefault(); area.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', function () { if (this.files.length) handleFile(this.files[0]); });
    removeBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); clearFile(); });

    function handleFile(file) {
        if (file.size > maxSize) { showToast('error', '❌ Слишком большой', 'Макс. 5 МБ'); return; }
        var ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExt.includes(ext)) { showToast('error', '❌ Недопустимый формат', 'Разрешены: ' + allowedExt.join(', ')); return; }

        nameEl.textContent = file.name;
        sizeEl.textContent = formatFileSize(file.size);
        content.style.display = 'none';
        preview.style.display = 'flex';
        showToast('success', '📎 Файл прикреплён', file.name);
    }

    function clearFile() {
        input.value = '';
        content.style.display = '';
        preview.style.display = 'none';
    }

    window.clearUploadedFile = clearFile;
})();


// ============================================================
//  11. FORM SUBMISSION (через API + FormData)
// ============================================================
(function () {
    var form = document.getElementById('submit-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var nickname = document.getElementById('nickname').value.trim();
        var email = document.getElementById('email').value.trim();
        var category = document.getElementById('category').value;
        var title = document.getElementById('work-title').value.trim();
        var description = document.getElementById('description').value.trim();
        var link = document.getElementById('link').value.trim();
        var fileInput = document.getElementById('file-input');

        if (!nickname) { showToast('error', '❌', 'Введи никнейм'); return; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('error', '❌', 'Введи корректный email'); return; }
        if (!category) { showToast('error', '❌', 'Выбери рубрику'); return; }
        if (!title) { showToast('error', '❌', 'Введи название'); return; }
        if (!description) { showToast('error', '❌', 'Добавь описание'); return; }
        if (!link && (!fileInput || !fileInput.files.length)) { showToast('warning', '⚠️', 'Добавь ссылку или файл'); return; }

        // Проверка бана
        try {
            var banCheck = await API.checkBan(nickname);
            if (banCheck.banned) {
                showToast('error', '🚫 Заблокирован', 'Аккаунт "' + nickname + '" забанен');
                return;
            }
        } catch (err) {}

        // FormData для отправки с файлом
        var formData = new FormData();
        formData.append('nickname', nickname);
        formData.append('email', email);
        formData.append('category', category);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('link', link);

        if (fileInput && fileInput.files.length) {
            formData.append('file', fileInput.files[0]);
        }

        try {
            var work = await API.createWork(formData);
            showToast('success', '🚀 Отправлено!', 'Спасибо, ' + nickname + '! Работа #' + (work._id || '').slice(-6));

            setCurrentNickname(nickname);
            form.reset();
            if (window.clearUploadedFile) window.clearUploadedFile();

            renderRecentWorks();
            if (window.renderProfile) window.renderProfile();
        } catch (err) {
            showToast('error', '❌ Ошибка', err.message || 'Не удалось отправить');
        }
    });
})();


// ============================================================
//  12. RECENT WORKS
// ============================================================
async function renderRecentWorks() {
    var list = document.getElementById('recent-list');
    if (!list) return;

    try {
        var works = await API.getWorks({ limit: 8 });
        list.innerHTML = '';

        if (works.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;">Работ пока нет. Стань первым! 🚀</p>';
            return;
        }

        works.forEach(function (w) {
            var statusLabels = { pending: '⏳ Ожидает', approved: '✅ Одобрено', rejected: '❌ Отклонено' };
            var item = document.createElement('div');
            item.className = 'recent-item';
            item.innerHTML =
                '<span class="recent-item-icon">📄</span>' +
                '<div class="recent-item-info"><h4>' + escapeHtml(w.title) + '</h4>' +
                '<p>' + escapeHtml(w.nickname) + ' · ' + formatDate(w.date) +
                (w.fileName ? ' · 📎' : '') + '</p></div>' +
                '<span class="recent-item-status status-' + w.status + '">' + (statusLabels[w.status] || w.status) + '</span>';
            list.appendChild(item);
        });
    } catch (err) {}
}

window.addEventListener('load', function () { setTimeout(renderRecentWorks, 3500); });
window.addEventListener('focus', renderRecentWorks);


// ============================================================
//  13. CALENDAR
// ============================================================
(function () {
    var monthEl = document.getElementById('cal-month');
    var daysEl = document.getElementById('cal-days');
    var prevBtn = document.getElementById('cal-prev');
    var nextBtn = document.getElementById('cal-next');
    if (!monthEl || !daysEl) return;

    var now = new Date();
    var currentMonth = now.getMonth();
    var currentYear = now.getFullYear();
    var monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    async function render() {
        monthEl.textContent = monthNames[currentMonth] + ' ' + currentYear;
        var firstDay = new Date(currentYear, currentMonth, 1);
        var lastDay = new Date(currentYear, currentMonth + 1, 0);
        var startDay = (firstDay.getDay() + 6) % 7;

        var events = [];
        try { events = await API.getCalendarEvents(currentYear, currentMonth + 1); } catch (e) {}

        daysEl.innerHTML = '';

        for (var i = 0; i < startDay; i++) {
            var empty = document.createElement('div');
            empty.className = 'cal-day empty';
            daysEl.appendChild(empty);
        }

        for (var d = 1; d <= lastDay.getDate(); d++) {
            var dayEl = document.createElement('div');
            dayEl.className = 'cal-day';
            var dateStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');

            var today = new Date();
            if (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                dayEl.classList.add('today');
            }

            var dayEvents = events.filter(function (e) { return e.date === dateStr; });
            var hasWork = dayEvents.some(function (e) { return e.type === 'work'; });
            var hasStream = dayEvents.some(function (e) { return e.type === 'stream'; });

            if (hasWork && hasStream) dayEl.classList.add('has-event', 'has-both');
            else if (hasWork) dayEl.classList.add('has-event', 'has-work');
            else if (hasStream) dayEl.classList.add('has-event', 'has-stream');

            if (dayEvents.length) dayEl.title = dayEvents.map(function (e) { return e.title; }).join('\n');
            dayEl.innerHTML = '<span class="cal-day-num">' + d + '</span>';
            daysEl.appendChild(dayEl);
        }

        var totalCells = startDay + lastDay.getDate();
        var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (var j = 0; j < remaining; j++) {
            var emptyEnd = document.createElement('div');
            emptyEnd.className = 'cal-day empty';
            daysEl.appendChild(emptyEnd);
        }
    }

    prevBtn.addEventListener('click', function () {
        currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } render();
    });
    nextBtn.addEventListener('click', function () {
        currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } render();
    });

    window.addEventListener('load', function () { setTimeout(render, 3300); });
    window.addEventListener('focus', render);
})();


// ============================================================
//  14. COUNTDOWN
// ============================================================
(function () {
    function getNextFriday() {
        var now = new Date();
        var d = (5 - now.getDay() + 7) % 7;
        if (d === 0 && now.getHours() >= 20) d = 7;
        var target = new Date(now);
        target.setDate(now.getDate() + d);
        target.setHours(20, 0, 0, 0);
        return target;
    }

    var target = getNextFriday();

    function update() {
        var diff = target - new Date();
        if (diff <= 0) { ['cd-days','cd-hours','cd-minutes'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent='00';}); var s=document.getElementById('cd-seconds');if(s)s.textContent='🔴'; return; }
        var D = Math.floor(diff / 86400000);
        var H = Math.floor(diff / 3600000 % 24);
        var M = Math.floor(diff / 60000 % 60);
        var S = Math.floor(diff / 1000 % 60);
        var el = function(id){return document.getElementById(id);};
        if(el('cd-days'))el('cd-days').textContent=String(D).padStart(2,'0');
        if(el('cd-hours'))el('cd-hours').textContent=String(H).padStart(2,'0');
        if(el('cd-minutes'))el('cd-minutes').textContent=String(M).padStart(2,'0');
        if(el('cd-seconds'))el('cd-seconds').textContent=String(S).padStart(2,'0');
    }
    setInterval(update, 1000); update();
})();


// ============================================================
//  15. THEME SWITCHER
// ============================================================
(function () {
    var label = document.getElementById('theme-label');
    var options = document.getElementById('theme-options');
    var buttons = document.querySelectorAll('.theme-btn');
    if (!label || !options) return;

    label.addEventListener('click', function () { options.classList.toggle('open'); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.theme-switcher')) options.classList.remove('open'); });

    buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var theme = this.getAttribute('data-theme');
            document.body.classList.remove('theme-green','theme-purple','theme-cyan','theme-red','theme-gold');
            if (theme !== 'green') document.body.classList.add('theme-' + theme);
            buttons.forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            localStorage.setItem('nedohackers-theme', theme);
            showToast('success', '🎨 Тема', theme);
            options.classList.remove('open');
        });
    });

    var saved = localStorage.getItem('nedohackers-theme');
    if (saved && saved !== 'green') {
        document.body.classList.add('theme-' + saved);
        buttons.forEach(function (b) { b.classList.remove('active'); if (b.getAttribute('data-theme') === saved) b.classList.add('active'); });
    }
})();


// ============================================================
//  16. TERMINAL
// ============================================================
(function () {
    var toggle = document.getElementById('terminal-toggle');
    var terminal = document.getElementById('terminal-window');
    var closeBtn = document.getElementById('terminal-close');
    var input = document.getElementById('terminal-input');
    var body = document.getElementById('terminal-body');
    if (!toggle || !terminal) return;

    toggle.addEventListener('click', function () {
        terminal.classList.toggle('open');
        if (terminal.classList.contains('open')) input.focus();
    });
    closeBtn.addEventListener('click', function () { terminal.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') terminal.classList.remove('open'); });

    var history = [], historyIndex = -1;

    var commands = {
        help: { output: ['📋 Команды:', '', '  help, about, rules, stats, categories, works,', '  prizes, contact, hack, matrix, whoami, neofetch,', '  date, uptime, clear, secret'], type: 'info' },
        about: { output: ['🛡️ NedoHackers — кибербезопасность.', '   Создаём, учимся, награждаем!'], type: 'info' },
        rules: { output: ['📜 1. Только образование', '   2. Никакого вреда', '   3. Изолированные среды', '   4. Уважение', '   5. Авторство'], type: 'warning' },
        prizes: { output: ['🏆 🥇 10,000₽  🥈 5,000₽  🥉 3,000₽'], type: 'success' },
        contact: { output: ['📬 admin@nedohackers.site', '   TG: @nedohackers', '   Discord: NedoHackers'], type: 'info' },
        hack: { output: ['💀 Инициализация...', '████████████ 100%', '', '⚠️ ACCESS DENIED', '😄 Шучу!'], type: 'error' },
        matrix: { output: ['⬇️ Wake up, Neo...', '⬇️ The Matrix has you...', '🐇 Knock, knock.'], type: 'success' },
        whoami: { output: ['👤 visitor — гость NedoHackers'], type: 'info' },
        secret: { output: ['🔑 Пасхалка: ↑↑↓↓←→←→'], type: 'warning' },
        neofetch: { output: ['  NedoHackers OS v3.0', '  Shell: NH-Terminal', '  Screen: ' + window.innerWidth + 'x' + window.innerHeight], type: 'info' }
    };

    function addLine(html) {
        var line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = html;
        body.appendChild(line);
        body.scrollTop = body.scrollHeight;
    }

    async function process(cmd) {
        cmd = cmd.trim();
        var lower = cmd.toLowerCase();
        addLine('<span class="terminal-prompt">visitor@nh:~$</span> <span class="terminal-output">' + escapeHtml(cmd) + '</span>');
        if (!lower) return;
        history.push(cmd); historyIndex = history.length;

        if (lower === 'clear') { body.innerHTML = ''; return; }
        if (lower === 'date') { addLine('<span class="terminal-output info">📅 ' + new Date().toLocaleString('ru-RU') + '</span>'); return; }
        if (lower === 'uptime') { addLine('<span class="terminal-output info">⏱️ ' + new Date().toLocaleTimeString('ru-RU') + '</span>'); return; }

        if (lower === 'stats') {
            try {
                var s = await API.getStats();
                ['📊 Статистика:', '  Участников: ' + s.totalUsers, '  Работ: ' + s.totalWorks, '  Одобрено: ' + s.approvedWorks, '  Ожидают: ' + s.pendingWorks].forEach(function (l, i) {
                    setTimeout(function () { addLine('<span class="terminal-output success">' + l + '</span>'); }, i * 80);
                });
            } catch (e) { addLine('<span class="terminal-output error">❌ Ошибка загрузки</span>'); }
            return;
        }

        if (lower === 'categories') {
            try {
                var cats = await API.getCategories(true);
                addLine('<span class="terminal-output info">📂 Рубрики:</span>');
                cats.forEach(function (c, i) { setTimeout(function () { addLine('<span class="terminal-output info">  ' + c.icon + ' ' + c.name + '</span>'); }, (i + 1) * 80); });
            } catch (e) {}
            return;
        }

        if (lower === 'works') {
            try {
                var works = await API.getWorks({ limit: 5 });
                if (works.length === 0) { addLine('<span class="terminal-output warning">Работ нет</span>'); return; }
                addLine('<span class="terminal-output info">📋 Последние:</span>');
                works.forEach(function (w, i) {
                    var st = w.status === 'approved' ? '✅' : w.status === 'rejected' ? '❌' : '⏳';
                    setTimeout(function () { addLine('<span class="terminal-output info">  ' + st + ' ' + w.title + ' — ' + w.nickname + '</span>'); }, (i + 1) * 80);
                });
            } catch (e) {}
            return;
        }

        if (commands[lower]) {
            commands[lower].output.forEach(function (l, i) {
                setTimeout(function () { addLine('<span class="terminal-output ' + commands[lower].type + '">' + l + '</span>'); }, i * 80);
            });
        } else {
            addLine('<span class="terminal-output error">❌ "' + escapeHtml(cmd) + '" не найдена. Введи help</span>');
        }
    }

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { process(input.value); input.value = ''; }
        if (e.key === 'ArrowUp') { e.preventDefault(); if (historyIndex > 0) { historyIndex--; input.value = history[historyIndex]; } }
        if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIndex < history.length - 1) { historyIndex++; input.value = history[historyIndex]; } else { historyIndex = history.length; input.value = ''; } }
        if (e.key === 'Tab') {
            e.preventDefault();
            var val = input.value.trim().toLowerCase();
            if (val) {
                var all = Object.keys(commands).concat(['clear','date','uptime','stats','categories','works']);
                var match = all.find(function (c) { return c.startsWith(val); });
                if (match) input.value = match;
            }
        }
    });
})();


// ============================================================
//  17. SMOOTH SCROLL
// ============================================================
(function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.offsetTop - 120, behavior: 'smooth' });
                var toggle = document.getElementById('nav-toggle');
                if (toggle) toggle.checked = false;
            }
        });
    });
})();


// ============================================================
//  18. SMART NAVBAR
// ============================================================
(function () {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;
    var last = 0;
    window.addEventListener('scroll', function () {
        var cur = window.scrollY;
        navbar.style.transform = (cur > last && cur > 200) ? 'translateY(-120%)' : 'translateY(0)';
        last = cur;
    });
})();


// ============================================================
//  19. SCROLL TOP
// ============================================================
(function () {
    var btn = document.getElementById('scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
        btn.classList.toggle('visible', window.scrollY > 500);
    });
})();


// ============================================================
//  20. PARALLAX
// ============================================================
(function () {
    var decors = document.querySelectorAll('.hero-decor');
    if (!decors.length || window.innerWidth <= 768) return;
    window.addEventListener('mousemove', function (e) {
        var x = (e.clientX / window.innerWidth - 0.5) * 2;
        var y = (e.clientY / window.innerHeight - 0.5) * 2;
        decors.forEach(function (d, i) {
            var s = (i + 1) * 15;
            d.style.transform = 'translate(' + (x * s) + 'px,' + (y * s) + 'px)';
        });
    });
})();


// ============================================================
//  21. KONAMI CODE
// ============================================================
(function () {
    var code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight'];
    var idx = 0;
    document.addEventListener('keydown', function (e) {
        if (e.key === code[idx]) { idx++; if (idx === code.length) { idx = 0; activate(); } } else { idx = 0; }
    });
    function activate() {
        var deg = 0;
        var iv = setInterval(function () { deg += 10; document.body.style.filter = 'hue-rotate(' + deg + 'deg)'; if (deg >= 360) { clearInterval(iv); document.body.style.filter = 'none'; } }, 50);
        showToast('success', '🎉 ПАСХАЛКА!', 'Код Konami!');
        for (var i = 0; i < 60; i++) confetti();
    }
    function confetti() {
        var el = document.createElement('div');
        var colors = ['#00ff41','#a855f7','#00d4ff','#ff3e3e','#ffd700'];
        var size = Math.random() * 10 + 5;
        var dur = Math.random() * 2 + 2;
        el.style.cssText = 'position:fixed;top:-10px;z-index:99999;pointer-events:none;left:' + Math.random() * 100 + 'vw;width:' + size + 'px;height:' + size + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';';
        document.body.appendChild(el);
        el.animate([{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: 'translateY(110vh) rotate(' + Math.random() * 720 + 'deg)', opacity: 0 }], { duration: dur * 1000, easing: 'linear' });
        setTimeout(function () { el.remove(); }, dur * 1000);
    }
})();


// ============================================================
//  22. CLICK PARTICLES
// ============================================================
(function () {
    document.addEventListener('click', function (e) { for (var i = 0; i < 8; i++) particle(e.clientX, e.clientY); });
    function particle(x, y) {
        var el = document.createElement('div');
        var size = Math.random() * 6 + 2;
        var color = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#00ff41';
        el.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border-radius:50%;left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px;background:' + color + ';box-shadow:0 0 6px ' + color;
        document.body.appendChild(el);
        var angle = Math.random() * Math.PI * 2;
        var speed = Math.random() * 80 + 30;
        el.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + Math.cos(angle) * speed + 'px,' + Math.sin(angle) * speed + 'px) scale(0)', opacity: 0 }], { duration: 600, easing: 'cubic-bezier(0,0.9,0.57,1)' });
        setTimeout(function () { el.remove(); }, 600);
    }
})();


// ============================================================
//  23. ACTIVE NAV LINK
// ============================================================
(function () {
    var sections = document.querySelectorAll('section[id]');
    var links = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', function () {
        var pos = window.scrollY + 200;
        sections.forEach(function (s) {
            if (pos >= s.offsetTop && pos < s.offsetTop + s.offsetHeight) {
                links.forEach(function (l) {
                    l.classList.toggle('active-nav', l.getAttribute('href') === '#' + s.id);
                });
            }
        });
    });
})();


// ============================================================
//  24. NOTIFICATIONS PANEL
// ============================================================
(function () {
    var bell = document.getElementById('notif-bell');
    var panel = document.getElementById('notif-panel');
    var badge = document.getElementById('notif-badge');
    var list = document.getElementById('notif-list');
    var clearBtn = document.getElementById('notif-clear');
    if (!bell || !panel) return;

    bell.addEventListener('click', function () {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) renderNotifs();
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.notif-bell') && !e.target.closest('.notif-panel')) panel.classList.remove('open'); });
    clearBtn.addEventListener('click', function () { API.clearNotifications().then(function () { renderNotifs(); updateBadge(); }); });

    async function renderNotifs() {
        try {
            var notifs = await API.getNotifications();
            list.innerHTML = '';
            if (notifs.length === 0) { list.innerHTML = '<div class="notif-empty">Нет уведомлений</div>'; return; }
            notifs.slice(0, 20).forEach(function (n) {
                var item = document.createElement('div');
                item.className = 'notif-item';
                item.innerHTML = '<span class="notif-item-icon">' + n.icon + '</span><div class="notif-item-info"><h4>' + n.title + '</h4><p>' + n.text + '</p></div><span class="notif-item-time">' + timeAgo(n.time) + '</span>';
                list.appendChild(item);
            });
        } catch (e) {}
    }

    async function updateBadge() {
        try {
            var notifs = await API.getNotifications();
            var count = notifs.length;
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.toggle('hidden', count === 0);
        } catch (e) {}
    }

    setInterval(updateBadge, 10000);
    window.addEventListener('load', function () { setTimeout(updateBadge, 3500); });
})();


// ============================================================
//  25. GLOBAL SEARCH
// ============================================================
(function () {
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var closeBtn = document.getElementById('search-close');
    if (!overlay) return;

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey && e.key === '/') || (e.ctrlKey && e.key === 'k')) { e.preventDefault(); overlay.classList.add('open'); input.value = ''; input.focus(); results.innerHTML = ''; }
        if (e.key === 'Escape') overlay.classList.remove('open');
    });
    closeBtn.addEventListener('click', function () { overlay.classList.remove('open'); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.classList.remove('open'); });

    var searchData = [
        { icon: '🏠', title: 'Главная', href: '#home' },
        { icon: '📂', title: 'Рубрики', href: '#categories' },
        { icon: '📋', title: 'Инструкция', href: '#how-it-works' },
        { icon: '📅', title: 'Календарь', href: '#calendar' },
        { icon: '📺', title: 'Расписание', href: '#schedule' },
        { icon: '📤', title: 'Отправить', href: '#submit' },
        { icon: '👤', title: 'Профиль', href: '#profile' },
        { icon: '🏆', title: 'Зал славы', href: '#hall-of-fame' },
        { icon: '👍', title: 'Голосование', href: '#voting' },
        { icon: '🔗', title: 'Ссылки', href: '#links' },
        { icon: '❓', title: 'FAQ', href: '#faq' },
        { icon: '📰', title: 'Блог', href: '#blog' },
        { icon: '🔧', title: 'Админ-панель', href: 'admin.html' },
    ];

    input.addEventListener('input', async function () {
        var q = this.value.trim().toLowerCase();
        results.innerHTML = '';
        if (!q) return;

        var filtered = searchData.filter(function (i) { return i.title.toLowerCase().includes(q); });

        try {
            var works = await API.getWorks({ search: q, limit: 5 });
            works.forEach(function (w) { filtered.push({ icon: '📄', title: w.title + ' (' + w.nickname + ')', href: '#submit' }); });
        } catch (e) {}

        if (filtered.length === 0) { results.innerHTML = '<div class="search-no-results">Ничего не найдено</div>'; return; }

        filtered.slice(0, 10).forEach(function (item) {
            var el = document.createElement('a');
            el.className = 'search-result-item'; el.href = item.href;
            el.innerHTML = '<span class="search-result-icon">' + item.icon + '</span><div class="search-result-info"><h4>' + item.title + '</h4></div>';
            el.addEventListener('click', function () { overlay.classList.remove('open'); });
            results.appendChild(el);
        });
    });
})();


// ============================================================
//  26. CHANGELOG
// ============================================================
(function () {
    var overlay = document.getElementById('changelog-overlay');
    var closeBtn = document.getElementById('changelog-close');
    var okBtn = document.getElementById('changelog-ok');
    if (!overlay) return;
    var version = 'v3.0';
    if (localStorage.getItem('nh_changelog_seen') !== version) {
        window.addEventListener('load', function () { setTimeout(function () { overlay.style.display = 'flex'; }, 4000); });
    }
    function close() { overlay.style.display = 'none'; localStorage.setItem('nh_changelog_seen', version); }
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (okBtn) okBtn.addEventListener('click', close);
})();


// ============================================================
//  27. COOKIE BANNER
// ============================================================
(function () {
    var banner = document.getElementById('cookie-banner');
    if (!banner || localStorage.getItem('nh_cookies')) return;
    window.addEventListener('load', function () { setTimeout(function () { banner.style.display = 'block'; }, 5000); });
    document.getElementById('cookie-accept').addEventListener('click', function () { localStorage.setItem('nh_cookies', 'all'); banner.style.display = 'none'; });
    document.getElementById('cookie-decline').addEventListener('click', function () { localStorage.setItem('nh_cookies', 'essential'); banner.style.display = 'none'; });
})();


// ============================================================
//  28. ONBOARDING
// ============================================================
(function () {
    var overlay = document.getElementById('onboarding-overlay');
    var tooltip = document.getElementById('onboarding-tooltip');
    if (!overlay || !tooltip || localStorage.getItem('nh_onboarding_done')) return;

    var steps = [
        { target: '#home', title: '👋 Добро пожаловать!', text: 'NedoHackers — платформа для работ по кибербезопасности.' },
        { target: '#categories', title: '📂 Рубрики', text: 'Все категории работ.' },
        { target: '#submit', title: '📤 Отправь работу', text: 'Форма + файл!' },
        { target: '#profile', title: '👤 Профиль', text: 'XP, достижения, статистика.' },
        { target: '.terminal-toggle', title: '⌨️ Терминал', text: 'Введи "help"!' },
    ];
    var cur = 0;

    window.addEventListener('load', function () { setTimeout(function () { if (localStorage.getItem('nh_changelog_seen')) start(); }, 6000); });

    function start() { overlay.style.display = 'block'; show(0); }
    function show(i) {
        if (i >= steps.length) { finish(); return; }
        cur = i;
        document.getElementById('onboarding-step').textContent = 'Шаг ' + (i + 1) + '/' + steps.length;
        document.getElementById('onboarding-title').textContent = steps[i].title;
        document.getElementById('onboarding-text').textContent = steps[i].text;
        document.getElementById('onboarding-next').textContent = i === steps.length - 1 ? 'Готово ✓' : 'Далее →';
        var t = document.querySelector(steps[i].target);
        if (t) { var r = t.getBoundingClientRect(); tooltip.style.top = Math.max(10, r.bottom + 10) + 'px'; tooltip.style.left = Math.max(10, Math.min(window.innerWidth - 370, r.left)) + 'px'; tooltip.style.transform = 'none'; t.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        else { tooltip.style.top = '30%'; tooltip.style.left = '50%'; tooltip.style.transform = 'translateX(-50%)'; }
    }
    function finish() { overlay.style.display = 'none'; localStorage.setItem('nh_onboarding_done', 'true'); showToast('success', '🎉 Тур завершён!', 'Удачи!'); }

    document.getElementById('onboarding-next').addEventListener('click', function () { show(cur + 1); });
    document.getElementById('onboarding-skip').addEventListener('click', finish);
})();


// ============================================================
//  29. ACTIVITY TIMER
// ============================================================
(function () {
    var el = document.getElementById('activity-timer');
    if (!el) return;
    var start = Date.now();
    setInterval(function () {
        var s = Math.floor((Date.now() - start) / 1000);
        el.textContent = '⏱ ' + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }, 1000);
})();


// ============================================================
//  30. BACKGROUND MUSIC
// ============================================================
(function () {
    var toggle = document.getElementById('music-toggle');
    if (!toggle) return;
    var ctx = null, playing = false;
    toggle.addEventListener('click', function () {
        if (!playing) {
            playing = true; toggle.textContent = '🔊'; toggle.classList.add('playing');
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            var gain = ctx.createGain(); gain.gain.value = 0.03; gain.connect(ctx.destination);
            function tone() {
                if (!playing) return;
                var osc = ctx.createOscillator(); osc.type = 'sine';
                osc.frequency.value = [130.81,146.83,164.81,174.61,196,220][Math.floor(Math.random() * 6)];
                osc.connect(gain); osc.start(); osc.stop(ctx.currentTime + 2 + Math.random() * 3);
                osc.onended = function () { setTimeout(tone, 500 + Math.random() * 2000); };
            }
            tone();
        } else {
            playing = false; toggle.textContent = '🔇'; toggle.classList.remove('playing');
            if (ctx) ctx.close(); ctx = null;
        }
    });
})();


// ============================================================
//  31. PROFILE
// ============================================================
(function () {
    async function render() {
        var nick = getCurrentNickname();
        var el = function (id) { return document.getElementById(id); };

        if (!nick) {
            if (el('profile-name')) el('profile-name').textContent = 'Гость (отправь работу чтобы создать профиль)';
            return;
        }

        try {
            var profile = await API.getProfile(nick);
            if (!profile) return;

            if (el('profile-name')) el('profile-name').textContent = profile.nickname;

            var levels = ['Новичок','Ученик','Хакер','Мастер','Гуру','Легенда','Бог'];
            var level = Math.floor((profile.xp || 0) / 100) + 1;
            var levelName = levels[Math.min(level - 1, levels.length - 1)];
            if (el('profile-level')) el('profile-level').textContent = 'Уровень ' + level + ' — ' + levelName;

            var xpInLevel = (profile.xp || 0) % 100;
            if (el('xp-fill')) el('xp-fill').style.width = xpInLevel + '%';
            if (el('xp-text')) el('xp-text').textContent = xpInLevel + '/100 XP (всего: ' + (profile.xp || 0) + ')';
            if (el('profile-streak')) el('profile-streak').textContent = profile.streak || 0;
            if (el('ps-works')) el('ps-works').textContent = profile.works || 0;
            if (el('ps-approved')) el('ps-approved').textContent = profile.approvedCount || 0;
            if (el('ps-likes')) el('ps-likes').textContent = profile.totalVotes || 0;
            if (el('ps-visits')) el('ps-visits').textContent = profile.visits || 0;

            // Достижения
            var grid = el('achievements-grid');
            if (grid) {
                grid.innerHTML = '';
                var allAchievements = [
                    { id: 'first_work', name: 'Первая работа', icon: '🎯', check: profile.worksCount >= 1 },
                    { id: 'five_works', name: '5 работ', icon: '📦', check: profile.worksCount >= 5 },
                    { id: 'ten_works', name: '10 работ', icon: '🗃️', check: profile.worksCount >= 10 },
                    { id: 'first_approve', name: 'Одобрено!', icon: '✅', check: profile.approvedCount >= 1 },
                    { id: 'five_approves', name: 'Мастер', icon: '🏅', check: profile.approvedCount >= 5 },
                    { id: 'streak_3', name: '3 дня', icon: '🔥', check: profile.streak >= 3 },
                    { id: 'streak_7', name: 'Неделя', icon: '💪', check: profile.streak >= 7 },
                    { id: 'streak_30', name: 'Месяц', icon: '🏆', check: profile.streak >= 30 },
                    { id: 'voter', name: 'Голосующий', icon: '👍', check: profile.totalVotes >= 1 },
                    { id: 'popular', name: 'Популярный', icon: '⭐', check: profile.totalVotes >= 10 },
                ];

                allAchievements.forEach(function (a) {
                    var unlocked = a.check || (profile.achievements && profile.achievements.includes(a.id));
                    var div = document.createElement('div');
                    div.className = 'achievement ' + (unlocked ? 'unlocked' : 'locked');
                    div.innerHTML = '<span class="achievement-icon">' + a.icon + '</span><span class="achievement-name">' + a.name + '</span>' + (!unlocked ? '<span class="achievement-lock">🔒</span>' : '');
                    grid.appendChild(div);
                });
            }

            // График (упрощённый — на клиенте)
            var chart = el('activity-chart');
            if (chart) {
                chart.innerHTML = '';
                var dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
                for (var j = 6; j >= 0; j--) {
                    var dd = new Date();
                    dd.setDate(dd.getDate() - j);
                    var dayIndex = (dd.getDay() + 6) % 7;
                    var h = Math.random() * 60 + 10; // Визуализация (в реальности брать из серверных логов)
                    var wrapper = document.createElement('div');
                    wrapper.className = 'chart-bar-wrapper';
                    wrapper.innerHTML = '<div class="chart-bar" style="height:' + h + 'px;"></div><span class="chart-label">' + dayNames[dayIndex] + '</span>';
                    chart.appendChild(wrapper);
                }
            }
        } catch (e) {}
    }

    window.addEventListener('load', function () { setTimeout(render, 3500); });
    window.addEventListener('focus', render);
    window.renderProfile = render;
})();


// ============================================================
//  32. VOTING
// ============================================================
(function () {
    async function render() {
        var grid = document.getElementById('voting-grid');
        if (!grid) return;

        try {
            var works = await API.getWorks({ status: 'approved', limit: 9 });
            grid.innerHTML = '';

            if (works.length === 0) {
                grid.innerHTML = '<div class="voting-empty">Пока нет одобренных работ</div>';
                return;
            }

            var visitorId = API.getVisitorId();

            works.forEach(function (w) {
                var voted = w.votedBy && w.votedBy.includes(visitorId);
                var card = document.createElement('div');
                card.className = 'voting-card';
                card.innerHTML =
                    '<div class="voting-card-header"><span class="voting-card-avatar">📄</span><div class="voting-card-info"><h3>' + escapeHtml(w.nickname) + '</h3><p>' + escapeHtml(w.category) + '</p></div></div>' +
                    '<div class="voting-card-title">' + escapeHtml(w.title) + '</div>' +
                    '<div class="voting-card-desc">' + escapeHtml((w.description || '').substring(0, 100)) + '</div>' +
                    '<div class="voting-card-footer"><button class="vote-btn ' + (voted ? 'voted' : '') + '" data-id="' + w._id + '">👍 <span class="vote-count">' + (w.votes || 0) + '</span></button></div>';
                grid.appendChild(card);
            });

            grid.querySelectorAll('.vote-btn').forEach(function (btn) {
                btn.addEventListener('click', async function () {
                    var id = this.getAttribute('data-id');
                    try {
                        var result = await API.voteWork(id, visitorId);
                        this.querySelector('.vote-count').textContent = result.votes;
                        this.classList.toggle('voted', result.voted);
                        if (result.voted) showToast('success', '👍 Голос принят!', 'Спасибо!');
                    } catch (e) { showToast('error', '❌', 'Ошибка голосования'); }
                });
            });
        } catch (e) {}
    }

    window.addEventListener('load', function () { setTimeout(render, 3500); });
    window.addEventListener('focus', render);
})();


// ============================================================
//  33. STREAK POPUP
// ============================================================
(function () {
    var nick = getCurrentNickname();
    if (!nick) return;

    window.addEventListener('load', function () {
        setTimeout(async function () {
            try {
                var result = await API.updateStreak(nick);
                if (result.streak > 1 && !result.alreadyVisited) {
                    var popup = document.getElementById('streak-popup');
                    var countEl = document.getElementById('streak-count');
                    if (popup && countEl) {
                        countEl.textContent = result.streak;
                        popup.style.display = 'flex';
                        setTimeout(function () { popup.style.display = 'none'; }, 3000);
                    }
                }
            } catch (e) {}
        }, 4500);
    });
})();


// ============================================================
//  34. CONSOLE EASTER EGG
// ============================================================
(function () {
    console.log('%c 🛡️ NedoHackers v3.0 ', 'color:#00ff41;background:#0a0a0f;font-size:16px;font-family:monospace;padding:10px 20px;border:1px solid #00ff41;border-radius:4px;');
    console.log('%c Привет, хакер! 😎 ', 'color:#a855f7;font-size:12px;');
})();
