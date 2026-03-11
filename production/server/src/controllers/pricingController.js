const pool = require('../db');

exports.getPricing = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM Pricing');
        const config = {};
        rows.forEach(r => config[r.key_name] = r.value);
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePricing = async (req, res) => {
    try {
        const { key_name, value } = req.body;
        await pool.execute('UPDATE Pricing SET value = ? WHERE key_name = ?', [value, key_name]);
        res.json({ message: 'Pricing updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
