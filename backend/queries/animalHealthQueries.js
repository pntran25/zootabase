// ── Animal Health Queries ────────────────────────────────────────────

// ── Health Records ──

const getAllRecords = `
  SELECT r.RecordID, r.AnimalID, r.CheckupDate, r.HealthScore, r.Notes, r.StaffID,
         r.ActivityLevel, r.Weight, r.WeightRangeLow, r.WeightRangeHigh,
         r.MedicalConditions, r.RecentTreatments, r.AppetiteStatus,
         a.Name AS AnimalName, a.Species,
         s.FullName AS StaffName
  FROM AnimalHealthRecord r
  JOIN Animal a ON r.AnimalID = a.AnimalID
  LEFT JOIN Staff s ON r.StaffID = s.StaffID
  WHERE r.DeletedAt IS NULL AND a.DeletedAt IS NULL
  ORDER BY r.CheckupDate DESC
`;

const getRecordsByAnimal = `
  SELECT r.RecordID, r.AnimalID, r.CheckupDate, r.HealthScore, r.Notes, r.StaffID,
         r.ActivityLevel, r.Weight, r.WeightRangeLow, r.WeightRangeHigh,
         r.MedicalConditions, r.RecentTreatments, r.AppetiteStatus,
         s.FullName AS StaffName
  FROM AnimalHealthRecord r
  LEFT JOIN Staff s ON r.StaffID = s.StaffID
  WHERE r.AnimalID = @animalId AND r.DeletedAt IS NULL
  ORDER BY r.CheckupDate DESC
`;

const insertRecord = `
  DECLARE @newId TABLE (RecordID INT);
  INSERT INTO AnimalHealthRecord (AnimalID, CheckupDate, HealthScore, Notes, StaffID,
         ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
         MedicalConditions, RecentTreatments, AppetiteStatus,
         CreatedAt, CreatedBy)
  OUTPUT INSERTED.RecordID INTO @newId
  VALUES (@animalId, @checkupDate, @healthScore, @notes, @staffId,
          @activityLevel, @weight, @weightRangeLow, @weightRangeHigh,
          @medicalConditions, @recentTreatments, @appetiteStatus,
          SYSUTCDATETIME(), @createdBy);
  SELECT RecordID FROM @newId;
`;

const updateRecord = `
  UPDATE AnimalHealthRecord
  SET AnimalID = @animalId, CheckupDate = @checkupDate, HealthScore = @healthScore,
      Notes = @notes, StaffID = @staffId,
      ActivityLevel = @activityLevel, Weight = @weight,
      WeightRangeLow = @weightRangeLow, WeightRangeHigh = @weightRangeHigh,
      MedicalConditions = @medicalConditions, RecentTreatments = @recentTreatments,
      AppetiteStatus = @appetiteStatus,
      UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE RecordID = @id AND DeletedAt IS NULL
`;

const deleteRecord = `
  UPDATE AnimalHealthRecord SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE RecordID = @id
`;

const syncAnimalHealth = `
  UPDATE Animal SET HealthStatus = @status WHERE AnimalID = @aid
`;

// ── Health Alerts ──

const getAllAlerts = `
  SELECT ha.AlertID, ha.AnimalID, ha.AlertType, ha.AlertMessage, ha.CreatedAt, ha.IsResolved,
         ha.ResolvedAt, ha.ResolutionNotes,
         a.Name AS AnimalName, a.Species
  FROM HealthAlert ha
  JOIN Animal a ON ha.AnimalID = a.AnimalID
  WHERE a.DeletedAt IS NULL
  ORDER BY ha.CreatedAt DESC
`;

const resolveAlert = `
  UPDATE HealthAlert SET IsResolved = 1, ResolvedAt = SYSUTCDATETIME(), ResolutionNotes = @notes WHERE AlertID = @id
`;

const insertAlert = `
  INSERT INTO HealthAlert (AnimalID, AlertType, AlertMessage, CreatedAt, IsResolved)
  VALUES (@animalId, @alertType, @alertMessage, SYSUTCDATETIME(), 0)
`;

// ── Health Report (aggregate) ──

