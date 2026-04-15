// ── Exhibit CRUD Queries ────────────────────────────────────────────

const getAll = `
  SELECT e.ExhibitID, e.ExhibitName, e.Capacity, e.OpeningHours, e.ImageUrl,
         e.IsFeatured, e.Description, e.CreatedBy, e.UpdatedBy,
         a.AreaName, h.HabitatType,
         ISNULL(STUFF((SELECT DISTINCT ',' + an.Species FROM Animal an
             JOIN Habitat ah ON an.HabitatID = ah.HabitatID
             WHERE ah.ExhibitID = e.ExhibitID AND an.DeletedAt IS NULL AND an.Species IS NOT NULL
             FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, ''), '') AS AnimalNames
  FROM Exhibit e
  LEFT JOIN Area a ON e.AreaID = a.AreaID
  LEFT JOIN Habitat h ON e.ExhibitID = h.ExhibitID
  WHERE e.DeletedAt IS NULL
`;

const findArea = `
  SELECT AreaID FROM Area WHERE AreaName = @paramAreaName
`;

const createArea = `
  INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID VALUES (@paramAreaName)
`;

const insertExhibit = `
  INSERT INTO Exhibit (ExhibitName, AreaID, Capacity, OpeningHours, Description, CreatedBy)
  OUTPUT INSERTED.ExhibitID
  VALUES (@paramExhibitName, @paramAreaId, @paramCapacity, @paramOpeningHours, @paramDescription, @paramCreatedBy)
`;

const insertHabitat = `
  INSERT INTO Habitat (HabitatType, Size, ExhibitID) VALUES (@paramHabitatType, 100.0, @paramExhibitId)
`;

const updateExhibit = `
  UPDATE Exhibit
  SET ExhibitName = @paramExhibitName, AreaID = @paramAreaId,
      Capacity = @paramCapacity, OpeningHours = @paramOpeningHours,
      Description = @paramDescription, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @paramUpdatedBy
  WHERE ExhibitID = @paramId AND DeletedAt IS NULL
`;

const checkHabitat = `
  SELECT HabitatID FROM Habitat WHERE ExhibitID = @paramId
`;

const updateHabitat = `
  UPDATE Habitat SET HabitatType = @paramHabitatType, UpdatedAt = SYSUTCDATETIME() WHERE ExhibitID = @paramId
`;

const insertHabitatForExhibit = `
  INSERT INTO Habitat (HabitatType, Size, ExhibitID) VALUES (@paramHabitatType, 100.0, @paramId)
`;

const patchFeatured = `
  UPDATE Exhibit SET IsFeatured = @isFeatured, UpdatedAt = SYSUTCDATETIME() WHERE ExhibitID = @id AND DeletedAt IS NULL
`;

const unlinkAnimals = `
  UPDATE Animal SET HabitatID = NULL WHERE DeletedAt IS NULL AND HabitatID IN (SELECT h.HabitatID FROM Habitat h WHERE h.ExhibitID = @id)
`;

const softDelete = `
  UPDATE Exhibit SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE ExhibitID = @id
`;

const updateImage = `
  UPDATE Exhibit SET ImageUrl = @paramImageUrl, UpdatedAt = SYSUTCDATETIME() WHERE ExhibitID = @paramId
`;

module.exports = {
  getAll,
  findArea,
  createArea,
  insertExhibit,
  insertHabitat,
  updateExhibit,
  checkHabitat,
  updateHabitat,
  insertHabitatForExhibit,
  patchFeatured,
  unlinkAnimals,
  softDelete,
  updateImage,
};
