const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');

// Update Profile
router.put('/profile', verifyToken, (req, res) => {
    const { fullName, email } = req.body; // Only extract safe fields
    db.run(
        'UPDATE users SET fullName = ?, email = ? WHERE id = ?',
        [fullName, email, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Profile updated successfully', fullName, email });
        }
    );
});

// Change Password
router.put('/password', verifyToken, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    db.get('SELECT password FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'User not found' });
        
        let isMatch = false;
        if (user.password === oldPassword) isMatch = true;
        else {
            try { isMatch = bcrypt.compareSync(oldPassword, user.password); } catch(e) {}
        }
        
        if (!isMatch) return res.status(400).json({ error: 'Mật khẩu cũ không chính xác' });
        
        const salt = bcrypt.genSaltSync(10);
        const hashed = bcrypt.hashSync(newPassword, salt);
        
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id], function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Password changed successfully' });
        });
    });
});

module.exports = router;
