// ── Zoo Stats Queries ───────────────────────────────────────────────

const totalAnimals = `SELECT COUNT(*) AS totalAnimals FROM Animal WHERE DeletedAt IS NULL`;

const minTicketPrice = `SELECT MIN(AdultPrice) AS minPrice FROM TicketPackage`;

const totalExhibits = `SELECT COUNT(*) AS totalExhibits FROM Exhibit WHERE DeletedAt IS NULL`;

const endangeredCount = `SELECT COUNT(*) AS endangeredCount FROM Animal WHERE IsEndangered = 1 AND DeletedAt IS NULL`;

module.exports = { totalAnimals, minTicketPrice, totalExhibits, endangeredCount };
