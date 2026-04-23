# Genderize API — Profile Classifier

HNG 14 Backend Stages 0, 1, and 2.

This service classifies a person from their name (Genderize + Agify + Nationalize), persists the result in Postgres (Supabase), and exposes a query layer with **filtering, sorting, pagination, and a rule-based natural-language search endpoint** built for Insighta Labs.

## Tech Stack

- [NestJS](https://docs.nestjs.com/) 11 + TypeScript
- [Supabase](https://supabase.com/) (PostgreSQL)
- `class-validator` / `class-transformer` for request validation
- `uuidv7` for time-sortable IDs
- PNPM

## Database Schema

The `profiles` table must match this shape exactly:

| Field                | Type              | Notes                                   |
| -------------------- | ----------------- | --------------------------------------- |
| id                   | UUID v7           | Primary key                             |
| name                 | VARCHAR + UNIQUE  | Lowercased full name                    |
| gender               | VARCHAR           | `male` or `female`                      |
| gender_probability   | FLOAT             | Confidence 0–1                          |
| age                  | INT               | Exact age                               |
| age_group            | VARCHAR           | `child` / `teenager` / `adult` / `senior` |
| country_id           | VARCHAR(2)        | ISO 3166-1 alpha-2                      |
| country_name         | VARCHAR           | Full country name                       |
| country_probability  | FLOAT             | Confidence 0–1                          |
| created_at           | TIMESTAMP         | UTC ISO 8601                            |

SQL for creating the table in Supabase:

```sql
create table if not exists profiles (
  id                  uuid primary key,
  name                varchar not null unique,
  gender              varchar not null,
  gender_probability  float8 not null,
  age                 int not null,
  age_group           varchar not null,
  country_id          varchar(2) not null,
  country_name        varchar not null,
  country_probability float8 not null,
  created_at          timestamptz not null default now()
);

create index if not exists profiles_gender_idx on profiles (gender);
create index if not exists profiles_country_id_idx on profiles (country_id);
create index if not exists profiles_age_group_idx on profiles (age_group);
create index if not exists profiles_age_idx on profiles (age);
create index if not exists profiles_gender_probability_idx on profiles (gender_probability);
create index if not exists profiles_country_probability_idx on profiles (country_probability);
create index if not exists profiles_created_at_idx on profiles (created_at);
```

## Endpoints

### 1. Classify Name (Stage 0)

`GET /api/classify?name={name}`

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

### 2. Create Profile

`POST /api/profiles`

Body: `{ "name": "ella" }` — duplicates return the existing record with `"message": "Profile already exists"`.

### 3. List Profiles (filters + sort + pagination)

`GET /api/profiles`

| Param                      | Type   | Notes                                            |
| -------------------------- | ------ | ------------------------------------------------ |
| `gender`                   | string | `male` \| `female`                               |
| `age_group`                | string | `child` \| `teenager` \| `adult` \| `senior`     |
| `country_id`               | string | ISO 3166-1 alpha-2 (e.g. `NG`, `BJ`)             |
| `min_age`                  | int    | ≥ 0                                              |
| `max_age`                  | int    | ≥ 0                                              |
| `min_gender_probability`   | float  | 0–1                                              |
| `min_country_probability`  | float  | 0–1                                              |
| `sort_by`                  | string | `age` \| `created_at` \| `gender_probability`    |
| `order`                    | string | `asc` \| `desc` (default `desc`)                 |
| `page`                     | int    | default `1`                                      |
| `limit`                    | int    | default `10`, max `50`                           |

All filters combine with AND. Example:

`GET /api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10`

Response (`200 OK`):

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": [
    {
      "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
      "name": "emmanuel",
      "gender": "male",
      "gender_probability": 0.99,
      "age": 34,
      "age_group": "adult",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.85,
      "created_at": "2026-04-01T12:00:00Z"
    }
  ]
}
```

### 4. Natural Language Search

`GET /api/profiles/search?q={query}&page=1&limit=10`

Plain English → structured filters (see [Natural Language Parsing](#natural-language-parsing)). Returns the same paginated shape as `/api/profiles`. If the query can't be interpreted:

```json
{ "status": "error", "message": "Unable to interpret query" }
```

### 5. Get / Delete single profile

`GET /api/profiles/{id}` → `200` or `404`
`DELETE /api/profiles/{id}` → `204`

## Natural Language Parsing

The parser is **100% rule-based** (no LLM). It lowercases the query, runs a sequence of regex passes, and collects matched filters into a structured object. If no filter matches at all, it returns `Unable to interpret query`.

Lives in [`src/profiles/nlQuery.ts`](src/profiles/nlQuery.ts).

### Pipeline

1. **Normalize**: lowercase, collapse whitespace, pad with spaces so `\b` word boundaries work at both ends.
2. **Both-gender short-circuit**: if the query contains `male and female`, `men and women`, `both genders`, etc., *no* gender filter is applied and the phrase is stripped so the remaining gender regex doesn't fire. This handles `"male and female teenagers above 17"` → gender is left unset.
3. **Gender**: otherwise the first hit wins — `males? | men | man | boys? | gentlemen` → `male`; `females? | women | woman | girls? | ladies` → `female`.
4. **Age group keywords** (mutually exclusive, first match wins):
   - `child | children | kid | kids` → `child`
   - `teenager(s) | teen(s)` → `teenager`
   - `adult(s)` → `adult`
   - `senior(s) | elderly | old people` → `senior`
5. **`young`** → `min_age = 16`, `max_age = 24` (bracket is parser-only; `young` is **never** stored as an `age_group`).
6. **Age ranges**:
   - `between N and M` / `aged N to M` → `min_age = min(N,M)`, `max_age = max(N,M)`
   - `above N | over N | older than N | greater than N | more than N` → `min_age = max(existing, N)`
   - `below N | under N | younger than N | less than N` → `max_age = min(existing, N)`
7. **Country**: scans for any ISO country name (built from `Intl.DisplayNames`) plus a curated alias table (`uk` → `GB`, `usa` → `US`, `drc` → `CD`, `uae` → `AE`, etc.). Matching is longest-first, so `"united states"` beats `"united"`.
8. **Interpretation check**: if the parsed filter object is empty, return `null` → controller raises `BadRequestException("Unable to interpret query")`.

### Worked examples

| Query                                  | Parsed filters                                           |
| -------------------------------------- | -------------------------------------------------------- |
| `young males`                          | `gender=male, min_age=16, max_age=24`                    |
| `females above 30`                     | `gender=female, min_age=30`                              |
| `people from angola`                   | `country_id=AO`                                          |
| `adult males from kenya`               | `gender=male, age_group=adult, country_id=KE`            |
| `male and female teenagers above 17`   | `age_group=teenager, min_age=17`                         |
| `children from nigeria between 5 and 10` | `age_group=child, country_id=NG, min_age=5, max_age=10` |
| `seniors from the united states`       | `age_group=senior, country_id=US`                        |

### Supported keyword summary

- **Gender (male)**: `male`, `males`, `man`, `men`, `boy`, `boys`, `gentlemen`
- **Gender (female)**: `female`, `females`, `woman`, `women`, `girl`, `girls`, `ladies`
- **Both genders (filter suppressed)**: `male and female`, `men and women`, `both genders` (and reversed variants)
- **Age group**: `child`, `children`, `kid(s)`, `teen(s)`, `teenager(s)`, `adult(s)`, `senior(s)`, `elderly`, `old people`
- **Bracket term**: `young` (16–24)
- **Age comparators**: `above`, `over`, `older than`, `greater than`, `more than`, `below`, `under`, `younger than`, `less than`
- **Age range**: `between N and M`, `aged N to M`
- **Country**: all ISO 3166-1 region names + aliases (`uk`, `usa`, `america`, `drc`, `uae`, `czechia`, `ivory coast`, `south/north korea`, `russia`, `vietnam`)

### Limitations & edge cases NOT handled

The parser is intentionally narrow — the rules below do **not** apply, and queries that rely on them may misparse or be rejected:

- **No fuzzy matching / typos.** `nigera` or `teeangers` are not recognised.
- **No stemming or language detection.** English only, ASCII keywords.
- **No negation.** `not male`, `excluding teenagers`, `no seniors` are all silently ignored.
- **No disjunction across filter types.** `males or females from nigeria or kenya` cannot be expressed — only one gender and one country win.
- **Only one country per query.** The first match (longest-first) wins; `"from nigeria or kenya"` yields `NG` only.
- **Contradictory ranges aren't normalized.** `young but above 30` sets `min_age=30` but keeps `max_age=24` from `young`, guaranteeing zero results. We surface it, we don't second-guess it.
- **No probability parsing.** `"confidence above 0.8"` or `"strong match"` are ignored — use `min_gender_probability` / `min_country_probability` directly.
- **No date / time references.** `"added last week"` / `"created in April"` are ignored.
- **No ordering intent.** `"the oldest males"` is parsed as `gender=male`; there's no `sort_by` inference. Use `/api/profiles` with `sort_by` + `order`.
- **No pluralization of country names.** `nigerians` is not resolved to `NG`; use `from nigeria`, `in nigeria`, or just `nigeria`.
- **No quoted phrases / entities.** `"New Zealand"` in quotes works the same as without, but nested / escaped quoting isn't stripped.
- **No multi-clause composition.** `"adults from kenya and teenagers from nigeria"` collapses — the first age-group match and the first country match win.

## Error Responses

All errors share this envelope:

```json
{ "status": "error", "message": "<reason>" }
```

| Status | Condition                                                               |
| ------ | ----------------------------------------------------------------------- |
| `400`  | Missing or empty required parameter; NL query cannot be interpreted      |
| `404`  | Profile not found                                                       |
| `422`  | Invalid parameter type (e.g. `min_age=abc`, `sort_by=height`) — message `"Invalid query parameters"` |
| `500`  | Internal server error                                                   |
| `502`  | Upstream API (Genderize/Agify/Nationalize) returned invalid data        |

CORS: `Access-Control-Allow-Origin: *` is enabled globally.

## Environment

```env
PORT=8000
GENDERIZE_API_URL=https://api.genderize.io
AGIFY_API_URL=https://api.agify.io
NATIONALIZE_API_URL=https://api.nationalize.io
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-service-role-key>
```

## Local Setup

```bash
git clone https://github.com/Moluno-xiii/genderize-api-hng-14-be-stage-2
cd genderize-api-hng-14-be-stage-2
pnpm install
cp .env.example .env   # then fill in the Supabase + API URLs
pnpm run start:dev
```

Server starts on `http://localhost:8000`.

