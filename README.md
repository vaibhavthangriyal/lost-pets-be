# Lost pets backend

Initial NestJS and MongoDB API for lost pets, sightings and stray-pet rescues.

## Project structure

`src/auth` and `src/pets` are NestJS feature modules. Each contains separate `controllers`, `entities`, `repositories`, `services`, and `routes` folders, plus DTOs for request validation. Route files contain the path constants used by NestJS controller decorators; repositories own database access, and services contain application logic.

## Run locally

Install Node.js 20+ and MongoDB, then:

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set unique, long random values for both secrets.
3. Start MongoDB and run `npm run start:dev`.
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
| GET | `/api/me/alerts` | Signed in | View own alert settings |
| POST | `/api/me/alerts` | Signed in | Set current location, radius, and post types |
| DELETE | `/api/me/alerts` | Signed in | Remove alert settings |

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

Post types are `lost`, `sighting`, and `rescue`. A sighting may supply `relatedPostId` for a lost post. Photos are currently external URLs; upload/storage is not yet implemented. Post locations and comments are public, so clients should make this clear before submission.

Example alert settings (the client must update location as the user moves):

```json
{ "location": { "latitude": 40.7128, "longitude": -74.006 }, "radiusKm": 10, "types": ["lost", "sighting", "rescue"] }
```

Alert preferences are stored but **push delivery, device registration, background location collection, and notification matching are not implemented yet**. A production OTP provider, image storage, moderation, and production deployment configuration are also needed before launch.
# lost-pets-be
