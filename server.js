// Entry Point Server Express Utama - POBSI Banjarnegara
// Auto-install sqlite3 locally if missing (prevents Vercel deployment issues)
try {
  require('sqlite3');
} catch (e) {
  console.log('⚠️ sqlite3 tidak ditemukan secara lokal. Mengunduh dan menginstal sqlite3...');
  try {
    const { execSync } = require('child_process');
    execSync('npm install sqlite3@5.1.7 --no-save', { stdio: 'inherit' });
    console.log('✅ sqlite3 berhasil diinstal secara lokal!');
  } catch (err) {
    console.error('❌ Gagal menginstal sqlite3 secara otomatis:', err);
    process.exit(1);
  }
}

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

// Buat folder uploads jika belum ada untuk menampung file offline
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
  db.run(`ALTER TABLE players ADD COLUMN created_at TEXT`, () => {});

  // 2. Buat Tabel Standings
  db.run(`CREATE TABLE IF NOT EXISTS standings (
    rank INTEGER,
    name TEXT NOT NULL,
    year TEXT NOT NULL DEFAULT '2026',
    club TEXT NOT NULL,
    handicap TEXT NOT NULL,
    points INTEGER NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    trend TEXT DEFAULT 'stable',
    boc_points TEXT,
    PRIMARY KEY (name, year)
  )`);

  // Jalankan migrasi SQLite jika tabel standings lama belum memiliki kolom year
  db.all(`PRAGMA table_info(standings)`, (err, columns) => {
    if (err) {
      console.error("Gagal memeriksa informasi tabel standings SQLite:", err);
      return;
    }
    const hasYear = columns && columns.some(col => col.name === 'year');
    if (!hasYear && columns && columns.length > 0) {
      console.log("⚠️ Mengupgrade tabel standings SQLite ke format multi-tahun...");
      db.serialize(() => {
        db.run(`ALTER TABLE standings RENAME TO standings_old`);
        db.run(`CREATE TABLE standings (
          rank INTEGER,
          name TEXT NOT NULL,
          year TEXT NOT NULL DEFAULT '2026',
          club TEXT NOT NULL,
          handicap TEXT NOT NULL,
          points INTEGER NOT NULL,
          played INTEGER DEFAULT 0,
          won INTEGER DEFAULT 0,
          lost INTEGER DEFAULT 0,
          trend TEXT DEFAULT 'stable',
          boc_points TEXT,
          PRIMARY KEY (name, year)
        )`);
        db.run(`INSERT INTO standings (rank, name, year, club, handicap, points, played, won, lost, trend, boc_points)
                SELECT rank, name, '2026', club, handicap, points, played, won, lost, trend, boc_points FROM standings_old`);
        db.run(`DROP TABLE standings_old`);
        console.log("✅ Tabel standings SQLite berhasil di-upgrade ke multi-tahun!");
      });
    }
  });

  // Buat Tabel Boc Sirkuits
  db.run(`CREATE TABLE IF NOT EXISTS boc_sirkuits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    UNIQUE(year, name)
  )`);

  // Buat Tabel BOC Settings (Konfigurasi per Tahun)
  db.run(`CREATE TABLE IF NOT EXISTS boc_settings (
    year TEXT PRIMARY KEY,
    cutoff_limit INTEGER DEFAULT 16,
    max_handicap TEXT DEFAULT 'Bebas',
    playoff_schedule TEXT,
    prizes TEXT,
    rules TEXT,
    status TEXT DEFAULT 'active'
  )`);

  // Safely add point_rules column to support custom point calculations
  db.run(`ALTER TABLE boc_settings ADD COLUMN point_rules TEXT`, () => {});
  db.run(`ALTER TABLE boc_settings ADD COLUMN cover TEXT`, () => {});
  db.run(`ALTER TABLE boc_settings ADD COLUMN recap_cover TEXT`, () => {});

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

  // Safely add fileUrl column to support physical document downloads
  db.run(`ALTER TABLE documents ADD COLUMN fileUrl TEXT`, () => {});


  // 5. Buat Tabel Clubs
  db.run(`CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    abbr TEXT,
    address TEXT NOT NULL,
    owner TEXT DEFAULT '-',
    phone TEXT DEFAULT '-',
    tables INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Aktif',
    logo TEXT,
    cover TEXT
  )`);

  // Safely alter existing table to add logo, cover, & abbr columns if they don't exist yet
  db.run(`ALTER TABLE clubs ADD COLUMN logo TEXT`, () => {});
  db.run(`ALTER TABLE clubs ADD COLUMN cover TEXT`, () => {});
  db.run(`ALTER TABLE clubs ADD COLUMN abbr TEXT`, () => {});

  // 5. Buat Tabel Users (RBAC)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    fullname TEXT
  )`);

  // 6. Buat Tabel Matches
  db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT,
    opponent_name TEXT NOT NULL,
    opponent_club TEXT NOT NULL,
    opponent_avatar TEXT,
    score TEXT NOT NULL,
    outcome TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
  )`);

  // 7. Buat Tabel Tournament History
  db.run(`CREATE TABLE IF NOT EXISTS tournament_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    badge TEXT NOT NULL,
    class_name TEXT NOT NULL,
    icon TEXT NOT NULL,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
  )`);

  // 8. Buat Tabel Handicap History
  db.run(`CREATE TABLE IF NOT EXISTS handicap_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT,
    date TEXT NOT NULL,
    from_hc TEXT NOT NULL,
    to_hc TEXT NOT NULL,
    reason TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
  )`);

  // 9. Buat Tabel Ranking History
  db.run(`CREATE TABLE IF NOT EXISTS ranking_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT,
    date TEXT NOT NULL,
    rank INTEGER NOT NULL,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
  )`);

  // 10. Buat Tabel Activity Logs
  db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
   MOUNT MODULAR ROUTERS (SQLite Fallback / Supabase Router Proxy)
   ========================================================================== */
