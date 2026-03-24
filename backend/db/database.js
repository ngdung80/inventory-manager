const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'store.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        verifyTables();
    }
});

function verifyTables() {
    db.serialize(() => {
        // Users Table (Thành viên 1)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT, -- admin, staff
            fullName TEXT,
            email TEXT
        )`);

        // Products Table (Thành viên 2)
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            stock INTEGER
        )`);

        // Suppliers Table (Thành viên 3)
        db.run(`CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            contact TEXT
        )`);

        // Customers Table (Thành viên 4)
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            address TEXT,
            requests TEXT
        )`);
        
        // Orders/Invoices Table (Thành viên 3 & 4)
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT, -- 'PURCHASE' or 'SALE'
            customerId INTEGER,
            supplierId INTEGER,
            totalAmount REAL,
            status TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            // Tự động nâng cấp (Migration) thêm cột cho CSDL cũ nếu tồn tại
            db.run("ALTER TABLE orders ADD COLUMN customerId INTEGER", () => {});
            db.run("ALTER TABLE orders ADD COLUMN supplierId INTEGER", () => {});
        });

        // Order Items Table for Receipt items
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orderId INTEGER,
            productId INTEGER,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY(orderId) REFERENCES orders(id),
            FOREIGN KEY(productId) REFERENCES products(id)
        )`);
        
        // Default admin user
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (row && row.count === 0) {
                db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', 'admin123', 'admin']);
            }
        });
    });
}

module.exports = db;
