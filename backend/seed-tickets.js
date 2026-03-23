require('dotenv').config();
const { connectToDb } = require('./services/admin');

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'];
const streets = ['Main St', 'Oak St', 'Pine St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Washington St', 'Lakeview Dr', 'Hillcrest Rd', 'Park Ave', 'Riverside Dr', 'Sunset Blvd'];
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
    { city: 'Nashville', state: 'TN', zip: '37201' },
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Los Angeles', state: 'CA', zip: '90001' }
];

const ticketTypes = [
    { name: 'General Admission', adultPrice: 25.00, childPrice: 15.00, seniorPrice: 20.00 },
    { name: 'Premium Experience', adultPrice: 50.00, childPrice: 35.00, seniorPrice: 45.00 },
    { name: 'VIP Safari', adultPrice: 99.00, childPrice: 79.00, seniorPrice: 89.00 }
];

const availableAddOns = [
    { id: 'parking', name: 'Preferred Parking', price: 15.00 },
    { id: 'train', name: 'Train Ride Pass', price: 5.00 },
    { id: 'carousel', name: 'Carousel Pass', price: 3.00 },
    { id: 'feeding', name: 'Animal Feeding', price: 10.00 },
    { id: 'photo', name: 'Photo Package', price: 25.00 }
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function runSeeder() {
    const pool = await connectToDb();
    let totalTickets = 0;
    
    // 6 months = 180 days
    for (let d = 180; d >= 0; d--) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - d);
        
        // 250 to 600 orders per day
        const dailyCount = Math.floor(Math.random() * 351) + 250; 
        
        const orderValues = [];
        
        for (let i = 0; i < dailyCount; i++) {
            const fn = rand(firstNames);
            const ln = rand(lastNames);
            const fullName = `${fn} ${ln}`;
            const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${d}.${i}@mock.com`;
            const phone = `555${Math.floor(1000000 + Math.random() * 8999999)}`;
            
            const loc = rand(locations);
            const addressLine1 = `${Math.floor(Math.random() * 9000) + 100} ${rand(streets)}`;
            
            // Randomly determine quantities (at least 1 adult or senior usually)
            let adultQty = Math.floor(Math.random() * 4) + (Math.random() > 0.2 ? 1 : 0);
            const childQty = Math.floor(Math.random() * 5);
            const seniorQty = Math.floor(Math.random() * 3);
            if (adultQty + childQty + seniorQty === 0) adultQty = 1; // Fallback
            
            const type = rand(ticketTypes);
            let subtotal = (adultQty * type.adultPrice) + (childQty * type.childPrice) + (seniorQty * type.seniorPrice);
            
            // Add-ons (0 to 3 random add-ons)
            const numAddOns = Math.floor(Math.random() * 4);
            const selectedAddOns = [];
            const addOnsCopy = [...availableAddOns].sort(() => 0.5 - Math.random());
            for (let a = 0; a < numAddOns; a++) {
                const addon = addOnsCopy[a];
                // Random quantity tied roughly to party size or 1
                let aQty = 1;
                if (['train', 'carousel', 'feeding'].includes(addon.id)) {
                    aQty = adultQty + childQty + seniorQty;
                }
                selectedAddOns.push({ id: addon.id, name: addon.name, price: addon.price, quantity: aQty });
                subtotal += (addon.price * aQty);
            }
            const addOnsJson = JSON.stringify(selectedAddOns).replace(/'/g, "''");
            
            // PlacedAt is randomly distributed within the day
            const placedTime = new Date(currentDate.getTime() + Math.random() * 86400000);
            const placedStr = placedTime.toISOString().replace('T', ' ').substring(0, 19);
            
            // VisitDate is typical 0 to 14 days after purchase
            const visitDay = new Date(placedTime);
            visitDay.setDate(visitDay.getDate() + Math.floor(Math.random() * 15));
            const visitStr = visitDay.toISOString().split('T')[0];
            
            const cardLastFour = Math.floor(1000 + Math.random() * 9000);
            
            orderValues.push(`('${fullName.replace(/'/g, "''")}', '${email}', '${phone}', '${addressLine1}', '${loc.city}', '${loc.state}', '${loc.zip}', 1, '${visitStr}', '${type.name}', ${adultQty}, ${childQty}, ${seniorQty}, '${addOnsJson}', '${cardLastFour}', ${subtotal}, ${subtotal}, '${placedStr}')`);
        }
        
        // Chunk inserts by 1000 rows
        for (let j = 0; j < orderValues.length; j += 1000) {
            const chunk = orderValues.slice(j, j + 1000);
            await pool.request().query(`
                INSERT INTO TicketOrders 
                (FullName, Email, Phone, AddressLine1, City, StateProvince, ZipCode, BillingSameAsContact, VisitDate, TicketType, AdultQty, ChildQty, SeniorQty, AddOns, CardLastFour, Subtotal, Total, PlacedAt) 
                VALUES ${chunk.join(',')}
            `);
        }
        
        totalTickets += dailyCount;
        process.stdout.write(`\rSeeded day ${180 - d}/180 | Ticket Orders created: ${totalTickets}                 `);
    }
    
    console.log(`\n\nSuccess! Seeded ${totalTickets} ticket orders.`);
    process.exit(0);
}

runSeeder().catch(err => {
    console.error(err);
    process.exit(1);
});
