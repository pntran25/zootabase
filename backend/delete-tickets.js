require('dotenv').config();
const { connectToDb } = require('./services/admin');

async function runDelete() {
    const pool = await connectToDb();
    
    console.log('Deleting mock tickets...');
    const result = await pool.request().query("DELETE FROM TicketOrders WHERE Email LIKE '%@mock.com'");
    
    const rowsDeleted = result.rowsAffected.reduce((a, b) => a + b, 0);
    console.log(`Successfully deleted ${rowsDeleted} ticket orders.`);
    
    process.exit(0);
}

runDelete().catch(err => {
    console.error(err);
    process.exit(1);
});
