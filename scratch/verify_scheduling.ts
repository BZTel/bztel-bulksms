// Test runner for Timezone-Aware SMS Dispatch scheduling logic

// The core timezone functions from worker.js, parameterized with mockDate to allow simulation
function getNigeriaTime(mockDate?: Date) {
  const d = mockDate || new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const watDate = new Date(utc + (3600000 * 1));
  return {
    hours: watDate.getHours(),
    minutes: watDate.getMinutes(),
    timeString: `${watDate.getHours().toString().padStart(2, '0')}:${watDate.getMinutes().toString().padStart(2, '0')}`
  };
}

function getAllowedRoutes(mockDate?: Date) {
  const { hours, minutes } = getNigeriaTime(mockDate);
  const minutesSinceMidnight = hours * 60 + minutes;

  // Transactional allowed: 8:00 AM to 8:00 PM WAT
  const startOfBroadcast = 8 * 60; // 08:00
  const endOfBroadcast = 20 * 60; // 20:00
  
  // Promotional allowed: 8:45 AM to 7:30 PM WAT
  const startOfPromo = 8 * 60 + 45; // 08:45
  const endOfPromo = 19 * 60 + 30; // 19:30

  return {
    tx: minutesSinceMidnight >= startOfBroadcast && minutesSinceMidnight < endOfBroadcast,
    promo: minutesSinceMidnight >= startOfPromo && minutesSinceMidnight < endOfPromo
  };
}

// Function to generate the mock prisma query condition
function getPrismaQueryFilter(canSendTx: boolean, canSendPromo: boolean, promoSenderIds: string[]) {
  const whereClause: any = { status: 'pending' };

  if (canSendTx && !canSendPromo) {
    whereClause.NOT = [
      { senderId: { in: promoSenderIds } },
      { senderId: { contains: 'PROMO' } },
      { senderId: { contains: 'Promo' } },
      { senderId: { contains: 'promo' } },
      { senderId: { contains: 'MARKETING' } },
      { senderId: { contains: 'Marketing' } },
      { senderId: { contains: 'marketing' } }
    ];
  } else if (!canSendTx && canSendPromo) {
    whereClause.OR = [
      { senderId: { in: promoSenderIds } },
      { senderId: { contains: 'PROMO' } },
      { senderId: { contains: 'Promo' } },
      { senderId: { contains: 'promo' } },
      { senderId: { contains: 'MARKETING' } },
      { senderId: { contains: 'Marketing' } },
      { senderId: { contains: 'marketing' } }
    ];
  }

  return whereClause;
}

// SIMULATIONS
// Note: We construct dates in UTC, and specify hours such that the resulting WAT time (UTC+1) matches the target.
function createDateInWAT(hours: number, minutes: number): Date {
  const utcHours = (hours - 1 + 24) % 24;
  const d = new Date();
  d.setUTCHours(utcHours, minutes, 0, 0);
  return d;
}

const testScenarios = [
  { hours: 2, minutes: 30, desc: 'Late Night Blackout', expTx: false, expPromo: false },
  { hours: 7, minutes: 59, desc: 'Early Morning Blackout (just before opening)', expTx: false, expPromo: false },
  { hours: 8, minutes: 0, desc: 'TX Route Opens', expTx: true, expPromo: false },
  { hours: 8, minutes: 30, desc: 'TX Open, Promo Closed', expTx: true, expPromo: false },
  { hours: 8, minutes: 45, desc: 'Promo Route Opens', expTx: true, expPromo: true },
  { hours: 12, minutes: 0, desc: 'Mid-day Peak (both routes open)', expTx: true, expPromo: true },
  { hours: 19, minutes: 29, desc: 'Just before Promo Closes', expTx: true, expPromo: true },
  { hours: 19, minutes: 30, desc: 'Promo Route Closes', expTx: true, expPromo: false },
  { hours: 19, minutes: 59, desc: 'Just before TX Closes', expTx: true, expPromo: false },
  { hours: 20, minutes: 0, desc: 'TX Route Closes / Night Blackout starts', expTx: false, expPromo: false },
  { hours: 23, minutes: 15, desc: 'Late Evening Blackout', expTx: false, expPromo: false },
];

console.log('--- STARTING TIMING SCHEDULER SIMULATION ---');
let allPassed = true;

for (const scenario of testScenarios) {
  const mockDate = createDateInWAT(scenario.hours, scenario.minutes);
  const watTime = getNigeriaTime(mockDate);
  const result = getAllowedRoutes(mockDate);

  const passed = result.tx === scenario.expTx && result.promo === scenario.expPromo;
  if (!passed) {
    console.error(`❌ FAILED: ${scenario.desc} at ${watTime.timeString} WAT. Expected TX: ${scenario.expTx}, Promo: ${scenario.expPromo}. Got TX: ${result.tx}, Promo: ${result.promo}`);
    allPassed = false;
  } else {
    console.log(`✅ PASSED: ${scenario.desc.padEnd(45)} | WAT: ${watTime.timeString} | TX: ${result.tx.toString().padEnd(5)} | Promo: ${result.promo.toString().padEnd(5)}`);
    
    // Check generated query filters
    const filter = getPrismaQueryFilter(result.tx, result.promo, ['PROMO1', 'PROMO2']);
    if (result.tx && !result.promo) {
      if (!filter.NOT || filter.NOT.length !== 7) {
        console.error('   ❌ FAILED: Starvation filter not generated correctly for TX-only window.');
        allPassed = false;
      } else {
        console.log('   ℹ️ Starvation filters successfully generated for TX-only window.');
      }
    } else if (!result.tx && !result.promo) {
      if (filter.NOT || filter.OR) {
        console.error('   ❌ FAILED: Query should not generate filter parameters during blackout.');
        allPassed = false;
      } else {
        console.log('   ℹ️ No query filters generated during blackout (poll skipped anyway).');
      }
    } else {
      if (filter.NOT || filter.OR) {
        console.error('   ❌ FAILED: Filters generated incorrectly during fully-open window.');
        allPassed = false;
      } else {
        console.log('   ℹ️ Normal query generated during fully-open window (no filters needed).');
      }
    }
  }
}

if (allPassed) {
  console.log('\n✅ ALL SCHEDULER TESTS COMPLETED SUCCESSFULLY!');
} else {
  console.error('\n❌ SOME SCHEDULER TESTS FAILED.');
  process.exit(1);
}
