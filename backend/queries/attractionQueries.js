// ── Attraction CRUD Queries ─────────────────────────────────────────

const getAll = `
  SELECT a.*, e.ExhibitName
  FROM Attraction a
  LEFT JOIN Exhibit e ON a.ExhibitID = e.ExhibitID
  WHERE a.DeletedAt IS NULL
`;

const insert = `
  DECLARE @Out TABLE (AttractionID INT);
  INSERT INTO Attraction (AttractionName, AttractionType, LocationDesc, ExhibitID, CapacityVisitors, ActiveFlag, Description, Hours, Duration, AgeGroup, Price, CreatedBy)
  OUTPUT INSERTED.AttractionID INTO @Out
  VALUES (@name, @type, @location, @exhibitId, @capacity, @activeFlag, @description, @hours, @duration, @ageGroup, @price, @createdBy);
  SELECT AttractionID FROM @Out;
`;

const update = `
  UPDATE Attraction
  SET AttractionName = @name, AttractionType = @type, LocationDesc = @location, ExhibitID = @exhibitId,
      CapacityVisitors = @capacity, ActiveFlag = @activeFlag, UpdatedAt = SYSUTCDATETIME(),
      Description = @description, Hours = @hours, Duration = @duration,
      AgeGroup = @ageGroup, Price = @price, UpdatedBy = @updatedBy
  WHERE AttractionID = @id
`;

const updateImage = `
  UPDATE Attraction SET ImageUrl = @imageUrl, UpdatedAt = SYSUTCDATETIME() WHERE AttractionID = @id
`;

const softDelete = `
  UPDATE Attraction SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE AttractionID = @id
`;

module.exports = { getAll, insert, update, updateImage, softDelete };
