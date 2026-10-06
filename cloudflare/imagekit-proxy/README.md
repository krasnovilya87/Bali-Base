# Bali Base ImageKit proxy

This Cloudflare Worker uploads images to ImageKit and delivers ImageKit Media
Library files through `https://media.balibase.id`.

## Deploy

1. Sign in to the Cloudflare account that owns `balibase.id`.
2. Add the ImageKit private key as an encrypted Worker secret:
   `npx wrangler secret put IMAGEKIT_PRIVATE_KEY`.
3. Add the Firebase Web API key used to validate Firebase ID tokens:
   `npx wrangler secret put FIREBASE_WEB_API_KEY`.
4. From this directory, run `npx wrangler deploy`.
5. Keep the Worker custom domain set to `media.balibase.id`.

Wrangler creates and manages the custom-domain DNS record and TLS certificate.
The browser uploads to `https://media.balibase.id/upload` with a Firebase ID
token and an `X-Firebase-AppCheck` token. The Worker verifies the App Check
JWT signature, issuer, audience, expiry, and Firebase Web App ID before it
accepts the upload. The ImageKit private key is read only by the Worker and is
never included in the frontend bundle.

`wrangler.toml` also declares Cloudflare's native `UPLOAD_RATE_LIMITER`
binding. It provides a shared per-user minute limit at each Cloudflare
location; the existing hourly guard remains as defense in depth. Wrangler
4.36.0 or newer is required for this binding.
