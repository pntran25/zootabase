const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');

// GET all products
router.get('/api/products', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM Product WHERE DeletedAt IS NULL');
        
        const mappedResult = result.recordset.map(row => ({
            id: row.ProductID.toString(),
            name: row.ProductName,
            sku: row.SKU || '',
            category: row.Category,
            price: row.Price,
            stockQuantity: row.StockQuantity
        }));
        
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST new product
router.post('/api/products', async (req, res) => {
    try {
        const { name, sku, category, price, stockQuantity } = req.body;
        const pool = await connectToDb();
        
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('sku', sql.NVarChar, sku)
            .input('category', sql.NVarChar, category)
            .input('price', sql.Decimal(10, 2), price)
            .input('stockQuantity', sql.Int, parseInt(stockQuantity, 10))
            .query(`
                DECLARE @Out TABLE (ProductID INT);
                INSERT INTO Product (ProductName, SKU, Category, Price, StockQuantity)
                OUTPUT INSERTED.ProductID INTO @Out
                VALUES (@name, @sku, @category, @price, @stockQuantity);
                SELECT ProductID FROM @Out;
            `);
            
        res.status(201).json({ id: result.recordset[0].ProductID.toString(), ...req.body });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT update product
router.put('/api/products/:id', async (req, res) => {
    try {
        const { name, sku, category, price, stockQuantity } = req.body;
        const pool = await connectToDb();
        
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('name', sql.NVarChar, name)
            .input('sku', sql.NVarChar, sku)
            .input('category', sql.NVarChar, category)
            .input('price', sql.Decimal(10, 2), price)
            .input('stockQuantity', sql.Int, parseInt(stockQuantity, 10))
            .query(`
                UPDATE Product 
                SET ProductName = @name, SKU = @sku, Category = @category, 
                    Price = @price, StockQuantity = @stockQuantity, UpdatedAt = SYSUTCDATETIME()
                WHERE ProductID = @id
            `);
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
