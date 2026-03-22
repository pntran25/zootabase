/**
 * Seed script: Insert sample data into AnimalHealthRecord & AnimalHealthMetrics.
 * Run with: node seed-health-data.js
 */
const sql = require('mssql');
const { connectToDb } = require('./services/admin');

function healthStatusFromScore(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Critical';
}

async function seed() {
  const pool = await connectToDb();

  // Fetch existing animals and staff
  const animals = (await pool.request().query(
    `SELECT TOP 10 AnimalID, Name, Species FROM Animal WHERE DeletedAt IS NULL ORDER BY AnimalID`
  )).recordset;

  const staffRows = (await pool.request().query(
    `SELECT TOP 5 StaffID, FullName FROM Staff WHERE DeletedAt IS NULL ORDER BY StaffID`
  )).recordset;

  if (animals.length === 0) { console.log('No animals found. Seed some animals first.'); process.exit(1); }
  if (staffRows.length === 0) { console.log('No staff found. Seed some staff first.'); process.exit(1); }

  console.log(`Found ${animals.length} animals and ${staffRows.length} staff members.`);

  // Sample health scores with variety
  const sampleScores = [95, 88, 72, 55, 35, 92, 78, 60, 45, 98];
  // Sample activity levels
  const activityLevels = ['High', 'Normal', 'Low', 'Very Active', 'Sedentary'];
  const appetites = ['Normal', 'Good', 'Reduced', 'Excellent', 'Poor'];
  const conditions = [null, 'Minor skin irritation', null, 'Mild arthritis', 'Respiratory infection', null, null, 'Dental wear', null, null];
  const treatments = [null, 'Topical cream applied', null, 'Anti-inflammatory medication', 'Antibiotics course', null, null, 'Dental cleaning scheduled', null, null];
  const notes = [
    'Routine checkup, all vitals normal.',
    'Slight lethargy observed; monitoring closely.',
    'Responding well to treatment plan.',
    'Joint stiffness noted; adjusted enrichment.',
    'Urgent: score critically low, vet follow-up required.',
    'Post-recovery checkup: animal in great shape.',
    'Moderate appetite changes; dietary adjustment made.',
    'Follow-up after dental procedure.',
    'Weight slightly above range; diet plan updated.',
    'Annual wellness assessment, excellent shape.'
  ];

  // Sample weights (kg) and ranges per animal — rough estimates
  const sampleWeights = [
    { w: 180, lo: 150, hi: 200 },
    { w: 45, lo: 35, hi: 55 },
    { w: 320, lo: 280, hi: 350 },
    { w: 5.5, lo: 4, hi: 7 },
    { w: 75, lo: 60, hi: 85 },
    { w: 12, lo: 9, hi: 15 },
    { w: 550, lo: 450, hi: 600 },
    { w: 8, lo: 6, hi: 10 },
    { w: 90, lo: 70, hi: 100 },
    { w: 200, lo: 170, hi: 230 },
  ];

  // Build dates over last 6 months
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (i * 18 + Math.floor(Math.random() * 10))); // spread out
    dates.push(d.toISOString().split('T')[0]);
  }

  console.log('Inserting health records...');
  for (let i = 0; i < Math.min(animals.length, 10); i++) {
    const a = animals[i];
    const s = staffRows[i % staffRows.length];
    const score = sampleScores[i];
    await pool.request()
      .input('animalId', sql.Int, a.AnimalID)
      .input('checkupDate', sql.DateTime2, new Date(dates[i]))
      .input('healthScore', sql.Int, score)
      .input('notes', sql.NVarChar(1000), notes[i])
      .input('staffId', sql.Int, s.StaffID)
      .query(`
        INSERT INTO AnimalHealthRecord (AnimalID, CheckupDate, HealthScore, Notes, StaffID, CreatedAt, CreatedBy)
        VALUES (@animalId, @checkupDate, @healthScore, @notes, @staffId, SYSUTCDATETIME(), 'seed-script')
      `);
    // Sync Animal.HealthStatus
    await pool.request()
      .input('aid', sql.Int, a.AnimalID)
      .input('status', sql.NVarChar(50), healthStatusFromScore(score))
      .query(`UPDATE Animal SET HealthStatus = @status WHERE AnimalID = @aid`);

    console.log(`  Record: ${a.Name} (${a.Species}) — Score ${score} → ${healthStatusFromScore(score)}`);
  }

  console.log('Inserting health metrics...');
  for (let i = 0; i < Math.min(animals.length, 10); i++) {
    const a = animals[i];
    const wt = sampleWeights[i];
    await pool.request()
      .input('animalId', sql.Int, a.AnimalID)
      .input('recordDate', sql.DateTime2, new Date(dates[i]))
      .input('activityLevel', sql.NVarChar(50), activityLevels[i % activityLevels.length])
      .input('weight', sql.Decimal(8, 2), wt.w)
      .input('weightRangeLow', sql.Decimal(8, 2), wt.lo)
      .input('weightRangeHigh', sql.Decimal(8, 2), wt.hi)
      .input('medicalConditions', sql.NVarChar(255), conditions[i])
      .input('recentTreatments', sql.NVarChar(255), treatments[i])
      .input('appetiteStatus', sql.NVarChar(50), appetites[i % appetites.length])
      .input('notes', sql.NVarChar(1000), notes[i])
      .query(`
        INSERT INTO AnimalHealthMetrics
          (AnimalID, RecordDate, ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
           MedicalConditions, RecentTreatments, AppetiteStatus, Notes, CreatedAt, CreatedBy)
        VALUES (@animalId, @recordDate, @activityLevel, @weight, @weightRangeLow, @weightRangeHigh,
                @medicalConditions, @recentTreatments, @appetiteStatus, @notes, SYSUTCDATETIME(), 'seed-script')
      `);
    console.log(`  Metric: ${a.Name} — ${wt.w}kg (range ${wt.lo}-${wt.hi})`);
  }

  console.log('\nDone! Sample health data inserted.');
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
