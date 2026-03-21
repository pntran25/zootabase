/**
 * One-off script: soft-delete all animals with no AnimalCode.
 * Run with: node scripts/remove-no-code-animals.js
 */
const { connectToDb } = require('../services/admin');

(async () => {
  const pool = await connectToDb();
  const req = pool.request();
  const found = await req.query(`SELECT AnimalID, Name FROM Animal WHERE AnimalCode IS NULL AND DeletedAt IS NULL`);
  if (found.recordset.length === 0) {
    console.log('No animals without an Animal ID found.');
  } else {
    await pool.request().query(`
      UPDATE Animal SET DeletedAt = SYSUTCDATETIME(), DepartureReason = 'Other'
      WHERE AnimalCode IS NULL AND DeletedAt IS NULL
    `);
    console.log(`Removed ${found.recordset.length} animal(s):`);
    found.recordset.forEach(r => console.log(`  - ID ${r.AnimalID}: ${r.Name || '(unnamed)'}`));
  }
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
