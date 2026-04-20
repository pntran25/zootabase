// ── Feeding Schedule Queries ────────────────────────────────────────

const getAll = `
  SELECT fs.ScheduleID, fs.AnimalID, fs.FeedTime, fs.FoodType, fs.StaffID,
         fs.Quantity, fs.Unit, fs.Frequency, fs.SpecialInstructions,
         fs.CreatedAt, fs.CreatedBy, fs.UpdatedAt, fs.UpdatedBy,
         a.Name AS AnimalName, a.Species,
         s.FullName AS StaffName, s.Role AS StaffRole
  FROM FeedingSchedule fs
  JOIN Animal a ON fs.AnimalID = a.AnimalID
  LEFT JOIN Staff s ON fs.StaffID = s.StaffID
  WHERE fs.DeletedAt IS NULL AND a.DeletedAt IS NULL
  ORDER BY fs.FeedTime
`;

const getByAnimal = `
  SELECT fs.ScheduleID, fs.AnimalID, fs.FeedTime, fs.FoodType, fs.StaffID,
         fs.Quantity, fs.Unit, fs.Frequency, fs.SpecialInstructions,
         s.FullName AS StaffName, s.Role AS StaffRole
  FROM FeedingSchedule fs LEFT JOIN Staff s ON fs.StaffID = s.StaffID
  WHERE fs.AnimalID = @animalId AND fs.DeletedAt IS NULL ORDER BY fs.FeedTime
`;

const insert = `
  INSERT INTO FeedingSchedule (AnimalID, FeedTime, FoodType, StaffID, Quantity, Unit, Frequency, SpecialInstructions, CreatedAt, CreatedBy)
  OUTPUT INSERTED.ScheduleID VALUES (@animalId, @feedTime, @foodType, @staffId, @quantity, @unit, @frequency, @specialInstructions, SYSUTCDATETIME(), @createdBy)
`;

const update = `
  UPDATE FeedingSchedule
  SET AnimalID = @animalId, FeedTime = @feedTime, FoodType = @foodType,
      StaffID = @staffId, Quantity = @quantity, Unit = @unit, Frequency = @frequency,
      SpecialInstructions = @specialInstructions,
      UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE ScheduleID = @id AND DeletedAt IS NULL
`;

const softDelete = `
  UPDATE FeedingSchedule SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE ScheduleID = @id
`;

module.exports = { getAll, getByAnimal, insert, update, softDelete };