const healthReportStats = `
  SELECT
    (SELECT COUNT(*) FROM Animal WHERE DeletedAt IS NULL) AS TotalAnimals,
    (SELECT COUNT(*) FROM HealthAlert WHERE IsResolved = 0) AS UnresolvedAlerts,
    (SELECT COUNT(*) FROM AnimalKeeperAssignment WHERE DeletedAt IS NULL AND EndDate IS NULL) AS ActiveAssignments,
    (SELECT COUNT(*) FROM FeedingSchedule WHERE DeletedAt IS NULL) AS TotalSchedules,
    (SELECT AVG(CAST(HealthScore AS FLOAT)) FROM AnimalHealthRecord WHERE DeletedAt IS NULL) AS AvgHealthScore
`;

const healthReportAlerts = `
  SELECT ha.AlertID, ha.AnimalID, ha.AlertType, ha.AlertMessage,
         ha.CreatedAt, ha.IsResolved, ha.ResolvedAt, ha.ResolutionNotes,
         a.Name AS AnimalName, a.Species, a.AnimalCode
  FROM HealthAlert ha
  JOIN Animal a ON ha.AnimalID = a.AnimalID
  WHERE a.DeletedAt IS NULL
  ORDER BY ha.IsResolved ASC, ha.CreatedAt DESC
`;

const healthReportKeepers = `
  SELECT ka.AssignmentID, ka.AnimalID, ka.StaffID, ka.StartDate, ka.EndDate,
         a.Name AS AnimalName, a.Species, a.AnimalCode,
         s.FullName AS KeeperName, s.Role
  FROM AnimalKeeperAssignment ka
  JOIN Animal a ON ka.AnimalID = a.AnimalID
  JOIN Staff s ON ka.StaffID = s.StaffID
  WHERE ka.DeletedAt IS NULL AND a.DeletedAt IS NULL
  ORDER BY ka.EndDate ASC, ka.StartDate DESC
`;

const healthReportFeedings = `
  SELECT fs.ScheduleID, fs.AnimalID, fs.FeedTime, fs.FoodType, fs.StaffID,
         a.Name AS AnimalName, a.Species, a.AnimalCode,
         s.FullName AS StaffName
  FROM FeedingSchedule fs
  JOIN Animal a ON fs.AnimalID = a.AnimalID
  LEFT JOIN Staff s ON fs.StaffID = s.StaffID
  WHERE fs.DeletedAt IS NULL AND a.DeletedAt IS NULL
  ORDER BY fs.FeedTime
`;

const healthReportMetrics = `
  SELECT r.RecordID AS MetricID, r.AnimalID, r.CheckupDate AS RecordDate,
         r.ActivityLevel, r.Weight, r.WeightRangeLow, r.WeightRangeHigh,
         r.MedicalConditions, r.RecentTreatments, r.AppetiteStatus, r.Notes,
         a.Name AS AnimalName, a.Species, a.AnimalCode
  FROM AnimalHealthRecord r
  JOIN Animal a ON r.AnimalID = a.AnimalID
  WHERE r.DeletedAt IS NULL AND a.DeletedAt IS NULL
    AND (r.Weight IS NOT NULL OR r.ActivityLevel IS NOT NULL OR r.AppetiteStatus IS NOT NULL)
  ORDER BY r.CheckupDate DESC
`;

const healthReportRecords = `
  SELECT r.RecordID, r.AnimalID, r.CheckupDate, r.HealthScore, r.Notes, r.StaffID,
         r.ActivityLevel, r.Weight, r.WeightRangeLow, r.WeightRangeHigh,
         r.MedicalConditions, r.RecentTreatments, r.AppetiteStatus,
         a.Name AS AnimalName, a.Species, a.AnimalCode,
         s.FullName AS StaffName
  FROM AnimalHealthRecord r
  JOIN Animal a ON r.AnimalID = a.AnimalID
  LEFT JOIN Staff s ON r.StaffID = s.StaffID
  WHERE r.DeletedAt IS NULL AND a.DeletedAt IS NULL
  ORDER BY r.CheckupDate DESC
`;

// ── Single Animal Report ──

const animalBase = `
  SELECT a.*, h.HabitatType, h.Size AS HabitatSize, e.ExhibitName, ar.AreaName
  FROM Animal a
  LEFT JOIN Habitat h ON a.HabitatID = h.HabitatID
  LEFT JOIN Exhibit e ON h.ExhibitID = e.ExhibitID
  LEFT JOIN Area ar ON e.AreaID = ar.AreaID
  WHERE a.AnimalID = @id AND a.DeletedAt IS NULL
`;

