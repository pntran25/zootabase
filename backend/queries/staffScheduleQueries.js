// ── Staff Schedule Queries ──────────────────────────────────────────

const getAll = `
  SELECT ss.ScheduleID, ss.StaffID,
         CONVERT(VARCHAR(10), ss.WorkDate, 23) AS WorkDate,
         CONVERT(VARCHAR(5), ss.ShiftStart, 108) AS ShiftStart,
         CONVERT(VARCHAR(5), ss.ShiftEnd, 108) AS ShiftEnd,
         ss.AssignedExhibitID,
         s.FullName AS StaffName, s.Role AS StaffRole,
         e.ExhibitName AS ExhibitName
  FROM StaffSchedule ss
  JOIN Staff s ON ss.StaffID = s.StaffID
  LEFT JOIN Exhibit e ON ss.AssignedExhibitID = e.ExhibitID
  WHERE ss.DeletedAt IS NULL AND s.DeletedAt IS NULL
  ORDER BY ss.WorkDate DESC, ss.ShiftStart
`;

const insert = `
  INSERT INTO StaffSchedule (StaffID, WorkDate, ShiftStart, ShiftEnd, AssignedExhibitID, CreatedAt, CreatedBy)
  OUTPUT INSERTED.ScheduleID
  VALUES (@staffId, @workDate, @shiftStart, @shiftEnd, @exhibitId, SYSUTCDATETIME(), @createdBy)
`;

const update = `
  UPDATE StaffSchedule
  SET StaffID = @staffId, WorkDate = @workDate, ShiftStart = @shiftStart,
      ShiftEnd = @shiftEnd, AssignedExhibitID = @exhibitId,
      UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
  WHERE ScheduleID = @id AND DeletedAt IS NULL
`;

const remove = `
  DELETE FROM StaffSchedule WHERE ScheduleID = @id
`;

module.exports = {
  getAll,
  insert,
  update,
  remove,
};
