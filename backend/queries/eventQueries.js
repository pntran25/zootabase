// ── Event & Event Booking Queries ───────────────────────────────────

// ── Helper: resolve or create exhibit ──

const findExhibit = `
  SELECT ExhibitID FROM Exhibit WHERE ExhibitName = @exhName
`;

const ensureEventsArea = `
  IF NOT EXISTS (SELECT 1 FROM Area WHERE AreaName = 'Events Space')
  BEGIN
      DECLARE @AreaOut TABLE (AreaID INT);
      INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID INTO @AreaOut VALUES ('Events Space');
      SELECT AreaID FROM @AreaOut;
  END
  ELSE BEGIN
      SELECT AreaID FROM Area WHERE AreaName = 'Events Space';
  END
`;

const createExhibit = `
  DECLARE @ExhOut TABLE (ExhibitID INT);
  INSERT INTO Exhibit (ExhibitName, AreaID, Capacity, OpeningHours)
  OUTPUT INSERTED.ExhibitID INTO @ExhOut
  VALUES (@newExhName, @areaId, 250, '09:00-17:00');
  SELECT ExhibitID FROM @ExhOut;
`;

// ── Event CRUD ──

const getAll = `
  SELECT e.*, ex.ExhibitName,
    ISNULL((SELECT SUM(Quantity) FROM EventBookings WHERE EventID = e.EventID), 0) AS SpotsBooked
  FROM Event e
  LEFT JOIN Exhibit ex ON e.ExhibitID = ex.ExhibitID
  WHERE e.DeletedAt IS NULL
`;

const insert = `
  DECLARE @Out TABLE (id INT);
  INSERT INTO Event (EventName, EventDate, EndDate, StartTime, EndTime, ExhibitID, Capacity, Description, Category, IsFeatured, Price, CreatedBy)
  OUTPUT INSERTED.EventID INTO @Out
  VALUES (@name, @date, @endDate, @startTime, @endTime, @exhId, @capacity, @description, @category, @isFeatured, @price, @createdBy);
  SELECT id FROM @Out;
`;

const update = `
  UPDATE Event
  SET EventName = @name, EventDate = @date, EndDate = @endDate,
      StartTime = @startTime, EndTime = @endTime, ExhibitID = @exhId,
      Capacity = @capacity, Description = @description, Category = @category,
      IsFeatured = @isFeatured, Price = @price,
      UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE EventID = @id
`;

const softDelete = `
  UPDATE Event SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE EventID = @id
`;

const updateImage = `
  UPDATE Event SET ImageUrl = @imageUrl WHERE EventID = @id
`;

// ── Event Bookings ──

const validateEvent = `
  SELECT EventDate, EndDate, Price, Capacity,
    ISNULL((SELECT SUM(Quantity) FROM EventBookings WHERE EventID = @evId), 0) AS SpotsBooked
  FROM Event WHERE EventID = @evId AND DeletedAt IS NULL
`;

const insertBooking = `
  DECLARE @Out TABLE (id INT);
  INSERT INTO EventBookings (EventID, BookingDate, Quantity, UnitPrice, Subtotal, Total,
      FirstName, LastName, Email, Phone, AddressLine1, AddressLine2, City, StateProvince, ZipCode,
      BillingSameAsContact, BillingFullName, BillingAddress1, BillingAddress2, BillingCity, BillingState, BillingZip,
      CardLastFour)
  OUTPUT INSERTED.EventBookingID INTO @Out
  VALUES (@eventId, @bookingDate, @quantity, @unitPrice, @subtotal, @total,
      @firstName, @lastName, @email, @phone, @addressLine1, @addressLine2, @city, @stateProvince, @zipCode,
      @billingSame, @billingFullName, @billingAddress1, @billingAddress2, @billingCity, @billingState, @billingZip,
      @cardLastFour);
  SELECT id FROM @Out;
`;

const listBookings = (conditions) => `
  SELECT eb.EventBookingID, eb.FirstName, eb.LastName, eb.Email,
         eb.BookingDate, eb.Quantity, eb.Total, eb.PlacedAt,
         e.EventName, e.Category
  FROM EventBookings eb
  JOIN Event e ON eb.EventID = e.EventID
  WHERE 1=1 ${conditions}
  ORDER BY eb.PlacedAt DESC
  OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
`;

const countBookings = (conditions) => `
  SELECT COUNT(*) AS total FROM EventBookings eb JOIN Event e ON eb.EventID = e.EventID WHERE 1=1 ${conditions}
`;

const getBookingById = `
  SELECT eb.*, e.EventName, e.Category, ex.ExhibitName AS Location
  FROM EventBookings eb
  JOIN Event e ON eb.EventID = e.EventID
  LEFT JOIN Exhibit ex ON e.ExhibitID = ex.ExhibitID
  WHERE eb.EventBookingID = @id
`;

module.exports = {
  findExhibit,
  ensureEventsArea,
  createExhibit,
  getAll,
  insert,
  update,
  softDelete,
  updateImage,
  validateEvent,
  insertBooking,
  listBookings,
  countBookings,
  getBookingById,
};
