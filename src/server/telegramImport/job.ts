// Entry point of the Cloud Run job (and of the scheduled import): one full Telegram import run.
//   npm run telegram:import
import '../env';
import { runImport } from './pipeline';
import { claimRun, getRun } from './store';

// A run started from the admin button is already claimed (step "queued"); a scheduled run claims it here.
const current = await getRun();
const claimedByButton = current?.running && current.step === 'queued';
if (!claimedByButton && !(await claimRun())) {
  console.log('[Telegram import] another run is in progress, exiting.');
  process.exit(0);
}

try {
  await runImport();
  process.exit(0);
} catch (error) {
  console.error('[Telegram import] failed:', error);
  process.exit(1);
}
