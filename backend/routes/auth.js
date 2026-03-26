const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
        
        // Check if account is locked
        if (user.is_locked) {
            return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa do nhập sai quá nhiều lần. Vui lòng liên hệ quản trị viên.' });
        }

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

        if (!isValid) {
            const newAttempts = (user.failed_attempts || 0) + 1;
            const isLocked = newAttempts >= 6;
            db.run('UPDATE users SET failed_attempts = ?, is_locked = ? WHERE id = ?', 
                [newAttempts, isLocked ? 1 : 0, user.id], 
                () => {
                    const remaining = 6 - newAttempts;
                    const msg = isLocked 
                        ? 'Tài khoản đã bị khóa.' 
                        : `Thông tin đăng nhập không chính xác. Bạn còn ${remaining} lần thử.`;
                    res.status(401).json({ error: msg });
                }
            );
            return;
        }
        
        // Reset failed attempts on success
        db.run('UPDATE users SET failed_attempts = 0 WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username }, 
            process.env.JWT_SECRET || 'super_secret_jwt_key_12345', 
            { expiresIn: '1d' }
        );
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName } });
    });
});

const { verifyToken } = require('../middleware/auth');
router.post('/logout', verifyToken, (req, res) => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
    db.run('INSERT INTO token_blacklist (token, expires_at) VALUES (?, ?)', [req.token, expiresAt], (err) => {
        if (err) return res.status(500).json({ error: 'Lỗi đăng xuất' });
        res.json({ message: 'Đã đăng xuất thành công' });
    });
});

module.exports = router;
