# Lost pets backend

Initial NestJS and MongoDB API for lost pets, sightings and stray-pet rescues.

## Implemented major features

- **OTP accounts:** development-only email-based OTP verification, JWT authentication, protected endpoints, and public display names without exposing email addresses.
- **Community posts:** public browsing and authenticated creation of lost-pet, sighting, and found-stray rescue posts; optional sighting links to lost posts; owner-controlled active/resolved status.
- **Shared metadata:** `metaMaster` and `metaOptions` collections seed post types, pet types, dog/cat breeds, and reward currencies used by the web and mobile dropdowns.
- **Geographic search:** MongoDB geospatial indexes and nearby search using latitude, longitude, and a radius; pagination and post-type/status filters.
- **Comments:** public top-level comments from signed-in users and public replies restricted to the post owner.
- **My pets:** private, owner-scoped pet profile creation, listing, editing, and deletion.
- **Nearby notifications:** users can save up to 10 coordinate-based notification locations with independent radii and post-type filters. Matching posts create in-app notifications and mobile push notifications.
- **Realtime delivery:** authenticated Socket.IO clients join a private per-user room and receive `notification:new` immediately after a matching in-app notification is stored.
- **Missing Pet posters:** owners can create printable posters from their lost-pet posts; poster details always come from the associated post.
- **Short links and QR codes:** every new post receives a persistent short URL. Poster responses include that URL and a generated QR image so printed posters can open the live post.
- **File uploads:** owner-scoped file records and GCS signed upload, confirmation, and download flows behind a cloud-storage interface. Confirmed images can be attached to public posts.
- **Basic safeguards:** request validation, rate limiting, authorization checks, and automated service tests.

## Not yet implemented

Production OTP delivery, automatic background location updates, moderation, durable queued notification retries, and attachment of uploaded files to pet profiles.

## Project structure

`src/auth`, `src/pets`, and `src/files` are NestJS feature modules. They contain separate controllers, entities, repositories, services, and routes, plus DTOs for request validation. The files module also contains the cloud-storage abstraction and GCS adapter.

## Run locally

Install Node.js 20+ and MongoDB, then:

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set unique, long random values for both secrets.
3. Start MongoDB and run `npm run dev`.
4. The API is available at `http://localhost:3000/api`.

OTP login currently accepts email addresses and prints codes to the server console **only in development** when `OTP_DELIVERY=console`. Production OTP delivery is intentionally disabled until an SMS or email provider and the final sign-in channel are selected. OTPs expire in five minutes and have a five-attempt limit. The development OTP must not be used in a deployed environment.

## API

