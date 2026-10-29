# Deploy the Telegram import to production (Cloud Run): API service + import job + schedule.
# Review before running. It changes production. Secret values are read from .env.local and piped into
# Secret Manager; they are never printed or put on the command line.
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-telegram-import.ps1
$ErrorActionPreference = "Stop"
$projectId = "bali-base-90ca8"
$region = "asia-southeast1"
$service = "bali-base-api"
$job = "bali-base-telegram-import"
$schedule = "0 */3 * * *"   # every 3 hours (Asia/Makassar time below)
$runtimeAccount = (gcloud run services describe $service --project=$projectId --region=$region --format="value(spec.template.spec.serviceAccountName)")

# Values from .env.local (server-only keys).
$envValues = @{}
Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$') { $envValues[$Matches[1]] = $Matches[2].Trim('"', "'") }
}
$secretNames = @("GEMINI_API_KEY", "IMAGEKIT_PRIVATE_KEY", "TELEGRAM_SESSION", "TELEGRAM_API_HASH")
foreach ($name in $secretNames + @("TELEGRAM_API_ID")) {
  if (-not $envValues[$name]) { throw "$name is missing in .env.local" }
}

# 1. APIs used by the import.
gcloud services enable secretmanager.googleapis.com cloudscheduler.googleapis.com --project=$projectId

# 2. Secrets (a new version is added when the secret already exists).
foreach ($name in $secretNames) {
  $exists = gcloud secrets list --project=$projectId --filter="name:$name" --format="value(name)"
  if (-not $exists) { gcloud secrets create $name --project=$projectId --replication-policy=automatic | Out-Null }
  $envValues[$name] | gcloud secrets versions add $name --project=$projectId --data-file=- | Out-Null
  gcloud secrets add-iam-policy-binding $name --project=$projectId --member="serviceAccount:$runtimeAccount" --role="roles/secretmanager.secretAccessor" | Out-Null
}
$secrets = ($secretNames | ForEach-Object { "$_=$($_):latest" }) -join ","
$plainEnv = "TELEGRAM_API_ID=$($envValues['TELEGRAM_API_ID']),IMAGEKIT_URL_ENDPOINT=$($envValues['IMAGEKIT_URL_ENDPOINT']),TELEGRAM_IMPORT_JOB=$job,TELEGRAM_IMPORT_REGION=$region"

# 3. API service with the new code (the admin button starts the job from here).
gcloud run deploy $service --source . --project=$projectId --region=$region --allow-unauthenticated `
  --update-env-vars=$plainEnv --update-secrets=$secrets

# 4. Import job: same image, runs `npm run telegram:import` (up to 1 hour, no automatic retry).
$image = (gcloud run services describe $service --project=$projectId --region=$region --format="value(spec.template.spec.containers[0].image)")
gcloud run jobs deploy $job --image=$image --project=$projectId --region=$region --service-account=$runtimeAccount `
  --command=npm --args="run,telegram:import" --task-timeout=3600 --max-retries=0 --memory=1Gi `
  --set-env-vars=$plainEnv --set-secrets=$secrets
gcloud run jobs add-iam-policy-binding $job --project=$projectId --region=$region --member="serviceAccount:$runtimeAccount" --role="roles/run.invoker" | Out-Null

# 5. Scheduled import.
$jobUri = "https://run.googleapis.com/v2/projects/$projectId/locations/$region/jobs/${job}:run"
$scheduler = gcloud scheduler jobs list --project=$projectId --location=$region --filter="name:telegram-import" --format="value(name)"
if (-not $scheduler) {
  gcloud scheduler jobs create http telegram-import --project=$projectId --location=$region --schedule=$schedule `
    --time-zone="Asia/Makassar" --uri=$jobUri --http-method=POST --oauth-service-account-email=$runtimeAccount
}

# 6. Frontend with the admin tab (ships every current UI change).
npm run build
firebase deploy --only hosting --project $projectId
Write-Host "Done. Telegram import: admin -> Telegram import -> Update, and automatically on schedule '$schedule'."
