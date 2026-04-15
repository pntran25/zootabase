// ── Profile Queries ─────────────────────────────────────────────────

const shopOrders = `
  SELECT OrderID, FirstName, LastName, Email,
         Subtotal, Shipping, Tax, Total, PlacedAt, OrderItems
  FROM Orders
  WHERE LOWER(Email) = LOWER(@email)
  ORDER BY PlacedAt DESC
`;

const ticketOrders = `
  SELECT TicketOrderID, FirstName, LastName, Email,
         VisitDate, TicketType,
         AdultQty, ChildQty, SeniorQty,
         Total, PlacedAt, AddOns
  FROM TicketOrders
  WHERE LOWER(Email) = LOWER(@email)
  ORDER BY PlacedAt DESC
`;

const membership = `
  SELECT TOP 1 SubID, PlanName, BillingPeriod, StartDate, EndDate, Total
  FROM MembershipSubscriptions
  WHERE Email = @email
  ORDER BY EndDate DESC
`;

module.exports = { shopOrders, ticketOrders, membership };
