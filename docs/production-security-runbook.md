# Production security activation

These steps intentionally change production and are not run automatically.

## 1. Establish administrator custom claim

Preview the target first:

```powershell
npm.cmd run admin:claim -- --email=ADMIN_EMAIL
```

After verifying the UID and email, apply the claim:

```powershell
npm.cmd run admin:claim -- --email=ADMIN_EMAIL --apply --confirm-project=bali-base-90ca8
```

The administrator must sign out and sign in again so Firebase issues a fresh ID token.
Set the claim before deploying the claim-based Firestore rules or backend.

## 2. App Check

1. Register the production Web app with the existing score-based reCAPTCHA Enterprise key.
2. Build the frontend with `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` set to that public site key.
3. Grant the Cloud Run runtime identity `roles/firebaseappcheck.tokenVerifier`.
4. Deploy the frontend and backend together. Production defaults to App Check enforcement.
5. Monitor valid traffic before enabling Firebase product enforcement in the console.

Do not add `localhost` to the production reCAPTCHA Enterprise key. Use an App Check debug token for local development.

## 3. Cloud Run service identity and secrets

Create a dedicated runtime service account. Grant only the permissions needed by the exercised API paths, including Firestore access, Firebase Authentication administration, App Check token verification, and access to the specific Secret Manager secret versions. Validate the new identity before removing `roles/editor` from the default compute service account.

Review and then run these production-changing commands manually:

```powershell
$projectId = "bali-base-90ca8"
$region = "asia-southeast1"
$runtimeAccount = "bali-base-api-runtime@$projectId.iam.gserviceaccount.com"

gcloud iam service-accounts create bali-base-api-runtime --project=$projectId --display-name="Bali Base API runtime"
gcloud projects add-iam-policy-binding $projectId --member="serviceAccount:$runtimeAccount" --role="roles/datastore.user"
gcloud projects add-iam-policy-binding $projectId --member="serviceAccount:$runtimeAccount" --role="roles/firebaseauth.admin"
gcloud projects add-iam-policy-binding $projectId --member="serviceAccount:$runtimeAccount" --role="roles/firebaseappcheck.tokenVerifier"

foreach ($secretId in @("GEMINI_API_KEY", "GOOGLE_PLACES_API_KEY", "GROQ_API_KEY", "CLOUDFLARE_API_TOKEN", "IMAGEKIT_PRIVATE_KEY")) {
  gcloud secrets add-iam-policy-binding $secretId --project=$projectId --member="serviceAccount:$runtimeAccount" --role="roles/secretmanager.secretAccessor"
}

gcloud run services update bali-base-api --project=$projectId --region=$region --service-account=$runtimeAccount --set-env-vars="APP_CHECK_ENFORCEMENT=true,DURABLE_RATE_LIMITING_ENABLED=true" --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_PLACES_API_KEY=GOOGLE_PLACES_API_KEY:latest,GROQ_API_KEY=GROQ_API_KEY:latest,CLOUDFLARE_API_TOKEN=CLOUDFLARE_API_TOKEN:latest,IMAGEKIT_PRIVATE_KEY=IMAGEKIT_PRIVATE_KEY:latest"
```

The secrets and secret versions must already exist. Do not put secret values directly into the command line or repository. The service update must be tested before removing any role from the previous runtime identity.

Store server-only values as individual Secret Manager secrets and attach them to Cloud Run as secret references. Do not pass them as `VITE_*` build variables or plain environment values.

Required integrations should be selected from:

- `GEMINI_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `GROQ_API_KEY`
- `CLOUDFLARE_API_TOKEN`
- `IMAGEKIT_PRIVATE_KEY`

Set non-secret identifiers such as the Cloudflare account and model names as ordinary environment variables. Set `APP_CHECK_ENFORCEMENT=true` and `DURABLE_RATE_LIMITING_ENABLED=true` explicitly for clarity, even though production defaults to both.

Create a project-owned browser key for Maps JavaScript API and Places API (New), restrict website referrers to the production domains, and provide it as `VITE_GOOGLE_MAPS_PLATFORM_KEY` during the production build. Retire the externally owned key only after verifying the replacement in production.

## 4. Cloudflare Worker

From `cloudflare/imagekit-proxy`, configure both encrypted bindings:

```powershell
npx.cmd wrangler secret put IMAGEKIT_PRIVATE_KEY
npx.cmd wrangler secret put FIREBASE_WEB_API_KEY
```

The Worker configuration includes the public Firebase project/app identifiers and a native rate-limit binding. Review the generated Wrangler deployment before deploying it.

## 5. Legacy bookings

Generate a dry-run report:

```powershell
npm.cmd run bookings:migrate
```

If verified guest mappings are available, copy `scripts/bookings-guest-map.example.json` to an ignored file outside Git and pass it with `--guest-map=PATH`. The mapping is keyed by booking document ID and must contain verified Firebase UIDs.

Only after reviewing the report:

```powershell
npm.cmd run bookings:migrate -- --guest-map=PATH --apply --confirm-project=bali-base-90ca8
```

The script never deletes bookings and never guesses a guest from names or phone numbers.
