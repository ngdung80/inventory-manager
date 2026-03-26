const jwt = require('jsonwebtoken');
const db = require('../db/database');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(403).json({ error: 'No token provided' });
    
    // Check if token is blacklisted
    db.get('SELECT token FROM token_blacklist WHERE token = ?', [token], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (row) return res.status(401).json({ error: 'Token is blacklisted. Please login again.' });
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');
            req.user = decoded;
            req.token = token; // Store token for logout
            next();
        } catch (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    });
};

module.exports = { verifyToken };
