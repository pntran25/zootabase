const fs = require('fs');
const path = require('path');

const tables = [
  'Animal', 'AnimalAudit', 'AnimalHealthMetrics', 'AnimalHealthRecord',
  'AnimalKeeperAssignment', 'Area', 'Attraction', 'Customer', 'CustomerAudit',
  'CustomerLoginAudit', 'Event', 'Exhibit', 'FeedingSchedule', 'GuestFeedback',
  'Habitat', 'HealthAlert', 'MaintenanceRequest', 'MembershipPlans',
  'MembershipSubscriptions', 'Orders', 'POSLocation', 'Product', 'SpeciesCode',
  'Staff', 'StaffLoginAudit', 'StaffSchedule', 'TicketAddon', 'TicketOrders',
  'TicketPackage', 'TicketType'
];

const counts = {};
tables.forEach(t => counts[t] = 0);
const filesWithTable = {};
tables.forEach(t => filesWithTable[t] = new Set());

function walk(dir) {
    if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('build') || dir.includes('dist')) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else {
            if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.sql')) {
                // Ignore the Schema_utf8.sql and Schema.sql themselves
                if (file === 'Schema.sql' || file === 'Schema_utf8.sql') continue;
                const content = fs.readFileSync(fullPath, 'utf8');
                tables.forEach(t => {
                    // Match whole word or exact string
                    const regex = new RegExp(`\\b${t}\\b`, 'gi');
                    const matches = content.match(regex);
                    if (matches) {
                        counts[t] += matches.length;
                        filesWithTable[t].add(fullPath.replace('c:\\Users\\jawad\\Documents\\ZooDatabase\\zootabase\\', ''));
                    }
                });
            }
        }
    }
}

walk('c:\\Users\\jawad\\Documents\\ZooDatabase\\zootabase');

console.log("=== Table Usage Report ===");
for (const t of tables) {
    console.log(`${t}: ${counts[t]} occurrences`);
    if (counts[t] > 0) {
        console.log(`  Used in: ${Array.from(filesWithTable[t]).slice(0, 5).join(', ')}${filesWithTable[t].size > 5 ? ' and more...' : ''}`);
    }
}
