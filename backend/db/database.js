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

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
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
            email TEXT,
            failed_attempts INTEGER DEFAULT 0,
            is_locked BOOLEAN DEFAULT 0
        )`, () => {
            // Migration for existing users table
            db.run("ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0", () => {});
            db.run("ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT 0", () => {});
        });

        // Token Blacklist Table
        db.run(`CREATE TABLE IF NOT EXISTS token_blacklist (
            token TEXT PRIMARY KEY,
            expires_at DATETIME
        )`);

        // Stock Movements Table (Audit Trail)
        db.run(`CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER,
            userId INTEGER,
            type TEXT, -- 'ADD', 'EDIT', 'REMOVE', 'SALE', 'PURCHASE'
            quantity INTEGER,
            reason TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(productId) REFERENCES products(id),
            FOREIGN KEY(userId) REFERENCES users(id)
        )`);

        // Wishlist Table (Customer Requests)
        db.run(`CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customerId INTEGER,
            productId INTEGER,
            salespersonId INTEGER,
            quantity INTEGER,
            notes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(customerId) REFERENCES customers(id),
            FOREIGN KEY(productId) REFERENCES products(id),
            FOREIGN KEY(salespersonId) REFERENCES users(id)
        )`);

        // Products Table (Thành viên 2)
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId TEXT UNIQUE,
            name TEXT,
            category TEXT,
            description TEXT,
            price REAL,
            stock INTEGER,
<<<<<<< HEAD
            expiryDate TEXT,
            supplierId TEXT,
=======
>>>>>>> ecb4fba843b408190d8a1a534d96a4f8f4336258
            reorderLevel INTEGER DEFAULT 0
        )`, (err) => {
            if (err) console.error("Create products error:", err.message);
            db.run("ALTER TABLE products ADD COLUMN reorderLevel INTEGER DEFAULT 0", (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error("Migrate products error:", err.message);
                }
            });
<<<<<<< HEAD
            db.run("ALTER TABLE products ADD COLUMN productId TEXT", (err) => {});
            db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_products_productid ON products(productId)", (err) => {});
            db.run("ALTER TABLE products ADD COLUMN category TEXT", (err) => {});
            db.run("ALTER TABLE products ADD COLUMN expiryDate TEXT", (err) => {});
            db.run("ALTER TABLE products ADD COLUMN supplierId TEXT", (err) => {});
=======
>>>>>>> ecb4fba843b408190d8a1a534d96a4f8f4336258
        });

        // Suppliers Table (Thành viên 3)
        db.run(`CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            contact TEXT
        )`);

        // Price History & Future Price Updates
        db.run(`CREATE TABLE IF NOT EXISTS price_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId TEXT,
            oldPrice REAL,
            newPrice REAL,
            effectiveDate TEXT,
            status TEXT DEFAULT 'APPLIED',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(productId) REFERENCES products(productId)
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
        )`, (err) => {
            if (err) console.error("Create orders error:", err.message);
            // Tự động nâng cấp (Migration) thêm cột cho CSDL cũ nếu tồn tại
            db.run("ALTER TABLE orders ADD COLUMN customerId INTEGER", (err) => {
                if (err && !err.message.includes('duplicate column name')) console.error("Migrate orders error 1:", err.message);
            });
            db.run("ALTER TABLE orders ADD COLUMN supplierId INTEGER", (err) => {
                if (err && !err.message.includes('duplicate column name')) console.error("Migrate orders error 2:", err.message);
            });
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
