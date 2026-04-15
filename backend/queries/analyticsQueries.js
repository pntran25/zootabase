// ── Analytics & Reporting Queries ────────────────────────────────────

const staffLogins = `
  SELECT TOP 500 s.LogID, s.LoginTime, st.FirstName, st.LastName, st.Role, st.Email, st.StaffID
  FROM StaffLoginAudit s
  JOIN Staff st ON s.StaffID = st.StaffID
  WHERE CAST(s.LoginTime AS DATE) >= @start AND CAST(s.LoginTime AS DATE) <= @end
  ORDER BY s.LoginTime DESC
`;

const customerLogins = `
  SELECT TOP 500 c.LogID, c.LoginTime, cu.FullName, cu.Email, cu.CustomerID
  FROM CustomerLoginAudit c
  JOIN Customer cu ON c.CustomerID = cu.CustomerID
  WHERE CAST(c.LoginTime AS DATE) >= @start AND CAST(c.LoginTime AS DATE) <= @end
  ORDER BY c.LoginTime DESC
`;

const shopKpi = `
  SELECT ISNULL(SUM(Total),0) AS revenue, COUNT(*) AS cnt
  FROM Orders
  WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
`;

const ticketKpi = `
  SELECT ISNULL(SUM(Total),0) AS revenue,
         ISNULL(SUM(AdultQty+ChildQty+SeniorQty),0) AS ticketCount,
         COUNT(*) AS orderCount
  FROM TicketOrders
  WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
`;

const memberKpi = `
  SELECT ISNULL(SUM(Total),0) AS revenue, COUNT(*) AS cnt
  FROM MembershipSubscriptions
  WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
`;

const eventKpi = `
  SELECT ISNULL(SUM(Total),0) AS revenue,
         ISNULL(SUM(Quantity),0) AS attendees,
         COUNT(*) AS cnt
  FROM EventBookings
  WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
`;

const trendDaily = (table) => `
  SELECT FORMAT(CAST(PlacedAt AS DATE), 'MMM d') AS month,
         YEAR(PlacedAt) AS yr,
         MONTH(PlacedAt) AS mo,
         DAY(PlacedAt) AS dy,
         ISNULL(SUM(Total),0) AS rev
  FROM ${table}
  WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
  GROUP BY FORMAT(CAST(PlacedAt AS DATE), 'MMM d'), YEAR(PlacedAt), MONTH(PlacedAt), DAY(PlacedAt)
  ORDER BY yr, mo, dy
`;

const trendMonthly = (table) => `
  SELECT FORMAT(PlacedAt,'MMM') AS month,
         YEAR(PlacedAt) AS yr,
         MONTH(PlacedAt) AS mo,
         0 AS dy,
         ISNULL(SUM(Total),0) AS rev
  FROM ${table}
  WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
  GROUP BY FORMAT(PlacedAt,'MMM'), YEAR(PlacedAt), MONTH(PlacedAt)
  ORDER BY yr, mo
`;

const ticketTiers = `
  SELECT TicketType AS tier, COUNT(*) AS count
  FROM TicketOrders
  WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
  GROUP BY TicketType ORDER BY count DESC
`;

const memberTiers = `
  SELECT PlanName AS tier, COUNT(*) AS count
  FROM MembershipSubscriptions
  WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
  GROUP BY PlanName ORDER BY count DESC
`;

const eventTiers = `
  SELECT e.Category AS tier, COUNT(*) AS count
  FROM EventBookings eb
  JOIN Event e ON eb.EventID = e.EventID
  WHERE CAST(eb.PlacedAt AS DATE) >= @start AND CAST(eb.PlacedAt AS DATE) <= @end
  GROUP BY e.Category ORDER BY count DESC
`;

const shopCategoryBreakdown = `
  SELECT JSON_VALUE(item.value, '$.category') AS category, COUNT(*) AS count
  FROM Orders o
  CROSS APPLY OPENJSON(o.OrderItems) AS item
  WHERE CAST(o.PlacedAt AS DATE) >= @start AND CAST(o.PlacedAt AS DATE) <= @end
    AND JSON_VALUE(item.value, '$.category') IS NOT NULL
  GROUP BY JSON_VALUE(item.value, '$.category')
  ORDER BY count DESC
`;

const shopNameFallback = `
  SELECT JSON_VALUE(item.value, '$.name') AS category, COUNT(*) AS count
  FROM Orders o
  CROSS APPLY OPENJSON(o.OrderItems) AS item
  WHERE CAST(o.PlacedAt AS DATE) >= @start AND CAST(o.PlacedAt AS DATE) <= @end
    AND JSON_VALUE(item.value, '$.name') IS NOT NULL
  GROUP BY JSON_VALUE(item.value, '$.name')
  ORDER BY count DESC
`;

module.exports = {
  staffLogins,
  customerLogins,
  shopKpi,
  ticketKpi,
  memberKpi,
  eventKpi,
  trendDaily,
  trendMonthly,
  ticketTiers,
  memberTiers,
  eventTiers,
  shopCategoryBreakdown,
  shopNameFallback,
};
