// Event Controller - Mengelola Agenda Turnamen / Acara POBSI
const { dbAll, dbGet, dbRun } = require('../config/db');

exports.getEvents = async (req, res) => {
  try {
    const events = await dbAll(`SELECT * FROM events`);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data event dari SQLite: " + error.message });
  }
};

exports.addEvent = async (req, res) => {
  const { title, date, venue, prizePool, entryFee, contact, description, status, poster, type, bracket_size, elimination_type, max_hc, participants, bracket, results } = req.body;
  if (!title || !date || !venue || !contact) {
    return res.status(400).json({ error: "Judul, tanggal, lokasi, dan kontak panitia wajib diisi!" });
  }

  try {
    const allEvents = await dbAll(`SELECT id FROM events`);
    let maxNum = 0;
    if (allEvents && allEvents.length > 0) {
      allEvents.forEach(e => {
        const num = parseInt(e.id.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      });
    }
    const nextNum = maxNum + 1;
    const id = `E${nextNum.toString().padStart(3, '0')}`;

    const newEvent = {
      id,
      title,
      date,
      venue,
      prizePool: prizePool || "-",
      entryFee: entryFee || "Gratis",
      contact,
      status: status || "Daftar",
      description: description || "",
      poster: poster || "images/event-poster.png",
      participants: participants || "[]",
      bracket: bracket || "{}",
      results: results || "{}",
      points_published: 0,
      type: type || "Home Tournament",
      bracket_size: bracket_size || "16",
      elimination_type: elimination_type || "single",
      max_hc: max_hc || "Bebas"
    };

    await dbRun(
      `INSERT INTO events (id, title, date, venue, prizePool, entryFee, contact, status, description, poster, participants, bracket, results, points_published, type, bracket_size, elimination_type, max_hc) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newEvent.id, newEvent.title, newEvent.date, newEvent.venue, newEvent.prizePool, newEvent.entryFee, newEvent.contact, newEvent.status, newEvent.description, newEvent.poster, newEvent.participants, newEvent.bracket, newEvent.results, 0, newEvent.type, newEvent.bracket_size, newEvent.elimination_type, newEvent.max_hc]
    );

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan event ke SQLite: " + error.message });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, date, venue, prizePool, entryFee, contact, description, status, poster, participants, bracket, results, points_published, type, bracket_size, elimination_type, max_hc } = req.body;

  try {
    await dbRun(
      `UPDATE events 
       SET title = ?, date = ?, venue = ?, prizePool = ?, entryFee = ?, contact = ?, description = ?, status = ?, poster = ?, participants = ?, bracket = ?, results = ?, points_published = ?, type = ?, bracket_size = ?, elimination_type = ?, max_hc = ?
       WHERE id = ?`,
      [title, date, venue, prizePool, entryFee, contact, description, status, poster, participants, bracket, results, points_published, type, bracket_size, elimination_type, max_hc, id]
    );
    res.json({ success: true, message: "Event updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui event di SQLite: " + error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun(`DELETE FROM events WHERE id = ?`, [id]);
    res.json({ success: true, message: "Event deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus event dari SQLite: " + error.message });
  }
};