## Seeding the Database

A provided JSON file contains 2026 profiles. The seeder is idempotent — re-runs skip rows whose `name` already exists (Postgres `UNIQUE` + `upsert(..., ignoreDuplicates: true)`).

1. Download the seed file from the Google Drive link in the task brief.
2. Save it locally, e.g. `data/profiles.json`.
3. Run:

```bash
pnpm run seed            # defaults to data/profiles.json
pnpm run seed path/to/custom-profiles.json
```

The script:

- Reads a JSON array (or `{ "data": [...] }` / `{ "profiles": [...] }`).
- Normalizes each record (lowercase name, uppercase country_id, fills `country_name` via `Intl.DisplayNames` when absent, assigns UUID v7, `created_at` default).
- Batches `upsert` calls (500 rows each) with `{ onConflict: 'name', ignoreDuplicates: true }`.

## Performance Notes

- `getAllProfiles` uses Supabase's single-query count (`select('*', { count: 'exact' })`) — no extra round-trip.
- All filters translate to indexed column predicates (gender / country_id / age_group / age / probabilities / created_at). The `CREATE INDEX` statements above cover every filter and sort dimension; no full-table scans.
- Pagination uses PostgREST's `.range(from, to)` (offset/limit under the hood).
- Name lookups on create/seed hit the `name UNIQUE` index.

## Scripts

```bash
pnpm run start:dev   # dev with watch
pnpm run start       # start
pnpm run build       # compile TypeScript
pnpm run lint        # eslint
pnpm run test        # jest
pnpm run seed        # seed profiles table (idempotent)
```

## Testing (manual)

```bash
# Create
curl -X POST http://localhost:8000/api/profiles -H "Content-Type: application/json" -d '{"name":"john"}'

# List with filters + sort + pagination
curl "http://localhost:8000/api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10"

# Natural language search
curl "http://localhost:8000/api/profiles/search?q=young%20males%20from%20nigeria"

# Classify
curl "http://localhost:8000/api/classify?name=john"

# Single / delete
curl http://localhost:8000/api/profiles/{id}
curl -X DELETE http://localhost:8000/api/profiles/{id}
```

## Built for HNG 14 Backend Stages 0, 1, and 2 (Insighta Labs brief).
