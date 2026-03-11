const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.createOrder = async (req, res) => {
    try {
        const { items, totalAmount } = req.body;
        const userId = req.user?.id || null;
        const orderId = `ORD-${uuidv4().substr(0, 8).toUpperCase()}`;

        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Create Order
            await connection.execute(
                'INSERT INTO Orders (id, user_id, total_amount, status) VALUES (?, ?, ?, ?)',
                [orderId, userId, totalAmount, 'pending']
            );

            // 2. Add Items
            for (const item of items) {
                await connection.execute(
                    'INSERT INTO OrderItems (order_id, file_name, original_file_path, gcode_path, filament_grams, print_time_seconds, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [orderId, item.fileName, item.originalPath, item.gcodePath, item.grams, item.printTime, item.price]
                );
            }

            await connection.commit();
            res.status(201).json({ success: true, orderId });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const [orders] = await pool.execute('SELECT * FROM Orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT O.*, U.name as user_name 
            FROM Orders O 
            LEFT JOIN Users U ON O.user_id = U.id 
            ORDER BY O.created_at DESC
        `);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