const animalHealthRecords = `
  SELECT r.RecordID, r.AnimalID, r.CheckupDate, r.HealthScore, r.Notes, r.StaffID,
         r.ActivityLevel, r.Weight, r.WeightRangeLow, r.WeightRangeHigh,
         r.MedicalConditions, r.RecentTreatments, r.AppetiteStatus,
         s.FullName AS StaffName
  FROM AnimalHealthRecord r
  LEFT JOIN Staff s ON r.StaffID = s.StaffID
  WHERE r.AnimalID = @id2 AND r.DeletedAt IS NULL
  ORDER BY r.CheckupDate DESC
`;

const animalHealthMetrics = `
  SELECT RecordID AS MetricID, AnimalID, CheckupDate AS RecordDate,
         ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
         MedicalConditions, RecentTreatments, AppetiteStatus, Notes
  FROM AnimalHealthRecord
  WHERE AnimalID = @id3 AND DeletedAt IS NULL
    AND (Weight IS NOT NULL OR ActivityLevel IS NOT NULL OR AppetiteStatus IS NOT NULL)
  ORDER BY CheckupDate DESC
`;

const animalKeepers = `
  SELECT ka.*, s.FullName AS KeeperName, s.Role
  FROM AnimalKeeperAssignment ka
  JOIN Staff s ON ka.StaffID = s.StaffID
  WHERE ka.AnimalID = @id4 AND ka.DeletedAt IS NULL
  ORDER BY ka.StartDate DESC
`;

const animalFeedings = `
  SELECT fs.*, s.FullName AS StaffName
  FROM FeedingSchedule fs
  LEFT JOIN Staff s ON fs.StaffID = s.StaffID
  WHERE fs.AnimalID = @id5 AND fs.DeletedAt IS NULL
  ORDER BY fs.FeedTime
`;

const animalAlerts = `
  SELECT * FROM HealthAlert WHERE AnimalID = @id6 ORDER BY CreatedAt DESC
`;

// ── Animal List (for health pages) ──

const animalsList = `
  SELECT a.AnimalID, a.Name, a.Species, a.AnimalCode, a.Age, a.Gender, a.HealthStatus,
         ex.ExhibitName
  FROM Animal a
  LEFT JOIN Habitat h ON a.HabitatID = h.HabitatID
  LEFT JOIN Exhibit ex ON h.ExhibitID = ex.ExhibitID
  WHERE a.DeletedAt IS NULL
  ORDER BY a.Species, a.Name
`;

const staffList = `
  SELECT StaffID, FullName, Role FROM Staff WHERE DeletedAt IS NULL ORDER BY FullName
`;

// ── Meal Time Config ──

const ensureMealTimeTable = `
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MealTimeConfig' AND xtype='U')
  CREATE TABLE MealTimeConfig (
      MealID    NVARCHAR(20) PRIMARY KEY,
      MealLabel NVARCHAR(50) NOT NULL,
      MealEmoji NVARCHAR(10) NOT NULL,
      MealTime  NVARCHAR(5)  NOT NULL,
      UpdatedAt DATETIME2,
      UpdatedBy NVARCHAR(100)
  )
`;

const seedMealTimes = `
  IF NOT EXISTS (SELECT 1 FROM MealTimeConfig)
  BEGIN
      INSERT INTO MealTimeConfig (MealID, MealLabel, MealEmoji, MealTime) VALUES
          ('breakfast', 'Breakfast', N'🌅', '07:00'),
          ('lunch',     'Lunch',     N'☀️', '12:00'),
          ('dinner',    'Dinner',    N'🌙', '18:00')
  END
`;

const getMealTimes = `
  SELECT MealID AS id, MealLabel AS label, MealEmoji AS emoji, MealTime AS time
  FROM MealTimeConfig ORDER BY MealTime
`;

const updateMealTime = `
  UPDATE MealTimeConfig
  SET MealTime = @time, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE MealID = @id
`;

module.exports = {
  getAllRecords,
  getRecordsByAnimal,
  insertRecord,
  updateRecord,
  deleteRecord,
  syncAnimalHealth,
  getAllAlerts,
  resolveAlert,
  insertAlert,
  healthReportStats,
  healthReportAlerts,
  healthReportKeepers,
  healthReportFeedings,
  healthReportMetrics,
  healthReportRecords,
  animalBase,
  animalHealthRecords,
  animalHealthMetrics,
  animalKeepers,
  animalFeedings,
  animalAlerts,
  animalsList,
  staffList,
  ensureMealTimeTable,
  seedMealTimes,
  getMealTimes,
  updateMealTime,
};
