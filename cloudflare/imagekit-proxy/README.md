# Bali Base ImageKit proxy

This Cloudflare Worker uploads images to ImageKit and delivers ImageKit Media
Library files through `https://media.balibase.id`.

## Deploy

1. Sign in to the Cloudflare account that owns `balibase.id`.
2. Add the ImageKit private key as an encrypted Worker secret:
   `npx wrangler secret put IMAGEKIT_PRIVATE_KEY`.
3. From this directory, run `npx wrangler deploy`.
4. Keep the Worker custom domain set to `media.balibase.id`.

Wrangler creates and manages the custom-domain DNS record and TLS certificate.
The browser uploads to `https://media.balibase.id/upload`. The private key is
read only by the Worker and is never included in the frontend bundle.
