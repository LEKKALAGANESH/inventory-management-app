const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { validationResult } = require('express-validator');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await db.allAsync('SELECT * FROM products ORDER BY id DESC');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Search products by name
const searchProducts = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const products = await db.allAsync(
      'SELECT * FROM products WHERE name LIKE ? ORDER BY name',
      [`%${name}%`]
    );

    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, unit, category, brand, stock, status, image } = req.body;

  try {
    // Check if product exists
    const existingProduct = await db.getAsync('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check name uniqueness (case-insensitive) excluding current product
    const duplicateName = await db.getAsync(
      'SELECT id FROM products WHERE LOWER(name) = LOWER(?) AND id != ?',
      [name, id]
    );

    if (duplicateName) {
      return res.status(409).json({ error: 'Product name already exists' });
    }

    // Update product
    await db.runAsync(
      `UPDATE products 
       SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, unit, category, brand, stock, status, image || existingProduct.image, id]
    );

    // Track inventory changes
    if (existingProduct.stock !== stock) {
      await db.runAsync(
        `INSERT INTO inventory_history (product_id, old_quantity, new_quantity, user_info)
         VALUES (?, ?, ?, ?)`,
        [id, existingProduct.stock, stock, 'System Admin']
      );
    }

    const updatedProduct = await db.getAsync('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Create new product
const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, unit, category, brand, stock, status, image } = req.body;

  try {
    // Check name uniqueness (case-insensitive)
    const duplicate = await db.getAsync(
      'SELECT id FROM products WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    if (duplicate) {
      return res.status(409).json({ error: 'Product name already exists' });
    }

    // Insert product using callback to get lastID
    const productId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO products (name, unit, category, brand, stock, status, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, unit, category, brand, stock || 0, status, image || null],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });

    // Log initial stock if > 0
    if (stock > 0) {
      await db.runAsync(
        `INSERT INTO inventory_history (product_id, old_quantity, new_quantity, user_info)
         VALUES (?, ?, ?, ?)`,
        [productId, 0, stock, 'System Admin']
      );
    }

    const newProduct = await db.getAsync('SELECT * FROM products WHERE id = ?', [productId]);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Import products from CSV
const importProducts = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const results = [];
  const duplicates = [];
  let added = 0;
  let skipped = 0;

  try {
    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each product
    for (const row of results) {
      const { name, unit, category, brand, stock, status, image } = row;

      if (!name || !unit || !category || !brand) {
        skipped++;
        continue;
      }

      try {
        // Check for duplicate (case-insensitive)
        const existing = await db.getAsync(
          'SELECT name FROM products WHERE LOWER(name) = LOWER(?)',
          [name.trim()]
        );

        if (existing) {
          duplicates.push(name.trim());
          skipped++;
          continue;
        }

        // Insert product
        const stockValue = parseInt(stock) || 0;
        const result = await db.runAsync(
          `INSERT INTO products (name, unit, category, brand, stock, status, image)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            name.trim(),
            unit.trim(),
            category.trim(),
            brand.trim(),
            stockValue,
            status?.trim() || (stockValue > 0 ? 'In Stock' : 'Out of Stock'),
            image?.trim() || null
          ]
        );

        // Log initial inventory
        if (stockValue > 0) {
          await db.runAsync(
            `INSERT INTO inventory_history (product_id, old_quantity, new_quantity, user_info)
             VALUES (?, ?, ?, ?)`,
            [result.lastID, 0, stockValue, 'CSV Import']
          );
        }

        added++;
      } catch (error) {
        console.error(`Error importing product ${name}:`, error);
        skipped++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      added,
      skipped,
      duplicates,
      total: results.length
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to import CSV file' });
  }
};

// Export products to CSV
const exportProducts = async (req, res) => {
  try {
    const products = await db.allAsync('SELECT * FROM products ORDER BY id');

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products to export' });
    }

    // Build CSV content
    const headers = ['id', 'name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
    let csv = headers.join(',') + '\n';

    products.forEach(product => {
      const row = headers.map(header => {
        const value = product[header] || '';
        // Escape commas and quotes in values
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csv += row.join(',') + '\n';
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
};

// Get inventory history for a product
const getProductHistory = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await db.getAsync('SELECT name FROM products WHERE id = ?', [id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const history = await db.allAsync(
      `SELECT * FROM inventory_history 
       WHERE product_id = ? 
       ORDER BY change_date DESC`,
      [id]
    );

    res.json({
      product: product.name,
      history
    });
  } catch (error) {
    console.error('Error fetching product history:', error);
    res.status(500).json({ error: 'Failed to fetch product history' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await db.getAsync('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product (CASCADE will handle history)
    await db.runAsync('DELETE FROM products WHERE id = ?', [id]);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

module.exports = {
  getAllProducts,
  searchProducts,
  updateProduct,
  createProduct,
  importProducts,
  exportProducts,
  getProductHistory,
  deleteProduct
};