// Disable caching for all API responses in local development
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});


const isSupabaseEnabled = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;

if (isSupabaseEnabled) {
  console.log('☁️ Supabase Cloud Mode is ACTIVE locally! Proxying local routes to Supabase handlers...');
  
  // Require Serverless Handlers
  const playersHandler = require('./api/players');
  const standingsHandler = require('./api/standings');
  const dbStatusHandler = require('./api/_db-status');
  const eventsHandler = require('./api/events');
  const docsHandler = require('./api/docs');
  const clubsHandler = require('./api/clubs');
  const loginHandler = require('./api/admin/login');
  const usersHandler = require('./api/admin/users');
  const changePasswordHandler = require('./api/admin/change-password');
  const bocSirkuitsHandler = require('./api/boc-sirkuits');
  const bocSettingsHandler = require('./api/boc-settings');
  const athleteDataHandler = require('./api/athlete-data');
  const activityLogsHandler = require('./api/_activity-logs');
  const miscHandler = require('./api/misc');

  // helper function to bridge Express API signature and Vercel Serverless signature
  const bridge = (handler, idParam = null) => {
    return async (req, res) => {
      try {
        if (idParam && req.params[idParam]) {
          req.query = { ...req.query, [idParam]: req.params[idParam] };
        }
        await handler(req, res);
      } catch (err) {
        console.error('Bridge handler execution failed:', err);
        res.status(500).json({ error: err.message || 'Internal Bridge Error' });
      }
    };
  };

  // Players
  app.all('/api/players', bridge(playersHandler));
  app.all('/api/players/:id', bridge(playersHandler, 'id'));

  // Standings
  app.all('/api/standings/reset', bridge(standingsHandler));
  app.all('/api/standings/reindex', bridge(standingsHandler));
  app.all('/api/standings', bridge(standingsHandler));

  // Activity Logs (legacy route for backward compat)
  app.all('/api/activity-logs', bridge(activityLogsHandler));

  // DB Status (legacy route for backward compat)
  app.all('/api/db-status', bridge(dbStatusHandler));

  // Misc (consolidated endpoint for Vercel - activity-logs + db-status)
  app.all('/api/misc', bridge(miscHandler));

  // Sirkuits
  app.all('/api/boc-sirkuits', bridge(bocSirkuitsHandler));
  app.all('/api/boc-settings', bridge(bocSettingsHandler));

  // BOC Dev Reset (Testing)
  const bocResetHandler = require('./api/controllers/bocResetController');
  app.post('/api/boc/reset', async (req, res) => { try { await bocResetHandler.resetBoc(req, res); } catch(err) { res.status(500).json({ error: err.message }); } });

  // Events
  app.all('/api/events', bridge(eventsHandler));
  app.all('/api/events/:id', bridge(eventsHandler, 'id'));

  // Docs
  app.all('/api/docs', bridge(docsHandler));

  // Clubs
  app.all('/api/clubs', bridge(clubsHandler));
  app.all('/api/clubs/:id', bridge(clubsHandler, 'id'));

  // Admin Login
  app.all('/api/admin/login', bridge(loginHandler));
  app.all('/api/admin/users', bridge(usersHandler));
  app.all('/api/admin/change-password', bridge(changePasswordHandler));

  // Athlete Detail Data (matches, tournament-history, handicap-history, ranking-history)
  const athleteDataBridge = (type) => bridge((req, res) => {
    req.query = { ...req.query, type };
    return athleteDataHandler(req, res);
  });
  app.all('/api/matches', athleteDataBridge('matches'));
  app.all('/api/tournament-history', athleteDataBridge('tournament-history'));
  app.all('/api/handicap-history', athleteDataBridge('handicap-history'));
  app.all('/api/ranking-history', athleteDataBridge('ranking-history'));

} else {
  console.log('💾 SQLite Local Mode is ACTIVE! Using SQLite database handlers...');
  
  app.use('/api/players', require('./api/routes/playerRoutes'));
  app.use('/api/standings', require('./api/routes/standingRoutes'));
  app.use('/api/events', require('./api/routes/eventRoutes'));
  app.use('/api/docs', require('./api/routes/docRoutes'));
  app.use('/api/clubs', require('./api/routes/clubRoutes'));
  app.use('/api/boc-sirkuits', require('./api/routes/bocSirkuitsRoutes'));
  app.use('/api/boc-settings', require('./api/routes/bocSettingsRoutes'));
  app.use('/api/boc/reset', require('./api/routes/bocResetRoutes'));
  app.use('/api/matches', require('./api/routes/matchRoutes'));
  app.use('/api/tournament-history', require('./api/routes/tournamentHistoryRoutes'));
  app.use('/api/handicap-history', require('./api/routes/handicapHistoryRoutes'));
  app.use('/api/ranking-history', require('./api/routes/rankingHistoryRoutes'));
  app.use('/api/activity-logs', require('./api/routes/activityLogRoutes'));
  
  app.get('/api/db-status', (req, res) => {
    res.json({ database: 'SQLite' });
  });

  // Misc consolidated endpoint (mirrors Vercel structure for frontend compat)
  app.all('/api/misc', async (req, res) => {
    const { action } = req.query;
    if (action === 'db-status') {
      return res.json({ database: 'SQLite' });
    }
    if (action === 'activity-logs') {
      // Forward to activity log routes
      const activityLogController = require('./api/controllers/activityLogController');
      if (req.method === 'GET') return activityLogController.getActivityLogs(req, res);
      if (req.method === 'POST') return activityLogController.addActivityLog(req, res);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return res.status(400).json({ error: 'Unknown action' });
  });

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

  // Rute Pengelolaan Pengguna (CRUD) untuk Local Mode
  app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT username, role, fullname FROM users ORDER BY role`, (err, rows) => {
      if (err) {
        console.error("Gagal memuat users SQLite:", err);
        return res.status(500).json({ error: "Gagal memuat daftar pengelola!" });
      }
      res.json(rows);
    });
  });

  app.post('/api/admin/users', (req, res) => {
    const { username, password, fullname, role } = req.body;
    if (!username || !password || !fullname || !role) {
      return res.status(400).json({ error: "Seluruh input wajib diisi!" });
    }

    db.get(`SELECT username FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) {
        console.error("Gagal cek username SQLite:", err);
        return res.status(500).json({ error: "Database error!" });
      }
      if (row) {
        return res.status(400).json({ error: "Username sudah digunakan!" });
      }

      db.run(`INSERT INTO users (username, password, role, fullname) VALUES (?, ?, ?, ?)`, [username, password, role, fullname], (insertErr) => {
        if (insertErr) {
          console.error("Gagal insert user SQLite:", insertErr);
          return res.status(500).json({ error: "Gagal menyimpan pengelola baru!" });
        }
        res.json({ success: true, message: "Akun pengelola berhasil dibuat!" });
      });
    });
  });

  app.delete('/api/admin/users', (req, res) => {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Username tidak valid!" });
    }
    if (username === 'superadmin') {
      return res.status(400).json({ error: "Akun superadmin tidak boleh dihapus!" });
    }

    db.run(`DELETE FROM users WHERE username = ?`, [username], (err) => {
      if (err) {
        console.error("Gagal delete user SQLite:", err);
        return res.status(500).json({ error: "Gagal menghapus akun pengelola!" });
      }
      res.json({ success: true, message: "Akun pengelola berhasil dihapus!" });
    });
  });

  app.post('/api/admin/change-password', (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Seluruh kolom kata sandi wajib diisi!" });
    }

    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, currentPassword], (err, user) => {
      if (err) {
        console.error("Gagal verifikasi sandi SQLite:", err);
        return res.status(500).json({ error: "Database error!" });
      }
      if (!user) {
        return res.status(401).json({ error: "Kata sandi saat ini salah!" });
      }

      db.run(`UPDATE users SET password = ? WHERE username = ?`, [newPassword, username], (updateErr) => {
        if (updateErr) {
          console.error("Gagal update sandi SQLite:", updateErr);
          return res.status(500).json({ error: "Gagal memperbarui kata sandi!" });
        }
        res.json({ success: true, message: "Kata sandi berhasil diperbarui!" });
      });
    });
  });
}

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
// Trigger nodemon restart