All protected endpoints use `Authorization: Bearer <accessToken>`. Public authors expose a display name, never an email address.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/otp/request` | Public | `{ "email": "person@example.com" }` |
| POST | `/api/auth/otp/verify` | Public | `{ "email": "person@example.com", "code": "123456", "displayName": "Sam" }`; returns token and public profile |
| GET | `/api/auth/me` | Signed in | View the current account profile and private email address |
| PATCH | `/api/auth/me` | Signed in | Update the public display name with `{ "displayName": "Sam" }` |
| GET | `/api/posts` | Public | Filter by `type`, `status`, or `latitude`, `longitude`, `radiusKm` together; optional `limit` and `skip` |
| GET | `/api/meta` | Public | List active pet types, post types, and breeds with their parent pet type |
| GET | `/api/posts/:id` | Public | View one post |
| GET | `/api/s/:code` | Public | Redirect a post short URL to the public web post |
| POST | `/api/posts` | Signed in | Create a post; accepts uploaded image IDs in `photoFileIds` |
| PATCH | `/api/posts/:id/status` | Owner | Set `{ "status": "resolved" }` or `active` |
| GET | `/api/posts/:id/comments` | Public | List up to 100 comments |
| POST | `/api/posts/:id/comments` | Signed in | Add `{ "text": "..." }` |
| POST | `/api/posts/:id/comments/:commentId/replies` | Post owner | Add a public reply `{ "text": "..." }` to a top-level comment |
| GET/POST | `/api/me/notification-locations` | Signed in | List or add notification locations |
| POST | `/api/me/notification-locations/automatic` | Signed in | Save the current coordinates as a default 5 km location, reusing a location within 100 metres |
| PATCH/DELETE | `/api/me/notification-locations/:id` | Owner | Update radius/details or remove a location |
| GET | `/api/me/notifications` | Signed in | List in-app notifications |
| GET | `/api/me/notifications/unread-count` | Signed in | Get the unread notification count |
| POST | `/api/me/notifications/:id/open` | Signed in | Mark a notification opened and read |
| PATCH | `/api/me/notifications/read-all` | Signed in | Mark all notifications read |
| POST | `/api/me/push-devices` | Signed in | Register or refresh an Expo push device |
| DELETE | `/api/me/push-devices/:deviceId` | Signed in | Disable a push device during logout |
| GET | `/api/posters/eligible-posts` | Signed in | List the user's lost-pet posts available for posters |
| GET/POST | `/api/posters` | Signed in | List posters or create one from `{ "postId": "..." }` |
| GET/PATCH/DELETE | `/api/posters/:id` | Owner | View, edit printable information, or remove a saved poster |
| GET | `/api/me/pets` | Signed in | List only your saved pets |
| POST | `/api/me/pets` | Signed in | Save a pet: `name`, `species`, optional `breed`, `description`, and `photos` URLs |
| PUT | `/api/me/pets/:id` | Owner | Replace your pet's details using the same fields |
| DELETE | `/api/me/pets/:id` | Owner | Remove your saved pet |

Example post:

```json
{
  "type": "lost",
  "title": "Missing golden retriever",
  "description": "Last seen wearing a blue collar.",
  "species": "dog",
  "photos": ["https://example.com/pet.jpg"],
  "location": { "latitude": 40.7128, "longitude": -74.006 },
  "occurredAt": "2026-11-08T10:00:00Z"
}
```

Post types are `lost`, `sighting`, and `rescue`. A sighting may supply `relatedPostId` for a lost post. A post can include up to 10 external `photos` URLs and/or confirmed image IDs in `photoFileIds`. Attached uploaded images become publicly viewable because posts are public. Post locations and comments are also public, so clients should make this clear before submission.

The comments endpoint returns up to 100 top-level comments, each with a `replies` array. Replies are public and only the post owner can create them; replies cannot themselves be replied to.

Saved pets are private to their owner and are separate from public posts. Photo URLs should only point to images the user is comfortable hosting publicly.

## Private file uploads (GCS)

Configure `GCS_BUCKET` with a private bucket and Google Application Default Credentials. For local development, set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account credential file outside the repository; in production use an attached service account. The identity needs permission to create and read objects and to sign URLs (service account signing credentials or IAM `signBlob` permission). Do not make the bucket public. Configure the bucket's CORS to allow your web origins and `PUT` with `Content-Type`, and use HTTPS. Bucket lifecycle rules should clean up abandoned/unconfirmed uploads; database pending records are retained for audit.

Set `GCS_BUCKET` and optionally `GCS_PROJECT_ID` in the backend `.env`; set `GOOGLE_APPLICATION_CREDENTIALS` only when using a local credential file. Restart the backend after changing these values. Never put credentials in frontend environment variables or source control.

All endpoints require a bearer token, and only the owner can confirm or download a file:

`GET /api/files` lists the owner's 100 most recent upload records, including pending and failed requests.

1. `POST /api/files/upload-url` with `{ "filename": "pet.jpg", "mimeType": "image/jpeg", "size": 12345, "durationSeconds": 2.5 }` (duration is optional). Returns `file.id` and `upload` containing a 15-minute signed URL, method `PUT`, and required `Content-Type` header.
2. Upload the raw bytes directly to `upload.url` with the returned method and headers. Do not send the API bearer token to the bucket. The create-only URL cannot overwrite an existing object.
3. `POST /api/files/:id/confirm` checks that the object exists and its storage-reported size and content type match, records its generation, and returns its metadata. Confirming an already confirmed upload is idempotent.
4. `GET /api/files/:id/download-url` returns a 15-minute signed download URL for the verified object generation. URLs are bearer credentials; do not log or share them.
5. Supplying a confirmed image ID in a new post's `photoFileIds` publishes it. `GET /api/files/:id/content` then redirects public viewers to a short-lived signed read URL without exposing a permanent bucket URL.

Keys use `user_id/mime_major_type/timestamp-uuid.extension`; the UUID prevents collisions. Declared size is limited to 100 MiB, but the signed PUT does **not** enforce this limit while uploading: size and content type are checked only on confirmation, so bucket quotas, lifecycle cleanup, and monitoring are important. MIME type and optional duration are client-provided, not content inspection; use server-side scanning or media processing before trusting files. A metadata mismatch remains pending and is not downloadable through the API. Uploads are integrated with posts, but not pet profiles.

Storage is isolated behind the `CloudStorage` interface. To use S3, implement that interface and bind the new adapter in `FilesModule` with S3 configuration; changing only a bucket and base URL is insufficient because signing and metadata APIs differ between providers.

Example notification location (coordinates are a saved snapshot and are not updated in the background):

```json
{ "name": "Home", "location": { "latitude": 40.7128, "longitude": -74.006 }, "radiusKm": 5, "types": ["lost", "sighting", "rescue"] }
```

After sign-in, web and mobile clients request foreground coordinates and save them automatically when permission is granted. Creating a post also saves its coordinates as a default notification location. Locations within 100 metres of an existing saved location are reused, and automatic saves never exceed the 10-location account limit.

Push delivery uses the separately bound `ExpoPushNotificationService`. The mobile app requires an EAS project ID (`EXPO_PUBLIC_EAS_PROJECT_ID` or EAS app configuration), Android FCM credentials, iOS APNs credentials, and a physical-device development/production build. A production OTP provider, moderation, server-side media scanning, durable notification-job processing, and production monitoring are still needed before launch.

Realtime clients connect to the `/notifications` Socket.IO namespace with `{ auth: { token: accessToken } }`. Invalid tokens are disconnected. Web deployments should set `NEXT_PUBLIC_BACKEND_ORIGIN` to the externally reachable backend origin; mobile deployments use the origin from `EXPO_PUBLIC_API_URL`.

Set `PUBLIC_API_URL` to the externally reachable API base including `/api` (for example `https://api.example.com/api`) so printed QR codes do not contain localhost. Set `PUBLIC_WEB_URL` to the public web app origin used by short-link redirects. Existing posts receive their short URL automatically the first time a poster is loaded.
# lost-pets-be
