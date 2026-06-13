-- Skrip Inisialisasi Database POBSI Banjarnegara di Supabase (PostgreSQL)

-- Hapus tabel jika sudah ada (Opsional, gunakan hati-hati)
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
    name TEXT PRIMARY KEY,
    club TEXT NOT NULL,
    handicap TEXT NOT NULL,
    points INTEGER NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    trend TEXT DEFAULT 'stable',
    boc_points TEXT -- Disimpan sebagai JSON string
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
    "fileType" TEXT DEFAULT 'PDF'
);

-- 5. Buat Tabel Clubs
CREATE TABLE clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner TEXT DEFAULT '-',
    phone TEXT DEFAULT '-',
    tables INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Aktif'
);

-- 6. Buat Tabel Users (Autentikasi RBAC Admin)
CREATE TABLE users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    fullname TEXT
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
