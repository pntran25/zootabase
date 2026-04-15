// ── Product Queries ─────────────────────────────────────────────────

const getAll = `SELECT * FROM Product WHERE DeletedAt IS NULL`;

const getLowStock = `
  SELECT ProductID, ProductName, Category, StockQuantity, LowStockThreshold, ImageUrl
  FROM Product
  WHERE DeletedAt IS NULL
    AND StockQuantity <= LowStockThreshold
  ORDER BY StockQuantity ASC
`;

const insert = `
  DECLARE @Out TABLE (ProductID INT);
  INSERT INTO Product (ProductName, Category, Price, StockQuantity, LowStockThreshold, CreatedBy)
  OUTPUT INSERTED.ProductID INTO @Out
  VALUES (@name, @category, @price, @stockQuantity, @lowStockThreshold, @createdBy);
  SELECT ProductID FROM @Out;
`;

const update = `
  UPDATE Product
  SET ProductName = @name, Category = @category,
      Price = @price, StockQuantity = @stockQuantity,
      LowStockThreshold = @lowStockThreshold, UpdatedAt = SYSUTCDATETIME(),
      UpdatedBy = @updatedBy
  WHERE ProductID = @id
`;

const updateImage = `UPDATE Product SET ImageUrl = @imageUrl, UpdatedAt = SYSUTCDATETIME() WHERE ProductID = @id`;

const softDelete = `UPDATE Product SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE ProductID = @id`;

module.exports = { getAll, getLowStock, insert, update, updateImage, softDelete };
