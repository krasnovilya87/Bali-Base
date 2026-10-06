import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = 'bali-base-90ca8';
const args = new Set(process.argv.slice(2));
const readArgument = name => {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find(value => value.startsWith(prefix))?.slice(prefix.length) || '';
};

const uid = readArgument('uid');
const email = readArgument('email').trim().toLowerCase();
const apply = args.has('--apply');
const remove = args.has('--remove');
const confirmedProject = readArgument('confirm-project');

if ((!uid && !email) || (uid && email)) {
  throw new Error('Specify exactly one of --uid=<uid> or --email=<email>.');
}
if (apply && confirmedProject !== PROJECT_ID) {
  throw new Error(`Writing requires --confirm-project=${PROJECT_ID}.`);
}

const app = getApps().find(candidate => candidate.name === 'admin-claim-tool') || initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID
}, 'admin-claim-tool');
const auth = getAuth(app);
const user = uid ? await auth.getUser(uid) : await auth.getUserByEmail(email);
const nextClaims = { ...(user.customClaims || {}) };

if (remove) {
  delete nextClaims.admin;
} else {
  nextClaims.admin = true;
}

const summary = {
  projectId: PROJECT_ID,
  uid: user.uid,
  email: user.email || null,
  action: remove ? 'remove-admin-claim' : 'grant-admin-claim',
  mode: apply ? 'apply' : 'dry-run'
};

if (apply) {
  await auth.setCustomUserClaims(user.uid, nextClaims);
}

console.log(JSON.stringify(summary, null, 2));
if (!apply) {
  console.log(`No changes made. Re-run with --apply --confirm-project=${PROJECT_ID} after reviewing the target user.`);
}
