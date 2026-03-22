require('dotenv').config();
const { connectToDb } = require('./services/admin');

async function migrateAuth() {
    console.log('Connecting to database...');
    const pool = await connectToDb();
    
    const steps = [
        `IF COL_LENGTH('Customer', 'FirebaseUid') IS NULL ALTER TABLE Customer ADD FirebaseUid NVARCHAR(128) NULL;`,
        `IF COL_LENGTH('Staff', 'Email') IS NULL ALTER TABLE Staff ADD Email NVARCHAR(255) NULL;`,
        `IF COL_LENGTH('Staff', 'FirebaseUid') IS NULL ALTER TABLE Staff ADD FirebaseUid NVARCHAR(128) NULL;`,
        `IF COL_LENGTH('Staff', 'FirstName') IS NULL ALTER TABLE Staff ADD FirstName NVARCHAR(100) NULL;`,
        `IF COL_LENGTH('Staff', 'LastName') IS NULL ALTER TABLE Staff ADD LastName NVARCHAR(100) NULL;`,
        `IF COL_LENGTH('Staff', 'DateOfBirth') IS NULL ALTER TABLE Staff ADD DateOfBirth DATE NULL;`,
        `IF COL_LENGTH('Staff', 'SSN') IS NULL ALTER TABLE Staff ADD SSN NVARCHAR(20) NULL;`,
        `UPDATE Staff SET FirstName = ISNULL(SUBSTRING(FullName, 1, CHARINDEX(' ', FullName + ' ') - 1), FullName) WHERE FirstName IS NULL;`,
        `UPDATE Staff SET LastName = LTRIM(SUBSTRING(FullName, CHARINDEX(' ', FullName + ' '), LEN(FullName))) WHERE LastName IS NULL;`,
        // If current MAX(StaffID) is < 10000, reseed.
        `DECLARE @MaxId INT; SELECT @MaxId = ISNULL(MAX(StaffID), 0) FROM Staff; IF @MaxId < 10000 DBCC CHECKIDENT ('Staff', RESEED, 9999);`,
        `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StaffLoginAudit' AND xtype='U')
        CREATE TABLE StaffLoginAudit (
            LogID INT IDENTITY(1,1) PRIMARY KEY,
            StaffID INT NOT NULL,
            LoginTime DATETIME2(0) DEFAULT SYSUTCDATETIME(),
            FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
        );`,
        `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CustomerLoginAudit' AND xtype='U')
        CREATE TABLE CustomerLoginAudit (
            LogID INT IDENTITY(1,1) PRIMARY KEY,
            CustomerID INT NOT NULL,
            LoginTime DATETIME2(0) DEFAULT SYSUTCDATETIME(),
            FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
        );`
    ];

    for (let step of steps) {
        try {
            await pool.request().query(step);
            console.log('Executed successfully:', step.substring(0, 80).replace(/\n/g, '') + '...');
        } catch (e) {
            console.error('Error on step:', step, '\n', e.message);
        }
    }
    console.log('Migration Complete.');
    process.exit(0);
}

migrateAuth();
