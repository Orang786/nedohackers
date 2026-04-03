// ================================================================
//  NEDOHACKERS — SERVER.JS
//  Node.js + Express + MongoDB Atlas
// ================================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Папка загрузок
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ===== MULTER =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const name = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, name + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.py','.js','.c','.cpp','.h','.rs','.go','.zip','.rar','.7z','.tar','.gz','.txt','.md','.json','.html','.css','.sh','.bat','.rb','.java','.kt'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});


// ================================================================
//  MONGOOSE MODELS
// ================================================================

const workSchema = new mongoose.Schema({
    nickname:    { type: String, required: true, trim: true },
    email:       { type: String, required: true, trim: true },
    category:    { type: String, required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    link:        { type: String, default: '' },
    fileName:    { type: String, default: '' },
    filePath:    { type: String, default: '' },
    fileSize:    { type: Number, default: 0 },
    status:      { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
    votes:       { type: Number, default: 0 },
    votedBy:     [{ type: String }],
    date:        { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    nickname:     { type: String, required: true, unique: true, trim: true },
    email:        { type: String, required: true, trim: true },
    banned:       { type: Boolean, default: false },
    warnings:     { type: Number, default: 0 },
    worksCount:   { type: Number, default: 0 },
    xp:           { type: Number, default: 0 },
    level:        { type: Number, default: 1 },
    streak:       { type: Number, default: 0 },
    lastVisit:    { type: String, default: '' },
    visits:       { type: Number, default: 0 },
    achievements: [{ type: String }],
    joinDate:     { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
    name:   { type: String, required: true, trim: true },
    icon:   { type: String, default: '📁' },
    tag:    { type: String, default: 'green' },
    active: { type: Boolean, default: true },
    order:  { type: Number, default: 0 }
});

const scheduleSchema = new mongoose.Schema({
    day:         { type: String, required: true },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    time:        { type: String, default: '' },
    date:        { type: String, default: '' },
    isLive:      { type: Boolean, default: false }
});

const notificationSchema = new mongoose.Schema({
    icon:  { type: String, default: 'ℹ️' },
    title: { type: String, required: true },
    text:  { type: String, default: '' },
    time:  { type: Date, default: Date.now }
});

const Work = mongoose.model('Work', workSchema);
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Schedule = mongoose.model('Schedule', scheduleSchema);
const Notification = mongoose.model('Notification', notificationSchema);


// ================================================================
//  SEED — начальные данные (создаются 1 раз)
// ================================================================
async function seed() {
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
        await Category.insertMany([
            { name: 'Вирусы и малварь', icon: '🦠', tag: 'green', order: 1 },
            { name: 'Эксплойты', icon: '🔓', tag: 'purple', order: 2 },
            { name: 'Реверс-инжиниринг', icon: '🛡️', tag: 'cyan', order: 3 },
            { name: 'Сетевые атаки', icon: '🌐', tag: 'red', order: 4 },
            { name: 'Криптография', icon: '🔐', tag: 'yellow', order: 5 },
            { name: 'Автоматизация', icon: '🤖', tag: 'green', order: 6 }
        ]);
        console.log('✅ Категории созданы');
    }

    const schCount = await Schedule.countDocuments();
    if (schCount === 0) {
        await Schedule.insertMany([
            { day: 'ПН / СР / ПТ', title: '🎮 Стрим: Разбор работ', description: 'Смотрим лучшие работы', time: '20:00 — 23:00 (МСК)', isLive: true },
            { day: 'ВТОРНИК', title: '📹 Туториалы', description: 'Обучающие видео', time: '18:00', isLive: false },
            { day: 'ЧЕТВЕРГ', title: '🏆 Топ работ', description: 'Обзор лучших проектов', time: '19:00', isLive: false },
            { day: 'СУББОТА', title: '💻 Кодим вместе', description: 'Совместный код', time: '16:00 — 20:00', isLive: true },
            { day: 'ВОСКРЕСЕНЬЕ', title: '📰 Дайджест', description: 'Новости недели', time: '12:00', isLive: false }
        ]);
        console.log('✅ Расписание создано');
    }
}


// ================================================================
//  API: STATS
// ================================================================
app.get('/api/stats', async (req, res) => {
    try {
        const [totalWorks, totalUsers, pendingWorks, approvedWorks, rejectedWorks, bannedUsers] = await Promise.all([
            Work.countDocuments(),
            User.countDocuments(),
            Work.countDocuments({ status: 'pending' }),
            Work.countDocuments({ status: 'approved' }),
            Work.countDocuments({ status: 'rejected' }),
            User.countDocuments({ banned: true })
        ]);
        res.json({ totalWorks, totalUsers, pendingWorks, approvedWorks, rejectedWorks, bannedUsers });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ================================================================
//  API: WORKS
// ================================================================
app.get('/api/works', async (req, res) => {
    try {
        const { status, category, search, limit } = req.query;
        let filter = {};
        if (status && status !== 'all') filter.status = status;
        if (category && category !== 'all') filter.category = category;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { nickname: { $regex: search, $options: 'i' } }
            ];
        }
        let query = Work.find(filter).sort({ date: -1 });
        if (limit) query = query.limit(parseInt(limit));
        res.json(await query);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/works/:id', async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        if (!work) return res.status(404).json({ error: 'Не найдено' });
        res.json(work);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/works', upload.single('file'), async (req, res) => {
    try {
        const { nickname, email, category, title, description, link } = req.body;

        // Проверка бана
        const existingUser = await User.findOne({ nickname: { $regex: new RegExp('^' + nickname + '$', 'i') } });
        if (existingUser && existingUser.banned) {
            return res.status(403).json({ error: 'Аккаунт заблокирован' });
        }

        const workData = { nickname, email, category, title, description, link };
        if (req.file) {
            workData.fileName = req.file.originalname;
            workData.filePath = req.file.filename;
            workData.fileSize = req.file.size;
        }

        const work = await new Work(workData).save();

        // Обновить пользователя
        await User.findOneAndUpdate(
            { nickname: { $regex: new RegExp('^' + nickname + '$', 'i') } },
            {
                $set: { email, lastActivity: new Date() },
                $inc: { worksCount: 1, xp: 25 },
                $setOnInsert: { joinDate: new Date(), nickname }
            },
            { upsert: true, new: true }
        );

        // Уведомление
        await new Notification({ icon: '📤', title: 'Новая работа!', text: nickname + ': ' + title }).save();

        res.status(201).json(work);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/works/:id', async (req, res) => {
    try {
        const work = await Work.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!work) return res.status(404).json({ error: 'Не найдено' });

        if (req.body.status) {
            const texts = { approved: '✅ Одобрена', rejected: '❌ Отклонена' };
            if (texts[req.body.status]) {
                await new Notification({
                    icon: req.body.status === 'approved' ? '✅' : '❌',
                    title: 'Статус изменён',
                    text: work.title + ' — ' + texts[req.body.status]
                }).save();

                if (req.body.status === 'approved') {
                    await User.findOneAndUpdate({ nickname: work.nickname }, { $inc: { xp: 50 } });
                }
            }
        }

        res.json(work);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/works/:id', async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        if (work && work.filePath) {
            const fp = path.join(uploadsDir, work.filePath);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }
        await Work.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/works/:id/download', async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        if (!work || !work.filePath) return res.status(404).json({ error: 'Файл не найден' });
        const fp = path.join(uploadsDir, work.filePath);
        if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Файл не найден на сервере' });
        res.download(fp, work.fileName);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/works/:id/vote', async (req, res) => {
    try {
        const { visitorId } = req.body;
        const work = await Work.findById(req.params.id);
        if (!work) return res.status(404).json({ error: 'Не найдено' });

        const voted = work.votedBy.includes(visitorId);
        if (voted) {
            work.votes = Math.max(0, work.votes - 1);
            work.votedBy = work.votedBy.filter(v => v !== visitorId);
        } else {
            work.votes += 1;
            work.votedBy.push(visitorId);
        }

        await work.save();
        res.json({ votes: work.votes, voted: !voted });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ================================================================
//  API: USERS
// ================================================================
app.get('/api/users', async (req, res) => {
    try { res.json(await User.find().sort({ lastActivity: -1 })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/:id/warn', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'Не найден' });
        user.warnings += 1;
        if (user.warnings >= 3) user.banned = true;
        await user.save();
        await new Notification({ icon: '⚠️', title: 'Предупреждение', text: user.nickname + ' (' + user.warnings + '/3)' }).save();
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/:id/ban', async (req, res) => {
    try { res.json(await User.findByIdAndUpdate(req.params.id, { banned: true }, { new: true })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/:id/unban', async (req, res) => {
    try { res.json(await User.findByIdAndUpdate(req.params.id, { banned: false, warnings: 0 }, { new: true })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/check-ban/:nickname', async (req, res) => {
    try {
        const user = await User.findOne({ nickname: { $regex: new RegExp('^' + req.params.nickname + '$', 'i') } });
        res.json({ banned: user ? user.banned : false });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/profile/:nickname', async (req, res) => {
    try {
        const user = await User.findOne({ nickname: { $regex: new RegExp('^' + req.params.nickname + '$', 'i') } });
        if (!user) return res.json(null);

        const works = await Work.find({ nickname: user.nickname });
        const approvedCount = works.filter(w => w.status === 'approved').length;
        const totalVotes = works.reduce((sum, w) => sum + (w.votes || 0), 0);

        res.json({ ...user.toObject(), approvedCount, totalVotes, works: works.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/streak', async (req, res) => {
    try {
        const { nickname } = req.body;
        if (!nickname) return res.json({ streak: 0 });

        const user = await User.findOne({ nickname: { $regex: new RegExp('^' + nickname + '$', 'i') } });
        if (!user) return res.json({ streak: 0 });

        const today = new Date().toISOString().split('T')[0];
        if (user.lastVisit === today) return res.json({ streak: user.streak, alreadyVisited: true });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (user.lastVisit === yesterday.toISOString().split('T')[0]) {
            user.streak += 1;
        } else {
            user.streak = 1;
        }

        user.lastVisit = today;
        user.visits += 1;
        await user.save();

        res.json({ streak: user.streak, alreadyVisited: false });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ================================================================
//  API: CATEGORIES
// ================================================================
app.get('/api/categories', async (req, res) => {
    try {
        let filter = {};
        if (req.query.active === 'true') filter.active = true;
        res.json(await Category.find(filter).sort({ order: 1 }));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/categories', async (req, res) => {
    try { res.status(201).json(await new Category(req.body).save()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/categories/:id', async (req, res) => {
    try { res.json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/categories/:id', async (req, res) => {
    try { await Category.findByIdAndDelete(req.params.id); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});


// ================================================================
//  API: SCHEDULE
// ================================================================
app.get('/api/schedule', async (req, res) => {
    try { res.json(await Schedule.find().sort({ _id: 1 })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/schedule', async (req, res) => {
    try { res.status(201).json(await new Schedule(req.body).save()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/schedule/:id', async (req, res) => {
    try { res.json(await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/schedule/:id', async (req, res) => {
    try { await Schedule.findByIdAndDelete(req.params.id); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});


// ================================================================
//  API: NOTIFICATIONS
// ================================================================
app.get('/api/notifications', async (req, res) => {
    try { res.json(await Notification.find().sort({ time: -1 }).limit(50)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/notifications', async (req, res) => {
    try { await Notification.deleteMany({}); res.json({ success: true }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});


// ================================================================
//  API: CALENDAR
// ================================================================
app.get('/api/calendar', async (req, res) => {
    try {
        const { year, month } = req.query;
        const events = [];

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        const works = await Work.find({ date: { $gte: start, $lt: end } });
        works.forEach(w => {
            events.push({ date: w.date.toISOString().split('T')[0], title: w.title, type: 'work', status: w.status });
        });

        const prefix = year + '-' + String(month).padStart(2, '0');
        const schedule = await Schedule.find({ date: { $regex: '^' + prefix } });
        schedule.forEach(s => {
            events.push({ date: s.date, title: s.title, type: 'stream', isLive: s.isLive });
        });

        res.json(events);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ================================================================
//  API: ADMIN + EXPORT
// ================================================================
app.post('/api/admin/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || 'admin123')) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Неверный пароль' });
    }
});

app.get('/api/export', async (req, res) => {
    try {
        const [works, users, categories, schedule] = await Promise.all([
            Work.find(), User.find(), Category.find(), Schedule.find()
        ]);
        res.json({ exportDate: new Date().toISOString(), works, users, categories, schedule });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ================================================================
//  PAGES
// ================================================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));


// ================================================================
//  CONNECT & START
// ================================================================
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB подключена');
        await seed();
        app.listen(PORT, () => console.log('🚀 Сервер: http://localhost:' + PORT));
    })
    .catch(err => {
        console.error('❌ MongoDB ошибка:', err.message);
        process.exit(1);
    });