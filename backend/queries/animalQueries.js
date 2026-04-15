// ── Animal CRUD Queries ─────────────────────────────────────────────

const getAll = (displayOnly) => `
  SELECT
      a.AnimalID as id, a.Name as name, a.Species as species, a.Age as age,
      a.Gender as gender, a.Diet as diet, a.HealthStatus as health,
      a.DateArrived as dateArrived, a.ImageUrl as imageUrl, a.Lifespan as lifespan,
      a.Weight as weight, a.Region as region, a.FunFact as funFact,
      a.IsEndangered as isEndangered, a.AnimalCode as animalCode,
      a.SpeciesDetail as speciesDetail, a.IsDisplay as isDisplay,
      a.CreatedBy as createdBy, a.UpdatedBy as updatedBy,
      h.HabitatType, e.ExhibitName as exhibit
  FROM Animal a
  LEFT JOIN Habitat h ON a.HabitatID = h.HabitatID
  LEFT JOIN Exhibit e ON h.ExhibitID = e.ExhibitID
  WHERE a.DeletedAt IS NULL
  ${displayOnly ? 'AND a.IsDisplay = 1' : ''}
`;

// ── Habitat resolution ──

const findHabitat = `
  SELECT TOP 1 h.HabitatID FROM Habitat h JOIN Exhibit e ON h.ExhibitID = e.ExhibitID WHERE e.ExhibitName = @searchExhibit
`;

const findExhibit = `
  SELECT TOP 1 ExhibitID FROM Exhibit WHERE ExhibitName = @searchExhibit
`;

const ensureGeneralArea = `
  IF NOT EXISTS (SELECT 1 FROM Area WHERE AreaName = 'General')
  BEGIN
      DECLARE @AreaOut TABLE (AreaID INT);
      INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID INTO @AreaOut VALUES ('General');
      SELECT AreaID FROM @AreaOut;
  END
  ELSE BEGIN
      SELECT AreaID FROM Area WHERE AreaName = 'General';
  END
`;

const createExhibit = `
  DECLARE @ExhOut TABLE (ExhibitID INT);
  INSERT INTO Exhibit (ExhibitName, AreaID, Capacity, OpeningHours)
  OUTPUT INSERTED.ExhibitID INTO @ExhOut
  VALUES (@newExhName, @areaId, 100, '09:00-17:00');
  SELECT ExhibitID FROM @ExhOut;
`;

const createHabitat = `
  DECLARE @HabOut TABLE (HabitatID INT);
  INSERT INTO Habitat (HabitatType, Size, ExhibitID)
  OUTPUT INSERTED.HabitatID INTO @HabOut
  VALUES ('Standard', 100.0, @exhibitId);
  SELECT HabitatID FROM @HabOut;
`;

// ── Animal Code ──

const incrementSpeciesCode = `
  UPDATE SpeciesCode SET LastCount = LastCount + 1
  OUTPUT INSERTED.CodeSuffix, INSERTED.LastCount
  WHERE SpeciesName = @speciesLookup
`;

const insertSpeciesCode = `
  INSERT INTO SpeciesCode (SpeciesName, CodeSuffix, LastCount) VALUES (@newSn, @newCs, 1)
`;

// ── CRUD ──

const insertAnimal = `
  DECLARE @AnimOut TABLE (id INT, imageUrl NVARCHAR(255));
  INSERT INTO Animal (Name, Species, SpeciesDetail, Age, Gender, Diet, HealthStatus, DateArrived, HabitatID, Lifespan, Weight, Region, FunFact, IsEndangered, IsDisplay, AnimalCode, CreatedBy, CreatedAt)
  OUTPUT INSERTED.AnimalID, INSERTED.ImageUrl INTO @AnimOut
  VALUES (@name, @species, @speciesDetail, @age, @gender, @diet, @health, @dateArrived, @habitatId, @lifespan, @weight, @region, @funFact, @isEndangered, @isDisplay, @animalCode, @createdBy, SYSUTCDATETIME());
  SELECT id, imageUrl FROM @AnimOut;
`;

const getAnimalCode = `
  SELECT AnimalCode FROM Animal WHERE AnimalID = @cid AND DeletedAt IS NULL
`;

const updateAnimal = `
  UPDATE Animal
  SET Name = @name, Species = @species, SpeciesDetail = @speciesDetail,
      Age = @age, Gender = @gender,
      Diet = @diet, HealthStatus = @health, DateArrived = @dateArrived,
      HabitatID = @habitatId, Lifespan = @lifespan, Weight = @weight,
      Region = @region, FunFact = @funFact, IsEndangered = @isEndangered,
      IsDisplay = @isDisplay,
      AnimalCode = COALESCE(AnimalCode, @animalCode),
      UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE AnimalID = @id AND DeletedAt IS NULL
`;

const patchEndangered = `
  UPDATE Animal SET IsEndangered = @isEndangered, UpdatedAt = SYSUTCDATETIME() WHERE AnimalID = @id AND DeletedAt IS NULL
`;

const deleteAnimal = `
  UPDATE Animal SET DeletedAt = SYSUTCDATETIME(), DepartureReason = @reason, DeletedBy = @deletedBy WHERE AnimalID = @id
`;

const updateAnimalImage = `
  UPDATE Animal SET ImageUrl = @imageUrl, UpdatedAt = SYSUTCDATETIME() WHERE AnimalID = @id
`;

module.exports = {
  getAll,
  findHabitat,
  findExhibit,
  ensureGeneralArea,
  createExhibit,
  createHabitat,
  incrementSpeciesCode,
  insertSpeciesCode,
  insertAnimal,
  getAnimalCode,
  updateAnimal,
  patchEndangered,
  deleteAnimal,
  updateAnimalImage,
};
