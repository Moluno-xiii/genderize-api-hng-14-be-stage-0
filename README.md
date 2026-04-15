# Genderize API — Profile Classifier

HNG 14 Backend Stage 0 + Stage 1 project.

This service accepts a name, queries three external APIs (Genderize, Agify, Nationalize), applies classification logic, stores the result in a database, and exposes endpoints to manage that data.

## Tech Stack

- [NestJS](https://docs.nestjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/) (PostgreSQL)
- [PNPM](https://pnpm.io/)

## API Endpoints

### Stage 0 — Classify Name

`GET /api/classify?name={name}`

Queries the Genderize API and returns a classification result.

```json
{
  "status": "success",
  "data": {
    "name": "walter",
    "gender": "male",
    "probability": 1,
    "sample_size": 348479,
    "is_confident": true,
    "processed_at": "2026-04-12T08:21:52.557Z"
  }
}
```

### Stage 1 — Profile CRUD

#### Create Profile

`POST /api/profiles`

Request body:

```json
{ "name": "ella" }
```

Response (`201 Created`):

```json
{
  "status": "success",
  "data": {
    "id": "019eeb1a-4b2c-7df0-a3c1-9f0b8e5d6a12",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "DRC",
    "country_probability": 0.85,
    "created_at": "2026-04-14T12:00:00.000Z"
  }
}
```

If the same name is submitted again, the existing profile is returned:

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { "...existing profile..." }
}
```

#### Get Single Profile

`GET /api/profiles/{id}`

Response (`200 OK`):

```json
{
  "status": "success",
  "data": {
    "id": "019eeb1a-4b2c-7df0-a3c1-9f0b8e5d6a12",
    "name": "emmanuel",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 25,
    "age_group": "adult",
    "country_id": "NG",
    "country_probability": 0.85,
    "created_at": "2026-04-14T12:00:00.000Z"
  }
}
```

#### Get All Profiles

`GET /api/profiles`

Optional query parameters (case-insensitive): `gender`, `country_id`, `age_group`

Example: `/api/profiles?gender=male&country_id=NG`

Response (`200 OK`):

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "019eeb1a-4b2c-7df0-a3c1-9f0b8e5d6a12",
      "name": "emmanuel",
      "gender": "male",
      "age": 25,
      "age_group": "adult",
      "country_id": "NG"
    },
    {
      "id": "019eeb1a-5a3d-7ef1-b4d2-0a1c9f6e7b23",
      "name": "sarah",
      "gender": "female",
      "age": 28,
      "age_group": "adult",
      "country_id": "US"
    }
  ]
}
```

#### Delete Profile

`DELETE /api/profiles/{id}`

Returns `204 No Content` on success.

## Classification Rules

- **Gender and probability**: from Genderize API. `count` is renamed to `sample_size`
- **Age group** from Agify API: 0-12 child, 13-19 teenager, 20-59 adult, 60+ senior
- **Nationality**: highest-probability country from Nationalize API
- **IDs**: UUID v7 (time-sortable)
- **Timestamps**: UTC ISO 8601

## Error Responses

All errors follow this structure:

```json
{
  "status": "error",
  "message": "<error message>"
}
```

| Status | Condition |
|---|---|
| `400 Bad Request` | Missing or empty name |
| `404 Not Found` | Profile not found |
| `422 Unprocessable Entity` | Invalid type |
| `500 Internal Server Error` | Server failure |
| `502 Bad Gateway` | Upstream API returned invalid data |

Edge cases that return `502`:

- Genderize returns `gender: null` or `count: 0`
- Agify returns `age: null`
- Nationalize returns no country data

## Environment Variables

```env
PORT=8000
GENDERIZE_API_URL=https://api.genderize.io
AGIFY_API_URL=https://api.agify.io
NATIONALIZE_API_URL=https://api.nationalize.io
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-service-role-key>
```

## Local Setup

Clone the repository:

```bash
git clone https://github.com/Moluno-xiii/genderize-api-hng-14-be-stage-1
```

Enter the directory:

```bash
cd genderize-api-hng-14-be-stage-1
```

Install dependencies:

```bash
pnpm install
```

Create a `.env` file with the variables listed above.

Run in development:

```bash
pnpm run start:dev
```

Run in production:

```bash
pnpm start
```

The server starts on:

```text
http://localhost:8000
```

## Testing

```bash
# Create a profile
curl -X POST http://localhost:8000/api/profiles -H "Content-Type: application/json" -d '{"name": "john"}'

# Get all profiles
curl http://localhost:8000/api/profiles

# Get all profiles filtered
curl "http://localhost:8000/api/profiles?gender=male&country_id=NG"

# Get single profile
curl http://localhost:8000/api/profiles/{id}

# Delete profile
curl -X DELETE http://localhost:8000/api/profiles/{id}

# Classify name (Stage 0)
curl "http://localhost:8000/api/classify?name=john"
```

## Built as a requirement for the HNG 14 Backend Stage 0 and Stage 1 tasks
