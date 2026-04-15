// ── Species Code Queries ────────────────────────────────────────────

const getAll = `SELECT SpeciesName as speciesName, CodeSuffix as codeSuffix, LastCount as lastCount FROM SpeciesCode ORDER BY SpeciesName`;

const getBySpecies = `SELECT CodeSuffix, LastCount FROM SpeciesCode WHERE SpeciesName = @sn`;

const insert = `INSERT INTO SpeciesCode (SpeciesName, CodeSuffix) VALUES (@sn, @cs)`;

module.exports = { getAll, getBySpecies, insert };
