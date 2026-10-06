import fs from 'node:fs';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'bali-base-90ca8';
const LISTING_COLLECTIONS = ['housing_for_rent_listing', 'transport_for_rent', 'listings'];
const args = new Set(process.argv.slice(2));
const readArgument = name => {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find(value => value.startsWith(prefix))?.slice(prefix.length) || '';
};

const apply = args.has('--apply');
const confirmedProject = readArgument('confirm-project');
const guestMapPath = readArgument('guest-map');

if (apply && confirmedProject !== PROJECT_ID) {
  throw new Error(`Writing requires --confirm-project=${PROJECT_ID}.`);
}

const guestMap = guestMapPath
  ? JSON.parse(fs.readFileSync(guestMapPath, 'utf8'))
  : {};
if (!guestMap || Array.isArray(guestMap) || typeof guestMap !== 'object') {
  throw new Error('The guest map must be a JSON object keyed by booking ID.');
}

const app = getApps().find(candidate => candidate.name === 'legacy-booking-migration') || initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID
}, 'legacy-booking-migration');
const db = getFirestore(app);

const [bookingSnapshot, userSnapshot, ...listingSnapshots] = await Promise.all([
  db.collection('bookings').get(),
  db.collection('users').get(),
  ...LISTING_COLLECTIONS.map(collectionName => db.collection(collectionName).get())
]);

const knownUsers = new Set(userSnapshot.docs.map(document => document.id));
const listingOwners = new Map();
listingSnapshots.forEach(snapshot => {
  snapshot.docs.forEach(document => {
    const ownerId = document.data()?.ownerId;
    if (typeof ownerId === 'string' && ownerId) listingOwners.set(document.id, ownerId);
  });
});

const updates = [];
const unresolved = [];
for (const document of bookingSnapshot.docs) {
  const booking = document.data();
  const update = {};

  if (!booking.listingOwnerId) {
    const ownerId = listingOwners.get(booking.listingId);
    if (ownerId) update.listingOwnerId = ownerId;
  }

  if (!booking.guestId) {
    const mappedGuestId = guestMap[document.id];
    if (typeof mappedGuestId === 'string' && knownUsers.has(mappedGuestId)) {
      update.guestId = mappedGuestId;
    }
  }

  if (Object.keys(update).length) updates.push({ reference: document.ref, update });
  if ((!booking.listingOwnerId && !update.listingOwnerId) || (!booking.guestId && !update.guestId)) {
    unresolved.push(document.id);
  }
}

if (apply && updates.length) {
  const writer = db.bulkWriter();
  updates.forEach(({ reference, update }) => writer.update(reference, update));
  await writer.close();
}

console.log(JSON.stringify({
  projectId: PROJECT_ID,
  mode: apply ? 'apply' : 'dry-run',
  bookingsScanned: bookingSnapshot.size,
  bookingsWithSafeUpdates: updates.length,
  ownerIdsToBackfill: updates.filter(item => item.update.listingOwnerId).length,
  guestIdsToBackfill: updates.filter(item => item.update.guestId).length,
  unresolvedBookings: unresolved.length,
  unresolvedBookingIds: unresolved
}, null, 2));

if (!apply) {
  console.log(`No changes made. Re-run with --apply --confirm-project=${PROJECT_ID} only after reviewing the report and guest mapping.`);
}
