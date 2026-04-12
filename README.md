# Genderize API Classifier

HNG 14 Backend Stage 0 project.

This service accepts a name, queries the Genderize API, processes the upstream response, and returns a structured classification result.

## Features

- `GET /api/classify?name={name}`
- Calls Genderize using the `name` query parameter
- Returns a normalized success response
- Computes `is_confident` from `probability` and `sample_size`
- Generates `processed_at` dynamically in UTC ISO 8601 format
- Returns consistent JSON error responses
- Enables CORS with `Access-Control-Allow-Origin: *`

## Tech Stack

- [Nest JS](https://docs.nestjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [PNPM](https://pnpm.io/)

## API Endpoint

### Classify Name

`GET /api/classify?name={name}`

Example:

```http
GET /api/classify?name=john
```

## Success Response

Status: `200 OK`

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

## Response Processing Rules

- Extract `gender`, `probability`, and `count` from Genderize
- Rename `count` to `sample_size`
- Set `is_confident` to `true` only when:
  - `probability >= 0.7`
  - `sample_size >= 100`
- Generate `processed_at` on every request using UTC ISO 8601 format

## Error Responses

All errors return this structure:

```json
{
  "status": "error",
  "message": "<error message>"
}
```

Possible error cases:

- `400 Bad Request` for missing or empty `name` query
- `422 Unprocessable Entity` when `name` query is not a string
- `500 Internal Server Error` for server failure
- `502 Bad Gateway` for upstream API failure
- `404 Not Found` for unknown routes

Edge case response:

If Genderize returns `gender: null` or `count: 0`, the service returns a 422 error:

```json
{
  "status": "error",
  "message": "No prediction available for the provided name"
}
```

## Environment Variables

```env
PORT=8000
GENDERIZE_API_URL=https://api.genderize.io
```

## Local Setup

Clone the repository:

```bash
git clone https://github.com/Moluno-xiii/genderize-api-hng-14-be-stage-0
```

Enter the directory:

```bash
cd genderize-api-hng-14-be-stage-0
```

Install dependencies:

```bash
pnpm install
```

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

## Testing the Endpoint

Using curl:

```bash
curl "http://localhost:8000/api/classify?name=john"
```

Example error case:

```bash
curl "http://localhost:8000/api/classify"
```

## Built as a requirement for the HNG 14 stage 0 backend task
