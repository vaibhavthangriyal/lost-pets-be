# Lost pets backend

Initial NestJS and MongoDB API for lost pets, sightings and stray-pet rescues.

## Implemented major features

- **OTP accounts:** development-only email-based OTP verification, JWT authentication, protected endpoints, and public display names without exposing email addresses.
- **Community posts:** public browsing and authenticated creation of lost-pet, sighting, and found-stray rescue posts; optional sighting links to lost posts; owner-controlled active/resolved status.
- **Geographic search:** MongoDB geospatial indexes and nearby search using latitude, longitude, and a radius; pagination and post-type/status filters.
- **Comments:** public top-level comments from signed-in users and public replies restricted to the post owner.
- **My pets:** private, owner-scoped pet profile creation, listing, editing, and deletion.
- **Alert preferences:** authenticated storage and removal of a user's location, radius, and selected post types. These settings do not yet trigger notifications.
- **Private files:** owner-scoped file records and GCS signed upload, confirmation, and download flows behind a cloud-storage interface. The file library is separate from post and pet photos.
- **Basic safeguards:** request validation, rate limiting, authorization checks, and automated service tests.

## Not yet implemented

Production OTP delivery, push notifications and nearby-recipient matching, automatic background location updates, moderation, and attachment of private uploaded files to posts or pet profiles. The existing post and pet photo fields accept external URLs.

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
| GET | `/api/posts` | Public | Filter by `type`, `status`, or `latitude`, `longitude`, `radiusKm` together; optional `limit` and `skip` |
| GET | `/api/posts/:id` | Public | View one post |
| POST | `/api/posts` | Signed in | Create a post |
| PATCH | `/api/posts/:id/status` | Owner | Set `{ "status": "resolved" }` or `active` |
| GET | `/api/posts/:id/comments` | Public | List up to 100 comments |
| POST | `/api/posts/:id/comments` | Signed in | Add `{ "text": "..." }` |
| POST | `/api/posts/:id/comments/:commentId/replies` | Post owner | Add a public reply `{ "text": "..." }` to a top-level comment |
| GET | `/api/me/alerts` | Signed in | View own alert settings |
| POST | `/api/me/alerts` | Signed in | Set current location, radius, and post types |
| DELETE | `/api/me/alerts` | Signed in | Remove alert settings |
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

Post types are `lost`, `sighting`, and `rescue`. A sighting may supply `relatedPostId` for a lost post. Post photos currently use external URLs; the private file upload feature is separate. Post locations and comments are public, so clients should make this clear before submission.

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

Keys use `user_id/mime_major_type/timestamp-uuid.extension`; the UUID prevents collisions. Declared size is limited to 100 MiB, but the signed PUT does **not** enforce this limit while uploading: size and content type are checked only on confirmation, so bucket quotas, lifecycle cleanup, and monitoring are important. MIME type and optional duration are client-provided, not content inspection; use server-side scanning or media processing before trusting files. A metadata mismatch remains pending and is not downloadable through the API. This module is not yet integrated into posts or pet profiles.

Storage is isolated behind the `CloudStorage` interface. To use S3, implement that interface and bind the new adapter in `FilesModule` with S3 configuration; changing only a bucket and base URL is insufficient because signing and metadata APIs differ between providers.

Example alert settings (the client must update location as the user moves):

```json
{ "location": { "latitude": 40.7128, "longitude": -74.006 }, "radiusKm": 10, "types": ["lost", "sighting", "rescue"] }
```

Alert preferences are stored but **push delivery, device registration, background location collection, and notification matching are not implemented yet**. A production OTP provider, post/photo attachment support, moderation, and production deployment configuration are also needed before launch.
# lost-pets-be
