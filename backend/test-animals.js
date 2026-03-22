const { connectToDb } = require('./services/admin');

async function test() {
  try {
    const pool = await connectToDb();
    const query = `
      SELECT 
        a.AnimalID,
        a.Name,
        a.Species,
        a.Age,
        a.Gender,
        h.HabitatType,
        e.ExhibitName
      FROM Animal a
      LEFT JOIN Habitat h ON a.HabitatID = h.HabitatID
      LEFT JOIN Exhibit e ON h.ExhibitID = e.ExhibitID
    `;
    const result = await pool.request().query(query);
    console.log('SUCCESS:', result.recordset);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    process.exit();
  }
}

test();
