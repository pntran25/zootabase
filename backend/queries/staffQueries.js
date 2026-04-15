// ── Staff CRUD Queries ──────────────────────────────────────────────

const getAll = `
  SELECT StaffID, FirstName, LastName, FullName, Email, DateOfBirth, SSN, Role, ContactNumber, Salary, HireDate
  FROM Staff WHERE DeletedAt IS NULL ORDER BY StaffID DESC
`;

const checkSsnUnique = `
  SELECT StaffID FROM Staff WHERE SSN = @SSN AND DeletedAt IS NULL
`;

const checkSsnUniqueExclude = `
  SELECT StaffID FROM Staff WHERE SSN = @SSN AND DeletedAt IS NULL AND StaffID != @StaffID
`;

const insertStaff = `
  INSERT INTO Staff (FirstName, LastName, Email, DateOfBirth, SSN, Role, ContactNumber, Salary, HireDate, FullName, FirebaseUid)
  OUTPUT INSERTED.*
  VALUES (@FirstName, @LastName, @Email, @DateOfBirth, @SSN, @Role, @ContactNumber, @Salary, @HireDate, @FullName, @FirebaseUid)
`;

const updateStaff = `
  UPDATE Staff
  SET FirstName = @FirstName, LastName = @LastName, Email = @Email,
      DateOfBirth = @DateOfBirth, SSN = @SSN, Role = @Role, FullName = @FullName,
      ContactNumber = @ContactNumber, Salary = @Salary
  WHERE StaffID = @StaffID
`;

const getFirebaseUid = `
  SELECT FirebaseUid FROM Staff WHERE StaffID = @StaffID
`;

const softDelete = `
  UPDATE Staff SET DeletedAt = SYSUTCDATETIME() WHERE StaffID = @StaffID
`;

module.exports = {
  getAll,
  checkSsnUnique,
  checkSsnUniqueExclude,
  insertStaff,
  updateStaff,
  getFirebaseUid,
  softDelete,
};
