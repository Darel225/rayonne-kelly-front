const { differenceInHours } = require('date-fns');
const SLA_HOURS_MAX = 24;

const testDates = [
  "2026-09-27 01:38:21", // Less than 24h ago
  "2026-09-25 01:38:21"  // More than 24h ago
];

testDates.forEach(dateStr => {
  const diff = differenceInHours(new Date(), new Date(dateStr));
  console.log(`For ${dateStr}, diff is ${diff} hours`);
  if (diff > SLA_HOURS_MAX) {
    console.log("-> Votre demande est toujours en cours de traitement, notre équipe vous contactera très prochainement.");
  } else {
    console.log(`-> Votre demande est en cours de traitement par notre conciergerie. Réponse sous ${SLA_HOURS_MAX}h.`);
  }
});
