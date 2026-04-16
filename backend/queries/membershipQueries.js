// ── Membership Queries (Plans + Subscriptions) ─────────────────────

// ── Plans ──

const getAllPlans = `
  SELECT PlanID, Name, Description, MonthlyPrice, YearlyPrice,
         Features, IsPopular, SortOrder, CreatedAt
  FROM MembershipPlans WHERE DeletedAt IS NULL ORDER BY SortOrder ASC
`;

const insertPlan = `
  INSERT INTO MembershipPlans (Name, Description, MonthlyPrice, YearlyPrice, Features, IsPopular, SortOrder)
  OUTPUT INSERTED.PlanID VALUES (@Name, @Description, @MonthlyPrice, @YearlyPrice, @Features, @IsPopular, @SortOrder)
`;

const updatePlan = `
  UPDATE MembershipPlans
  SET Name=@Name, Description=@Description, MonthlyPrice=@MonthlyPrice,
      YearlyPrice=@YearlyPrice, Features=@Features, IsPopular=@IsPopular, SortOrder=@SortOrder
  WHERE PlanID=@id AND DeletedAt IS NULL
`;

const deletePlan = `
  UPDATE MembershipPlans SET DeletedAt = SYSUTCDATETIME() WHERE PlanID = @id
`;

// ── Subscriptions ──

const insertSubscription = `
  INSERT INTO MembershipSubscriptions (CustomerID, PlanName, BillingPeriod, FirstName, LastName, Email, Phone,
       AddressLine1, AddressLine2, City, StateProvince, ZipCode,
       BillingSameAsContact, BillingFullName, BillingAddress1, BillingAddress2,
       BillingCity, BillingState, BillingZip, CardLastFour, Total, StartDate, EndDate)
  OUTPUT INSERTED.SubID
  VALUES (@CustomerID, @PlanName, @BillingPeriod, @FirstName, @LastName, @Email, @Phone,
       @AddressLine1, @AddressLine2, @City, @StateProvince, @ZipCode,
       @BillingSameAsContact, @BillingFullName, @BillingAddress1, @BillingAddress2,
       @BillingCity, @BillingState, @BillingZip, @CardLastFour, @Total, @StartDate, @EndDate)
`;

const listSubscriptions = (where) => `
  SELECT SubID, FirstName, LastName,
         CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) AS FullName,
         Email, PlanName, BillingPeriod, Total, StartDate, EndDate, PlacedAt
  FROM MembershipSubscriptions ${where}
  ORDER BY PlacedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
`;

const countSubscriptions = (where) => `
  SELECT COUNT(*) AS total FROM MembershipSubscriptions ${where}
`;

const getActiveByEmail = `
  SELECT TOP 1 ms.PlanName, ms.EndDate, mp.Features
  FROM MembershipSubscriptions ms
  LEFT JOIN MembershipPlans mp ON mp.Name = ms.PlanName AND mp.DeletedAt IS NULL
  WHERE ms.Email = @Email AND ms.EndDate >= CAST(GETDATE() AS DATE)
  ORDER BY ms.EndDate DESC
`;

const getSubscriptionById = `
  SELECT *, CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) AS FullName FROM MembershipSubscriptions WHERE SubID = @id
`;

const cancelSubscriptionByEmail = `
  UPDATE MembershipSubscriptions
  SET EndDate = CAST(GETDATE() AS DATE)
  WHERE Email = @Email AND EndDate >= CAST(GETDATE() AS DATE)
`;

module.exports = {
  getAllPlans,
  insertPlan,
  updatePlan,
  deletePlan,
  insertSubscription,
  listSubscriptions,
  countSubscriptions,
  getActiveByEmail,
  getSubscriptionById,
  cancelSubscriptionByEmail,
};
