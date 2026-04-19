// ── Profile Queries ─────────────────────────────────────────────────

const shopOrders = `
  SELECT OrderID, FirstName, LastName, Email,
         Subtotal, Shipping, Tax, Total, PlacedAt, OrderItems
  FROM Orders
  WHERE (CustomerID = @customerId AND @customerId IS NOT NULL)
     OR (@customerId IS NULL AND LOWER(Email) = LOWER(@email))
     OR (CustomerID IS NULL AND LOWER(Email) = LOWER(@email))
  ORDER BY PlacedAt DESC
`;

const ticketOrders = `
  SELECT TicketOrderID, FirstName, LastName, Email,
         VisitDate, TicketType,
         AdultQty, ChildQty, SeniorQty,
         Total, PlacedAt, AddOns
  FROM TicketOrders
  WHERE (CustomerID = @customerId AND @customerId IS NOT NULL)
     OR (@customerId IS NULL AND LOWER(Email) = LOWER(@email))
     OR (CustomerID IS NULL AND LOWER(Email) = LOWER(@email))
  ORDER BY PlacedAt DESC
`;

const membership = `
  SELECT TOP 1 SubID, PlanName, BillingPeriod, StartDate, EndDate, Total
  FROM MembershipSubscriptions
  WHERE (CustomerID = @customerId AND @customerId IS NOT NULL)
     OR (@customerId IS NULL AND LOWER(Email) = LOWER(@email))
     OR (CustomerID IS NULL AND LOWER(Email) = LOWER(@email))
  ORDER BY EndDate DESC
`;

module.exports = { shopOrders, ticketOrders, membership };
