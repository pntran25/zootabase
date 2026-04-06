/****** Object:  Database [zootabase-database321]    Script Date: 3/23/2026 9:52:42 PM ******/
CREATE DATABASE [zootabase-database321]  (EDITION = 'GeneralPurpose', SERVICE_OBJECTIVE = 'GP_S_Gen5_1', MAXSIZE = 32 GB) WITH CATALOG_COLLATION = SQL_Latin1_General_CP1_CI_AS, LEDGER = OFF;
GO
ALTER DATABASE [zootabase-database321] SET COMPATIBILITY_LEVEL = 170
GO
ALTER DATABASE [zootabase-database321] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [zootabase-database321] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [zootabase-database321] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [zootabase-database321] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [zootabase-database321] SET ARITHABORT OFF 
GO
ALTER DATABASE [zootabase-database321] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [zootabase-database321] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [zootabase-database321] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [zootabase-database321] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [zootabase-database321] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [zootabase-database321] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [zootabase-database321] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [zootabase-database321] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [zootabase-database321] SET ALLOW_SNAPSHOT_ISOLATION ON 
GO
ALTER DATABASE [zootabase-database321] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [zootabase-database321] SET READ_COMMITTED_SNAPSHOT ON 
GO
ALTER DATABASE [zootabase-database321] SET  MULTI_USER 
GO
ALTER DATABASE [zootabase-database321] SET ENCRYPTION ON
GO
ALTER DATABASE [zootabase-database321] SET QUERY_STORE = ON
GO
ALTER DATABASE [zootabase-database321] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 100, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
/*** The scripts of database scoped configurations in Azure should be executed inside the target database connection. ***/
GO
-- ALTER DATABASE SCOPED CONFIGURATION SET MAXDOP = 8;
GO
/****** Object:  Table [dbo].[Animal]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Animal](
	[AnimalID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Species] [nvarchar](100) NOT NULL,
	[Age] [int] NOT NULL,
	[Gender] [nvarchar](20) NULL,
	[DateArrived] [date] NOT NULL,
	[HabitatID] [int] NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
	[ImageUrl] [nvarchar](255) NULL,
	[Diet] [nvarchar](100) NULL,
	[HealthStatus] [nvarchar](50) NULL,
	[Lifespan] [nvarchar](50) NULL,
	[Weight] [nvarchar](50) NULL,
	[Region] [nvarchar](100) NULL,
	[FunFact] [nvarchar](255) NULL,
	[IsEndangered] [bit] NULL,
	[AnimalCode] [nvarchar](20) NULL,
	[DepartureReason] [nvarchar](50) NULL,
	[SpeciesDetail] [nvarchar](100) NULL,
	[IsDisplay] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[AnimalID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AnimalAudit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AnimalAudit](
	[AuditID] [int] IDENTITY(1,1) NOT NULL,
	[AnimalID] [int] NULL,
	[Name] [nvarchar](100) NULL,
	[Species] [nvarchar](100) NULL,
	[Age] [int] NULL,
	[Gender] [nvarchar](20) NULL,
	[DateArrived] [date] NULL,
	[HabitatID] [int] NULL,
	[ActionType] [nvarchar](10) NULL,
	[ActionDate] [datetime2](0) NOT NULL,
	[PerformedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[AuditID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AnimalHealthMetrics]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AnimalHealthMetrics](
	[MetricID] [int] IDENTITY(1,1) NOT NULL,
	[AnimalID] [int] NOT NULL,
	[RecordDate] [datetime2](0) NOT NULL,
	[ActivityLevel] [nvarchar](50) NULL,
	[Weight] [decimal](8, 2) NULL,
	[WeightRangeLow] [decimal](8, 2) NULL,
	[WeightRangeHigh] [decimal](8, 2) NULL,
	[MedicalConditions] [nvarchar](255) NULL,
	[RecentTreatments] [nvarchar](255) NULL,
	[AppetiteStatus] [nvarchar](50) NULL,
	[Notes] [nvarchar](1000) NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[MetricID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AnimalHealthRecord]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AnimalHealthRecord](
	[RecordID] [int] IDENTITY(1,1) NOT NULL,
	[AnimalID] [int] NOT NULL,
	[CheckupDate] [datetime2](0) NOT NULL,
	[HealthScore] [int] NOT NULL,
	[Notes] [nvarchar](1000) NULL,
	[StaffID] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[RecordID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AnimalKeeperAssignment]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AnimalKeeperAssignment](
	[AssignmentID] [int] IDENTITY(1,1) NOT NULL,
	[AnimalID] [int] NOT NULL,
	[StaffID] [int] NOT NULL,
	[StartDate] [date] NOT NULL,
	[EndDate] [date] NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[AssignmentID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Area]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Area](
	[AreaID] [int] IDENTITY(1,1) NOT NULL,
	[AreaName] [nvarchar](100) NOT NULL,
	[Theme] [nvarchar](100) NULL,
	[Description] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[AreaID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Attraction]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Attraction](
	[AttractionID] [int] IDENTITY(1,1) NOT NULL,
	[AttractionName] [nvarchar](48) NOT NULL,
	[AttractionType] [nvarchar](16) NOT NULL,
	[LocationDesc] [nvarchar](48) NOT NULL,
	[CapacityVisitors] [int] NOT NULL,
	[ActiveFlag] [bit] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
	[Description] [nvarchar](500) NULL,
	[Hours] [nvarchar](50) NULL,
	[Duration] [nvarchar](50) NULL,
	[AgeGroup] [nvarchar](50) NULL,
	[Price] [decimal](10, 2) NULL,
	[ImageUrl] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[AttractionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Customer]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Customer](
	[CustomerID] [int] IDENTITY(1,1) NOT NULL,
	[FullName] [nvarchar](120) NOT NULL,
	[Email] [nvarchar](255) NOT NULL,
	[PhoneNumber] [nvarchar](30) NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
	[LastLoginAt] [datetime2](0) NULL,
	[FirebaseUid] [nvarchar](128) NULL,
PRIMARY KEY CLUSTERED 
(
	[CustomerID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CustomerAudit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CustomerAudit](
	[AuditID] [int] IDENTITY(1,1) NOT NULL,
	[CustomerID] [int] NULL,
	[ActionType] [nvarchar](20) NULL,
	[ActionDate] [datetime2](0) NOT NULL,
	[PerformedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[AuditID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CustomerLoginAudit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CustomerLoginAudit](
	[LogID] [int] IDENTITY(1,1) NOT NULL,
	[CustomerID] [int] NOT NULL,
	[LoginTime] [datetime2](0) NULL,
PRIMARY KEY CLUSTERED 
(
	[LogID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Event]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Event](
	[EventID] [int] IDENTITY(1,1) NOT NULL,
	[EventName] [nvarchar](120) NOT NULL,
	[EventDate] [date] NOT NULL,
	[StartTime] [time](0) NOT NULL,
	[EndTime] [time](0) NOT NULL,
	[ExhibitID] [int] NOT NULL,
	[Capacity] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
	[Description] [nvarchar](500) NULL,
	[Category] [nvarchar](50) NULL,
	[IsFeatured] [bit] NOT NULL,
	[Price] [decimal](10, 2) NOT NULL,
	[EndDate] [date] NULL,
	[ImageUrl] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[EventID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Exhibit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Exhibit](
	[ExhibitID] [int] IDENTITY(1,1) NOT NULL,
	[ExhibitName] [nvarchar](100) NOT NULL,
	[AreaID] [int] NOT NULL,
	[Capacity] [int] NOT NULL,
	[OpeningHours] [nvarchar](100) NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
	[ImageUrl] [nvarchar](255) NULL,
	[IsFeatured] [bit] NULL,
	[Description] [nvarchar](1000) NULL,
PRIMARY KEY CLUSTERED 
(
	[ExhibitID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FeedingSchedule]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FeedingSchedule](
	[ScheduleID] [int] IDENTITY(1,1) NOT NULL,
	[AnimalID] [int] NOT NULL,
	[FeedTime] [datetime2](0) NOT NULL,
	[FoodType] [nvarchar](100) NOT NULL,
	[StaffID] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[ScheduleID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GuestFeedback]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GuestFeedback](
	[FeedbackID] [int] IDENTITY(1,1) NOT NULL,
	[Rating] [int] NOT NULL,
	[Comment] [nvarchar](1000) NULL,
	[LocationTag] [nvarchar](100) NULL,
	[DateSubmitted] [date] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[FeedbackID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Habitat]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Habitat](
	[HabitatID] [int] IDENTITY(1,1) NOT NULL,
	[HabitatType] [nvarchar](100) NOT NULL,
	[Size] [decimal](10, 2) NOT NULL,
	[ExhibitID] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[HabitatID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HealthAlert]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HealthAlert](
	[AlertID] [int] IDENTITY(1,1) NOT NULL,
	[AnimalID] [int] NOT NULL,
	[AlertType] [nvarchar](50) NOT NULL,
	[AlertMessage] [nvarchar](1000) NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[IsResolved] [bit] NOT NULL,
	[ResolvedAt] [datetime2](0) NULL,
PRIMARY KEY CLUSTERED 
(
	[AlertID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MaintenanceRequest]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MaintenanceRequest](
	[RequestID] [int] IDENTITY(1,1) NOT NULL,
	[ExhibitID] [int] NOT NULL,
	[Description] [nvarchar](1000) NOT NULL,
	[RequestDate] [datetime2](0) NOT NULL,
	[Status] [nvarchar](20) NOT NULL,
	[StaffID] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[RequestID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MembershipPlans]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MembershipPlans](
	[PlanID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[MonthlyPrice] [decimal](10, 2) NOT NULL,
	[YearlyPrice] [decimal](10, 2) NOT NULL,
	[Features] [nvarchar](max) NULL,
	[IsPopular] [bit] NOT NULL,
	[SortOrder] [int] NOT NULL,
	[DeletedAt] [datetime2](7) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[PlanID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MembershipSubscriptions]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MembershipSubscriptions](
	[SubID] [int] IDENTITY(1,1) NOT NULL,
	[CustomerID] [int] NULL,
	[PlanName] [nvarchar](100) NOT NULL,
	[BillingPeriod] [nvarchar](10) NOT NULL,
	[Email] [nvarchar](200) NOT NULL,
	[Phone] [nvarchar](30) NULL,
	[AddressLine1] [nvarchar](200) NULL,
	[AddressLine2] [nvarchar](200) NULL,
	[City] [nvarchar](100) NULL,
	[StateProvince] [nvarchar](100) NULL,
	[ZipCode] [nvarchar](20) NULL,
	[BillingSameAsContact] [bit] NOT NULL,
	[BillingFullName] [nvarchar](100) NULL,
	[BillingAddress1] [nvarchar](200) NULL,
	[BillingAddress2] [nvarchar](200) NULL,
	[BillingCity] [nvarchar](100) NULL,
	[BillingState] [nvarchar](100) NULL,
	[BillingZip] [nvarchar](20) NULL,
	[CardLastFour] [nvarchar](4) NULL,
	[Total] [decimal](10, 2) NOT NULL,
	[StartDate] [date] NOT NULL,
	[EndDate] [date] NOT NULL,
	[PlacedAt] [datetime2](7) NOT NULL,
	[FirstName] [nvarchar](50) NULL,
	[LastName] [nvarchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[SubID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Orders]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Orders](
	[OrderID] [int] IDENTITY(1,1) NOT NULL,
	[Email] [nvarchar](200) NOT NULL,
	[Phone] [nvarchar](30) NULL,
	[AddressLine1] [nvarchar](200) NOT NULL,
	[AddressLine2] [nvarchar](200) NULL,
	[City] [nvarchar](100) NOT NULL,
	[StateProvince] [nvarchar](100) NOT NULL,
	[ZipCode] [nvarchar](20) NOT NULL,
	[BillingSameAsShipping] [bit] NOT NULL,
	[CardLastFour] [nvarchar](4) NULL,
	[Subtotal] [decimal](10, 2) NOT NULL,
	[Shipping] [decimal](10, 2) NOT NULL,
	[Tax] [decimal](10, 2) NOT NULL,
	[Total] [decimal](10, 2) NOT NULL,
	[OrderItems] [nvarchar](max) NULL,
	[PlacedAt] [datetime2](7) NOT NULL,
	[FirstName] [nvarchar](50) NULL,
	[LastName] [nvarchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[OrderID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[POSLocation]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[POSLocation](
	[POSLocationID] [int] IDENTITY(1,1) NOT NULL,
	[LocationName] [nvarchar](100) NOT NULL,
	[LocationType] [nvarchar](50) NOT NULL,
	[ZoneName] [nvarchar](50) NULL,
	[OpenTime] [time](0) NOT NULL,
	[CloseTime] [time](0) NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[POSLocationID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Product]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Product](
	[ProductID] [int] IDENTITY(1,1) NOT NULL,
	[ProductName] [nvarchar](120) NOT NULL,
	[Category] [nvarchar](100) NULL,
	[Price] [decimal](10, 2) NOT NULL,
	[StockQuantity] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
	[SKU] [nvarchar](50) NULL,
	[ImageUrl] [nvarchar](255) NULL,
	[LowStockThreshold] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ProductID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SpeciesCode]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SpeciesCode](
	[SpeciesCodeID] [int] IDENTITY(1,1) NOT NULL,
	[SpeciesName] [nvarchar](100) NOT NULL,
	[CodeSuffix] [nvarchar](10) NOT NULL,
	[LastCount] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[SpeciesCodeID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_CodeSuffix] UNIQUE NONCLUSTERED 
(
	[CodeSuffix] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_SpeciesName] UNIQUE NONCLUSTERED 
(
	[SpeciesName] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Staff]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Staff](
	[StaffID] [int] IDENTITY(1,1) NOT NULL,
	[FullName] [nvarchar](120) NOT NULL,
	[Role] [nvarchar](20) NOT NULL,
	[ContactNumber] [nvarchar](30) NULL,
	[Salary] [decimal](12, 2) NOT NULL,
	[HireDate] [date] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
	[Email] [nvarchar](255) NULL,
	[FirebaseUid] [nvarchar](128) NULL,
	[FirstName] [nvarchar](100) NULL,
	[LastName] [nvarchar](100) NULL,
	[DateOfBirth] [date] NULL,
	[SSN] [nvarchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[StaffID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StaffLoginAudit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StaffLoginAudit](
	[LogID] [int] IDENTITY(1,1) NOT NULL,
	[StaffID] [int] NOT NULL,
	[LoginTime] [datetime2](0) NULL,
PRIMARY KEY CLUSTERED 
(
	[LogID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StaffSchedule]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StaffSchedule](
	[ScheduleID] [int] IDENTITY(1,1) NOT NULL,
	[StaffID] [int] NOT NULL,
	[WorkDate] [date] NOT NULL,
	[ShiftStart] [time](0) NOT NULL,
	[ShiftEnd] [time](0) NOT NULL,
	[AssignedExhibitID] [int] NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[ScheduleID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TicketAddon]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TicketAddon](
	[AddonID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](200) NULL,
	[Price] [decimal](10, 2) NOT NULL,
	[SortOrder] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NULL,
	[DeletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[AddonID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TicketOrders]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TicketOrders](
	[TicketOrderID] [int] IDENTITY(1,1) NOT NULL,
	[Email] [nvarchar](200) NOT NULL,
	[Phone] [nvarchar](30) NULL,
	[VisitDate] [date] NOT NULL,
	[TicketType] [nvarchar](100) NOT NULL,
	[AdultQty] [int] NOT NULL,
	[ChildQty] [int] NOT NULL,
	[SeniorQty] [int] NOT NULL,
	[AddOns] [nvarchar](max) NULL,
	[BillingAddress] [nvarchar](500) NULL,
	[CardLastFour] [nvarchar](4) NULL,
	[Subtotal] [decimal](10, 2) NOT NULL,
	[Total] [decimal](10, 2) NOT NULL,
	[PlacedAt] [datetime2](7) NOT NULL,
	[AddressLine1] [nvarchar](200) NULL,
	[AddressLine2] [nvarchar](200) NULL,
	[City] [nvarchar](100) NULL,
	[StateProvince] [nvarchar](100) NULL,
	[ZipCode] [nvarchar](20) NULL,
	[BillingSameAsContact] [bit] NOT NULL,
	[BillingFullName] [nvarchar](100) NULL,
	[BillingAddress1] [nvarchar](200) NULL,
	[BillingAddress2] [nvarchar](200) NULL,
	[BillingCity] [nvarchar](100) NULL,
	[BillingState] [nvarchar](100) NULL,
	[BillingZip] [nvarchar](20) NULL,
	[AdultUnitPrice] [decimal](10, 2) NULL,
	[ChildUnitPrice] [decimal](10, 2) NULL,
	[SeniorUnitPrice] [decimal](10, 2) NULL,
	[FirstName] [nvarchar](50) NULL,
	[LastName] [nvarchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[TicketOrderID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TicketPackage]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TicketPackage](
	[PackageID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[AdultPrice] [decimal](10, 2) NOT NULL,
	[ChildPrice] [decimal](10, 2) NOT NULL,
	[SeniorPrice] [decimal](10, 2) NOT NULL,
	[IsMostPopular] [bit] NOT NULL,
	[Features] [nvarchar](max) NULL,
	[SortOrder] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NULL,
	[DeletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[PackageID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TicketType]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TicketType](
	[TicketTypeID] [int] IDENTITY(1,1) NOT NULL,
	[TypeName] [nvarchar](30) NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedBy] [nvarchar](100) NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedBy] [nvarchar](100) NULL,
	[DeletedAt] [datetime2](0) NULL,
	[DeletedBy] [nvarchar](100) NULL,
	[BasePrice] [decimal](10, 2) NULL,
	[Description] [nvarchar](255) NULL,
	[Category] [nvarchar](30) NULL,
PRIMARY KEY CLUSTERED 
(
	[TicketTypeID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Animal] ADD  CONSTRAINT [DF_Animal_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Animal] ADD  DEFAULT ((0)) FOR [IsDisplay]
GO
ALTER TABLE [dbo].[AnimalAudit] ADD  DEFAULT (sysutcdatetime()) FOR [ActionDate]
GO
ALTER TABLE [dbo].[AnimalHealthMetrics] ADD  CONSTRAINT [DF_AHM_RecordDate]  DEFAULT (sysutcdatetime()) FOR [RecordDate]
GO
ALTER TABLE [dbo].[AnimalHealthMetrics] ADD  CONSTRAINT [DF_AHM_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[AnimalHealthRecord] ADD  CONSTRAINT [DF_AHR_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment] ADD  CONSTRAINT [DF_AKA_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Area] ADD  CONSTRAINT [DF_Area_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Attraction] ADD  CONSTRAINT [DF_Attraction_ActiveFlag]  DEFAULT ((1)) FOR [ActiveFlag]
GO
ALTER TABLE [dbo].[Attraction] ADD  CONSTRAINT [DF_Attraction_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Customer] ADD  CONSTRAINT [DF_Customer_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[CustomerAudit] ADD  DEFAULT (sysutcdatetime()) FOR [ActionDate]
GO
ALTER TABLE [dbo].[CustomerLoginAudit] ADD  DEFAULT (sysutcdatetime()) FOR [LoginTime]
GO
ALTER TABLE [dbo].[Event] ADD  CONSTRAINT [DF_Event_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Event] ADD  DEFAULT ((0)) FOR [IsFeatured]
GO
ALTER TABLE [dbo].[Event] ADD  DEFAULT ((0)) FOR [Price]
GO
ALTER TABLE [dbo].[Exhibit] ADD  CONSTRAINT [DF_Exhibit_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[FeedingSchedule] ADD  CONSTRAINT [DF_FS_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[GuestFeedback] ADD  DEFAULT (CONVERT([date],getutcdate())) FOR [DateSubmitted]
GO
ALTER TABLE [dbo].[GuestFeedback] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Habitat] ADD  CONSTRAINT [DF_Habitat_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[HealthAlert] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[HealthAlert] ADD  DEFAULT ((0)) FOR [IsResolved]
GO
ALTER TABLE [dbo].[MaintenanceRequest] ADD  CONSTRAINT [DF_MR_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[MembershipPlans] ADD  DEFAULT ((0)) FOR [MonthlyPrice]
GO
ALTER TABLE [dbo].[MembershipPlans] ADD  DEFAULT ((0)) FOR [YearlyPrice]
GO
ALTER TABLE [dbo].[MembershipPlans] ADD  DEFAULT ((0)) FOR [IsPopular]
GO
ALTER TABLE [dbo].[MembershipPlans] ADD  DEFAULT ((0)) FOR [SortOrder]
GO
ALTER TABLE [dbo].[MembershipPlans] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[MembershipSubscriptions] ADD  DEFAULT ((1)) FOR [BillingSameAsContact]
GO
ALTER TABLE [dbo].[MembershipSubscriptions] ADD  DEFAULT (sysutcdatetime()) FOR [PlacedAt]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT ((1)) FOR [BillingSameAsShipping]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT (sysutcdatetime()) FOR [PlacedAt]
GO
ALTER TABLE [dbo].[POSLocation] ADD  CONSTRAINT [DF_POS_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Product] ADD  CONSTRAINT [DF_Product_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Product] ADD  DEFAULT ((10)) FOR [LowStockThreshold]
GO
ALTER TABLE [dbo].[SpeciesCode] ADD  DEFAULT ((0)) FOR [LastCount]
GO
ALTER TABLE [dbo].[Staff] ADD  CONSTRAINT [DF_Staff_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[StaffLoginAudit] ADD  DEFAULT (sysutcdatetime()) FOR [LoginTime]
GO
ALTER TABLE [dbo].[StaffSchedule] ADD  CONSTRAINT [DF_SS_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[TicketAddon] ADD  DEFAULT ((0)) FOR [Price]
GO
ALTER TABLE [dbo].[TicketAddon] ADD  DEFAULT ((0)) FOR [SortOrder]
GO
ALTER TABLE [dbo].[TicketAddon] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[TicketOrders] ADD  DEFAULT ((0)) FOR [AdultQty]
GO
ALTER TABLE [dbo].[TicketOrders] ADD  DEFAULT ((0)) FOR [ChildQty]
GO
ALTER TABLE [dbo].[TicketOrders] ADD  DEFAULT ((0)) FOR [SeniorQty]
GO
ALTER TABLE [dbo].[TicketOrders] ADD  DEFAULT (sysutcdatetime()) FOR [PlacedAt]
GO
ALTER TABLE [dbo].[TicketOrders] ADD  DEFAULT ((1)) FOR [BillingSameAsContact]
GO
ALTER TABLE [dbo].[TicketPackage] ADD  DEFAULT ((0)) FOR [AdultPrice]
GO
ALTER TABLE [dbo].[TicketPackage] ADD  DEFAULT ((0)) FOR [ChildPrice]
GO
ALTER TABLE [dbo].[TicketPackage] ADD  DEFAULT ((0)) FOR [SeniorPrice]
GO
ALTER TABLE [dbo].[TicketPackage] ADD  DEFAULT ((0)) FOR [IsMostPopular]
GO
ALTER TABLE [dbo].[TicketPackage] ADD  DEFAULT ((0)) FOR [SortOrder]
GO
ALTER TABLE [dbo].[TicketPackage] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[TicketType] ADD  CONSTRAINT [DF_TicketType_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Animal]  WITH CHECK ADD  CONSTRAINT [FK_Animal_Habitat] FOREIGN KEY([HabitatID])
REFERENCES [dbo].[Habitat] ([HabitatID])
GO
ALTER TABLE [dbo].[Animal] CHECK CONSTRAINT [FK_Animal_Habitat]
GO
ALTER TABLE [dbo].[AnimalHealthMetrics]  WITH CHECK ADD  CONSTRAINT [FK_AHM_Animal] FOREIGN KEY([AnimalID])
REFERENCES [dbo].[Animal] ([AnimalID])
GO
ALTER TABLE [dbo].[AnimalHealthMetrics] CHECK CONSTRAINT [FK_AHM_Animal]
GO
ALTER TABLE [dbo].[AnimalHealthRecord]  WITH CHECK ADD  CONSTRAINT [FK_AHR_Animal] FOREIGN KEY([AnimalID])
REFERENCES [dbo].[Animal] ([AnimalID])
GO
ALTER TABLE [dbo].[AnimalHealthRecord] CHECK CONSTRAINT [FK_AHR_Animal]
GO
ALTER TABLE [dbo].[AnimalHealthRecord]  WITH CHECK ADD  CONSTRAINT [FK_AHR_Staff] FOREIGN KEY([StaffID])
REFERENCES [dbo].[Staff] ([StaffID])
GO
ALTER TABLE [dbo].[AnimalHealthRecord] CHECK CONSTRAINT [FK_AHR_Staff]
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment]  WITH CHECK ADD  CONSTRAINT [FK_AKA_Animal] FOREIGN KEY([AnimalID])
REFERENCES [dbo].[Animal] ([AnimalID])
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment] CHECK CONSTRAINT [FK_AKA_Animal]
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment]  WITH CHECK ADD  CONSTRAINT [FK_AKA_Staff] FOREIGN KEY([StaffID])
REFERENCES [dbo].[Staff] ([StaffID])
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment] CHECK CONSTRAINT [FK_AKA_Staff]
GO
ALTER TABLE [dbo].[CustomerLoginAudit]  WITH CHECK ADD FOREIGN KEY([CustomerID])
REFERENCES [dbo].[Customer] ([CustomerID])
GO
ALTER TABLE [dbo].[Event]  WITH CHECK ADD  CONSTRAINT [FK_Event_Exhibit] FOREIGN KEY([ExhibitID])
REFERENCES [dbo].[Exhibit] ([ExhibitID])
GO
ALTER TABLE [dbo].[Event] CHECK CONSTRAINT [FK_Event_Exhibit]
GO
ALTER TABLE [dbo].[Exhibit]  WITH CHECK ADD  CONSTRAINT [FK_Exhibit_Area] FOREIGN KEY([AreaID])
REFERENCES [dbo].[Area] ([AreaID])
GO
ALTER TABLE [dbo].[Exhibit] CHECK CONSTRAINT [FK_Exhibit_Area]
GO
ALTER TABLE [dbo].[FeedingSchedule]  WITH CHECK ADD  CONSTRAINT [FK_FS_Animal] FOREIGN KEY([AnimalID])
REFERENCES [dbo].[Animal] ([AnimalID])
GO
ALTER TABLE [dbo].[FeedingSchedule] CHECK CONSTRAINT [FK_FS_Animal]
GO
ALTER TABLE [dbo].[FeedingSchedule]  WITH CHECK ADD  CONSTRAINT [FK_FS_Staff] FOREIGN KEY([StaffID])
REFERENCES [dbo].[Staff] ([StaffID])
GO
ALTER TABLE [dbo].[FeedingSchedule] CHECK CONSTRAINT [FK_FS_Staff]
GO
ALTER TABLE [dbo].[Habitat]  WITH CHECK ADD  CONSTRAINT [FK_Habitat_Exhibit] FOREIGN KEY([ExhibitID])
REFERENCES [dbo].[Exhibit] ([ExhibitID])
GO
ALTER TABLE [dbo].[Habitat] CHECK CONSTRAINT [FK_Habitat_Exhibit]
GO
ALTER TABLE [dbo].[HealthAlert]  WITH CHECK ADD  CONSTRAINT [FK_HealthAlert_Animal] FOREIGN KEY([AnimalID])
REFERENCES [dbo].[Animal] ([AnimalID])
GO
ALTER TABLE [dbo].[HealthAlert] CHECK CONSTRAINT [FK_HealthAlert_Animal]
GO
ALTER TABLE [dbo].[MaintenanceRequest]  WITH CHECK ADD  CONSTRAINT [FK_MR_Exhibit] FOREIGN KEY([ExhibitID])
REFERENCES [dbo].[Exhibit] ([ExhibitID])
GO
ALTER TABLE [dbo].[MaintenanceRequest] CHECK CONSTRAINT [FK_MR_Exhibit]
GO
ALTER TABLE [dbo].[MaintenanceRequest]  WITH CHECK ADD  CONSTRAINT [FK_MR_Staff] FOREIGN KEY([StaffID])
REFERENCES [dbo].[Staff] ([StaffID])
GO
ALTER TABLE [dbo].[MaintenanceRequest] CHECK CONSTRAINT [FK_MR_Staff]
GO
ALTER TABLE [dbo].[StaffLoginAudit]  WITH CHECK ADD FOREIGN KEY([StaffID])
REFERENCES [dbo].[Staff] ([StaffID])
GO
ALTER TABLE [dbo].[StaffSchedule]  WITH CHECK ADD  CONSTRAINT [FK_SS_Exhibit] FOREIGN KEY([AssignedExhibitID])
REFERENCES [dbo].[Exhibit] ([ExhibitID])
GO
ALTER TABLE [dbo].[StaffSchedule] CHECK CONSTRAINT [FK_SS_Exhibit]
GO
ALTER TABLE [dbo].[StaffSchedule]  WITH CHECK ADD  CONSTRAINT [FK_SS_Staff] FOREIGN KEY([StaffID])
REFERENCES [dbo].[Staff] ([StaffID])
GO
ALTER TABLE [dbo].[StaffSchedule] CHECK CONSTRAINT [FK_SS_Staff]
GO
ALTER TABLE [dbo].[Animal]  WITH CHECK ADD  CONSTRAINT [CK_Animal_Age] CHECK  (([Age]>=(0)))
GO
ALTER TABLE [dbo].[Animal] CHECK CONSTRAINT [CK_Animal_Age]
GO
ALTER TABLE [dbo].[AnimalHealthRecord]  WITH CHECK ADD  CONSTRAINT [CK_AHR_HealthScore] CHECK  (([HealthScore]>=(0) AND [HealthScore]<=(100)))
GO
ALTER TABLE [dbo].[AnimalHealthRecord] CHECK CONSTRAINT [CK_AHR_HealthScore]
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment]  WITH CHECK ADD  CONSTRAINT [CK_AKA_Date] CHECK  (([EndDate] IS NULL OR [EndDate]>=[StartDate]))
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment] CHECK CONSTRAINT [CK_AKA_Date]
GO
ALTER TABLE [dbo].[Attraction]  WITH CHECK ADD  CONSTRAINT [CK_Attraction_Capacity] CHECK  (([CapacityVisitors]>=(0)))
GO
ALTER TABLE [dbo].[Attraction] CHECK CONSTRAINT [CK_Attraction_Capacity]
GO
ALTER TABLE [dbo].[Event]  WITH CHECK ADD  CONSTRAINT [CK_Event_Capacity] CHECK  (([Capacity]>=(0)))
GO
ALTER TABLE [dbo].[Event] CHECK CONSTRAINT [CK_Event_Capacity]
GO
ALTER TABLE [dbo].[Event]  WITH CHECK ADD  CONSTRAINT [CK_Event_Time] CHECK  (([EndTime]>[StartTime]))
GO
ALTER TABLE [dbo].[Event] CHECK CONSTRAINT [CK_Event_Time]
GO
ALTER TABLE [dbo].[Exhibit]  WITH CHECK ADD  CONSTRAINT [CK_Exhibit_Capacity] CHECK  (([Capacity]>=(0)))
GO
ALTER TABLE [dbo].[Exhibit] CHECK CONSTRAINT [CK_Exhibit_Capacity]
GO
ALTER TABLE [dbo].[GuestFeedback]  WITH CHECK ADD CHECK  (([Rating]>=(1) AND [Rating]<=(5)))
GO
ALTER TABLE [dbo].[Habitat]  WITH CHECK ADD  CONSTRAINT [CK_Habitat_Size] CHECK  (([Size]>(0)))
GO
ALTER TABLE [dbo].[Habitat] CHECK CONSTRAINT [CK_Habitat_Size]
GO
ALTER TABLE [dbo].[MaintenanceRequest]  WITH CHECK ADD  CONSTRAINT [CK_MR_Status] CHECK  (([Status]='Completed' OR [Status]='In Progress' OR [Status]='Pending'))
GO
ALTER TABLE [dbo].[MaintenanceRequest] CHECK CONSTRAINT [CK_MR_Status]
GO
ALTER TABLE [dbo].[POSLocation]  WITH CHECK ADD  CONSTRAINT [CK_POS_Time] CHECK  (([CloseTime]>[OpenTime]))
GO
ALTER TABLE [dbo].[POSLocation] CHECK CONSTRAINT [CK_POS_Time]
GO
ALTER TABLE [dbo].[Product]  WITH CHECK ADD  CONSTRAINT [CK_Product_Price] CHECK  (([Price]>=(0)))
GO
ALTER TABLE [dbo].[Product] CHECK CONSTRAINT [CK_Product_Price]
GO
ALTER TABLE [dbo].[Product]  WITH CHECK ADD  CONSTRAINT [CK_Product_Stock] CHECK  (([StockQuantity]>=(0)))
GO
ALTER TABLE [dbo].[Product] CHECK CONSTRAINT [CK_Product_Stock]
GO
ALTER TABLE [dbo].[Staff]  WITH CHECK ADD  CONSTRAINT [CK_Staff_Salary] CHECK  (([Salary]>=(0)))
GO
ALTER TABLE [dbo].[Staff] CHECK CONSTRAINT [CK_Staff_Salary]
GO
ALTER TABLE [dbo].[StaffSchedule]  WITH CHECK ADD  CONSTRAINT [CK_StaffSchedule_Shift] CHECK  (([ShiftEnd]>[ShiftStart]))
GO
ALTER TABLE [dbo].[StaffSchedule] CHECK CONSTRAINT [CK_StaffSchedule_Shift]
GO
/****** Object:  Trigger [dbo].[trg_Animal_Delete_Audit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   TRIGGER [dbo].[trg_Animal_Delete_Audit]
ON [dbo].[Animal]
AFTER DELETE
AS
BEGIN
    INSERT INTO dbo.AnimalAudit
    (
        AnimalID, Name, Species, Age, Gender, DateArrived, HabitatID,
        ActionType, ActionDate, PerformedBy
    )
    SELECT
        d.AnimalID, d.Name, d.Species, d.Age, d.Gender, d.DateArrived, d.HabitatID,
        'DELETE', SYSUTCDATETIME(), d.UpdatedBy
    FROM deleted d;
END
GO
ALTER TABLE [dbo].[Animal] ENABLE TRIGGER [trg_Animal_Delete_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Animal_Insert_Audit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   TRIGGER [dbo].[trg_Animal_Insert_Audit]
ON [dbo].[Animal]
AFTER INSERT
AS
BEGIN
    INSERT INTO dbo.AnimalAudit
    (
        AnimalID, Name, Species, Age, Gender, DateArrived, HabitatID,
        ActionType, ActionDate, PerformedBy
    )
    SELECT
        i.AnimalID, i.Name, i.Species, i.Age, i.Gender, i.DateArrived, i.HabitatID,
        'INSERT', SYSUTCDATETIME(), i.CreatedBy
    FROM inserted i;
END
GO
ALTER TABLE [dbo].[Animal] ENABLE TRIGGER [trg_Animal_Insert_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Animal_SoftDelete]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Animal
CREATE   TRIGGER [dbo].[trg_Animal_SoftDelete]
ON [dbo].[Animal]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE a
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.Animal a
    INNER JOIN deleted d ON a.AnimalID = d.AnimalID;
END
GO
ALTER TABLE [dbo].[Animal] ENABLE TRIGGER [trg_Animal_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Animal_Update_Audit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   TRIGGER [dbo].[trg_Animal_Update_Audit]
ON [dbo].[Animal]
AFTER UPDATE
AS
BEGIN
    INSERT INTO dbo.AnimalAudit
    (
        AnimalID, Name, Species, Age, Gender, DateArrived, HabitatID,
        ActionType, ActionDate, PerformedBy
    )
    SELECT
        i.AnimalID, i.Name, i.Species, i.Age, i.Gender, i.DateArrived, i.HabitatID,
        'UPDATE', SYSUTCDATETIME(), i.UpdatedBy
    FROM inserted i;
END
GO
ALTER TABLE [dbo].[Animal] ENABLE TRIGGER [trg_Animal_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_AnimalHealthMetrics_SoftDelete]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- AnimalHealthMetrics (if you have this table)
CREATE   TRIGGER [dbo].[trg_AnimalHealthMetrics_SoftDelete]
ON [dbo].[AnimalHealthMetrics]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE ahm
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.AnimalHealthMetrics ahm
    INNER JOIN deleted d ON ahm.MetricID = d.MetricID;
END
GO
ALTER TABLE [dbo].[AnimalHealthMetrics] ENABLE TRIGGER [trg_AnimalHealthMetrics_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_AnimalHealthMetrics_Update_Audit]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- AnimalHealthMetrics (if you created this table)
CREATE   TRIGGER [dbo].[trg_AnimalHealthMetrics_Update_Audit]
ON [dbo].[AnimalHealthMetrics]
AFTER UPDATE
AS
BEGIN
    UPDATE ahm
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.AnimalHealthMetrics ahm
    INNER JOIN inserted i ON ahm.MetricID = i.MetricID;
END
GO
ALTER TABLE [dbo].[AnimalHealthMetrics] ENABLE TRIGGER [trg_AnimalHealthMetrics_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_HealthMetrics_WeightAlert]    Script Date: 3/23/2026 9:52:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

    CREATE TRIGGER [dbo].[trg_HealthMetrics_WeightAlert]
    ON [dbo].[AnimalHealthMetrics]
    AFTER INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        IF TRIGGER_NESTLEVEL() > 1 RETURN;

        INSERT INTO [dbo].[HealthAlert] (AnimalID, AlertType, AlertMessage)
        SELECT
            i.AnimalID,
            'Weight Out of Range',
            CONCAT(
                a.Name, ' (', a.Species, ') weight of ',
                CAST(i.Weight AS NVARCHAR(20)), ' kg is outside the expected range [',
                ISNULL(CAST(i.WeightRangeLow AS NVARCHAR(20)), '?'), ' - ',
                ISNULL(CAST(i.WeightRangeHigh AS NVARCHAR(20)), '?'), ' kg]. Recorded on ',
                FORMAT(i.RecordDate, 'yyyy-MM-dd'), '.'
            )
        FROM inserted i
        JOIN [dbo].[Animal] a ON i.AnimalID = a.AnimalID
        WHERE i.Weight IS NOT NULL
          AND i.DeletedAt IS NULL
          AND (
                (i.WeightRangeLow IS NOT NULL AND i.Weight < i.WeightRangeLow)
             OR (i.WeightRangeHigh IS NOT NULL AND i.Weight > i.WeightRangeHigh)
          );
    END;
  
GO
ALTER TABLE [dbo].[AnimalHealthMetrics] ENABLE TRIGGER [trg_HealthMetrics_WeightAlert]
GO
/****** Object:  Trigger [dbo].[trg_AnimalHealthRecord_SoftDelete]    Script Date: 3/23/2026 9:52:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- AnimalHealthRecord
CREATE   TRIGGER [dbo].[trg_AnimalHealthRecord_SoftDelete]
ON [dbo].[AnimalHealthRecord]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE ahr
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.AnimalHealthRecord ahr
    INNER JOIN deleted d ON ahr.RecordID = d.RecordID;
END
GO
ALTER TABLE [dbo].[AnimalHealthRecord] ENABLE TRIGGER [trg_AnimalHealthRecord_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_AnimalHealthRecord_Update_Audit]    Script Date: 3/23/2026 9:52:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- AnimalHealthRecord
CREATE   TRIGGER [dbo].[trg_AnimalHealthRecord_Update_Audit]
ON [dbo].[AnimalHealthRecord]
AFTER UPDATE
AS
BEGIN
    UPDATE ahr
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.AnimalHealthRecord ahr
    INNER JOIN inserted i ON ahr.RecordID = i.RecordID;
END
GO
ALTER TABLE [dbo].[AnimalHealthRecord] ENABLE TRIGGER [trg_AnimalHealthRecord_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_HealthRecord_CriticalScore]    Script Date: 3/23/2026 9:52:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

    CREATE TRIGGER [dbo].[trg_HealthRecord_CriticalScore]
    ON [dbo].[AnimalHealthRecord]
    AFTER INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        IF TRIGGER_NESTLEVEL() > 1 RETURN;

        INSERT INTO [dbo].[HealthAlert] (AnimalID, AlertType, AlertMessage)
        SELECT
            i.AnimalID,
            'Critical Health Score',
            CONCAT(
                a.Name, ' (', a.Species, ') received a critical health score of ',
                CAST(i.HealthScore AS NVARCHAR(10)), ' on ',
                FORMAT(i.CheckupDate, 'yyyy-MM-dd'),
                '. Immediate attention required.'
            )
        FROM inserted i
        JOIN [dbo].[Animal] a ON i.AnimalID = a.AnimalID
        WHERE i.HealthScore < 40
          AND i.DeletedAt IS NULL;

        INSERT INTO [dbo].[MaintenanceRequest]
            (ExhibitID, Description, RequestDate, Status, StaffID, CreatedAt, CreatedBy)
        SELECT
            h.ExhibitID,
            CONCAT(
                '[AUTO] Critical health alert for ', a.Name, ' (', a.Species,
                '). Health score: ', CAST(i.HealthScore AS NVARCHAR(10)),
                '. Habitat/exhibit inspection and veterinary review needed.'
            ),
            SYSUTCDATETIME(),
            'Pending',
            i.StaffID,
            SYSUTCDATETIME(),
            'SYSTEM_TRIGGER'
        FROM inserted i
        JOIN [dbo].[Animal] a ON i.AnimalID = a.AnimalID
        JOIN [dbo].[Habitat] hab ON a.HabitatID = hab.HabitatID
        JOIN [dbo].[Exhibit] h ON hab.ExhibitID = h.ExhibitID
        WHERE i.HealthScore < 40
          AND i.DeletedAt IS NULL;
    END;
  
GO
ALTER TABLE [dbo].[AnimalHealthRecord] ENABLE TRIGGER [trg_HealthRecord_CriticalScore]
GO
/****** Object:  Trigger [dbo].[trg_AnimalKeeperAssignment_SoftDelete]    Script Date: 3/23/2026 9:52:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- AnimalKeeperAssignment
CREATE   TRIGGER [dbo].[trg_AnimalKeeperAssignment_SoftDelete]
ON [dbo].[AnimalKeeperAssignment]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE aka
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.AnimalKeeperAssignment aka
    INNER JOIN deleted d ON aka.AssignmentID = d.AssignmentID;
END
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment] ENABLE TRIGGER [trg_AnimalKeeperAssignment_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_AnimalKeeperAssignment_Update_Audit]    Script Date: 3/23/2026 9:52:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- AnimalKeeperAssignment
CREATE   TRIGGER [dbo].[trg_AnimalKeeperAssignment_Update_Audit]
ON [dbo].[AnimalKeeperAssignment]
AFTER UPDATE
AS
BEGIN
    UPDATE aka
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.AnimalKeeperAssignment aka
    INNER JOIN inserted i ON aka.AssignmentID = i.AssignmentID;
END
GO
ALTER TABLE [dbo].[AnimalKeeperAssignment] ENABLE TRIGGER [trg_AnimalKeeperAssignment_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Area_SoftDelete]    Script Date: 3/23/2026 9:52:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- Area
CREATE   TRIGGER [dbo].[trg_Area_SoftDelete]
ON [dbo].[Area]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE a
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.Area a
    INNER JOIN deleted d ON a.AreaID = d.AreaID;
END
GO
ALTER TABLE [dbo].[Area] ENABLE TRIGGER [trg_Area_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Area_Update_Audit]    Script Date: 3/23/2026 9:52:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- Area
CREATE   TRIGGER [dbo].[trg_Area_Update_Audit]
ON [dbo].[Area]
AFTER UPDATE
AS
BEGIN
    UPDATE a
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.Area a
    INNER JOIN inserted i ON a.AreaID = i.AreaID;
END
GO
ALTER TABLE [dbo].[Area] ENABLE TRIGGER [trg_Area_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Attraction_SoftDelete]    Script Date: 3/23/2026 9:52:43 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Attraction
CREATE   TRIGGER [dbo].[trg_Attraction_SoftDelete]
ON [dbo].[Attraction]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE a
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.Attraction a
    INNER JOIN deleted d ON a.AttractionID = d.AttractionID;
END
GO
ALTER TABLE [dbo].[Attraction] ENABLE TRIGGER [trg_Attraction_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Attraction_Update_Audit]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Attraction
CREATE   TRIGGER [dbo].[trg_Attraction_Update_Audit]
ON [dbo].[Attraction]
AFTER UPDATE
AS
BEGIN
    UPDATE a
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.Attraction a
    INNER JOIN inserted i ON a.AttractionID = i.AttractionID;
END
GO
ALTER TABLE [dbo].[Attraction] ENABLE TRIGGER [trg_Attraction_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Customer_Login_Audit]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 4. Trigger for Login (Update to LastLoginAt)
CREATE   TRIGGER [dbo].[trg_Customer_Login_Audit]
ON [dbo].[Customer]
AFTER UPDATE
AS
BEGIN
    INSERT INTO dbo.CustomerAudit (CustomerID, ActionType, ActionDate, PerformedBy)
    SELECT i.CustomerID, 'LOGIN', SYSUTCDATETIME(), i.UpdatedBy
    FROM inserted i
    INNER JOIN deleted d ON i.CustomerID = d.CustomerID
    WHERE i.LastLoginAt IS NOT NULL AND (d.LastLoginAt IS NULL OR i.LastLoginAt > d.LastLoginAt);
END
GO
ALTER TABLE [dbo].[Customer] ENABLE TRIGGER [trg_Customer_Login_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Customer_Signup_Audit]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   TRIGGER [dbo].[trg_Customer_Signup_Audit]
ON [dbo].[Customer]
AFTER INSERT
AS
BEGIN
    INSERT INTO dbo.CustomerAudit (CustomerID, ActionType, ActionDate, PerformedBy)
    SELECT i.CustomerID, 'SIGNUP', SYSUTCDATETIME(), i.CreatedBy
    FROM inserted i;
END
GO
ALTER TABLE [dbo].[Customer] ENABLE TRIGGER [trg_Customer_Signup_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Customer_SoftDelete]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Customer
CREATE   TRIGGER [dbo].[trg_Customer_SoftDelete]
ON [dbo].[Customer]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE c
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.Customer c
    INNER JOIN deleted d ON c.CustomerID = d.CustomerID;
END
GO
ALTER TABLE [dbo].[Customer] ENABLE TRIGGER [trg_Customer_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Customer_Update_Audit]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Customer
CREATE   TRIGGER [dbo].[trg_Customer_Update_Audit]
ON [dbo].[Customer]
AFTER UPDATE
AS
BEGIN
    UPDATE c
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.Customer c
    INNER JOIN inserted i ON c.CustomerID = i.CustomerID;
END
GO
ALTER TABLE [dbo].[Customer] ENABLE TRIGGER [trg_Customer_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Event_SoftDelete]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Event
CREATE   TRIGGER [dbo].[trg_Event_SoftDelete]
ON [dbo].[Event]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE e
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.[Event] e
    INNER JOIN deleted d ON e.EventID = d.EventID;
END
GO
ALTER TABLE [dbo].[Event] ENABLE TRIGGER [trg_Event_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Event_Update_Audit]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Event
CREATE   TRIGGER [dbo].[trg_Event_Update_Audit]
ON [dbo].[Event]
AFTER UPDATE
AS
BEGIN
    UPDATE e
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.[Event] e
    INNER JOIN inserted i ON e.EventID = i.EventID;
END
GO
ALTER TABLE [dbo].[Event] ENABLE TRIGGER [trg_Event_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Exhibit_SoftDelete]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Exhibit
CREATE   TRIGGER [dbo].[trg_Exhibit_SoftDelete]
ON [dbo].[Exhibit]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE e
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.Exhibit e
    INNER JOIN deleted d ON e.ExhibitID = d.ExhibitID;
END
GO
ALTER TABLE [dbo].[Exhibit] ENABLE TRIGGER [trg_Exhibit_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Exhibit_Update_Audit]    Script Date: 3/23/2026 9:52:44 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Exhibit
CREATE   TRIGGER [dbo].[trg_Exhibit_Update_Audit]
ON [dbo].[Exhibit]
AFTER UPDATE
AS
BEGIN
    UPDATE e
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.Exhibit e
    INNER JOIN inserted i ON e.ExhibitID = i.ExhibitID;
END
GO
ALTER TABLE [dbo].[Exhibit] ENABLE TRIGGER [trg_Exhibit_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_FeedingSchedule_SoftDelete]    Script Date: 3/23/2026 9:52:45 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- FeedingSchedule
CREATE   TRIGGER [dbo].[trg_FeedingSchedule_SoftDelete]
ON [dbo].[FeedingSchedule]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE fs
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.FeedingSchedule fs
    INNER JOIN deleted d ON fs.ScheduleID = d.ScheduleID;
END
GO
ALTER TABLE [dbo].[FeedingSchedule] ENABLE TRIGGER [trg_FeedingSchedule_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_FeedingSchedule_Update_Audit]    Script Date: 3/23/2026 9:52:45 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- FeedingSchedule
CREATE   TRIGGER [dbo].[trg_FeedingSchedule_Update_Audit]
ON [dbo].[FeedingSchedule]
AFTER UPDATE
AS
BEGIN
    UPDATE fs
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.FeedingSchedule fs
    INNER JOIN inserted i ON fs.ScheduleID = i.ScheduleID;
END
GO
ALTER TABLE [dbo].[FeedingSchedule] ENABLE TRIGGER [trg_FeedingSchedule_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Habitat_SoftDelete]    Script Date: 3/23/2026 9:52:45 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Habitat
CREATE   TRIGGER [dbo].[trg_Habitat_SoftDelete]
ON [dbo].[Habitat]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE h
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.Habitat h
    INNER JOIN deleted d ON h.HabitatID = d.HabitatID;
END
GO
ALTER TABLE [dbo].[Habitat] ENABLE TRIGGER [trg_Habitat_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Habitat_Update_Audit]    Script Date: 3/23/2026 9:52:45 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Habitat
CREATE   TRIGGER [dbo].[trg_Habitat_Update_Audit]
ON [dbo].[Habitat]
AFTER UPDATE
AS
BEGIN
    UPDATE h
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.Habitat h
    INNER JOIN inserted i ON h.HabitatID = i.HabitatID;
END
GO
ALTER TABLE [dbo].[Habitat] ENABLE TRIGGER [trg_Habitat_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_MaintenanceRequest_SoftDelete]    Script Date: 3/23/2026 9:52:45 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- MaintenanceRequest
CREATE   TRIGGER [dbo].[trg_MaintenanceRequest_SoftDelete]
ON [dbo].[MaintenanceRequest]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE mr
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.MaintenanceRequest mr
    INNER JOIN deleted d ON mr.RequestID = d.RequestID;
END
GO
ALTER TABLE [dbo].[MaintenanceRequest] ENABLE TRIGGER [trg_MaintenanceRequest_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_MaintenanceRequest_Update_Audit]    Script Date: 3/23/2026 9:52:45 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- MaintenanceRequest
CREATE   TRIGGER [dbo].[trg_MaintenanceRequest_Update_Audit]
ON [dbo].[MaintenanceRequest]
AFTER UPDATE
AS
BEGIN
    UPDATE mr
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.MaintenanceRequest mr
    INNER JOIN inserted i ON mr.RequestID = i.RequestID;
END
GO
ALTER TABLE [dbo].[MaintenanceRequest] ENABLE TRIGGER [trg_MaintenanceRequest_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_POSLocation_SoftDelete]    Script Date: 3/23/2026 9:52:45 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- POSLocation
CREATE   TRIGGER [dbo].[trg_POSLocation_SoftDelete]
ON [dbo].[POSLocation]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE pl
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.POSLocation pl
    INNER JOIN deleted d ON pl.POSLocationID = d.POSLocationID;
END
GO
ALTER TABLE [dbo].[POSLocation] ENABLE TRIGGER [trg_POSLocation_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_POSLocation_Update_Audit]    Script Date: 3/23/2026 9:52:45 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- POSLocation
CREATE   TRIGGER [dbo].[trg_POSLocation_Update_Audit]
ON [dbo].[POSLocation]
AFTER UPDATE
AS
BEGIN
    UPDATE pl
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.POSLocation pl
    INNER JOIN inserted i ON pl.POSLocationID = i.POSLocationID;
END
GO
ALTER TABLE [dbo].[POSLocation] ENABLE TRIGGER [trg_POSLocation_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Product_SoftDelete]    Script Date: 3/23/2026 9:52:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Product
CREATE   TRIGGER [dbo].[trg_Product_SoftDelete]
ON [dbo].[Product]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE p
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.Product p
    INNER JOIN deleted d ON p.ProductID = d.ProductID;
END
GO
ALTER TABLE [dbo].[Product] ENABLE TRIGGER [trg_Product_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Product_Update_Audit]    Script Date: 3/23/2026 9:52:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Product
CREATE   TRIGGER [dbo].[trg_Product_Update_Audit]
ON [dbo].[Product]
AFTER UPDATE
AS
BEGIN
    UPDATE p
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.Product p
    INNER JOIN inserted i ON p.ProductID = i.ProductID;
END
GO
ALTER TABLE [dbo].[Product] ENABLE TRIGGER [trg_Product_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_Staff_SoftDelete]    Script Date: 3/23/2026 9:52:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Staff
CREATE   TRIGGER [dbo].[trg_Staff_SoftDelete]
ON [dbo].[Staff]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE s
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.Staff s
    INNER JOIN deleted d ON s.StaffID = d.StaffID;
END
GO
ALTER TABLE [dbo].[Staff] ENABLE TRIGGER [trg_Staff_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_Staff_Update_Audit]    Script Date: 3/23/2026 9:52:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Staff
CREATE   TRIGGER [dbo].[trg_Staff_Update_Audit]
ON [dbo].[Staff]
AFTER UPDATE
AS
BEGIN
    UPDATE s
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.Staff s
    INNER JOIN inserted i ON s.StaffID = i.StaffID;
END
GO
ALTER TABLE [dbo].[Staff] ENABLE TRIGGER [trg_Staff_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_StaffSchedule_SoftDelete]    Script Date: 3/23/2026 9:52:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- StaffSchedule
CREATE   TRIGGER [dbo].[trg_StaffSchedule_SoftDelete]
ON [dbo].[StaffSchedule]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE ss
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.StaffSchedule ss
    INNER JOIN deleted d ON ss.ScheduleID = d.ScheduleID;
END
GO
ALTER TABLE [dbo].[StaffSchedule] ENABLE TRIGGER [trg_StaffSchedule_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_StaffSchedule_Update_Audit]    Script Date: 3/23/2026 9:52:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- StaffSchedule
CREATE   TRIGGER [dbo].[trg_StaffSchedule_Update_Audit]
ON [dbo].[StaffSchedule]
AFTER UPDATE
AS
BEGIN
    UPDATE ss
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.StaffSchedule ss
    INNER JOIN inserted i ON ss.ScheduleID = i.ScheduleID;
END
GO
ALTER TABLE [dbo].[StaffSchedule] ENABLE TRIGGER [trg_StaffSchedule_Update_Audit]
GO
/****** Object:  Trigger [dbo].[trg_TicketType_SoftDelete]    Script Date: 3/23/2026 9:52:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- TicketType
CREATE   TRIGGER [dbo].[trg_TicketType_SoftDelete]
ON [dbo].[TicketType]
INSTEAD OF DELETE
AS
BEGIN
    UPDATE tt
    SET DeletedAt = SYSUTCDATETIME(), DeletedBy = SYSTEM_USER
    FROM dbo.TicketType tt
    INNER JOIN deleted d ON tt.TicketTypeID = d.TicketTypeID;
END
GO
ALTER TABLE [dbo].[TicketType] ENABLE TRIGGER [trg_TicketType_SoftDelete]
GO
/****** Object:  Trigger [dbo].[trg_TicketType_Update_Audit]    Script Date: 3/23/2026 9:52:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- TicketType
CREATE   TRIGGER [dbo].[trg_TicketType_Update_Audit]
ON [dbo].[TicketType]
AFTER UPDATE
AS
BEGIN
    UPDATE tt
    SET UpdatedAt = SYSUTCDATETIME(), UpdatedBy = SYSTEM_USER
    FROM dbo.TicketType tt
    INNER JOIN inserted i ON tt.TicketTypeID = i.TicketTypeID;
END
GO
ALTER TABLE [dbo].[TicketType] ENABLE TRIGGER [trg_TicketType_Update_Audit]
GO
ALTER DATABASE [zootabase-database321] SET  READ_WRITE 
GO
