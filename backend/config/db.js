const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

const dbPath = process.env.DB_PATH || './database.sqlite';

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to SQLite database');
});

// Promisify database methods for async/await
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));

// Initialize database schema
const initializeDatabase = async () => {
  try {
    // Create products table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        unit TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inventory history table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS inventory_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        old_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_info TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster queries
    await db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_product_name 
      ON products(name COLLATE NOCASE)
    `);

    await db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_history_product 
      ON inventory_history(product_id, change_date DESC)
    `);

    console.log('✓ Database schema initialized successfully');

    // Check if database is empty and add sample data
    const count = await db.getAsync('SELECT COUNT(*) as count FROM products');
    if (count.count === 0) {
      console.log('📦 Adding sample data...');
      await addSampleData();
    }
  } catch (error) {
    console.error('Failed to initialize database schema:', error.message);
    process.exit(1);
  }
};

// Add sample data
const addSampleData = async () => {
  const sampleProducts = [
    { name: 'Wireless Mouse', unit: 'pcs', category: 'Electronics', brand: 'Logitech', stock: 50, status: 'In Stock', image: null },
    { name: 'Mechanical Keyboard', unit: 'pcs', category: 'Electronics', brand: 'Corsair', stock: 25, status: 'In Stock', image: null },
    { name: 'USB-C Hub', unit: 'pcs', category: 'Electronics', brand: 'Anker', stock: 40, status: 'In Stock', image: null },
    { name: 'Laptop Stand', unit: 'pcs', category: 'Accessories', brand: 'Rain Design', stock: 15, status: 'In Stock', image: null },
    { name: 'Desk Lamp', unit: 'pcs', category: 'Furniture', brand: 'IKEA', stock: 30, status: 'In Stock', image: null },
    { name: 'Office Chair', unit: 'pcs', category: 'Furniture', brand: 'Herman Miller', stock: 8, status: 'In Stock', image: null },
    { name: 'Monitor 27 inch', unit: 'pcs', category: 'Electronics', brand: 'Dell', stock: 12, status: 'In Stock', image: null },
    { name: 'Webcam HD', unit: 'pcs', category: 'Electronics', brand: 'Logitech', stock: 0, status: 'Out of Stock', image: null },
    { name: 'Notebook A4', unit: 'pcs', category: 'Stationery', brand: 'Moleskine', stock: 150, status: 'In Stock', image: null },
    { name: 'Pen Set', unit: 'pcs', category: 'Stationery', brand: 'Parker', stock: 80, status: 'In Stock', image: null },
    { name: 'Coffee Maker', unit: 'pcs', category: 'Appliances', brand: 'Breville', stock: 5, status: 'In Stock', image: null },
    { name: 'Water Bottle', unit: 'pcs', category: 'Accessories', brand: 'Hydro Flask', stock: 45, status: 'In Stock', image: null },
    { name: 'Headphones Wireless', unit: 'pcs', category: 'Electronics', brand: 'Sony', stock: 0, status: 'Out of Stock', image: null },
    { name: 'Desk Organizer', unit: 'pcs', category: 'Accessories', brand: 'Umbra', stock: 35, status: 'In Stock', image: null },
    { name: 'Portable SSD 1TB', unit: 'pcs', category: 'Electronics', brand: 'Samsung', stock: 20, status: 'In Stock', image: null }
  ];

  try {
    for (const product of sampleProducts) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO products (name, unit, category, brand, stock, status, image)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [product.name, product.unit, product.category, product.brand, product.stock, product.status, product.image],
          function(err) {
            if (err) return reject(err);
            
            // Add initial inventory history for products with stock
            if (product.stock > 0) {
              db.run(
                `INSERT INTO inventory_history (product_id, old_quantity, new_quantity, user_info)
                 VALUES (?, ?, ?, ?)`,
                [this.lastID, 0, product.stock, 'Initial Data'],
                (err) => {
                  if (err) return reject(err);
                  resolve();
                }
              );
            } else {
              resolve();
            }
          }
        );
      });
    }
    console.log(`✓ Added ${sampleProducts.length} sample products`);
  } catch (error) {
    console.error('Failed to add sample data:', error.message);
  }
};

// Initialize on module load
initializeDatabase();

module.exports = db;
