// ── Maintenance Request Queries ─────────────────────────────────────

// ── Helpers ──

const findExhibit = `
  SELECT ExhibitID FROM Exhibit WHERE ExhibitName = @exhName
`;

const ensureGeneralGroundsArea = `
  IF NOT EXISTS (SELECT 1 FROM Area WHERE AreaName = 'General Grounds')
  BEGIN
      DECLARE @AreaOut TABLE (AreaID INT);
      INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID INTO @AreaOut VALUES ('General Grounds');
      SELECT AreaID FROM @AreaOut;
  END
  ELSE BEGIN
      SELECT AreaID FROM Area WHERE AreaName = 'General Grounds';
  END
`;

const createExhibit = `
  DECLARE @ExhOut TABLE (ExhibitID INT);
  INSERT INTO Exhibit (ExhibitName, AreaID, Capacity, OpeningHours)
  OUTPUT INSERTED.ExhibitID INTO @ExhOut
  VALUES (@newExhName, @areaId, 100, '09:00-17:00');
  SELECT ExhibitID FROM @ExhOut;
`;

const findStaffByName = `
  SELECT StaffID FROM Staff WHERE FullName = @staffName
`;

const createStaff = `
  DECLARE @StaffOut TABLE (StaffID INT);
  INSERT INTO Staff (FullName, Role, Salary, HireDate)
  OUTPUT INSERTED.StaffID INTO @StaffOut
  VALUES (@newStaffName, 'Manager', 60000.00, SYSUTCDATETIME());
  SELECT StaffID FROM @StaffOut;
`;

// ── CRUD ──

const getAll = `
  SELECT m.*, ex.ExhibitName, s.FullName as StaffName
  FROM MaintenanceRequest m
  LEFT JOIN Exhibit ex ON m.ExhibitID = ex.ExhibitID
  LEFT JOIN Staff s ON m.StaffID = s.StaffID
  WHERE m.DeletedAt IS NULL
`;

const insert = `
  DECLARE @Out TABLE (RequestID INT);
  INSERT INTO MaintenanceRequest (ExhibitID, Description, RequestDate, Status, StaffID, CreatedBy, CreatedAt)
  OUTPUT INSERTED.RequestID INTO @Out VALUES (@exhId, @desc, @reqDate, @status, @staffId, @createdBy, SYSUTCDATETIME());
  SELECT RequestID FROM @Out;
`;

const update = `
  UPDATE MaintenanceRequest
  SET ExhibitID = @exhId, Description = @desc, RequestDate = @reqDate,
      Status = @status, StaffID = @staffId, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE RequestID = @id
`;

const softDelete = `
  UPDATE MaintenanceRequest SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE RequestID = @id
`;

module.exports = {
  findExhibit,
  ensureGeneralGroundsArea,
  createExhibit,
  findStaffByName,
  createStaff,
  getAll,
  insert,
  update,
  softDelete,
};
