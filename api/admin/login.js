const { supabase } = require('../_supabase');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username dan sandi wajib diisi!" });
    }

    // Query user dari Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      console.error('Error querying users from Supabase:', error);
      return res.status(500).json({ error: "Kegagalan internal database Supabase!" });
    }

    if (user) {
      return res.status(200).json({ 
        success: true, 
        token: "POBSI_BNA_SECRET_AUTH_TOKEN_2026",
        role: user.role,
        fullname: user.fullname,
        username: user.username
      });
    } else {
      return res.status(401).json({ error: "Username atau sandi administratif tidak cocok!" });
    }
  } catch (error) {
    console.error('Error inside admin login handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
