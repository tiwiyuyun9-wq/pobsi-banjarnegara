const { supabase, logActivity } = require('./_supabase');
const { uploadMedia } = require('./_media-upload');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ambil ID parameter jika ada (di-rewrite oleh vercel.json)
  const { id } = req.query;

  try {
    /* ==========================================================================
       GET: Mengambil Data Event
       ========================================================================== */
    if (req.method === 'GET') {
      if (id) {
        const { data: event, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!event) return res.status(404).json({ error: 'Event tidak ditemukan!' });
        return res.status(200).json(event);
      } else {
        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        return res.status(200).json(events);
      }
    }

    /* ==========================================================================
       POST: Menambahkan Event Baru
       ========================================================================== */
    if (req.method === 'POST') {
      const { title, date, venue, prizePool, entryFee, contact, description, status, poster, type, bracket_size, elimination_type, max_hc, participants, bracket, results } = req.body;
      if (!title || !date || !venue || !contact) {
        return res.status(400).json({ error: "Judul, tanggal, lokasi, dan kontak panitia wajib diisi!" });
      }

      // Ambil ID terbesar untuk generate ID berikutnya
      const { data: allEvents, error: fetchErr } = await supabase
        .from('events')
        .select('id');

      if (fetchErr) throw fetchErr;

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
      const newId = `E${nextNum.toString().padStart(3, '0')}`;

      const serialize = (val, fallback) => val ? (typeof val === 'object' ? JSON.stringify(val) : val) : fallback;

      let posterUrl = poster || "images/event-poster.png";
      if (poster && poster.includes(';base64,')) {
        posterUrl = await uploadMedia(poster, `event-poster-${newId}`, 'posters');
      }

      const newEvent = {
        id: newId,
        title: title.trim(),
        date: date.trim(),
        venue: venue.trim(),
        prizePool: prizePool || "-",
        entryFee: entryFee || "Gratis",
        contact: contact.trim(),
        status: status || "Daftar",
        description: description || "",
        poster: posterUrl,
        participants: serialize(participants, "[]"),
        bracket: serialize(bracket, "{}"),
        results: serialize(results, "{}"),
        points_published: 0,
        type: type || "Home Tournament",
        bracket_size: bracket_size || "16",
        elimination_type: elimination_type || "single",
        max_hc: max_hc || "Bebas"
      };

      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();

      if (error) throw error;

      await logActivity("Event BOC Series dibuat", `Event "${title}" berhasil ditambahkan ke agenda sirkuit`, "info", "fa-trophy");

      return res.status(201).json(data);
    }

    /* ==========================================================================
       PUT: Memperbarui Data Event
       ========================================================================== */
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: "ID event wajib diberikan!" });

      const { title, date, venue, prizePool, entryFee, contact, description, status, poster, participants, bracket, results, points_published, type, bracket_size, elimination_type, max_hc } = req.body;

      // Cek apakah event ada
      const { data: event, error: checkErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (!event) return res.status(404).json({ error: "Event tidak ditemukan!" });

      const serialize = (val, current) => val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : val) : current;

      let posterUrl = event.poster;
      if (poster !== undefined) {
        if (poster && poster.includes(';base64,')) {
          posterUrl = await uploadMedia(poster, `event-poster-${id}`, 'posters');
        } else {
          posterUrl = poster || "images/event-poster.png";
        }
      }

      const updated = {
        title: title !== undefined ? title.trim() : event.title,
        date: date !== undefined ? date.trim() : event.date,
        venue: venue !== undefined ? venue.trim() : event.venue,
        prizePool: prizePool !== undefined ? prizePool : event.prizePool,
        entryFee: entryFee !== undefined ? entryFee : event.entryFee,
        contact: contact !== undefined ? contact.trim() : event.contact,
        description: description !== undefined ? description : event.description,
        status: status !== undefined ? status : event.status,
        poster: posterUrl,
        participants: serialize(participants, event.participants),
        bracket: serialize(bracket, event.bracket),
        results: serialize(results, event.results),
        points_published: points_published !== undefined ? parseInt(points_published, 10) : event.points_published,
        type: type !== undefined ? type : event.type,
        bracket_size: bracket_size !== undefined ? bracket_size : event.bracket_size,
        elimination_type: elimination_type !== undefined ? elimination_type : event.elimination_type,
        max_hc: max_hc !== undefined ? max_hc : event.max_hc
      };

      const { error: updateErr } = await supabase
        .from('events')
        .update(updated)
        .eq('id', id);

      if (updateErr) throw updateErr;

      await logActivity("Event diperbarui", `Event "${title || event.title}" berhasil diperbarui`, "info", "fa-trophy");

      return res.status(200).json({ success: true, message: "Event updated successfully!" });
    }

    /* ==========================================================================
       DELETE: Menghapus Event
       ========================================================================== */
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: "ID event wajib diberikan!" });

      // Cek apakah event ada
      const { data: event, error: checkErr } = await supabase
        .from('events')
        .select('title')
        .eq('id', id)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (!event) return res.status(404).json({ error: "Event tidak ditemukan!" });

      const { error: deleteErr } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;

      await logActivity("Event dihapus", `Event "${event.title}" telah dihapus`, "danger", "fa-trash");

      return res.status(200).json({ success: true, message: "Event deleted successfully!" });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error processing request in api/events.js (${req.method}):`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
