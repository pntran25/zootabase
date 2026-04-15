// ── Gift Shop Order Queries ─────────────────────────────────────────

const insert = `
  DECLARE @NewOrder TABLE (OrderID INT);
  INSERT INTO Orders (FirstName, LastName, Email, Phone, AddressLine1, AddressLine2, City, StateProvince,
       ZipCode, BillingSameAsShipping, CardLastFour, Subtotal, Shipping, Tax, Total, OrderItems)
  OUTPUT INSERTED.OrderID INTO @NewOrder
  VALUES (@FirstName, @LastName, @Email, @Phone, @AddressLine1, @AddressLine2, @City, @StateProvince,
       @ZipCode, @BillingSameAsShipping, @CardLastFour, @Subtotal, @Shipping, @Tax, @Total, @OrderItems);
  SELECT OrderID FROM @NewOrder;
`;

const list = (where) => `
  SELECT OrderID, FirstName, LastName,
         CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) AS FullName,
         Email, Phone, City, StateProvince, ZipCode,
         CardLastFour, Subtotal, Shipping, Tax, Total, PlacedAt
  FROM Orders ${where}
  ORDER BY PlacedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
`;

const count = (where) => `
  SELECT COUNT(*) AS total FROM Orders ${where}
`;

const getById = `
  SELECT *, CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) AS FullName FROM Orders WHERE OrderID = @id
`;

module.exports = { insert, list, count, getById };
