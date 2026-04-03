// ================================================================
//  DB.JS — "База данных" на localStorage
//  Используется на главной странице и в админ-панели
// ================================================================

var DB = (function () {

    // ===== Значения по умолчанию =====
    var defaultCategories = [
        { id: 1, name: 'Вирусы и малварь', icon: '🦠', tag: 'green', active: true },
        { id: 2, name: 'Эксплойты', icon: '🔓', tag: 'purple', active: true },
        { id: 3, name: 'Реверс-инжиниринг', icon: '🛡️', tag: 'cyan', active: true },
        { id: 4, name: 'Сетевые атаки', icon: '🌐', tag: 'red', active: true },
        { id: 5, name: 'Криптография', icon: '🔐', tag: 'yellow', active: true },
        { id: 6, name: 'Автоматизация', icon: '🤖', tag: 'green', active: true }
    ];

    var defaultSchedule = [
        { id: 1, day: 'ПН / СР / ПТ', title: '🎮 Стрим: Разбор работ недели', description: 'Смотрим лучшие присланные работы, обсуждаем код и выбираем победителя', time: '20:00 — 23:00 (МСК)', isLive: true, date: '' },
        { id: 2, day: 'ВТОРНИК', title: '📹 Видео: Туториалы', description: 'Обучающие видео по созданию инструментов', time: '18:00 — Премьера', isLive: false, date: '' },
        { id: 3, day: 'ЧЕТВЕРГ', title: '🏆 Видео: Топ работ месяца', description: 'Ежемесячный обзор лучших проектов', time: '19:00 — Премьера', isLive: false, date: '' },
        { id: 4, day: 'СУББОТА', title: '💻 Стрим: Кодим вместе', description: 'Совместное написание кода в реальном времени', time: '16:00 — 20:00 (МСК)', isLive: true, date: '' },
        { id: 5, day: 'ВОСКРЕСЕНЬЕ', title: '📰 Дайджест новостей', description: 'Еженедельная подборка новостей', time: '12:00 — Пост в Telegram', isLive: false, date: '' }
    ];

    // ===== Инициализация =====
    function init() {
        if (!localStorage.getItem('nh_categories')) {
            save('nh_categories', defaultCategories);
        }
        if (!localStorage.getItem('nh_schedule')) {
            save('nh_schedule', defaultSchedule);
        }
        if (!localStorage.getItem('nh_works')) {
            save('nh_works', []);
        }
        if (!localStorage.getItem('nh_users')) {
            save('nh_users', []);
        }
    }

    // ===== Базовые операции =====
    function save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function load(key) {
        var data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    function genId(arr) {
        if (!arr || arr.length === 0) return 1;
        return Math.max.apply(null, arr.map(function (item) { return item.id || 0; })) + 1;
    }

    // ===== РАБОТЫ =====
    function getWorks() {
        return load('nh_works') || [];
    }

    function addWork(work) {
        var works = getWorks();
        work.id = genId(works);
        work.date = new Date().toISOString();
        work.status = 'pending'; // pending | approved | rejected
        work.rating = 0;
        works.push(work);
        save('nh_works', works);

        // Обновить / создать пользователя
        addOrUpdateUser(work.nickname, work.email);

        return work;
    }

    function updateWork(id, updates) {
        var works = getWorks();
        for (var i = 0; i < works.length; i++) {
            if (works[i].id === id) {
                for (var key in updates) {
                    works[i][key] = updates[key];
                }
                break;
            }
        }
        save('nh_works', works);
    }

    function deleteWork(id) {
        var works = getWorks().filter(function (w) { return w.id !== id; });
        save('nh_works', works);
    }

    function getWorkById(id) {
        return getWorks().find(function (w) { return w.id === id; }) || null;
    }

    // ===== ПОЛЬЗОВАТЕЛИ =====
    function getUsers() {
        return load('nh_users') || [];
    }

    function addOrUpdateUser(nickname, email) {
        var users = getUsers();
        var existing = users.find(function (u) {
            return u.nickname.toLowerCase() === nickname.toLowerCase();
        });

        if (existing) {
            existing.worksCount = (existing.worksCount || 0) + 1;
            existing.lastActivity = new Date().toISOString();
        } else {
            users.push({
                id: genId(users),
                nickname: nickname,
                email: email,
                banned: false,
                warnings: 0,
                worksCount: 1,
                joinDate: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            });
        }
        save('nh_users', users);
    }

    function updateUser(id, updates) {
        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === id) {
                for (var key in updates) {
                    users[i][key] = updates[key];
                }
                break;
            }
        }
        save('nh_users', users);
    }

    function banUser(id) {
        updateUser(id, { banned: true });
    }

    function unbanUser(id) {
        updateUser(id, { banned: false });
    }

    function warnUser(id) {
        var users = getUsers();
        var user = users.find(function (u) { return u.id === id; });
        if (user) {
            user.warnings = (user.warnings || 0) + 1;
            if (user.warnings >= 3) user.banned = true;
            save('nh_users', users);
        }
    }

    function isUserBanned(nickname) {
        var users = getUsers();
        var user = users.find(function (u) {
            return u.nickname.toLowerCase() === nickname.toLowerCase();
        });
        return user ? user.banned : false;
    }

    // ===== КАТЕГОРИИ =====
    function getCategories() {
        return load('nh_categories') || defaultCategories;
    }

    function getActiveCategories() {
        return getCategories().filter(function (c) { return c.active; });
    }

    function addCategory(cat) {
        var cats = getCategories();
        cat.id = genId(cats);
        cat.active = true;
        cats.push(cat);
        save('nh_categories', cats);
        return cat;
    }

    function updateCategory(id, updates) {
        var cats = getCategories();
        for (var i = 0; i < cats.length; i++) {
            if (cats[i].id === id) {
                for (var key in updates) {
                    cats[i][key] = updates[key];
                }
                break;
            }
        }
        save('nh_categories', cats);
    }

    function deleteCategory(id) {
        var cats = getCategories().filter(function (c) { return c.id !== id; });
        save('nh_categories', cats);
    }

    // ===== РАСПИСАНИЕ =====
    function getSchedule() {
        return load('nh_schedule') || defaultSchedule;
    }

    function addScheduleItem(item) {
        var schedule = getSchedule();
        item.id = genId(schedule);
        schedule.push(item);
        save('nh_schedule', schedule);
        return item;
    }

    function updateScheduleItem(id, updates) {
        var schedule = getSchedule();
        for (var i = 0; i < schedule.length; i++) {
            if (schedule[i].id === id) {
                for (var key in updates) {
                    schedule[i][key] = updates[key];
                }
                break;
            }
        }
        save('nh_schedule', schedule);
    }

    function deleteScheduleItem(id) {
        var schedule = getSchedule().filter(function (s) { return s.id !== id; });
        save('nh_schedule', schedule);
    }

    // ===== СТАТИСТИКА =====
    function getStats() {
        var works = getWorks();
        var users = getUsers();
        return {
            totalWorks: works.length,
            totalUsers: users.length,
            pendingWorks: works.filter(function (w) { return w.status === 'pending'; }).length,
            approvedWorks: works.filter(function (w) { return w.status === 'approved'; }).length,
            rejectedWorks: works.filter(function (w) { return w.status === 'rejected'; }).length,
            bannedUsers: users.filter(function (u) { return u.banned; }).length,
            totalWarnings: users.reduce(function (sum, u) { return sum + (u.warnings || 0); }, 0)
        };
    }

    // ===== СОБЫТИЯ КАЛЕНДАРЯ =====
    function getCalendarEvents() {
        var events = [];

        // Работы как события
        getWorks().forEach(function (w) {
            events.push({
                date: w.date.split('T')[0],
                title: w.title,
                type: 'work',
                status: w.status
            });
        });

        // Расписание с датами
        getSchedule().forEach(function (s) {
            if (s.date) {
                events.push({
                    date: s.date,
                    title: s.title,
                    type: 'stream',
                    isLive: s.isLive
                });
            }
        });

        return events;
    }

        // ===== ДОСТИЖЕНИЯ =====
    var achievementsList = [
        { id: 'first_work', name: 'Первая работа', icon: '🎯', desc: 'Отправь первую работу', condition: function(p) { return p.worksCount >= 1; } },
        { id: 'five_works', name: '5 работ', icon: '📦', desc: 'Отправь 5 работ', condition: function(p) { return p.worksCount >= 5; } },
        { id: 'ten_works', name: '10 работ', icon: '🗃️', desc: 'Отправь 10 работ', condition: function(p) { return p.worksCount >= 10; } },
        { id: 'first_approve', name: 'Одобрено!', icon: '✅', desc: 'Получи первое одобрение', condition: function(p) { return p.approvedCount >= 1; } },
        { id: 'five_approves', name: 'Мастер', icon: '🏅', desc: '5 одобренных работ', condition: function(p) { return p.approvedCount >= 5; } },
        { id: 'streak_3', name: '3 дня подряд', icon: '🔥', desc: '3 дня подряд на сайте', condition: function(p) { return p.streak >= 3; } },
        { id: 'streak_7', name: 'Неделя!', icon: '💪', desc: '7 дней подряд', condition: function(p) { return p.streak >= 7; } },
        { id: 'streak_30', name: 'Месяц!', icon: '🏆', desc: '30 дней подряд', condition: function(p) { return p.streak >= 30; } },
        { id: 'voter', name: 'Голосующий', icon: '👍', desc: 'Проголосуй за работу', condition: function(p) { return p.votesCount >= 1; } },
        { id: 'popular', name: 'Популярный', icon: '⭐', desc: 'Получи 10 лайков', condition: function(p) { return p.likesReceived >= 10; } },
        { id: 'night_owl', name: 'Ночная сова', icon: '🦉', desc: 'Зайди на сайт после полуночи', condition: function(p) { return p.nightVisit; } },
        { id: 'explorer', name: 'Исследователь', icon: '🔍', desc: 'Открой терминал', condition: function(p) { return p.terminalOpened; } },
    ];

    function getAchievements() { return achievementsList; }

    // ===== ПРОФИЛЬ ТЕКУЩЕГО ПОСЕТИТЕЛЯ =====
    function getProfile() {
        var profile = load('nh_profile') || {
            nickname: 'Гость',
            xp: 0,
            level: 1,
            streak: 0,
            lastVisit: '',
            visits: 0,
            worksCount: 0,
            approvedCount: 0,
            votesCount: 0,
            likesReceived: 0,
            nightVisit: false,
            terminalOpened: false,
            unlockedAchievements: [],
            activityLog: {}
        };
        return profile;
    }

    function saveProfile(profile) {
        save('nh_profile', profile);
    }

    function addXP(amount) {
        var profile = getProfile();
        profile.xp += amount;

        // Уровень: каждые 100 XP
        var newLevel = Math.floor(profile.xp / 100) + 1;
        if (newLevel > profile.level) {
            profile.level = newLevel;
        }

        saveProfile(profile);
        return profile;
    }

    function checkAchievements() {
        var profile = getProfile();
        var newUnlocks = [];

        achievementsList.forEach(function (a) {
            if (profile.unlockedAchievements.indexOf(a.id) === -1) {
                if (a.condition(profile)) {
                    profile.unlockedAchievements.push(a.id);
                    newUnlocks.push(a);
                }
            }
        });

        saveProfile(profile);
        return newUnlocks;
    }

    function updateStreak() {
        var profile = getProfile();
        var today = new Date().toISOString().split('T')[0];

        if (profile.lastVisit === today) return profile;

        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var yesterdayStr = yesterday.toISOString().split('T')[0];

        if (profile.lastVisit === yesterdayStr) {
            profile.streak += 1;
        } else if (profile.lastVisit !== today) {
            profile.streak = 1;
        }

        profile.lastVisit = today;
        profile.visits += 1;

        // Лог активности
        if (!profile.activityLog) profile.activityLog = {};
        profile.activityLog[today] = (profile.activityLog[today] || 0) + 1;

        // Ночная сова
        if (new Date().getHours() >= 0 && new Date().getHours() < 5) {
            profile.nightVisit = true;
        }

        saveProfile(profile);
        return profile;
    }

    function recordProfileWork() {
        var profile = getProfile();
        profile.worksCount += 1;
        saveProfile(profile);
        addXP(25);
    }

    function recordTerminalOpen() {
        var profile = getProfile();
        if (!profile.terminalOpened) {
            profile.terminalOpened = true;
            saveProfile(profile);
        }
    }

    // ===== ЛАЙКИ / ГОЛОСОВАНИЕ =====
    function getVotes() {
        return load('nh_votes') || {};
    }

    function toggleVote(workId) {
        var votes = getVotes();
        var key = String(workId);

        if (!votes[key]) votes[key] = { count: 0, voted: false };

        if (votes[key].voted) {
            votes[key].count = Math.max(0, votes[key].count - 1);
            votes[key].voted = false;
        } else {
            votes[key].count += 1;
            votes[key].voted = true;

            var profile = getProfile();
            profile.votesCount = (profile.votesCount || 0) + 1;
            saveProfile(profile);
            addXP(5);
        }

        save('nh_votes', votes);
        return votes[key];
    }

    function getVoteCount(workId) {
        var votes = getVotes();
        var key = String(workId);
        return votes[key] || { count: 0, voted: false };
    }

    // ===== УВЕДОМЛЕНИЯ =====
    function getNotifications() {
        return load('nh_notifications') || [];
    }

    function addNotification(icon, title, text) {
        var notifs = getNotifications();
        notifs.unshift({
            id: Date.now(),
            icon: icon,
            title: title,
            text: text,
            time: new Date().toISOString(),
            read: false
        });

        // Макс 50
        if (notifs.length > 50) notifs = notifs.slice(0, 50);
        save('nh_notifications', notifs);
    }

    function clearNotifications() {
        save('nh_notifications', []);
    }

    function getUnreadCount() {
        return getNotifications().filter(function(n) { return !n.read; }).length;
    }

    function markAllRead() {
        var notifs = getNotifications();
        notifs.forEach(function(n) { n.read = true; });
        save('nh_notifications', notifs);
    }

    // ===== Инициализация при загрузке =====
    init();

    // ===== Публичный API =====
    return {
        getWorks: getWorks, addWork: addWork, updateWork: updateWork,
        deleteWork: deleteWork, getWorkById: getWorkById,
        getUsers: getUsers, updateUser: updateUser, banUser: banUser,
        unbanUser: unbanUser, warnUser: warnUser, isUserBanned: isUserBanned,
        getCategories: getCategories, getActiveCategories: getActiveCategories,
        addCategory: addCategory, updateCategory: updateCategory, deleteCategory: deleteCategory,
        getSchedule: getSchedule, addScheduleItem: addScheduleItem,
        updateScheduleItem: updateScheduleItem, deleteScheduleItem: deleteScheduleItem,
        getStats: getStats, getCalendarEvents: getCalendarEvents,

        // Новые
        getProfile: getProfile, saveProfile: saveProfile, addXP: addXP,
        checkAchievements: checkAchievements, updateStreak: updateStreak,
        recordProfileWork: recordProfileWork, recordTerminalOpen: recordTerminalOpen,
        getAchievements: getAchievements,
        toggleVote: toggleVote, getVoteCount: getVoteCount, getVotes: getVotes,
        getNotifications: getNotifications, addNotification: addNotification,
        clearNotifications: clearNotifications, getUnreadCount: getUnreadCount,
        markAllRead: markAllRead
    };
})();