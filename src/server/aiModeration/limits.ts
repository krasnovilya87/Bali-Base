import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebaseAdmin';

export const AI_MODERATION_LIMITS = {
  maxChecksPerUserPerDay: 10,
  maxChecksPerAppPerDay: 100,
  maxPhotoUrlsPerRequest: 10,
  maxOutputTokens: 800
} as const;

const USAGE_COLLECTION = 'ai_moderation_usage';
const CHECKED_LISTINGS_COLLECTION = 'ai_moderation_checked_listings';

const getDailyKey = (date = new Date()) => date.toISOString().slice(0, 10);

const normalizeDocId = (value: string) =>
  value.trim().replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 160) || 'unknown';

export const assertAiModerationQuota = async (userId: string, listingId: string) => {
  const dayKey = getDailyKey();
  const userRef = adminDb.collection(USAGE_COLLECTION).doc(`user_${normalizeDocId(userId)}_${dayKey}`);
  const appRef = adminDb.collection(USAGE_COLLECTION).doc(`app_${dayKey}`);
  const listingRef = adminDb.collection(CHECKED_LISTINGS_COLLECTION).doc(normalizeDocId(listingId));

  await adminDb.runTransaction(async transaction => {
    const [userSnapshot, appSnapshot, listingSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(appRef),
      transaction.get(listingRef)
    ]);

    if (listingSnapshot.exists) {
      throw new Error('AI moderation already checked this listing.');
    }

    const userCount = Number(userSnapshot.data()?.count || 0);
    if (userCount >= AI_MODERATION_LIMITS.maxChecksPerUserPerDay) {
      throw new Error('AI moderation daily user limit reached.');
    }

    const appCount = Number(appSnapshot.data()?.count || 0);
    if (appCount >= AI_MODERATION_LIMITS.maxChecksPerAppPerDay) {
      throw new Error('AI moderation daily app limit reached.');
    }

    const now = new Date().toISOString();
    transaction.set(userRef, {
      scope: 'user',
      userId,
      dayKey,
      count: FieldValue.increment(1),
      limit: AI_MODERATION_LIMITS.maxChecksPerUserPerDay,
      updatedAt: now
    }, { merge: true });
    transaction.set(appRef, {
      scope: 'app',
      dayKey,
      count: FieldValue.increment(1),
      limit: AI_MODERATION_LIMITS.maxChecksPerAppPerDay,
      updatedAt: now
    }, { merge: true });
    transaction.set(listingRef, {
      listingId,
      userId,
      dayKey,
      checkedAt: now
    });
  });
};
