require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectToDb } = require('./services/admin');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

app.use(cors());
app.use(express.json());

const exhibitsRouter = require('./routes/exhibits');
const animalsRouter = require('./routes/animals');
const attractionsRouter = require('./routes/attractions');
const eventsRouter = require('./routes/events');
const productsRouter = require('./routes/products');
const ticketsRouter = require('./routes/tickets');
const maintenanceRouter = require('./routes/maintenance');
const feedbackRouter = require('./routes/feedback');
const speciesCodesRouter = require('./routes/speciesCodes');
const authRouter = require('./routes/auth');
const staffRouter = require('./routes/staff');
const analyticsRouter = require('./routes/analytics');
const ordersRouter = require('./routes/orders');
const ticketOrdersRouter = require('./routes/ticketOrders');
const membershipPlansRouter = require('./routes/membershipPlans');
const membershipSubsRouter = require('./routes/membershipSubscriptions');
const path = require('path');

app.use('/api/exhibits', exhibitsRouter);
app.use('/api/animals', animalsRouter);
app.use('/', attractionsRouter);
app.use('/', eventsRouter);
app.use('/', productsRouter);
app.use('/', ticketsRouter);
app.use('/', maintenanceRouter);
app.use('/', feedbackRouter);
app.use('/api/species-codes', speciesCodesRouter);
app.use('/api/auth', authRouter);
app.use('/api/staff', staffRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/ticket-orders', ticketOrdersRouter);
app.use('/api/membership-plans', membershipPlansRouter);
app.use('/api/membership-subscriptions', membershipSubsRouter);

// Serve images from the frontend assets folder dynamically
app.use('/images', express.static(path.join(__dirname, '../frontend/src/assets/images')));

let isDatabaseConnected = false;

app.get('/health', (req, res) => {
	const statusCode = isDatabaseConnected ? 200 : 503;
	res.status(statusCode).json({
		status: 'ok',
		database: isDatabaseConnected ? 'connected' : 'disconnected'
	});
});

async function runMigrations(pool) {
	const steps = [
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name=N'ImageUrl' AND Object_ID=Object_ID(N'Animal')) ALTER TABLE Animal ADD ImageUrl NVARCHAR(255) NULL`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name=N'Diet' AND Object_ID=Object_ID(N'Animal')) ALTER TABLE Animal ADD Diet NVARCHAR(100) NULL`,
		`IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name=N'HealthStatus' AND Object_ID=Object_ID(N'Animal')) ALTER TABLE Animal ADD HealthStatus NVARCHAR(50) NULL`,
		`IF COL_LENGTH('Animal','Lifespan') IS NULL ALTER TABLE Animal ADD Lifespan NVARCHAR(50) NULL`,
		`IF COL_LENGTH('Animal','Weight') IS NULL ALTER TABLE Animal ADD Weight NVARCHAR(50) NULL`,
		`IF COL_LENGTH('Animal','Region') IS NULL ALTER TABLE Animal ADD Region NVARCHAR(100) NULL`,
		`IF COL_LENGTH('Animal','FunFact') IS NULL ALTER TABLE Animal ADD FunFact NVARCHAR(255) NULL`,
		`IF COL_LENGTH('Animal','DeletedAt') IS NULL ALTER TABLE Animal ADD DeletedAt DATETIME2 NULL`,
		`IF COL_LENGTH('Animal','UpdatedAt') IS NULL ALTER TABLE Animal ADD UpdatedAt DATETIME2 NULL`,
		`IF COL_LENGTH('Animal','CreatedAt') IS NULL ALTER TABLE Animal ADD CreatedAt DATETIME2 NULL`,
		// IsEndangered: add column first, then backfill in a separate statement
		// so SQL Server compiles the UPDATE after the column exists
		`IF COL_LENGTH('Animal','IsEndangered') IS NULL ALTER TABLE Animal ADD IsEndangered BIT NULL`,
		`UPDATE Animal SET IsEndangered = 0 WHERE IsEndangered IS NULL`,
		`IF COL_LENGTH('Exhibit','IsFeatured') IS NULL ALTER TABLE Exhibit ADD IsFeatured BIT NULL`,
		`UPDATE Exhibit SET IsFeatured = 0 WHERE IsFeatured IS NULL`,
		`IF COL_LENGTH('Exhibit','UpdatedAt') IS NULL ALTER TABLE Exhibit ADD UpdatedAt DATETIME2 NULL`,
		`IF COL_LENGTH('Exhibit','DeletedAt') IS NULL ALTER TABLE Exhibit ADD DeletedAt DATETIME2 NULL`,
		`IF COL_LENGTH('Exhibit','Description') IS NULL ALTER TABLE Exhibit ADD Description NVARCHAR(1000) NULL`,
		`IF COL_LENGTH('Attraction','Description') IS NULL ALTER TABLE Attraction ADD Description NVARCHAR(500) NULL`,
		`IF COL_LENGTH('Attraction','Hours') IS NULL ALTER TABLE Attraction ADD Hours NVARCHAR(50) NULL`,
		`IF COL_LENGTH('Attraction','Duration') IS NULL ALTER TABLE Attraction ADD Duration NVARCHAR(50) NULL`,
		`IF COL_LENGTH('Attraction','AgeGroup') IS NULL ALTER TABLE Attraction ADD AgeGroup NVARCHAR(50) NULL`,
		`IF COL_LENGTH('Attraction','Price') IS NULL ALTER TABLE Attraction ADD Price DECIMAL(10,2) NULL`,
		`UPDATE Attraction SET Price = 0 WHERE Price IS NULL`,
		`IF COL_LENGTH('Attraction','ImageUrl') IS NULL ALTER TABLE Attraction ADD ImageUrl NVARCHAR(255) NULL`,
		`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SpeciesCode' AND xtype='U')
		  CREATE TABLE SpeciesCode (
		    SpeciesCodeID INT IDENTITY(1,1) PRIMARY KEY,
		    SpeciesName   NVARCHAR(100) NOT NULL,
		    CodeSuffix    NVARCHAR(10)  NOT NULL,
		    LastCount     INT NOT NULL DEFAULT 0,
		    CONSTRAINT UQ_SpeciesName UNIQUE (SpeciesName),
		    CONSTRAINT UQ_CodeSuffix  UNIQUE (CodeSuffix)
		  )`,
		`IF COL_LENGTH('Animal','AnimalCode') IS NULL ALTER TABLE Animal ADD AnimalCode NVARCHAR(20) NULL`,
		`IF COL_LENGTH('Animal','DepartureReason') IS NULL ALTER TABLE Animal ADD DepartureReason NVARCHAR(50) NULL`,
		`IF COL_LENGTH('Animal','SpeciesDetail') IS NULL ALTER TABLE Animal ADD SpeciesDetail NVARCHAR(100) NULL`,
		`IF COL_LENGTH('Event','Description') IS NULL ALTER TABLE Event ADD Description NVARCHAR(500) NULL`,
		`IF COL_LENGTH('Event','Category') IS NULL ALTER TABLE Event ADD Category NVARCHAR(50) NULL`,
		`IF COL_LENGTH('Event','IsFeatured') IS NULL ALTER TABLE Event ADD IsFeatured BIT NOT NULL DEFAULT 0`,
		`IF COL_LENGTH('Event','Price') IS NULL ALTER TABLE Event ADD Price DECIMAL(10,2) NOT NULL DEFAULT 0`,
		`IF COL_LENGTH('Event','EndDate') IS NULL ALTER TABLE Event ADD EndDate DATE NULL`,
		`IF COL_LENGTH('Event','ImageUrl') IS NULL ALTER TABLE Event ADD ImageUrl NVARCHAR(255) NULL`,
		`IF COL_LENGTH('Product','ImageUrl') IS NULL ALTER TABLE Product ADD ImageUrl NVARCHAR(255) NULL`,
		`IF COL_LENGTH('Product','LowStockThreshold') IS NULL ALTER TABLE Product ADD LowStockThreshold INT NOT NULL DEFAULT 10`,
		// Drop any CHECK constraints on Product.Category so new category names are accepted
		`DECLARE @chk NVARCHAR(MAX) = '';
		 SELECT @chk = @chk + 'ALTER TABLE Product DROP CONSTRAINT [' + c.name + ']; '
		 FROM sys.check_constraints c
		 JOIN sys.columns col ON c.parent_object_id = col.object_id AND c.parent_column_id = col.column_id
		 WHERE OBJECT_NAME(c.parent_object_id) = 'Product' AND col.name = 'Category';
		 IF LEN(@chk) > 0 EXEC(@chk)`,
		// Drop any FK constraints on Product.Category
		`DECLARE @fk NVARCHAR(MAX) = '';
		 SELECT @fk = @fk + 'ALTER TABLE Product DROP CONSTRAINT [' + fk.name + ']; '
		 FROM sys.foreign_key_columns fkc
		 JOIN sys.foreign_keys fk ON fkc.constraint_object_id = fk.object_id
		 JOIN sys.columns col ON fkc.parent_object_id = col.object_id AND fkc.parent_column_id = col.column_id
		 WHERE OBJECT_NAME(fk.parent_object_id) = 'Product' AND col.name = 'Category';
		 IF LEN(@fk) > 0 EXEC(@fk)`,
		// Now widen the column
		`ALTER TABLE Product ALTER COLUMN Category NVARCHAR(100) NULL`,
		`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
		  CREATE TABLE Orders (
		    OrderID               INT IDENTITY(1,1) PRIMARY KEY,
		    FullName              NVARCHAR(100)  NOT NULL,
		    Email                 NVARCHAR(200)  NOT NULL,
		    Phone                 NVARCHAR(30)   NULL,
		    AddressLine1          NVARCHAR(200)  NOT NULL,
		    AddressLine2          NVARCHAR(200)  NULL,
		    City                  NVARCHAR(100)  NOT NULL,
		    StateProvince         NVARCHAR(100)  NOT NULL,
		    ZipCode               NVARCHAR(20)   NOT NULL,
		    BillingSameAsShipping BIT            NOT NULL DEFAULT 1,
		    CardLastFour          NVARCHAR(4)    NULL,
		    Subtotal              DECIMAL(10,2)  NOT NULL,
		    Shipping              DECIMAL(10,2)  NOT NULL,
		    Tax                   DECIMAL(10,2)  NOT NULL,
		    Total                 DECIMAL(10,2)  NOT NULL,
		    OrderItems            NVARCHAR(MAX)  NULL,
		    PlacedAt              DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
		  )`,
		`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TicketOrders' AND xtype='U')
		  CREATE TABLE TicketOrders (
		    TicketOrderID        INT IDENTITY(1,1) PRIMARY KEY,
		    FullName             NVARCHAR(100)  NOT NULL,
		    Email                NVARCHAR(200)  NOT NULL,
		    Phone                NVARCHAR(30)   NULL,
		    AddressLine1         NVARCHAR(200)  NULL,
		    AddressLine2         NVARCHAR(200)  NULL,
		    City                 NVARCHAR(100)  NULL,
		    StateProvince        NVARCHAR(100)  NULL,
		    ZipCode              NVARCHAR(20)   NULL,
		    BillingSameAsContact BIT            NOT NULL DEFAULT 1,
		    BillingFullName      NVARCHAR(100)  NULL,
		    BillingAddress1      NVARCHAR(200)  NULL,
		    BillingAddress2      NVARCHAR(200)  NULL,
		    BillingCity          NVARCHAR(100)  NULL,
		    BillingState         NVARCHAR(100)  NULL,
		    BillingZip           NVARCHAR(20)   NULL,
		    VisitDate            DATE           NOT NULL,
		    TicketType           NVARCHAR(100)  NOT NULL,
		    AdultQty             INT            NOT NULL DEFAULT 0,
		    ChildQty             INT            NOT NULL DEFAULT 0,
		    SeniorQty            INT            NOT NULL DEFAULT 0,
		    AddOns               NVARCHAR(MAX)  NULL,
		    CardLastFour         NVARCHAR(4)    NULL,
		    Subtotal             DECIMAL(10,2)  NOT NULL,
		    Total                DECIMAL(10,2)  NOT NULL,
		    PlacedAt             DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
		  )`,
		// Add structured address columns to TicketOrders if table already existed with old schema
		`IF COL_LENGTH('TicketOrders','AddressLine1') IS NULL ALTER TABLE TicketOrders ADD AddressLine1 NVARCHAR(200) NULL`,
		`IF COL_LENGTH('TicketOrders','AddressLine2') IS NULL ALTER TABLE TicketOrders ADD AddressLine2 NVARCHAR(200) NULL`,
		`IF COL_LENGTH('TicketOrders','City') IS NULL ALTER TABLE TicketOrders ADD City NVARCHAR(100) NULL`,
		`IF COL_LENGTH('TicketOrders','StateProvince') IS NULL ALTER TABLE TicketOrders ADD StateProvince NVARCHAR(100) NULL`,
		`IF COL_LENGTH('TicketOrders','ZipCode') IS NULL ALTER TABLE TicketOrders ADD ZipCode NVARCHAR(20) NULL`,
		`IF COL_LENGTH('TicketOrders','BillingSameAsContact') IS NULL ALTER TABLE TicketOrders ADD BillingSameAsContact BIT NOT NULL DEFAULT 1`,
		`IF COL_LENGTH('TicketOrders','BillingFullName') IS NULL ALTER TABLE TicketOrders ADD BillingFullName NVARCHAR(100) NULL`,
		`IF COL_LENGTH('TicketOrders','BillingAddress1') IS NULL ALTER TABLE TicketOrders ADD BillingAddress1 NVARCHAR(200) NULL`,
		`IF COL_LENGTH('TicketOrders','BillingAddress2') IS NULL ALTER TABLE TicketOrders ADD BillingAddress2 NVARCHAR(200) NULL`,
		`IF COL_LENGTH('TicketOrders','BillingCity') IS NULL ALTER TABLE TicketOrders ADD BillingCity NVARCHAR(100) NULL`,
		`IF COL_LENGTH('TicketOrders','BillingState') IS NULL ALTER TABLE TicketOrders ADD BillingState NVARCHAR(100) NULL`,
		`IF COL_LENGTH('TicketOrders','BillingZip') IS NULL ALTER TABLE TicketOrders ADD BillingZip NVARCHAR(20) NULL`,
		`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MembershipPlans' AND xtype='U')
		  CREATE TABLE MembershipPlans (
		    PlanID       INT IDENTITY(1,1) PRIMARY KEY,
		    Name         NVARCHAR(100)  NOT NULL,
		    Description  NVARCHAR(500)  NULL,
		    MonthlyPrice DECIMAL(10,2)  NOT NULL DEFAULT 0,
		    YearlyPrice  DECIMAL(10,2)  NOT NULL DEFAULT 0,
		    Features     NVARCHAR(MAX)  NULL,
		    IsPopular    BIT            NOT NULL DEFAULT 0,
		    SortOrder    INT            NOT NULL DEFAULT 0,
		    DeletedAt    DATETIME2      NULL,
		    CreatedAt    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
		  )`,
		// Seed default plans if table is empty
		`IF NOT EXISTS (SELECT 1 FROM MembershipPlans)
		  INSERT INTO MembershipPlans (Name, Description, MonthlyPrice, YearlyPrice, Features, IsPopular, SortOrder) VALUES
		  ('Individual', 'Perfect for solo adventurers', 9.99, 89.00,
		   '[{"text":"Unlimited admission for 1 adult","included":true},{"text":"10% discount at Gift Shop","included":true},{"text":"10% discount at cafes","included":true},{"text":"Member-only newsletter","included":true},{"text":"Early access to events","included":true},{"text":"Free parking (weekdays)","included":true},{"text":"Guest passes","included":false},{"text":"Behind-the-scenes tours","included":false},{"text":"VIP lounge access","included":false}]',
		   0, 1),
		  ('Family', 'Best value for families', 19.99, 179.00,
		   '[{"text":"Unlimited admission for 2 adults + 4 children","included":true},{"text":"4 guest passes per year","included":true},{"text":"15% discount at Gift Shop","included":true},{"text":"15% discount at cafes","included":true},{"text":"Member-only newsletter","included":true},{"text":"Early access to events","included":true},{"text":"Free parking (all days)","included":true},{"text":"Priority booking for camps","included":true},{"text":"Behind-the-scenes tours","included":false},{"text":"VIP lounge access","included":false}]',
		   1, 2),
		  ('Premium', 'The ultimate zoo experience', 35.99, 349.00,
		   '[{"text":"Unlimited admission for 2 adults + 6 children","included":true},{"text":"12 guest passes per year","included":true},{"text":"20% discount at Gift Shop","included":true},{"text":"20% discount at cafes","included":true},{"text":"Member-only newsletter","included":true},{"text":"Early access to all events","included":true},{"text":"Free parking (all days)","included":true},{"text":"Priority booking for camps","included":true},{"text":"2 behind-the-scenes tours","included":true},{"text":"VIP lounge access","included":true},{"text":"Exclusive member events","included":true},{"text":"Complimentary stroller rental","included":true}]',
		   0, 3)`,
		`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MembershipSubscriptions' AND xtype='U')
		  CREATE TABLE MembershipSubscriptions (
		    SubID                INT IDENTITY(1,1) PRIMARY KEY,
		    CustomerID           INT            NULL,
		    PlanName             NVARCHAR(100)  NOT NULL,
		    BillingPeriod        NVARCHAR(10)   NOT NULL,
		    FullName             NVARCHAR(100)  NOT NULL,
		    Email                NVARCHAR(200)  NOT NULL,
		    Phone                NVARCHAR(30)   NULL,
		    AddressLine1         NVARCHAR(200)  NULL,
		    AddressLine2         NVARCHAR(200)  NULL,
		    City                 NVARCHAR(100)  NULL,
		    StateProvince        NVARCHAR(100)  NULL,
		    ZipCode              NVARCHAR(20)   NULL,
		    BillingSameAsContact BIT            NOT NULL DEFAULT 1,
		    BillingFullName      NVARCHAR(100)  NULL,
		    BillingAddress1      NVARCHAR(200)  NULL,
		    BillingAddress2      NVARCHAR(200)  NULL,
		    BillingCity          NVARCHAR(100)  NULL,
		    BillingState         NVARCHAR(100)  NULL,
		    BillingZip           NVARCHAR(20)   NULL,
		    CardLastFour         NVARCHAR(4)    NULL,
		    Total                DECIMAL(10,2)  NOT NULL,
		    StartDate            DATE           NOT NULL,
		    EndDate              DATE           NOT NULL,
		    PlacedAt             DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
		  )`,
	];

	for (const sql of steps) {
		try {
			await pool.request().query(sql);
		} catch (err) {
			console.warn(`Migration step warning (non-fatal): ${err.message}`);
		}
	}
	console.log('Database migrations complete.');
}

async function startServer() {
	try {
		const pool = await connectToDb();
		isDatabaseConnected = true;
		await runMigrations(pool);
	} catch (error) {
		isDatabaseConnected = false;
		console.error('Failed to start server: database connection is required.');
		process.exit(1);
	}

	app.listen(PORT, () => {
		console.log(`Backend server running on port ${PORT}`);
	});
}

startServer();
