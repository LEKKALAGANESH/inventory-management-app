const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../middleware/upload');
const {
  getAllProducts,
  searchProducts,
  updateProduct,
  createProduct,
  importProducts,
  exportProducts,
  getProductHistory,
  deleteProduct
} = require('../controllers/productsController');

// Validation rules
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('status').trim().notEmpty().withMessage('Status is required')
];

// Routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/export', exportProducts);
router.get('/:id/history', getProductHistory);
router.post('/', productValidation, createProduct);
router.post('/import', upload.single('file'), importProducts);
router.put('/:id', productValidation, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
