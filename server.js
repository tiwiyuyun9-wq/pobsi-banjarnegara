// Entry Point Server Express Utama - POBSI Banjarnegara
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { db, DB_FILE } = require('./api/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Sajikan Aset Statis Frontend dari Folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

/* ==========================================================================
   INISIALISASI SKEMA DATABASE & SEEDING OTOMATIS (OFFLINE-FIRST)
   ========================================================================== */
db.serialize(() => {
  // 1. Buat Tabel Players
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    club TEXT NOT NULL,
    handicap TEXT NOT NULL,
    status TEXT DEFAULT 'Aktif',
    points REAL DEFAULT 0.0,
    avatar TEXT,
    gender TEXT,
    age INTEGER,
    phone TEXT,
    address TEXT
  )`);

  // Safely add cover and ktp columns to support upload integrations (ignores error if columns already exist)
  db.run(`ALTER TABLE players ADD COLUMN cover TEXT`, () => {});
  db.run(`ALTER TABLE players ADD COLUMN ktp TEXT`, () => {});

  // 2. Buat Tabel Standings
  db.run(`CREATE TABLE IF NOT EXISTS standings (
    rank INTEGER,
    name TEXT PRIMARY KEY,
    club TEXT NOT NULL,
    handicap TEXT NOT NULL,
    points INTEGER NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    trend TEXT DEFAULT 'stable',
    boc_points TEXT
  )`);

  // Safely add boc_points column to standings for existing databases
  db.run(`ALTER TABLE standings ADD COLUMN boc_points TEXT`, () => {});

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    prizePool TEXT,
    entryFee TEXT,
    contact TEXT NOT NULL,
    status TEXT DEFAULT 'Daftar',
    description TEXT,
    poster TEXT,
    type TEXT DEFAULT 'Home Tournament',
    bracket_size TEXT DEFAULT '16',
    elimination_type TEXT DEFAULT 'single'
  )`);

  // Safely add new columns to events to support rich details (participants list, bracket, results, points publish status, event type, bracket size)
  db.run(`ALTER TABLE events ADD COLUMN participants TEXT`, () => {});
  db.run(`ALTER TABLE events ADD COLUMN bracket TEXT`, () => {});
  db.run(`ALTER TABLE events ADD COLUMN results TEXT`, () => {});
  db.run(`ALTER TABLE events ADD COLUMN points_published INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE events ADD COLUMN type TEXT DEFAULT 'Home Tournament'`, () => {});
  db.run(`ALTER TABLE events ADD COLUMN bracket_size TEXT DEFAULT '16'`, () => {});
  db.run(`ALTER TABLE events ADD COLUMN elimination_type TEXT DEFAULT 'single'`, () => {});
  db.run(`ALTER TABLE events ADD COLUMN max_hc TEXT DEFAULT 'Bebas'`, () => {});


  // 4. Buat Tabel Documents
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    fileSize TEXT,
    fileType TEXT DEFAULT 'PDF'
  )`);

  // 5. Buat Tabel Clubs
  db.run(`CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner TEXT DEFAULT '-',
    phone TEXT DEFAULT '-',
    tables INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Aktif'
  )`);

  // 5. Buat Tabel Users (RBAC)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    fullname TEXT
  )`);

  // Lakukan Seeding Otomatis Akun Pengguna jika tabel users kosong
  db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
    if (err) {
      console.error("Gagal mengecek isi tabel users:", err);
      return;
    }
    if (row.count === 0) {
      console.log("⚠️ Tabel users kosong! Memulai seeding akun bawaan (superadmin, admin, staff)...");
      const stmt = db.prepare(`INSERT INTO users (username, password, role, fullname) VALUES (?, ?, ?, ?)`);
      stmt.run('superadmin', 'super-pobsi-2026', 'super admin', 'Super Admin POBSI');
      stmt.run('admin', 'admin-pobsi-2026', 'admin', 'Admin Utama POBSI');
      stmt.run('staff', 'staff-pobsi-2026', 'staff', 'Staff Lapangan POBSI');
      stmt.finalize();
      console.log("✅ Berhasil menyemai akun pengguna administratif (RBAC)!");
    }
  });

  // Lakukan Seeding Otomatis jika database masih kosong kosong
  db.get(`SELECT COUNT(*) as count FROM players`, (err, row) => {
    if (err) {
      console.error("Gagal mengecek isi tabel players:", err);
      return;
    }

    if (row.count === 0) {
      console.log("⚠️ Database SQLite kosong! Memulai seeding data awal dari db.json...");
      
      const dbJsonFile = path.join(__dirname, 'api', 'data', 'db.json');
      if (fs.existsSync(dbJsonFile)) {
        try {
          const rawJson = fs.readFileSync(dbJsonFile, 'utf8');
          const seedData = JSON.parse(rawJson);

          // Seeding Players
          if (seedData.players && seedData.players.length > 0) {
            const stmt = db.prepare(`INSERT INTO players (id, name, club, handicap, status, points, avatar, gender, age, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            seedData.players.forEach(p => {
              const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.name)}`;
              stmt.run(p.id, p.name, p.club, p.handicap, p.status || 'Aktif', p.points || 0.0, p.avatar || defaultAvatar, p.gender || 'Laki-laki', p.age || 24, p.phone || '0812-XXXX-XXXX', p.address || 'Kabupaten Banjarnegara');
            });
            stmt.finalize();
            console.log(`✅ Berhasil menyalin ${seedData.players.length} atlet ke tabel 'players'.`);
          }

          // Seeding Standings
          if (seedData.standings && seedData.standings.length > 0) {
            const stmt = db.prepare(`INSERT INTO standings (rank, name, club, handicap, points, played, won, lost, trend) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            seedData.standings.forEach(s => {
              stmt.run(s.rank, s.name, s.club, s.handicap, s.points, s.played, s.won, s.lost, s.trend || 'stable');
            });
            stmt.finalize();
            console.log(`✅ Berhasil menyalin ${seedData.standings.length} peringkat ke tabel 'standings'.`);
          }

          // Seeding Events
          if (seedData.events && seedData.events.length > 0) {
            const stmt = db.prepare(`INSERT INTO events (id, title, date, venue, prizePool, entryFee, contact, status, description, poster) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            seedData.events.forEach(e => {
              stmt.run(e.id, e.title, e.date, e.venue, e.prizePool, e.entryFee, e.contact, e.status, e.description, e.poster || 'images/event-poster.png');
            });
            stmt.finalize();
            console.log(`✅ Berhasil menyalin ${seedData.events.length} event ke tabel 'events'.`);
          }

          // Seeding Documents
          if (seedData.documents && seedData.documents.length > 0) {
            const stmt = db.prepare(`INSERT INTO documents (id, title, date, fileSize, fileType) VALUES (?, ?, ?, ?, ?)`);
            seedData.documents.forEach(d => {
              stmt.run(d.id, d.title, d.date, d.fileSize, d.fileType || 'PDF');
            });
            stmt.finalize();
            console.log(`✅ Berhasil menyalin ${seedData.documents.length} dokumen ke tabel 'documents'.`);
          }

          // Seeding Clubs
          if (seedData.clubs && seedData.clubs.length > 0) {
            const stmt = db.prepare(`INSERT INTO clubs (id, name, address, owner, phone, tables, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            seedData.clubs.forEach(c => {
              stmt.run(c.id, c.name, c.address, c.owner || '-', c.phone || '-', c.tables || 0, c.status || 'Aktif');
            });
            stmt.finalize();
            console.log(`✅ Berhasil menyalin ${seedData.clubs.length} klub ke tabel 'clubs'.`);
          }

          console.log("🎉 Seeding database SQLite sukses 100%!");
        } catch (parseErr) {
          console.error("Gagal melakukan parse db.json untuk seeding:", parseErr);
        }
      } else {
        console.warn("⚠️ File cadangan db.json tidak ditemukan. Melewati proses seeding otomatis.");
      }
    }
  });
});

/* ==========================================================================
   MOUNT MODULAR ROUTERS
   ========================================================================== */
// Disable caching for all API responses in local development
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/api/players', require('./api/routes/playerRoutes'));
app.use('/api/standings', require('./api/routes/standingRoutes'));
app.use('/api/events', require('./api/routes/eventRoutes'));
app.use('/api/docs', require('./api/routes/docRoutes'));
app.use('/api/clubs', require('./api/routes/clubRoutes'));

// Rute Autentikasi Admin Rahasia (RBAC)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan sandi wajib diisi!" });
  }

  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, user) => {
    if (err) {
      console.error("Gagal query SQLite users:", err);
      return res.status(500).json({ error: "Kegagalan internal database!" });
    }
    if (user) {
      res.json({ 
        success: true, 
        token: "POBSI_BNA_SECRET_AUTH_TOKEN_2026",
        role: user.role,
        fullname: user.fullname,
        username: user.username
      });
    } else {
      res.status(401).json({ error: "Username atau sandi administratif tidak cocok!" });
    }
  });
});

// Fallback untuk SPA: Sajikan index.html jika ada rute frontend tak dikenal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan Server Lokal
app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`🚀 Server Lokal POBSI Banjarnegara (SQLite) Aktif!`);
  console.log(`💻 Buka di browser: http://localhost:${PORT}`);
  console.log(`💾 Menggunakan Database SQL: ${DB_FILE}`);
  console.log(`===========================================================`);
});
