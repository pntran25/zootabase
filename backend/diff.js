require('dotenv').config();
const { connectToDb } = require('./services/admin');

async function check() {
  const pool = await connectToDb();
  const res = await pool.request().query("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('CustomerLoginAudit', 'CustomerAudit') ORDER BY TABLE_NAME, ORDINAL_POSITION");
  console.table(res.recordset);
  process.exit(0);
}
check().catch(console.error);
