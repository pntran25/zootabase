const sql = require('mssql');
require('dotenv').config();
const { connectToDb } = require('../services/admin');

// Realistic dummy data sets
const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kevin', 'Sarah', 'Brian', 'Karen', 'Timothy', 'Nancy', 'Ronald', 'Betty', 'Jason', 'Sandra', 'Jeffrey', 'Ashley', 'Gary', 'Kimberly', 'Ryan', 'Donna', 'Nicholas', 'Emily', 'Eric', 'Michelle', 'Stephen', 'Dorothy', 'Jonathan', 'Carol', 'Larry', 'Amanda', 'Justin', 'Melissa', 'Scott', 'Deborah', 'Brandon', 'Stephanie', 'Frank', 'Rebecca', 'Benjamin', 'Sharon', 'Gregory', 'Laura', 'Samuel', 'Cynthia', 'Raymond', 'Kathleen', 'Patrick', 'Amy', 'Alexander', 'Shirley', 'Jack', 'Angela', 'Dennis', 'Helen', 'Jerry', 'Anna', 'Tyler', 'Brenda', 'Aaron', 'Pamela', 'Jose', 'Nicole', 'Adam', 'Emma'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'];
const streets = ['Main St', 'Oak St', 'Pine St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Washington St', 'Lakeview Dr', 'Hillcrest Rd', 'Park Ave', 'Riverside Dr', 'Sunset Blvd', 'Highland Ave', 'Forest Dr', 'Meadow Ln', 'Ridge Rd', 'Valley View Dr', 'Summit St', 'Pioneer Blvd', 'Broad St'];
const cities = [
    { city: 'Austin', state: 'TX', zip: '78701' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Seattle', state: 'WA', zip: '98101' },
    { city: 'Miami', state: 'FL', zip: '33101' },
    { city: 'Denver', state: 'CO', zip: '80201' },
    { city: 'Boston', state: 'MA', zip: '02108' },
    { city: 'Atlanta', state: 'GA', zip: '30303' },
    { city: 'Portland', state: 'OR', zip: '97204' },
    { city: 'Phoenix', state: 'AZ', zip: '85001' },
    { city: 'Nashville', state: 'TN', zip: '37201' },
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Los Angeles', state: 'CA', zip: '90001' },
    { city: 'Houston', state: 'TX', zip: '77001' },
    { city: 'Dallas', state: 'TX', zip: '75201' },
    { city: 'San Diego', state: 'CA', zip: '92101' },
    { city: 'San Jose', state: 'CA', zip: '95101' },
    { city: 'San Francisco', state: 'CA', zip: '94101' },
    { city: 'Charlotte', state: 'NC', zip: '28201' },
    { city: 'Detroit', state: 'MI', zip: '48201' },
    { city: 'Memphis', state: 'TN', zip: '38101' }
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seedOrders() {
    console.log('Starting seed-ticket-orders-custom.js...');
    const pool = await connectToDb();

    // 1. Fetch Packages and Add-ons from DB
    console.log('Fetching ticket packages and add-ons...');
    const pkgsRes = await pool.request().query('SELECT * FROM TicketPackage WHERE DeletedAt IS NULL');
    const addonsRes = await pool.request().query('SELECT * FROM TicketAddon WHERE DeletedAt IS NULL');

    const packages = pkgsRes.recordset.map(p => ({
        id: p.PackageID,
        name: p.Name,
        adultPrice: Number(p.AdultPrice),
        childPrice: Number(p.ChildPrice),
        seniorPrice: Number(p.SeniorPrice)
    }));

    const addons = addonsRes.recordset.map(a => ({
        id: a.AddonID,
        name: a.Name,
        price: Number(a.Price)
    }));

    if (packages.length === 0) {
        console.error('No ticket packages found. Please seed packages first.');
        process.exit(1);
    }

    let totalOrdersCreated = 0;
    const daysToSeed = 180; // 6 months

    console.log(`Seeding ${daysToSeed} days of data (300-600 orders per day)...`);

    for (let d = daysToSeed; d >= 0; d--) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - d);
        
        // 300 to 600 orders per day as requested
        const dailyCount = Math.floor(Math.random() * 301) + 300; 
        const orderValues = [];

        for (let i = 0; i < dailyCount; i++) {
            const firstName = rand(firstNames);
            const lastName = rand(lastNames);
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${d}.${i}@example.com`;
            const phone = `(555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`;
            
            const loc = rand(cities);
            const addressLine1 = `${Math.floor(Math.random() * 9000) + 100} ${rand(streets)}`;
            const addressLine2 = Math.random() > 0.8 ? `Apt ${Math.floor(Math.random() * 100) + 1}` : null;

            // Quantities
            let adultQty = Math.floor(Math.random() * 3) + 1; // 1-3 adults
            let childQty = Math.floor(Math.random() * 4);    // 0-3 children
            let seniorQty = Math.floor(Math.random() * 2);   // 0-1 senior
            const totalGuests = adultQty + childQty + seniorQty;

            // Package
            const pkg = rand(packages);

            // Add-ons (0 to 4)
            const numAddons = Math.floor(Math.random() * 5);
            const selectedAddons = [];
            const shuffledAddons = [...addons].sort(() => 0.5 - Math.random());
            let addonTotal = 0;
            for (let a = 0; a < numAddons && a < shuffledAddons.length; a++) {
                const add = shuffledAddons[a];
                selectedAddons.push({ id: add.id, name: add.name, price: add.price });
                addonTotal += (add.price * totalGuests);
            }

            const subtotal = (adultQty * pkg.adultPrice) + (childQty * pkg.childPrice) + (seniorQty * pkg.seniorPrice);
            const total = subtotal + addonTotal;

            // Dates
            const placedAt = new Date(currentDate.getTime() + Math.random() * 86400000);
            const visitDate = new Date(placedAt);
            visitDate.setDate(visitDate.getDate() + Math.floor(Math.random() * 10) + 1); // 1-10 days later

            const cardLastFour = Math.floor(1000 + Math.random() * 9000).toString();

            // Billing
            const billingSame = Math.random() > 0.3; // 70% same
            let billingInfo = {
                fullName: null, addr1: null, addr2: null, city: null, state: null, zip: null
            };
            if (!billingSame) {
                const bFn = rand(firstNames);
                const bLn = rand(lastNames);
                const bLoc = rand(cities);
                billingInfo = {
                    fullName: `${bFn} ${bLn}`,
                    addr1: `${Math.floor(Math.random() * 9000) + 100} ${rand(streets)}`,
                    addr2: Math.random() > 0.8 ? `Suite ${Math.floor(Math.random() * 50) + 1}` : null,
                    city: bLoc.city,
                    state: bLoc.state,
                    zip: bLoc.zip
                };
            }

            orderValues.push({
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                Phone: phone,
                AddressLine1: addressLine1,
                AddressLine2: addressLine2,
                City: loc.city,
                StateProvince: loc.state,
                ZipCode: loc.zip,
                BillingSameAsContact: billingSame ? 1 : 0,
                BillingFullName: billingInfo.fullName,
                BillingAddress1: billingInfo.addr1,
                BillingAddress2: billingInfo.addr2,
                BillingCity: billingInfo.city,
                BillingState: billingInfo.state,
                BillingZip: billingInfo.zip,
                VisitDate: visitDate,
                TicketType: pkg.name,
                AdultQty: adultQty,
                ChildQty: childQty,
                SeniorQty: seniorQty,
                AdultUnitPrice: pkg.adultPrice,
                ChildUnitPrice: pkg.childPrice,
                SeniorUnitPrice: pkg.seniorPrice,
                AddOns: JSON.stringify(selectedAddons),
                CardLastFour: cardLastFour,
                Subtotal: subtotal,
                Total: total,
                PlacedAt: placedAt
            });
        }

        // Batch Insert (1000 at a time)
        for (let j = 0; j < orderValues.length; j += 1000) {
            const chunk = orderValues.slice(j, j + 1000);
            const request = pool.request();
            
            // Build the query manually for speed or use individual inputs (manual list is harder with many cols)
            // We'll use a dynamic query with parameters for the chunk (or just use simple values for seeding)
            let query = `INSERT INTO TicketOrders 
                (FirstName, LastName, Email, Phone, AddressLine1, AddressLine2, City, StateProvince, ZipCode, 
                 BillingSameAsContact, BillingFullName, BillingAddress1, BillingAddress2, BillingCity, BillingState, BillingZip, 
                 VisitDate, TicketType, AdultQty, ChildQty, SeniorQty, AdultUnitPrice, ChildUnitPrice, SeniorUnitPrice, 
                 AddOns, CardLastFour, Subtotal, Total, PlacedAt) VALUES `;

            const valueStrings = chunk.map((o, idx) => {
                const esc = (val) => val === null ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`;
                const d = (val) => `'${val.toISOString().slice(0, 23).replace('T', ' ')}'`;
                return `(${esc(o.FirstName)}, ${esc(o.LastName)}, ${esc(o.Email)}, ${esc(o.Phone)}, ${esc(o.AddressLine1)}, ${esc(o.AddressLine2)}, ${esc(o.City)}, ${esc(o.StateProvince)}, ${esc(o.ZipCode)}, 
                        ${o.BillingSameAsContact}, ${esc(o.BillingFullName)}, ${esc(o.BillingAddress1)}, ${esc(o.BillingAddress2)}, ${esc(o.BillingCity)}, ${esc(o.BillingState)}, ${esc(o.BillingZip)}, 
                        ${d(o.VisitDate)}, ${esc(o.TicketType)}, ${o.AdultQty}, ${o.ChildQty}, ${o.SeniorQty}, ${o.AdultUnitPrice}, ${o.ChildUnitPrice}, ${o.SeniorUnitPrice}, 
                        ${esc(o.AddOns)}, ${esc(o.CardLastFour)}, ${o.Subtotal}, ${o.Total}, ${d(o.PlacedAt)})`;
            });

            await request.query(query + valueStrings.join(','));
        }

        totalOrdersCreated += dailyCount;
        if (d % 10 === 0) {
            console.log(`Processed day ${daysToSeed - d}/${daysToSeed}. Total orders: ${totalOrdersCreated}`);
        }
    }

    console.log(`Successfully seeded ${totalOrdersCreated} ticket orders!`);
    process.exit(0);
}

seedOrders().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
