-- Skrip Inisialisasi Database POBSI Banjarnegara di Supabase (PostgreSQL)

-- Hapus tabel jika sudah ada (Opsional, gunakan hati-hati)
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS boc_sirkuits CASCADE;
DROP TABLE IF EXISTS boc_settings CASCADE;

-- 1. Buat Tabel Players
CREATE TABLE players (
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
    address TEXT,
    cover TEXT,
    ktp TEXT
);

-- 2. Buat Tabel Standings
CREATE TABLE standings (
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
    boc_points TEXT, -- Disimpan sebagai JSON string
    PRIMARY KEY (name, year)
);

-- 3. Buat Tabel Events
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    "prizePool" TEXT,
    "entryFee" TEXT,
    contact TEXT NOT NULL,
    status TEXT DEFAULT 'Daftar',
    description TEXT,
    poster TEXT,
    type TEXT DEFAULT 'Home Tournament',
    bracket_size TEXT DEFAULT '16',
    elimination_type TEXT DEFAULT 'single',
    participants TEXT, -- Disimpan sebagai JSON string
    bracket TEXT,      -- Disimpan sebagai JSON string
    results TEXT,      -- Disimpan sebagai JSON string
    points_published INTEGER DEFAULT 0,
    max_hc TEXT DEFAULT 'Bebas'
);

-- 4. Buat Tabel Documents
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    "fileSize" TEXT,
    "fileType" TEXT DEFAULT 'PDF',
    "fileUrl" TEXT
);

-- 5. Buat Tabel Clubs
CREATE TABLE clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    abbr TEXT DEFAULT '-',
    address TEXT NOT NULL,
    owner TEXT DEFAULT '-',
    phone TEXT DEFAULT '-',
    tables INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Aktif',
    logo TEXT,
    cover TEXT
);

-- 6. Buat Tabel Users (Autentikasi RBAC Admin)
CREATE TABLE users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    fullname TEXT
);

-- 7. Buat Tabel Boc Sirkuits
CREATE TABLE boc_sirkuits (
    id SERIAL PRIMARY KEY,
    year TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    CONSTRAINT unique_year_name UNIQUE (year, name)
);

-- 8. Buat Tabel BOC Settings (Konfigurasi per Tahun)
CREATE TABLE boc_settings (
    year TEXT PRIMARY KEY,
    cutoff_limit INTEGER DEFAULT 16,
    max_handicap TEXT DEFAULT 'Bebas',
    playoff_schedule TEXT,
    prizes TEXT,
    rules TEXT,
    point_rules TEXT,
    status TEXT DEFAULT 'active',
    cover TEXT,
    recap_cover TEXT
);

-- Seed akun pengguna default (superadmin, admin, staff)
INSERT INTO users (username, password, role, fullname) VALUES 
('superadmin', 'super-pobsi-2026', 'super admin', 'Super Admin POBSI'),
('admin', 'admin-pobsi-2026', 'admin', 'Admin Utama POBSI'),
('staff', 'staff-pobsi-2026', 'staff', 'Staff Lapangan POBSI')
ON CONFLICT (username) DO NOTHING;

-- Nonaktifkan Row Level Security (RLS) agar API client dapat membaca/menulis data secara langsung 
-- (Cocok untuk setup awal/sederhana menyamai SQLite). Anda bisa mengaktifkannya kembali nanti dengan policy spesifik.
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE standings DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE boc_sirkuits DISABLE ROW LEVEL SECURITY;
ALTER TABLE boc_settings DISABLE ROW LEVEL SECURITY;

-- 9. Buat Tabel Matches
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
    opponent_name TEXT NOT NULL,
    opponent_club TEXT NOT NULL,
    opponent_avatar TEXT,
    score TEXT NOT NULL,
    outcome TEXT NOT NULL,
    date TEXT NOT NULL
);

-- 10. Buat Tabel Tournament History
CREATE TABLE tournament_history (
    id SERIAL PRIMARY KEY,
    player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    badge TEXT NOT NULL,
    class_name TEXT NOT NULL,
    icon TEXT NOT NULL
);

ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_history DISABLE ROW LEVEL SECURITY;

-- 11. Buat Tabel Handicap History
CREATE TABLE handicap_history (
    id SERIAL PRIMARY KEY,
    player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    from_hc TEXT NOT NULL,
    to_hc TEXT NOT NULL,
    reason TEXT NOT NULL,
    admin_name TEXT NOT NULL
);

-- 12. Buat Tabel Ranking History
CREATE TABLE ranking_history (
    id SERIAL PRIMARY KEY,
    player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    rank INTEGER NOT NULL
);

ALTER TABLE handicap_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history DISABLE ROW LEVEL SECURITY;

-- 12. Buat Tabel Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MIGRASI: Tambahkan kolom baru pada tabel clubs (untuk database yang sudah ada)
-- Jalankan query berikut di Supabase SQL Editor jika tabel clubs sudah ada
-- =============================================================================
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS abbr TEXT DEFAULT '-';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS cover TEXT;

