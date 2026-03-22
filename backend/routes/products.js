const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure image directory exists
const imageDir = path.join(__dirname, '../../frontend/src/assets/images/Product_Images');
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imageDir),
    filename: (req, file, cb) => cb(null, 'product-' + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// GET all products
router.get('/api/products', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM Product WHERE DeletedAt IS NULL');
        const mappedResult = result.recordset.map(row => ({
            id: row.ProductID.toString(),
            name: row.ProductName,
            category: row.Category,
            price: row.Price,
            stockQuantity: row.StockQuantity,
            lowStockThreshold: row.LowStockThreshold ?? 10,
            imageUrl: row.ImageUrl || null,
        }));
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET low-stock products
router.get('/api/products/low-stock', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT ProductID, ProductName, Category, StockQuantity, LowStockThreshold, ImageUrl
            FROM Product
            WHERE DeletedAt IS NULL
              AND StockQuantity <= LowStockThreshold
            ORDER BY StockQuantity ASC
        `);
        res.json(result.recordset.map(row => ({
            id: row.ProductID.toString(),
            name: row.ProductName,
            category: row.Category,
            stockQuantity: row.StockQuantity,
            lowStockThreshold: row.LowStockThreshold ?? 10,
            imageUrl: row.ImageUrl || null,
        })));
    } catch (error) {
        console.error('Error fetching low-stock products:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new product
router.post('/api/products', async (req, res) => {
    try {
        const { name, category, price, stockQuantity, lowStockThreshold } = req.body;
        const pool = await connectToDb();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('category', sql.NVarChar, category)
            .input('price', sql.Decimal(10, 2), price)
            .input('stockQuantity', sql.Int, parseInt(stockQuantity, 10))
            .input('lowStockThreshold', sql.Int, parseInt(lowStockThreshold ?? 10, 10))
            .query(`
                DECLARE @Out TABLE (ProductID INT);
                INSERT INTO Product (ProductName, Category, Price, StockQuantity, LowStockThreshold)
                OUTPUT INSERTED.ProductID INTO @Out
                VALUES (@name, @category, @price, @stockQuantity, @lowStockThreshold);
                SELECT ProductID FROM @Out;
            `);
        res.status(201).json({ id: result.recordset[0].ProductID.toString(), ...req.body });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update product
router.put('/api/products/:id', async (req, res) => {
    try {
        const { name, category, price, stockQuantity, lowStockThreshold } = req.body;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('name', sql.NVarChar, name)
            .input('category', sql.NVarChar, category)
            .input('price', sql.Decimal(10, 2), price)
            .input('stockQuantity', sql.Int, parseInt(stockQuantity, 10))
            .input('lowStockThreshold', sql.Int, parseInt(lowStockThreshold ?? 10, 10))
            .query(`
                UPDATE Product
                SET ProductName = @name, Category = @category,
                    Price = @price, StockQuantity = @stockQuantity,
                    LowStockThreshold = @lowStockThreshold, UpdatedAt = SYSUTCDATETIME()
                WHERE ProductID = @id
            `);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST upload product image
router.post('/api/products/:id/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });
        const imageUrl = '/images/Product_Images/' + req.file.filename;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('imageUrl', sql.NVarChar, imageUrl)
            .query('UPDATE Product SET ImageUrl = @imageUrl, UpdatedAt = SYSUTCDATETIME() WHERE ProductID = @id');
        res.json({ message: 'Image uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE product (soft delete)
router.delete('/api/products/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query('UPDATE Product SET DeletedAt = SYSUTCDATETIME() WHERE ProductID = @id');
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
