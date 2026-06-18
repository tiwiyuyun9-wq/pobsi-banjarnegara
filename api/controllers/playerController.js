// Player Controller - Mengelola Data Atlet Handicap
const { dbAll, dbGet, dbRun } = require('../config/db');

exports.getPlayers = async (req, res) => {
  try {
    const players = await dbAll(`SELECT * FROM players`);
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data atlet dari SQLite: " + error.message });
  }
};

exports.addPlayer = async (req, res) => {
  const { name, club, handicap, points, avatar, gender, age, phone, address, cover, ktp } = req.body;
  if (!name || !club || !handicap) {
    return res.status(400).json({ error: "Nama, klub, dan handicap wajib diisi!" });
  }

  try {
    const allPlayers = await dbAll(`SELECT id FROM players`);
    let maxNum = 0;
    if (allPlayers && allPlayers.length > 0) {
      allPlayers.forEach(p => {
        const num = parseInt(p.id.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      });
    }
    const nextNum = maxNum + 1;
    const id = `P${nextNum.toString().padStart(3, '0')}`;

    const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    const newPlayer = {
      id,
      name,
      club,
      handicap: handicap.toString().trim(),
      status: "Aktif",
      points: parseFloat(points || 0.0),
      avatar: avatar && avatar.trim() ? avatar.trim() : defaultAvatar,
      gender: gender || "Laki-laki",
      age: age ? parseInt(age, 10) : 24,
      phone: phone && phone.trim() ? phone.trim() : "0812-XXXX-XXXX",
      address: address && address.trim() ? address.trim() : "Kabupaten Banjarnegara",
      cover: cover && cover.trim() ? cover.trim() : "",
      ktp: ktp && ktp.trim() ? ktp.trim() : ""
    };

    await dbRun(
      `INSERT INTO players (id, name, club, handicap, status, points, avatar, gender, age, phone, address, cover, ktp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newPlayer.id,
        newPlayer.name,
        newPlayer.club,
        newPlayer.handicap,
        newPlayer.status,
        newPlayer.points,
        newPlayer.avatar,
        newPlayer.gender,
        newPlayer.age,
        newPlayer.phone,
        newPlayer.address,
        newPlayer.cover,
        newPlayer.ktp
      ]
    );

    res.status(201).json(newPlayer);
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan atlet ke SQLite: " + error.message });
  }
};

exports.updatePlayer = async (req, res) => {
  const { id } = req.params;
  const { name, club, handicap, points, avatar, gender, age, phone, address, status, cover, ktp } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID atlet wajib diberikan!" });
  }

  try {
    // Check if player exists
    const player = await dbGet(`SELECT * FROM players WHERE id = ?`, [id]);
    if (!player) {
      return res.status(404).json({ error: "Atlet tidak ditemukan!" });
    }

    const updated = {
      name: name !== undefined ? name.trim() : player.name,
      club: club !== undefined ? club.trim() : player.club,
      handicap: handicap !== undefined ? handicap.toString().trim() : player.handicap,
      points: points !== undefined ? parseFloat(points) : player.points,
      avatar: avatar !== undefined ? avatar.trim() : player.avatar,
      gender: gender !== undefined ? gender : player.gender,
      age: age !== undefined ? parseInt(age, 10) : player.age,
      phone: phone !== undefined ? phone.trim() : player.phone,
      address: address !== undefined ? address.trim() : player.address,
      status: status !== undefined ? status : player.status,
      cover: cover !== undefined ? cover.trim() : player.cover,
      ktp: ktp !== undefined ? ktp.trim() : player.ktp
    };

    await dbRun(
      `UPDATE players SET name = ?, club = ?, handicap = ?, points = ?, avatar = ?, gender = ?, age = ?, phone = ?, address = ?, status = ?, cover = ?, ktp = ? WHERE id = ?`,
      [
        updated.name,
        updated.club,
        updated.handicap,
        updated.points,
        updated.avatar,
        updated.gender,
        updated.age,
        updated.phone,
        updated.address,
        updated.status,
        updated.cover,
        updated.ktp,
        id
      ]
    );

    // Also update standings if name changed or club changed or handicap changed
    if (name || club || handicap) {
      await dbRun(
        `UPDATE standings SET name = ?, club = ?, handicap = ? WHERE name = ?`,
        [updated.name, updated.club, updated.handicap, player.name]
      ).catch(() => null);
    }

    res.json({ success: true, message: `Data atlet ${id} berhasil diperbarui.`, player: { id, ...updated } });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui atlet di SQLite: " + error.message });
  }
};

exports.deletePlayer = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "ID atlet wajib diberikan!" });
  }

  try {
    const player = await dbGet(`SELECT name FROM players WHERE id = ?`, [id]);
    if (!player) {
      return res.status(404).json({ error: "Atlet tidak ditemukan!" });
    }
    
    // Delete from standings first
    await dbRun(`DELETE FROM standings WHERE name = ?`, [player.name]).catch(() => null);
    
    // Delete from players
    await dbRun(`DELETE FROM players WHERE id = ?`, [id]);
    
    res.json({ success: true, message: `Atlet ${id} berhasil dihapus.` });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus atlet dari SQLite: " + error.message });
  }
};
