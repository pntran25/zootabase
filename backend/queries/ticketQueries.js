// ── Ticket Queries (Types, Packages, Addons, Orders) ────────────────

// ── Ticket Types ──

const getAllTypes = `
  SELECT * FROM TicketType WHERE DeletedAt IS NULL
`;

const insertType = `
  DECLARE @Out TABLE (TicketTypeID INT);
  INSERT INTO TicketType (TypeName, Category, Description, BasePrice, CreatedBy)
  OUTPUT INSERTED.TicketTypeID INTO @Out VALUES (@type, @category, @desc, @price, @createdBy);
  SELECT TicketTypeID FROM @Out;
`;

const updateType = `
  UPDATE TicketType
  SET TypeName = @type, Category = @category, Description = @desc,
      BasePrice = @price, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE TicketTypeID = @id
`;

const deleteType = `
  UPDATE TicketType SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE TicketTypeID = @id
`;

// ── Ticket Packages ──

const getAllPackages = `
  SELECT PackageID, Name, Description, AdultPrice, ChildPrice, SeniorPrice,
         IsMostPopular, Features, SortOrder
  FROM TicketPackage WHERE DeletedAt IS NULL ORDER BY SortOrder
`;

const insertPackage = `
  INSERT INTO TicketPackage (Name,Description,AdultPrice,ChildPrice,SeniorPrice,IsMostPopular,Features,SortOrder)
  OUTPUT INSERTED.PackageID VALUES (@Name,@Description,@AdultPrice,@ChildPrice,@SeniorPrice,@IsMostPopular,@Features,@SortOrder)
`;

const updatePackage = `
  UPDATE TicketPackage SET
    Name=@Name, Description=@Description,
    AdultPrice=@AdultPrice, ChildPrice=@ChildPrice, SeniorPrice=@SeniorPrice,
    IsMostPopular=@IsMostPopular, Features=@Features, SortOrder=@SortOrder,
    UpdatedAt=SYSUTCDATETIME()
  WHERE PackageID=@id AND DeletedAt IS NULL
`;

const deletePackage = `
  UPDATE TicketPackage SET DeletedAt=SYSUTCDATETIME() WHERE PackageID=@id
`;

// ── Ticket Addons ──

const getAllAddons = `
  SELECT AddonID, Name, Description, Price, SortOrder FROM TicketAddon WHERE DeletedAt IS NULL ORDER BY SortOrder
`;

const insertAddon = `
  INSERT INTO TicketAddon (Name,Description,Price,SortOrder) OUTPUT INSERTED.AddonID VALUES (@Name,@Description,@Price,@SortOrder)
`;

const updateAddon = `
  UPDATE TicketAddon SET Name=@Name, Description=@Description, Price=@Price, SortOrder=@SortOrder, UpdatedAt=SYSUTCDATETIME()
  WHERE AddonID=@id AND DeletedAt IS NULL
`;

const deleteAddon = `
  UPDATE TicketAddon SET DeletedAt=SYSUTCDATETIME() WHERE AddonID=@id
`;

// ── Ticket Orders ──

const insertOrder = `
  INSERT INTO TicketOrders (CustomerID, FirstName, LastName, Email, Phone,
       AddressLine1, AddressLine2, City, StateProvince, ZipCode,
       BillingSameAsContact, BillingFullName, BillingAddress1, BillingAddress2,
       BillingCity, BillingState, BillingZip,
       VisitDate, TicketType, AdultQty, ChildQty, SeniorQty,
       AdultUnitPrice, ChildUnitPrice, SeniorUnitPrice,
       AddOns, CardLastFour, Subtotal, Total)
  OUTPUT INSERTED.TicketOrderID
  VALUES (@CustomerID, @FirstName, @LastName, @Email, @Phone,
       @AddressLine1, @AddressLine2, @City, @StateProvince, @ZipCode,
       @BillingSameAsContact, @BillingFullName, @BillingAddress1, @BillingAddress2,
       @BillingCity, @BillingState, @BillingZip,
       @VisitDate, @TicketType, @AdultQty, @ChildQty, @SeniorQty,
       @AdultUnitPrice, @ChildUnitPrice, @SeniorUnitPrice,
       @AddOns, @CardLastFour, @Subtotal, @Total)
`;

const listOrders = (where) => `
  SELECT TicketOrderID, FirstName, LastName,
         CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) AS FullName,
         Email, VisitDate, TicketType, AdultQty, ChildQty, SeniorQty, Total, CardLastFour, PlacedAt
  FROM TicketOrders ${where}
  ORDER BY PlacedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
`;

const countOrders = (where) => `
  SELECT COUNT(*) AS total FROM TicketOrders ${where}
`;

const getOrderById = `
  SELECT *, CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) AS FullName FROM TicketOrders WHERE TicketOrderID = @id
`;

module.exports = {
  getAllTypes,
  insertType,
  updateType,
  deleteType,
  getAllPackages,
  insertPackage,
  updatePackage,
  deletePackage,
  getAllAddons,
  insertAddon,
  updateAddon,
  deleteAddon,
  insertOrder,
  listOrders,
  countOrders,
  getOrderById,
};
