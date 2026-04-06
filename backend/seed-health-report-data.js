/**
 * Seed script: Insert comprehensive dummy data for the Health Report.
 * Populates: AnimalHealthRecord, AnimalHealthMetrics, HealthAlert,
 *            AnimalKeeperAssignment, FeedingSchedule
 *
 * Run with: node seed-health-report-data.js
 */
const sql = require('mssql');
const { connectToDb } = require('./services/admin');

function healthStatusFromScore(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Critical';
}

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seed() {
  const pool = await connectToDb();

  // ── Fetch existing animals and staff ──────────────────────────
  const animals = (await pool.request().query(
    `SELECT AnimalID, Name, Species, AnimalCode FROM Animal WHERE DeletedAt IS NULL ORDER BY AnimalID`
  )).recordset;

  const staffRows = (await pool.request().query(
    `SELECT StaffID, FullName, Role FROM Staff WHERE DeletedAt IS NULL ORDER BY StaffID`
  )).recordset;

  if (animals.length === 0) { console.log('No animals in DB. Seed animals first.'); process.exit(1); }
  if (staffRows.length === 0) { console.log('No staff in DB. Seed staff first.'); process.exit(1); }

  const caretakers = staffRows.filter(s =>
    s.Role === 'Caretaker' || s.Role === 'Super Admin'
  );
  const keepers = caretakers.length > 0 ? caretakers : staffRows;

  console.log(`Found ${animals.length} animals, ${staffRows.length} staff (${keepers.length} keepers).`);
  console.log('');

  // ── Sample data pools ─────────────────────────────────────────
  const activityLevels = ['Very Active', 'High', 'Normal', 'Low', 'Sedentary'];
  const appetites = ['Excellent', 'Good', 'Normal', 'Reduced', 'Poor'];
  const foodTypes = [
    'Raw Meat', 'Fish & Squid', 'Fresh Vegetables', 'Fruit Mix', 'Hay & Grass',
    'Insects & Grubs', 'Seeds & Nuts', 'Bamboo', 'Specialized Pellets', 'Live Prey',
    'Leafy Greens', 'Frozen Rodents', 'Mixed Grain', 'Krill & Shrimp', 'Root Vegetables'
  ];
  const conditionsList = [
    null, null, null, null,
    'Minor skin irritation', 'Mild arthritis', 'Respiratory infection',
    'Dental wear', 'Slight limp on left hind', 'Eye discharge noted',
    'Parasitic infection (treated)', 'Feather plucking', 'Scale discoloration',
    'Overgrown nails', 'Weight loss trend'
  ];
  const treatmentsList = [
    null, null, null, null,
    'Topical cream applied', 'Anti-inflammatory meds', 'Antibiotics (7-day course)',
    'Dental cleaning completed', 'Rest and limited activity', 'Eye drops prescribed',
    'Deworming treatment', 'Enrichment program adjusted', 'Vitamin D supplementation',
    'Nail trimming scheduled', 'High-calorie diet supplement'
  ];
  const recordNotes = [
    'Routine checkup, all vitals normal.',
    'Slight lethargy observed; monitoring closely.',
    'Responding well to treatment plan.',
    'Joint stiffness noted; adjusted enrichment activities.',
    'Urgent: score critically low, vet follow-up required.',
    'Post-recovery checkup: animal in great shape.',
    'Moderate appetite changes; dietary adjustment made.',
    'Follow-up after dental procedure — healing well.',
    'Weight slightly above range; diet plan updated.',
    'Annual wellness assessment — excellent condition.',
    'Seasonal coat change observed; normal behavior.',
    'Blood work results pending; physical exam normal.',
    'Behavioral enrichment evaluation — positive response.',
    'Vaccination update completed, no adverse reaction.',
    'Hydration levels normal, activity patterns consistent.',
    'Minor wound on tail healing as expected.',
    'Post-quarantine assessment — cleared for exhibit.',
    'Nutrition consultation: increased protein portion.',
    'Stress indicators low; social integration successful.',
    'Reproductive health check — all normal.'
  ];
  const alertTypes = ['Low Health Score', 'Weight Out of Range', 'Missed Feeding', 'Behavioral Change', 'Injury Reported', 'Medication Due'];
  const alertMessages = [
    'Health score dropped below 40 — immediate veterinary attention recommended.',
    'Weight recorded outside healthy range — review diet and activity.',
    'Feeding schedule was missed for morning meal.',
    'Unusual aggression observed during afternoon observation.',
    'Minor laceration found during routine inspection.',
    'Medication dose is overdue by 24 hours.',
    'Repeated low appetite over 3 consecutive days.',
    'Animal isolating from group — monitor for illness.',
    'Abnormal stool observed — lab test recommended.',
    'Temperature reading elevated during morning check.',
    'Limping noted — possible joint or muscle issue.',
    'Refusal to eat preferred food items.',
    'Excessive vocalization detected — stress evaluation needed.',
    'Weight gain exceeding 10% of baseline in 30 days.',
    'Skin lesion identified on right flank.'
  ];

  // Weight profiles per species type (rough kg estimates)
  const weightProfiles = {
    default: { lo: 10, hi: 50, variance: 8 },
    big: { lo: 150, hi: 500, variance: 40 },
    medium: { lo: 30, hi: 120, variance: 15 },
    small: { lo: 1, hi: 15, variance: 3 },
    bird: { lo: 0.3, hi: 8, variance: 1 },
  };

  function getWeightProfile(species) {
    const s = (species || '').toLowerCase();
    if (s.includes('elephant') || s.includes('hippo') || s.includes('rhino') || s.includes('giraffe') || s.includes('bear')) return weightProfiles.big;
    if (s.includes('lion') || s.includes('tiger') || s.includes('gorilla') || s.includes('zebra') || s.includes('deer') || s.includes('wolf') || s.includes('seal')) return weightProfiles.medium;
    if (s.includes('parrot') || s.includes('flamingo') || s.includes('penguin') || s.includes('eagle') || s.includes('owl') || s.includes('bird') || s.includes('toucan')) return weightProfiles.bird;
    if (s.includes('frog') || s.includes('lizard') || s.includes('snake') || s.includes('gecko') || s.includes('rabbit') || s.includes('meerkat') || s.includes('otter')) return weightProfiles.small;
    return weightProfiles.default;
  }

  // ══════════════════════════════════════════════════════════════
  // 1. HEALTH RECORDS (3-5 per animal, spread over 12 months)
  // ══════════════════════════════════════════════════════════════
  console.log('── Seeding Health Records ──');
  let recordCount = 0;
  for (const animal of animals) {
    const numRecords = randomInt(3, 5);
    for (let j = 0; j < numRecords; j++) {
      const score = randomInt(25, 100);
      const staff = randomItem(keepers);
      const dayOffset = randomInt(j * 60, (j + 1) * 80);
      const checkupDate = daysAgo(dayOffset);

      await pool.request()
        .input(`ar_aid_${recordCount}`, sql.Int, animal.AnimalID)
        .input(`ar_date_${recordCount}`, sql.DateTime2, checkupDate)
        .input(`ar_score_${recordCount}`, sql.Int, score)
        .input(`ar_notes_${recordCount}`, sql.NVarChar(1000), randomItem(recordNotes))
        .input(`ar_sid_${recordCount}`, sql.Int, staff.StaffID)
        .query(`
          INSERT INTO AnimalHealthRecord (AnimalID, CheckupDate, HealthScore, Notes, StaffID, CreatedAt, CreatedBy)
          VALUES (@ar_aid_${recordCount}, @ar_date_${recordCount}, @ar_score_${recordCount}, @ar_notes_${recordCount}, @ar_sid_${recordCount}, SYSUTCDATETIME(), 'seed-health-report')
        `);

      // Update animal health status to match latest record
      if (j === 0) {
        await pool.request()
          .input(`hs_aid_${recordCount}`, sql.Int, animal.AnimalID)
          .input(`hs_status_${recordCount}`, sql.NVarChar(50), healthStatusFromScore(score))
          .query(`UPDATE Animal SET HealthStatus = @hs_status_${recordCount} WHERE AnimalID = @hs_aid_${recordCount}`);
      }
      recordCount++;
    }
  }
  console.log(`  Inserted ${recordCount} health records.`);

  // ══════════════════════════════════════════════════════════════
  // 2. HEALTH METRICS (3-5 per animal, spread over 12 months)
  // ══════════════════════════════════════════════════════════════
  console.log('── Seeding Health Metrics ──');
  let metricCount = 0;
  for (const animal of animals) {
    const wp = getWeightProfile(animal.Species);
    const baseWeight = wp.lo + Math.random() * (wp.hi - wp.lo);
    const numMetrics = randomInt(3, 5);

    for (let j = 0; j < numMetrics; j++) {
      const dayOffset = randomInt(j * 60, (j + 1) * 80);
      const recordDate = daysAgo(dayOffset);
      const weight = +(baseWeight + (Math.random() - 0.5) * wp.variance * 2).toFixed(2);
      const rangeLo = +(baseWeight - wp.variance).toFixed(2);
      const rangeHi = +(baseWeight + wp.variance).toFixed(2);

      await pool.request()
        .input(`m_aid_${metricCount}`, sql.Int, animal.AnimalID)
        .input(`m_date_${metricCount}`, sql.DateTime2, recordDate)
        .input(`m_act_${metricCount}`, sql.NVarChar(50), randomItem(activityLevels))
        .input(`m_w_${metricCount}`, sql.Decimal(8, 2), weight)
        .input(`m_wlo_${metricCount}`, sql.Decimal(8, 2), rangeLo)
        .input(`m_whi_${metricCount}`, sql.Decimal(8, 2), rangeHi)
        .input(`m_cond_${metricCount}`, sql.NVarChar(255), randomItem(conditionsList))
        .input(`m_treat_${metricCount}`, sql.NVarChar(255), randomItem(treatmentsList))
        .input(`m_app_${metricCount}`, sql.NVarChar(50), randomItem(appetites))
        .input(`m_notes_${metricCount}`, sql.NVarChar(1000), randomItem(recordNotes))
        .query(`
          INSERT INTO AnimalHealthMetrics
            (AnimalID, RecordDate, ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
             MedicalConditions, RecentTreatments, AppetiteStatus, Notes, CreatedAt, CreatedBy)
          VALUES (@m_aid_${metricCount}, @m_date_${metricCount}, @m_act_${metricCount}, @m_w_${metricCount},
                  @m_wlo_${metricCount}, @m_whi_${metricCount}, @m_cond_${metricCount}, @m_treat_${metricCount},
                  @m_app_${metricCount}, @m_notes_${metricCount}, SYSUTCDATETIME(), 'seed-health-report')
        `);
      metricCount++;
    }
  }
  console.log(`  Inserted ${metricCount} health metrics.`);

  // ══════════════════════════════════════════════════════════════
  // 3. HEALTH ALERTS (mix of resolved and active, ~2 per animal)
  // ══════════════════════════════════════════════════════════════
  console.log('── Seeding Health Alerts ──');
  let alertCount = 0;
  for (const animal of animals) {
    const numAlerts = randomInt(1, 3);
    for (let j = 0; j < numAlerts; j++) {
      const isResolved = Math.random() > 0.35; // ~65% resolved
      const dayOffset = randomInt(1, 200);
      const createdAt = daysAgo(dayOffset);
      const resolvedAt = isResolved ? daysAgo(Math.max(1, dayOffset - randomInt(1, 14))) : null;

      await pool.request()
        .input(`al_aid_${alertCount}`, sql.Int, animal.AnimalID)
        .input(`al_type_${alertCount}`, sql.NVarChar(100), randomItem(alertTypes))
        .input(`al_msg_${alertCount}`, sql.NVarChar(500), randomItem(alertMessages))
        .input(`al_created_${alertCount}`, sql.DateTime2, createdAt)
        .input(`al_resolved_${alertCount}`, sql.Bit, isResolved ? 1 : 0)
        .input(`al_resolvedAt_${alertCount}`, sql.DateTime2, resolvedAt)
        .query(`
          INSERT INTO HealthAlert (AnimalID, AlertType, AlertMessage, CreatedAt, IsResolved, ResolvedAt)
          VALUES (@al_aid_${alertCount}, @al_type_${alertCount}, @al_msg_${alertCount},
                  @al_created_${alertCount}, @al_resolved_${alertCount}, @al_resolvedAt_${alertCount})
        `);
      alertCount++;
    }
  }
  console.log(`  Inserted ${alertCount} health alerts.`);

  // ══════════════════════════════════════════════════════════════
  // 4. KEEPER ASSIGNMENTS (1-2 active + 0-1 ended per animal)
  // ══════════════════════════════════════════════════════════════
  console.log('── Seeding Keeper Assignments ──');
  let keeperCount = 0;
  for (const animal of animals) {
    // Active assignment(s)
    const numActive = randomInt(1, 2);
    const usedKeepers = new Set();
    for (let j = 0; j < numActive; j++) {
      let keeper;
      do { keeper = randomItem(keepers); } while (usedKeepers.has(keeper.StaffID) && usedKeepers.size < keepers.length);
      usedKeepers.add(keeper.StaffID);

      const startOffset = randomInt(30, 365);
      await pool.request()
        .input(`ka_aid_${keeperCount}`, sql.Int, animal.AnimalID)
        .input(`ka_sid_${keeperCount}`, sql.Int, keeper.StaffID)
        .input(`ka_start_${keeperCount}`, sql.DateTime2, daysAgo(startOffset))
        .query(`
          INSERT INTO AnimalKeeperAssignment (AnimalID, StaffID, StartDate, CreatedAt, CreatedBy)
          VALUES (@ka_aid_${keeperCount}, @ka_sid_${keeperCount}, @ka_start_${keeperCount}, SYSUTCDATETIME(), 'seed-health-report')
        `);
      keeperCount++;
    }

    // Ended assignment (50% chance)
    if (Math.random() > 0.5) {
      const oldKeeper = randomItem(keepers);
      const startOffset = randomInt(200, 500);
      const endOffset = randomInt(30, 199);
      await pool.request()
        .input(`ka_aid_${keeperCount}`, sql.Int, animal.AnimalID)
        .input(`ka_sid_${keeperCount}`, sql.Int, oldKeeper.StaffID)
        .input(`ka_start_${keeperCount}`, sql.DateTime2, daysAgo(startOffset))
        .input(`ka_end_${keeperCount}`, sql.DateTime2, daysAgo(endOffset))
        .query(`
          INSERT INTO AnimalKeeperAssignment (AnimalID, StaffID, StartDate, EndDate, CreatedAt, CreatedBy)
          VALUES (@ka_aid_${keeperCount}, @ka_sid_${keeperCount}, @ka_start_${keeperCount}, @ka_end_${keeperCount}, SYSUTCDATETIME(), 'seed-health-report')
        `);
      keeperCount++;
    }
  }
  console.log(`  Inserted ${keeperCount} keeper assignments.`);

  // ══════════════════════════════════════════════════════════════
  // 5. FEEDING SCHEDULES (2-3 per animal — breakfast, lunch, dinner)
  // ══════════════════════════════════════════════════════════════
  console.log('── Seeding Feeding Schedules ──');
  let feedCount = 0;
  const mealTimes = [
    { hour: 7, min: 0 },   // breakfast
    { hour: 12, min: 0 },  // lunch
    { hour: 18, min: 0 },  // dinner
  ];

  for (const animal of animals) {
    const numMeals = randomInt(2, 3);
    const shuffledMeals = [...mealTimes].sort(() => Math.random() - 0.5).slice(0, numMeals);

    for (const meal of shuffledMeals) {
      const staff = randomItem(keepers);
      const feedTime = new Date();
      feedTime.setHours(meal.hour + randomInt(0, 1), meal.min + randomInt(0, 30), 0, 0);

      await pool.request()
        .input(`fs_aid_${feedCount}`, sql.Int, animal.AnimalID)
        .input(`fs_time_${feedCount}`, sql.DateTime2, feedTime)
        .input(`fs_food_${feedCount}`, sql.NVarChar(100), randomItem(foodTypes))
        .input(`fs_sid_${feedCount}`, sql.Int, staff.StaffID)
        .query(`
          INSERT INTO FeedingSchedule (AnimalID, FeedTime, FoodType, StaffID, CreatedAt, CreatedBy)
          VALUES (@fs_aid_${feedCount}, @fs_time_${feedCount}, @fs_food_${feedCount}, @fs_sid_${feedCount}, SYSUTCDATETIME(), 'seed-health-report')
        `);
      feedCount++;
    }
  }
  console.log(`  Inserted ${feedCount} feeding schedules.`);

  // ── Summary ───────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  Seed Complete!');
  console.log(`  Health Records:      ${recordCount}`);
  console.log(`  Health Metrics:      ${metricCount}`);
  console.log(`  Health Alerts:       ${alertCount}`);
  console.log(`  Keeper Assignments:  ${keeperCount}`);
  console.log(`  Feeding Schedules:   ${feedCount}`);
  console.log(`  TOTAL ROWS:          ${recordCount + metricCount + alertCount + keeperCount + feedCount}`);
  console.log('═══════════════════════════════════════════');

  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
