<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bb80daaa-d9a4-434f-b297-61e49064e614

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app with the API server:
   `npm run dev:full`

The Google Places reviews endpoint runs on the local API server at `http://localhost:3001`.
Use `npm run dev` only when you need the Vite frontend without API routes.

If you start the project from the repository root, you can also run `start-site.cmd` to launch the dev server from the correct folder automatically.

## Deploy With API Routes

Firebase Hosting serves the static app from `dist`. API routes such as `/api/image-upload/freeimage` must run on the Cloud Run service configured in `firebase.json`:

- Service: `bali-base-api`
- Region: `asia-southeast1`

Deploy the API container:

```sh
gcloud run deploy bali-base-api \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars FREEIMAGE_API_KEY=YOUR_FREEIMAGE_API_KEY
```

Then build and deploy Hosting:

```sh
npm run build
firebase deploy --only hosting
```

The Hosting rewrite sends `/api/**` requests to Cloud Run and keeps all other routes on the React app.
