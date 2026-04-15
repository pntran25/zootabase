// ── Feedback Queries ────────────────────────────────────────────────

const getAll = `
  SELECT * FROM GuestFeedback ORDER BY DateSubmitted DESC
`;

const insert = `
  DECLARE @Out TABLE (FeedbackID INT);
  INSERT INTO GuestFeedback (Rating, Comment, LocationTag, DateSubmitted)
  OUTPUT INSERTED.FeedbackID INTO @Out VALUES (@rating, @comment, @location, @date);
  SELECT FeedbackID FROM @Out;
`;

const remove = `
  DELETE FROM GuestFeedback WHERE FeedbackID = @id
`;

module.exports = { getAll, insert, remove };
