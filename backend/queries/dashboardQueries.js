// ── Dashboard Queries ───────────────────────────────────────────────

const animalStats = `
  SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN MONTH(CreatedAt) = MONTH(GETUTCDATE()) AND YEAR(CreatedAt) = YEAR(GETUTCDATE()) THEN 1 ELSE 0 END) AS thisMonth,
      SUM(CASE WHEN MONTH(CreatedAt) = MONTH(DATEADD(MONTH,-1,GETUTCDATE())) AND YEAR(CreatedAt) = YEAR(DATEADD(MONTH,-1,GETUTCDATE())) THEN 1 ELSE 0 END) AS lastMonth
  FROM Animal WHERE DeletedAt IS NULL
`;

const openMaintenance = `
  SELECT COUNT(*) AS cnt FROM MaintenanceRequest
  WHERE Status NOT IN ('Resolved','Completed') AND DeletedAt IS NULL
`;

const recentAnimalActivity = `
  SELECT TOP 5
      'animal' AS type,
      CASE WHEN a.UpdatedBy IS NOT NULL THEN 'Animal record updated' ELSE 'New animal added' END AS action,
      COALESCE(NULLIF(a.Name,''), a.Species, 'Unknown') + COALESCE(' — ' + e.ExhibitName, '') AS detail,
      COALESCE(a.UpdatedAt, a.CreatedAt, CAST(a.DateArrived AS DATETIME2)) AS ts
  FROM Animal a
  LEFT JOIN Habitat h ON a.HabitatID = h.HabitatID
  LEFT JOIN Exhibit e ON h.ExhibitID = e.ExhibitID
  WHERE a.DeletedAt IS NULL
  ORDER BY COALESCE(a.UpdatedAt, a.CreatedAt, CAST(a.DateArrived AS DATETIME2)) DESC
`;

const recentMaintenanceActivity = `
  SELECT TOP 5
      'maintenance' AS type,
      CASE WHEN m.Status IN ('Resolved','Completed') THEN 'Maintenance resolved' ELSE 'Maintenance logged' END AS action,
      LEFT(m.Description, 60) + COALESCE(' — ' + ex.ExhibitName, '') AS detail,
      COALESCE(m.UpdatedAt, m.CreatedAt, CAST(m.RequestDate AS DATETIME2)) AS ts
  FROM MaintenanceRequest m
  LEFT JOIN Exhibit ex ON m.ExhibitID = ex.ExhibitID
  WHERE m.DeletedAt IS NULL
  ORDER BY COALESCE(m.UpdatedAt, m.CreatedAt, CAST(m.RequestDate AS DATETIME2)) DESC
`;

const ticketsThisMonth = `
  SELECT ISNULL(SUM(AdultQty+ChildQty+SeniorQty), 0) AS cnt
  FROM TicketOrders
  WHERE MONTH(PlacedAt) = MONTH(GETUTCDATE()) AND YEAR(PlacedAt) = YEAR(GETUTCDATE())
`;

const ticketsLastMonth = `
  SELECT ISNULL(SUM(AdultQty+ChildQty+SeniorQty), 0) AS cnt
  FROM TicketOrders
  WHERE MONTH(PlacedAt) = MONTH(DATEADD(MONTH,-1,GETUTCDATE()))
    AND YEAR(PlacedAt) = YEAR(DATEADD(MONTH,-1,GETUTCDATE()))
`;

const membershipsThisMonth = `
  SELECT COUNT(*) AS cnt FROM MembershipSubscriptions
  WHERE MONTH(PlacedAt) = MONTH(GETUTCDATE()) AND YEAR(PlacedAt) = YEAR(GETUTCDATE())
`;

const membershipsLastMonth = `
  SELECT COUNT(*) AS cnt FROM MembershipSubscriptions
  WHERE MONTH(PlacedAt) = MONTH(DATEADD(MONTH,-1,GETUTCDATE()))
    AND YEAR(PlacedAt) = YEAR(DATEADD(MONTH,-1,GETUTCDATE()))
`;

const visitorsCurrentWeek = `
  SELECT CAST(VisitDate AS DATE) AS visitDay,
         ISNULL(SUM(AdultQty+ChildQty+SeniorQty), 0) AS cnt
  FROM TicketOrders
  WHERE CAST(VisitDate AS DATE) >= @monday AND CAST(VisitDate AS DATE) <= @sunday
  GROUP BY CAST(VisitDate AS DATE)
`;

const visitorsPreviousWeek = `
  SELECT CAST(VisitDate AS DATE) AS visitDay,
         ISNULL(SUM(AdultQty+ChildQty+SeniorQty), 0) AS cnt
  FROM TicketOrders
  WHERE CAST(VisitDate AS DATE) >= @prevMonday AND CAST(VisitDate AS DATE) <= @prevSunday
  GROUP BY CAST(VisitDate AS DATE)
`;

module.exports = {
  animalStats,
  openMaintenance,
  recentAnimalActivity,
  recentMaintenanceActivity,
  ticketsThisMonth,
  ticketsLastMonth,
  membershipsThisMonth,
  membershipsLastMonth,
  visitorsCurrentWeek,
  visitorsPreviousWeek,
};
