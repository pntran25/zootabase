// ── Keeper Assignment Queries ───────────────────────────────────────

const getAll = `
  SELECT ka.AssignmentID, ka.AnimalID, ka.StaffID, ka.StartDate, ka.EndDate,
         ka.CreatedAt, ka.CreatedBy, ka.UpdatedAt, ka.UpdatedBy,
         a.Name AS AnimalName, a.Species,
         s.FullName AS KeeperName, s.Role AS KeeperRole
  FROM AnimalKeeperAssignment ka
  JOIN Animal a ON ka.AnimalID = a.AnimalID
  JOIN Staff s ON ka.StaffID = s.StaffID
  WHERE ka.DeletedAt IS NULL AND a.DeletedAt IS NULL AND s.DeletedAt IS NULL
  ORDER BY ka.StartDate DESC
`;

const getByAnimal = `
  SELECT ka.AssignmentID, ka.AnimalID, ka.StaffID, ka.StartDate, ka.EndDate,
         s.FullName AS KeeperName, s.Role AS KeeperRole
  FROM AnimalKeeperAssignment ka
  JOIN Staff s ON ka.StaffID = s.StaffID
  WHERE ka.AnimalID = @animalId AND ka.DeletedAt IS NULL AND s.DeletedAt IS NULL
  ORDER BY ka.StartDate DESC
`;

const insert = `
  INSERT INTO AnimalKeeperAssignment (AnimalID, StaffID, StartDate, EndDate, CreatedAt, CreatedBy)
  OUTPUT INSERTED.AssignmentID
  VALUES (@animalId, @staffId, @startDate, @endDate, SYSUTCDATETIME(), @createdBy)
`;

const update = `
  UPDATE AnimalKeeperAssignment
  SET AnimalID = @animalId, StaffID = @staffId, StartDate = @startDate,
      EndDate = @endDate, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE AssignmentID = @id AND DeletedAt IS NULL
`;

const softDelete = `
  UPDATE AnimalKeeperAssignment SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE AssignmentID = @id
`;

module.exports = { getAll, getByAnimal, insert, update, softDelete };
