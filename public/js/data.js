// Data Statis untuk Website POBSI Kabupaten Banjarnegara
const POBSI_DATA = {
  // 1. Data Papan Peringkat (Battle of Champions 2026)
  standings: [
    { rank: 1, name: "Aditya 'Gondrong' Prasetya", club: "Golden Banjarnegara", handicap: 5, points: 450, played: 12, won: 10, lost: 2, trend: "up" },
    { rank: 2, name: "Bambang Triyono", club: "Bara Billiard Club", handicap: 6, points: 410, played: 12, won: 9, lost: 3, trend: "up" },
    { rank: 3, name: "Hendra Wijaya", club: "Raya Pool Arena", handicap: 5, points: 380, played: 12, won: 8, lost: 4, trend: "stable" },
    { rank: 4, name: "Fajar 'Kancil' Nugroho", club: "Golden Banjarnegara", handicap: 4, points: 340, played: 11, won: 8, lost: 3, trend: "up" },
    { rank: 5, name: "Rian Hidayat", club: "Barometer Club", handicap: 4, points: 310, played: 12, won: 7, lost: 5, trend: "down" },
    { rank: 6, name: "Eko Prasetyo", club: "Bara Billiard Club", handicap: 5, points: 290, played: 10, won: 6, lost: 4, trend: "stable" },
    { rank: 7, name: "Dimas Saputra", club: "Raya Pool Arena", handicap: 3, points: 270, played: 11, won: 6, lost: 5, trend: "up" },
    { rank: 8, name: "Aris Munandar", club: "KONI Banjarnegara", handicap: 6, points: 260, played: 9, won: 6, lost: 3, trend: "down" },
    { rank: 9, name: "Taufik Hidayatullah", club: "Barometer Club", handicap: 5, points: 240, played: 12, won: 5, lost: 7, trend: "stable" },
    { rank: 10, name: "Wahyu Setiawan", club: "Golden Banjarnegara", handicap: 3, points: 220, played: 10, won: 5, lost: 5, trend: "up" }
  ],

  // 2. Data Lengkap Rekap Handicap Pemain (50 Pemain Realistis Banjarnegara)
  players: [
    { id: "P001", name: "Aditya 'Gondrong' Prasetya", club: "Golden Banjarnegara", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aditya", gender: "Laki-laki", age: 28, phone: "0812-3004-9811", address: "Kec. Banjarnegara, Kabupaten Banjarnegara" },
    { id: "P002", name: "Bambang Triyono", club: "Bara Billiard Club", handicap: 6, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Bambang", gender: "Laki-laki", age: 34, phone: "0812-3004-1290", address: "Kec. Mandiraja, Kabupaten Banjarnegara" },
    { id: "P003", name: "Hendra Wijaya", club: "Raya Pool Arena", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hendra", gender: "Laki-laki", age: 31, phone: "0812-3004-8933", address: "Kec. Purwanegara, Kabupaten Banjarnegara" },
    { id: "P004", name: "Fajar 'Kancil' Nugroho", club: "Golden Banjarnegara", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Fajar", gender: "Laki-laki", age: 23, phone: "0812-3004-5612", address: "Kec. Bawang, Kabupaten Banjarnegara" },
    { id: "P005", name: "Rian Hidayat", club: "Barometer Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rian", gender: "Laki-laki", age: 26, phone: "0812-3004-7429", address: "Kec. Purwareja Klampok, Kabupaten Banjarnegara" },
    { id: "P006", name: "Eko Prasetyo", club: "Bara Billiard Club", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Eko", gender: "Laki-laki", age: 29, phone: "0812-3004-3311", address: "Kec. Susukan, Kabupaten Banjarnegara" },
    { id: "P007", name: "Dimas Saputra", club: "Raya Pool Arena", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Dimas", gender: "Laki-laki", age: 21, phone: "0812-3004-4509", address: "Kec. Karangkobar, Kabupaten Banjarnegara" },
    { id: "P008", name: "Aris Munandar", club: "KONI Banjarnegara", handicap: 6, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aris", gender: "Laki-laki", age: 35, phone: "0812-3004-6782", address: "Kec. Kalibening, Kabupaten Banjarnegara" },
    { id: "P009", name: "Taufik Hidayatullah", club: "Barometer Club", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Taufik", gender: "Laki-laki", age: 32, phone: "0812-3004-9022", address: "Kec. Wanadadi, Kabupaten Banjarnegara" },
    { id: "P010", name: "Wahyu Setiawan", club: "Golden Banjarnegara", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Wahyu", gender: "Laki-laki", age: 20, phone: "0812-3004-1188", address: "Kec. Rakit, Kabupaten Banjarnegara" },
    { id: "P011", name: "Agung Wicaksono", club: "Bara Billiard Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Agung", gender: "Laki-laki", age: 27, phone: "0812-3004-5544", address: "Kec. Madukara, Kabupaten Banjarnegara" },
    { id: "P012", name: "Andi Wijaya", club: "Raya Pool Arena", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Andi", gender: "Laki-laki", age: 22, phone: "0812-3004-2233", address: "Kec. Sigaluh, Kabupaten Banjarnegara" },
    { id: "P013", name: "Budi Santoso", club: "Barometer Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Budi", gender: "Laki-laki", age: 30, phone: "0812-3004-1122", address: "Kec. Banjarnegara, Kabupaten Banjarnegara" },
    { id: "P014", name: "Candra Kirana", club: "Golden Banjarnegara", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kirana", gender: "Perempuan", age: 25, phone: "0812-3004-9988", address: "Kec. Bawang, Kabupaten Banjarnegara" },
    { id: "P015", name: "Deni Ramadhan", club: "KONI Banjarnegara", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Deni", gender: "Laki-laki", age: 24, phone: "0812-3004-4455", address: "Kec. Purwanegara, Kabupaten Banjarnegara" },
    { id: "P016", name: "Erwin Syahputra", club: "Raya Pool Arena", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Erwin", gender: "Laki-laki", age: 19, phone: "0812-3004-6677", address: "Kec. Mandiraja, Kabupaten Banjarnegara" },
    { id: "P017", name: "Farhan Mahendra", club: "Bara Billiard Club", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Farhan", gender: "Laki-laki", age: 28, phone: "0812-3004-8899", address: "Kec. Purwareja Klampok, Kabupaten Banjarnegara" },
    { id: "P018", name: "Gilang Permana", club: "Barometer Club", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Gilang", gender: "Laki-laki", age: 23, phone: "0812-3004-3344", address: "Kec. Susukan, Kabupaten Banjarnegara" },
    { id: "P019", name: "Heri Susanto", club: "Golden Banjarnegara", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Heri", gender: "Laki-laki", age: 33, phone: "0812-3004-5566", address: "Kec. Karangkobar, Kabupaten Banjarnegara" },
    { id: "P020", name: "Irfan Bachdim", club: "KONI Banjarnegara", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Irfan", gender: "Laki-laki", age: 35, phone: "0812-3004-7788", address: "Kec. Kalibening, Kabupaten Banjarnegara" },
    { id: "P021", name: "Joko Widodo", club: "Raya Pool Arena", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Joko", gender: "Laki-laki", age: 40, phone: "0812-3004-1234", address: "Kec. Wanadadi, Kabupaten Banjarnegara" },
    { id: "P022", name: "Kurniawan Dwi", club: "Bara Billiard Club", handicap: 6, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kurniawan", gender: "Laki-laki", age: 36, phone: "0812-3004-5678", address: "Kec. Rakit, Kabupaten Banjarnegara" },
    { id: "P023", name: "Lukman Hakim", club: "Barometer Club", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lukman", gender: "Laki-laki", age: 25, phone: "0812-3004-9012", address: "Kec. Madukara, Kabupaten Banjarnegara" },
    { id: "P024", name: "Mulyadi", club: "Golden Banjarnegara", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Mulyadi", gender: "Laki-laki", age: 29, phone: "0812-3004-3456", address: "Kec. Sigaluh, Kabupaten Banjarnegara" },
    { id: "P025", name: "Nugroho Adhi", club: "KONI Banjarnegara", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Nugroho", gender: "Laki-laki", age: 31, phone: "0812-3004-7890", address: "Kec. Banjarnegara, Kabupaten Banjarnegara" },
    { id: "P026", name: "Oki Setiawan", club: "Raya Pool Arena", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Oki", gender: "Laki-laki", age: 22, phone: "0812-3004-0987", address: "Kec. Bawang, Kabupaten Banjarnegara" },
    { id: "P027", name: "Pranoto", club: "Bara Billiard Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Pranoto", gender: "Laki-laki", age: 34, phone: "0812-3004-8765", address: "Kec. Purwanegara, Kabupaten Banjarnegara" },
    { id: "P028", name: "Qomaruddin", club: "Barometer Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Qomar", gender: "Laki-laki", age: 27, phone: "0812-3004-4321", address: "Kec. Mandiraja, Kabupaten Banjarnegara" },
    { id: "P029", name: "Rudi Hartono", club: "Golden Banjarnegara", handicap: 6, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rudi", gender: "Laki-laki", age: 38, phone: "0812-3004-2109", address: "Kec. Purwareja Klampok, Kabupaten Banjarnegara" },
    { id: "P030", name: "Slamet Riyadi", club: "KONI Banjarnegara", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Slamet", gender: "Laki-laki", age: 21, phone: "0812-3004-3210", address: "Kec. Susukan, Kabupaten Banjarnegara" },
    { id: "P031", name: "Toni Sucipto", club: "Raya Pool Arena", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Toni", gender: "Laki-laki", age: 30, phone: "0812-3004-5432", address: "Kec. Karangkobar, Kabupaten Banjarnegara" },
    { id: "P032", name: "Umar Syarif", club: "Bara Billiard Club", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Umar", gender: "Laki-laki", age: 26, phone: "0812-3004-7654", address: "Kec. Kalibening, Kabupaten Banjarnegara" },
    { id: "P033", name: "Vicky Prasetyo", club: "Barometer Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Vicky", gender: "Laki-laki", age: 28, phone: "0812-3004-9876", address: "Kec. Wanadadi, Kabupaten Banjarnegara" },
    { id: "P034", name: "Wawan Hermawan", club: "Golden Banjarnegara", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Wawan", gender: "Laki-laki", age: 32, phone: "0812-3004-2468", address: "Kec. Rakit, Kabupaten Banjarnegara" },
    { id: "P035", name: "Yanto 'Pace' Sugiarto", club: "KONI Banjarnegara", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Yanto", gender: "Laki-laki", age: 27, phone: "0812-3004-1357", address: "Kec. Madukara, Kabupaten Banjarnegara" },
    { id: "P036", name: "Zainal Abidin", club: "Raya Pool Arena", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zainal", gender: "Laki-laki", age: 24, phone: "0812-3004-9753", address: "Kec. Sigaluh, Kabupaten Banjarnegara" },
    { id: "P037", name: "Arif Rahman", club: "Barometer Club", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Arif", gender: "Laki-laki", age: 29, phone: "0812-3004-8642", address: "Kec. Banjarnegara, Kabupaten Banjarnegara" },
    { id: "P038", name: "Bagus Setiadi", club: "Golden Banjarnegara", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Bagus", gender: "Laki-laki", age: 20, phone: "0812-3004-7531", address: "Kec. Bawang, Kabupaten Banjarnegara" },
    { id: "P039", name: "Dharmawan", club: "Bara Billiard Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Dharmawan", gender: "Laki-laki", age: 31, phone: "0812-3004-6420", address: "Kec. Purwanegara, Kabupaten Banjarnegara" },
    { id: "P040", name: "Eka Nugraha", club: "KONI Banjarnegara", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Eka", gender: "Laki-laki", age: 25, phone: "0812-3004-5309", address: "Kec. Mandiraja, Kabupaten Banjarnegara" },
    { id: "P041", name: "Feri Irawan", club: "Raya Pool Arena", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Feri", gender: "Laki-laki", age: 33, phone: "0812-3004-4298", address: "Kec. Purwareja Klampok, Kabupaten Banjarnegara" },
    { id: "P042", name: "Guntur Triaji", club: "Barometer Club", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Guntur", gender: "Laki-laki", age: 22, phone: "0812-3004-3187", address: "Kec. Susukan, Kabupaten Banjarnegara" },
    { id: "P043", name: "Hadi Wijaya", club: "Golden Banjarnegara", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hadi", gender: "Laki-laki", age: 36, phone: "0812-3004-2076", address: "Kec. Karangkobar, Kabupaten Banjarnegara" },
    { id: "P044", name: "Indra Kahfi", club: "Bara Billiard Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Indra", gender: "Laki-laki", age: 26, phone: "0812-3004-1965", address: "Kec. Kalibening, Kabupaten Banjarnegara" },
    { id: "P045", name: "Jajang Mulyana", club: "KONI Banjarnegara", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jajang", gender: "Laki-laki", age: 24, phone: "0812-3004-0854", address: "Kec. Wanadadi, Kabupaten Banjarnegara" },
    { id: "P046", name: "Koko Arianto", club: "Raya Pool Arena", handicap: 5, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Koko", gender: "Laki-laki", age: 28, phone: "0812-3004-9743", address: "Kec. Rakit, Kabupaten Banjarnegara" },
    { id: "P047", name: "Luthfi Kamal", club: "Barometer Club", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Luthfi", gender: "Laki-laki", age: 23, phone: "0812-3004-8632", address: "Kec. Madukara, Kabupaten Banjarnegara" },
    { id: "P048", name: "Mochammad Sabillah", club: "Golden Banjarnegara", handicap: 6, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sabillah", gender: "Laki-laki", age: 30, phone: "0812-3004-7521", address: "Kec. Sigaluh, Kabupaten Banjarnegara" },
    { id: "P049", name: "Novri Setiawan", club: "Bara Billiard Club", handicap: 3, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Novri", gender: "Laki-laki", age: 21, phone: "0812-3004-6410", address: "Kec. Banjarnegara, Kabupaten Banjarnegara" },
    { id: "P050", name: "Okto Maniani", club: "KONI Banjarnegara", handicap: 4, status: "Aktif", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Okto", gender: "Laki-laki", age: 35, phone: "0812-3004-5300", address: "Kec. Bawang, Kabupaten Banjarnegara" }
  ],

  events: [
    {
      id: "E001",
      title: "RD HT",
      date: "10 Februari 2026",
      venue: "RD Billiard Club",
      prizePool: "Rp 5.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Selesai",
      description: "Sirkuit Home Tournament seri 1 di RD Billiard.",
      poster: "images/event-poster.png",
      participants: ["Doni Lalapo", "Pak Teguh RD", "Rafael JP", "Hendik PLT", "Dika Luminous", "Santo Quantum", "Satria Atlas", "Didon", "Ade Atlas", "Dodo RD"],
      results: {
        champion: "Doni Lalapo",
        runnerUp: "Pak Teguh RD",
        top4: ["Rafael JP", "Hendik PLT"],
        top8: ["Dika Luminous", "Santo Quantum", "Satria Atlas"]
      }
    },
    {
      id: "E002",
      title: "JP HT",
      date: "12 Maret 2026",
      venue: "JP Billiard Club",
      prizePool: "Rp 5.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Selesai",
      description: "Sirkuit Home Tournament seri 2 di JP Billiard.",
      poster: "images/event-poster.png",
      participants: ["Didon", "Edo Luminous", "Pak Teguh RD", "To'i PLT", "Rio RD", "Dodo RD", "Akbar", "Rafael JP", "Hendik PLT", "Ade Atlas", "Satria Atlas"],
      results: {
        champion: "Didon",
        runnerUp: "Edo Luminous",
        top4: ["Pak Teguh RD", "To'i PLT"],
        top8: ["Rio RD", "Dodo RD", "Akbar"]
      }
    },
    {
      id: "E003",
      title: "LMS HT",
      date: "15 April 2026",
      venue: "Luminous Billiard Arena",
      prizePool: "Rp 5.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Selesai",
      description: "Sirkuit Home Tournament seri 3 di Luminous Billiard.",
      poster: "images/event-poster.png",
      participants: ["Ageng PLT", "Rio RD", "Faiz PLT", "To'i PLT", "Ade Atlas", "Dodo RD", "Rafael JP", "Dika Luminous", "Pak Teguh RD", "Hendik PLT", "Santo Quantum", "Didon"],
      results: {
        champion: "Ageng PLT",
        runnerUp: "Rio RD",
        top4: ["Faiz PLT", "To'i PLT", "Ade Atlas"],
        top8: ["Dodo RD"]
      }
    },
    {
      id: "E004",
      title: "SYP HT",
      date: "18 Mei 2026",
      venue: "Surya Yudha Billiard Arena",
      prizePool: "Rp 5.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Selesai",
      description: "Sirkuit Home Tournament seri 4 di Surya Yudha Billiard.",
      poster: "images/event-poster.png",
      participants: ["Edo Luminous", "Pak Teguh RD", "Santo Quantum", "Akbar", "Rio RD", "Dodo RD", "Ageng PLT", "Dika Luminous", "To'i PLT", "Rafael JP", "Hendik PLT", "Satria Atlas", "Faiz PLT"],
      results: {
        champion: "Edo Luminous",
        runnerUp: "Pak Teguh RD",
        top4: ["Santo Quantum", "Akbar"],
        top8: ["Rio RD", "Dodo RD", "Ageng PLT"]
      }
    },
    {
      id: "E005",
      title: "RD HT (2)",
      date: "12 Juni 2026",
      venue: "RD Billiard Club",
      prizePool: "Rp 6.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Daftar",
      description: "Sirkuit Home Tournament seri 5 di RD Billiard.",
      poster: "images/event-poster.png",
      participants: []
    },
    {
      id: "E006",
      title: "JP HT (2)",
      date: "15 Juli 2026",
      venue: "JP Billiard Club",
      prizePool: "Rp 6.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Daftar",
      description: "Sirkuit Home Tournament seri 6 di JP Billiard.",
      poster: "images/event-poster.png",
      participants: []
    },
    {
      id: "E007",
      title: "LMS HT (2)",
      date: "20 Agustus 2026",
      venue: "Luminous Billiard Arena",
      prizePool: "Rp 6.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Daftar",
      description: "Sirkuit Home Tournament seri 7 di Luminous Billiard.",
      poster: "images/event-poster.png",
      participants: []
    },
    {
      id: "E008",
      title: "PLT HT",
      date: "10 September 2026",
      venue: "Platinum Billiard Club",
      prizePool: "Rp 6.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Daftar",
      description: "Sirkuit Home Tournament seri 8 di Platinum Billiard.",
      poster: "images/event-poster.png",
      participants: []
    },
    {
      id: "E009",
      title: "SYP HT (2)",
      date: "15 Oktober 2026",
      venue: "Surya Yudha Billiard Arena",
      prizePool: "Rp 6.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Daftar",
      description: "Sirkuit Home Tournament seri 9 di Surya Yudha Billiard.",
      poster: "images/event-poster.png",
      participants: []
    },
    {
      id: "E010",
      title: "RD HT (3)",
      date: "20 November 2026",
      venue: "RD Billiard Club",
      prizePool: "Rp 8.000.000",
      entryFee: "Rp 50.000",
      contact: "0821-1502-3944 (Sekretariat POBSI)",
      status: "Daftar",
      description: "Sirkuit Home Tournament seri 10 (Final Series) di RD Billiard.",
      poster: "images/event-poster.png",
      participants: []
    }
  ],

  // 4. Data Surat Edaran & Dokumen Administratif
  documents: [
    { id: "D001", title: "Surat Edaran Rapat Pengurus POBSI Banjarnegara.pdf", date: "15 April 2026", fileSize: "245 KB", fileType: "PDF" },
    { id: "D002", title: "SK Pengurus Cabang POBSI Kabupaten Banjarnegara Masa Bakti 2024-2028.pdf", date: "10 Januari 2024", fileSize: "1.2 MB", fileType: "PDF" },
    { id: "D003", title: "Buku Panduan Regulasi Turnamen Biliar POBSI.pdf", date: "05 Maret 2026", fileSize: "3.4 MB", fileType: "PDF" },
    { id: "D004", title: "Formulir Pendaftaran Klub Biliar Resmi KONI Banjarnegara.docx", date: "20 Mei 2026", fileSize: "98 KB", fileType: "DOCX" },
    { id: "D005", title: "Hasil Rapat Kerja Kabupaten (Rakerkab) POBSI Banjarnegara 2026.pdf", date: "02 Pebruari 2026", fileSize: "512 KB", fileType: "PDF" }
  ],

  // 5. Rumus Handicap Pertandingan (Sistem Race Biliar Standard)
  // Menghasilkan objek: { raceA: number, raceB: number, voorA: number, voorB: number }
  calculateRace: function(hcA, hcB) {
    const diff = Math.abs(hcA - hcB);
    const minHc = Math.min(hcA, hcB);
    const maxHc = Math.max(hcA, hcB);
    
    // Basis race default adalah 5 racks
    let raceA = 5;
    let raceB = 5;
    let voorA = 0;
    let voorB = 0;
    
    if (hcA === hcB) {
      // Jika handicap sama, race imbang (Race ke-5 atau sesuai kelas handicap)
      const baseRace = hcA === 3 ? 4 : (hcA === 4 ? 5 : (hcA === 5 ? 6 : 7));
      return {
        raceA: baseRace,
        raceB: baseRace,
        voorA: 0,
        voorB: 0,
        notes: `Handicap seimbang. Pertandingan dimainkan dengan Race ke-${baseRace} tanpa voor.`
      };
    }

    // Formula Standar POBSI untuk Perbedaan Handicap (Race Selisih)
    // Pemain dengan HC lebih rendah mendapat voor atau target race lebih kecil.
    // Contoh populer:
    // HC 3 vs HC 4 -> Race to 4 vs 5
    // HC 3 vs HC 5 -> Race to 3 vs 5 (atau 4 vs 6)
    // HC 3 vs HC 6 -> Race to 3 vs 6
    // HC 4 vs HC 5 -> Race to 5 vs 6
    // HC 4 vs HC 6 -> Race to 4 vs 6
    // HC 5 vs HC 6 -> Race to 6 vs 7

    if (minHc === 3 && maxHc === 4) {
      raceA = hcA === 3 ? 4 : 5;
      raceB = hcB === 3 ? 4 : 5;
    } else if (minHc === 3 && maxHc === 5) {
      raceA = hcA === 3 ? 3 : 5;
      raceB = hcB === 3 ? 3 : 5;
    } else if (minHc === 3 && maxHc === 6) {
      raceA = hcA === 3 ? 3 : 6;
      raceB = hcB === 3 ? 3 : 6;
    } else if (minHc === 4 && maxHc === 5) {
      raceA = hcA === 4 ? 5 : 6;
      raceB = hcB === 4 ? 5 : 6;
    } else if (minHc === 4 && maxHc === 6) {
      raceA = hcA === 4 ? 4 : 6;
      raceB = hcB === 4 ? 4 : 6;
    } else if (minHc === 5 && maxHc === 6) {
      raceA = hcA === 5 ? 6 : 7;
      raceB = hcB === 5 ? 6 : 7;
    } else {
      // General fallbacks
      const diffOffset = diff;
      if (hcA < hcB) {
        raceA = Math.max(3, 5 - Math.floor(diffOffset/2));
        raceB = 5 + Math.ceil(diffOffset/2);
      } else {
        raceA = 5 + Math.ceil(diffOffset/2);
        raceB = Math.max(3, 5 - Math.floor(diffOffset/2));
      }
    }

    return {
      raceA: raceA,
      raceB: raceB,
      voorA: hcA < hcB ? Math.abs(raceA - raceB) : 0,
      voorB: hcB < hcA ? Math.abs(raceA - raceB) : 0,
      notes: `Pemain handicap ${Math.min(hcA, hcB)} mendapatkan keringanan dengan target kemenangan lebih kecil (Race ${Math.min(raceA, raceB)} vs ${Math.max(raceA, raceB)}).`
    };
  },

  // 6. Data Klub Biliar Resmi di Bawah Naungan POBSI Banjarnegara
  clubs: [
    { id: "C001", name: "POBSI Banjarnegara", address: "Kompleks GOR KONI, Jl. Raya Banjarnegara", owner: "Pengcab POBSI", phone: "0821-1502-3944", tables: 4, status: "Aktif" },
    { id: "C002", name: "JP Billiard", address: "Jl. S. Parman, Banjarnegara", owner: "Manajemen JP", phone: "-", tables: 8, status: "Aktif" },
    { id: "C003", name: "RD Billiard", address: "Jl. Letjen Suprapto, Banjarnegara", owner: "Manajemen RD", phone: "-", tables: 6, status: "Aktif" },
    { id: "C004", name: "Platinum Billiard", address: "Jl. MT Haryono, Banjarnegara", owner: "Manajemen Platinum", phone: "-", tables: 10, status: "Aktif" },
    { id: "C005", name: "Luminous Billiard", address: "Jl. Pemuda, Banjarnegara", owner: "Manajemen Luminous", phone: "-", tables: 6, status: "Aktif" },
    { id: "C006", name: "Quantum Billiard", address: "Jl. Raya Banjarnegara", owner: "Manajemen Quantum", phone: "-", tables: 5, status: "Aktif" },
    { id: "C007", name: "Surya Yudha Billiard", address: "Hotel Surya Yudha, Banjarnegara", owner: "Surya Yudha Group", phone: "-", tables: 4, status: "Aktif" }
  ]
};
