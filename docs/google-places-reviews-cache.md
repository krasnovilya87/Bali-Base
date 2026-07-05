# Google Places Reviews Cache

Server-only integration for Google Places API (New), used to refresh listing rating and up to 5 reviews without calling Google on every user visit.

## Google Request Contract

Endpoint:

```http
GET https://places.googleapis.com/v1/places/{PLACE_ID}
X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY
X-Goog-FieldMask: id,rating,reviews
```

The field mask is intentionally locked to `id,rating,reviews`. Do not add photos, addresses, phones, display names, or other fields here because they change billing and payload size.

## Firestore Structure

Equivalent SQL-style schema:

```sql
CREATE TABLE google_places_review_cache (
  hotel_id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  rating NUMERIC,
  reviews_json JSON NOT NULL,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL,
  stale_after TIMESTAMP NOT NULL,
  source TEXT NOT NULL DEFAULT 'google_places_new'
);

CREATE TABLE google_places_api_usage (
  month_key TEXT PRIMARY KEY,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  hard_limit INTEGER NOT NULL DEFAULT 9500,
  creation_reserve INTEGER NOT NULL DEFAULT 500,
  background_limit INTEGER NOT NULL DEFAULT 9000,
  estimated_free_requests INTEGER NOT NULL DEFAULT 10000,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE google_places_api_request_log (
  id TEXT PRIMARY KEY,
  month_key TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  field_mask TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

Firestore collections used by the code:

- `google_places_review_cache/{listingId}`
- `google_places_api_usage/{YYYY-MM}`
- `google_places_api_request_log/{autoId}`

## Refresh Policy

- Cache younger than 14 days is returned without a Google request.
- Missing cache can be refreshed immediately if the quota allows it.
- Stale cache is returned immediately and can be refreshed in the background.
- Monthly hard limit defaults to `9500`.
- `500` requests are reserved for listing creation/manual refresh.
- Background cron stops at `9000`, protecting the creation reserve.
- Daily cron limit defaults to `300`.

## Manual/Cron Run

```bash
npm run places:refresh
npm run places:refresh -- 150
```

The optional number limits that run. Production cron can run this once daily.
