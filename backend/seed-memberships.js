require('dotenv').config();
const { connectToDb } = require('./services/admin');
const sql = require('mssql');

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'];
const streets = ['Main St', 'Oak St', 'Pine St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Washington St', 'Lakeview Dr', 'Hillcrest Rd', 'Park Ave'];
const locations = [
    { city: 'Austin', state: 'TX', zip: '78701' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Seattle', state: 'WA', zip: '98101' },
    { city: 'Miami', state: 'FL', zip: '33101' },
    { city: 'Denver', state: 'CO', zip: '80201' },
    { city: 'Boston', state: 'MA', zip: '02108' },
    { city: 'Atlanta', state: 'GA', zip: '30303' },
    { city: 'Portland', state: 'OR', zip: '97204' },
    { city: 'Phoenix', state: 'AZ', zip: '85001' },
    { city: 'Nashville', state: 'TN', zip: '37201' }
];

const plans = [
    { name: 'Individual', monthly: 9.99, yearly: 89.00 },
    { name: 'Family', monthly: 19.99, yearly: 179.00 },
    { name: 'Premium', monthly: 35.99, yearly: 349.00 }
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function runSeeder() {
    const pool = await connectToDb();
    let totalMemberships = 0;
    
    // We will simulate the past 180 days.
    for (let d = 180; d >= 0; d--) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - d);
        
        const dailyCount = Math.floor(Math.random() * 151) + 50; // 50 to 200
        
        const customerValues = [];
        const customersData = [];
        
        for (let i = 0; i < dailyCount; i++) {
            const fn = rand(firstNames);
            const ln = rand(lastNames);
            const fullName = `${fn} ${ln}`;
            const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${d}.${i}@mock.com`;
            const uid = `mock_${d}_${i}`;
            const createdAt = currentDate.toISOString().replace('T', ' ').substring(0, 19);
            
            customerValues.push(`('${fullName.replace(/'/g, "''")}', '${email}', '${createdAt}', '${createdAt}', 'zootabase-admin', '${createdAt}', '${uid}')`);
            customersData.push({ fullName, email, createdAt });
        }
        
        const insertCustQuery = `
            DECLARE @OutputTbl TABLE (CustomerID INT, Email NVARCHAR(200));
            
            INSERT INTO Customer (FullName, Email, CreatedAt, UpdatedAt, UpdatedBy, LastLoginAt, FirebaseUid)
            OUTPUT INSERTED.CustomerID, INSERTED.Email INTO @OutputTbl
            VALUES ${customerValues.join(',')};
            
            SELECT * FROM @OutputTbl;
        `;
        
        const custResult = await pool.request().query(insertCustQuery);
        const insertedCustomers = custResult.recordset;
        
        // 2. Prepare Logins and Subscriptions using the new CustomerIDs
        const loginValues = [];
        const subValues = [];
        
        for (let i = 0; i < insertedCustomers.length; i++) {
            const cust = insertedCustomers[i];
            const originalData = customersData[i];
            
            // Logins: 1 to 3 logins over their lifetime
            const loginCount = Math.floor(Math.random() * 3) + 1;
            for(let lc = 0; lc < loginCount; lc++) {
                // Random time between creation and now
                const createdTime = new Date(originalData.createdAt).getTime();
                const nowTime = new Date().getTime();
                const randomTime = new Date(createdTime + Math.random() * (nowTime - createdTime));
                const loginTimeStr = randomTime.toISOString().replace('T', ' ').substring(0, 19);
                loginValues.push(`(${cust.CustomerID}, '${loginTimeStr}')`);
            }
            
            // Subscriptions
            const loc = rand(locations);
            const address = `${Math.floor(Math.random() * 9000) + 100} ${rand(streets)}`;
            const plan = rand(plans);
            const period = Math.random() > 0.5 ? 'monthly' : 'yearly';
            const total = period === 'monthly' ? plan.monthly : plan.yearly;
            
            // End Date logic
            const sDate = new Date(originalData.createdAt);
            const eDate = new Date(sDate);
            if (period === 'yearly') eDate.setFullYear(eDate.getFullYear() + 1);
            else eDate.setMonth(eDate.getMonth() + 1);
            
            const startStr = sDate.toISOString().split('T')[0];
            const endStr = eDate.toISOString().split('T')[0];
            const placedStr = originalData.createdAt;
            const card = Math.floor(1000 + Math.random() * 9000);
            
            subValues.push(`(${cust.CustomerID}, '${plan.name}', '${period}', '${originalData.fullName.replace(/'/g, "''")}', '${cust.Email}', '${address}', '${loc.city}', '${loc.state}', '${loc.zip}', 1, '${card}', ${total}, '${startStr}', '${endStr}', '${placedStr}')`);
        }
        
        // 3. Insert Logins in chunks of 1000 to avoid SQL statement length limits
        for (let j = 0; j < loginValues.length; j += 1000) {
            const chunk = loginValues.slice(j, j + 1000);
            await pool.request().query(`INSERT INTO CustomerLoginAudit (CustomerID, LoginTime) VALUES ${chunk.join(',')}`);
        }
        
        // 4. Insert Subscriptions
        for (let j = 0; j < subValues.length; j += 1000) {
            const chunk = subValues.slice(j, j + 1000);
            await pool.request().query(`
                INSERT INTO MembershipSubscriptions 
                (CustomerID, PlanName, BillingPeriod, FullName, Email, AddressLine1, City, StateProvince, ZipCode, BillingSameAsContact, CardLastFour, Total, StartDate, EndDate, PlacedAt) 
                VALUES ${chunk.join(',')}
            `);
        }
        
        totalMemberships += dailyCount;
        process.stdout.write(`\rSeeded day ${180 - d}/180 | Memberships created: ${totalMemberships}                 `);
    }
    
    console.log(`\n\nSuccess! Seeded ${totalMemberships} memberships and customers.`);
    process.exit(0);
}

runSeeder().catch(err => {
    console.error(err);
    process.exit(1);
});
