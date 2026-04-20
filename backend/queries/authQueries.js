// ── Authentication & User Sync Queries ──────────────────────────────

const findStaffByEmail = `
  SELECT StaffID, FirebaseUid FROM Staff WHERE Email = @Email AND DeletedAt IS NULL
`;

const updateStaffFirebaseUid = `
  UPDATE Staff SET FirebaseUid = @FirebaseUid WHERE StaffID = @StaffID
`;

const insertStaffLoginAudit = `
  INSERT INTO StaffLoginAudit (StaffID, LoginTime) VALUES (@StaffID, SYSDATETIME())
`;

const findCustomer = `
  SELECT CustomerID FROM Customer WHERE FirebaseUid = @FirebaseUid OR Email = @Email
`;

const updateCustomerFirebaseUid = `
  UPDATE Customer SET FirebaseUid = @FirebaseUid WHERE CustomerID = @CustomerID
`;

const insertCustomer = `
  INSERT INTO Customer (FullName, Email, FirebaseUid) VALUES (@FullName, @Email, @FirebaseUid); SELECT SCOPE_IDENTITY() AS CustomerID;
`;

const updateCustomerLastLogin = `
  UPDATE Customer SET LastLoginAt = SYSDATETIME() WHERE CustomerID = @CustomerID
`;

const insertCustomerLoginAudit = `
  INSERT INTO CustomerLoginAudit (CustomerID, LoginTime) VALUES (@CustomerID, SYSDATETIME())
`;

module.exports = {
  findStaffByEmail,
  updateStaffFirebaseUid,
  insertStaffLoginAudit,
  findCustomer,
  updateCustomerFirebaseUid,
  insertCustomer,
  updateCustomerLastLogin,
  insertCustomerLoginAudit,
};
