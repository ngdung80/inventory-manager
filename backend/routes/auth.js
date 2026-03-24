const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        // Simple string comparison for seeded users, else bcrypt
        let isValid = false;
        if (user.password === password) {
            isValid = true;
        } else {
            try {
                isValid = bcrypt.compareSync(password, user.password);
            } catch (e) {
                isValid = false;
            }
        }

        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '1d' }
        );
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName } });
    });
});

module.exports = router;
