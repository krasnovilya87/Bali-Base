import express, { type Router } from 'express';
import { adminAuth, adminDb } from '../firebaseAdmin';
import { getAuthenticatedUser, rateLimit, requireAdmin, requireAuth } from '../security';

const ALLOWED_ROLES = new Set(['admin', 'moderator', 'host', 'guest']);

export const createAdminRouter = (): Router => {
  const router = express.Router();
  router.use(requireAuth, requireAdmin);
  router.use(rateLimit({ scope: 'admin-users', windowMs: 10 * 60 * 1000, max: 60 }));

  router.post('/users', async (req, res) => {
    let createdUid = '';
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
      const role = typeof req.body?.role === 'string' && ALLOWED_ROLES.has(req.body.role)
        ? req.body.role
        : 'guest';

      if (!name || name.length > 128 || !email || email.length > 254 || !email.includes('@') || phone.length > 32) {
        res.status(400).json({ ok: false, error: 'Valid name, email, and phone values are required.' });
        return;
      }

      const created = await adminAuth.createUser({ email, displayName: name, disabled: false });
      createdUid = created.uid;
      const registeredAt = new Date().toISOString();
      const profile = {
        uid: created.uid,
        displayName: name,
        email,
        contactPhone: phone,
        role,
        status: 'active',
        listingsCount: 0,
        registeredAt,
        photoURL: '',
        updatedAt: registeredAt
      };
      await adminDb.collection('users').doc(created.uid).set(profile, { merge: true });
      res.status(201).json({ ok: true, user: { id: created.uid, ...profile } });
    } catch (error: any) {
      if (createdUid) {
        await adminAuth.deleteUser(createdUid).catch(cleanupError => {
          console.error('[Admin users] Could not roll back Auth user creation:', cleanupError);
        });
      }
      const conflict = error?.code === 'auth/email-already-exists';
      res.status(conflict ? 409 : 500).json({
        ok: false,
        error: conflict ? 'A Firebase Auth user with this email already exists.' : 'Could not create the user.'
      });
    }
  });

  router.patch('/users/:uid/status', async (req, res) => {
    const uid = req.params.uid;
    const status = req.body?.status;
    const caller = getAuthenticatedUser(res);
    if (!uid || uid.length > 128 || (status !== 'active' && status !== 'banned')) {
      res.status(400).json({ ok: false, error: 'A valid user and status are required.' });
      return;
    }
    if (caller?.uid === uid && status === 'banned') {
      res.status(400).json({ ok: false, error: 'Administrators cannot ban their own account.' });
      return;
    }

    try {
      const previousAuthUser = await adminAuth.getUser(uid);
      await adminAuth.updateUser(uid, { disabled: status === 'banned' });
      try {
        await adminDb.collection('users').doc(uid).set({ status, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (firestoreError) {
        await adminAuth.updateUser(uid, { disabled: previousAuthUser.disabled }).catch(rollbackError => {
          console.error('[Admin users] Could not roll back Auth status:', rollbackError);
        });
        throw firestoreError;
      }
      if (status === 'banned') await adminAuth.revokeRefreshTokens(uid);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ ok: false, error: 'Could not update the Firebase Auth user.' });
    }
  });

  router.delete('/users/:uid', async (req, res) => {
    const uid = req.params.uid;
    const caller = getAuthenticatedUser(res);
    if (!uid || uid.length > 128) {
      res.status(400).json({ ok: false, error: 'A valid user is required.' });
      return;
    }
    if (caller?.uid === uid) {
      res.status(400).json({ ok: false, error: 'Administrators cannot delete their own account.' });
      return;
    }

    try {
      const profileReference = adminDb.collection('users').doc(uid);
      const previousProfile = await profileReference.get();
      await profileReference.delete();
      try {
        await adminAuth.deleteUser(uid);
      } catch (authError: any) {
        if (authError?.code !== 'auth/user-not-found' && previousProfile.exists) {
          await profileReference.set(previousProfile.data() || {}).catch(rollbackError => {
            console.error('[Admin users] Could not restore Firestore profile:', rollbackError);
          });
        }
        if (authError?.code !== 'auth/user-not-found') throw authError;
      }
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: 'Could not delete the Firebase Auth user.' });
    }
  });

  return router;
};
