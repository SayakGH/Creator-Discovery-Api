# Technical Requirements Document
## upstageX — Creator Discovery API (Backend Intern Task)

---

## 1. Overview

Build a REST API service that powers creator discovery for the upstageX marketplace. Brands use this API to search, filter, and shortlist creators (YouTubers, Instagram creators, etc.) for campaigns.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (feature-module: controller / service / dto) |
| ORM | Prisma |
| Database | PostgreSQL (local or Supabase / Neon free tier) |
| Validation | class-validator + class-transformer |
| Auth | JWT (stubbed login endpoint) |
| Language | TypeScript |
| Testing | Jest |

**Constraints:**
- Use Nest's global `ValidationPipe` with `whitelist: true`
- No raw SQL string concatenation — all queries through Prisma

---

## 3. Data Models

### 3.1 Creator

```prisma
model Creator {
  id              String   @id @default(uuid())
  name            String
  platform        String   // e.g. "youtube", "instagram"
  niche           String   // e.g. "fitness", "tech", "lifestyle"
  bio             String
  followerCount   Int
  engagementRate  Float
  audienceCountry String
  sampleContent   String?  // URL or description
  createdAt       DateTime @default(now())

  shortlists      Shortlist[]
}
```

### 3.2 Brand (Auth User)

```prisma
model Brand {
  id         String      @id @default(uuid())
  email      String      @unique
  password   String      // hashed
  createdAt  DateTime    @default(now())

  shortlists Shortlist[]
}
```

### 3.3 Shortlist

```prisma
model Shortlist {
  id        String   @id @default(uuid())
  brandId   String
  creatorId String
  createdAt DateTime @default(now())

  brand     Brand   @relation(fields: [brandId], references: [id])
  creator   Creator @relation(fields: [creatorId], references: [id])

  @@unique([brandId, creatorId])
}
```

---

## 4. API Endpoints

### 4.1 Creators Module (Public)

#### `GET /creators`

List creators with search, filters, sorting, and pagination.

**Query Parameters (validated via DTO):**

| Param | Type | Description |
|---|---|---|
| `q` | string (optional) | Keyword search over `name`, `bio`, `niche` |
| `niche` | string (optional) | Filter by exact niche |
| `platform` | string (optional) | Filter by platform |
| `minFollowers` | number (optional) | Minimum follower count |
| `country` | string (optional) | Filter by `audienceCountry` |
| `sortBy` | `followers` \| `engagement` (optional) | Sort field |
| `order` | `asc` \| `desc` (optional, default: `desc`) | Sort direction |
| `page` | number (optional, default: `1`) | Page number |
| `limit` | number (optional, default: `20`, max: `100`) | Items per page |

**Response `200 OK`:**
```json
{
  "data": [ /* Creator[] */ ],
  "meta": {
    "total": 200,
    "page": 1,
    "limit": 20,
    "totalPages": 10
  }
}
```

---

#### `GET /creators/:id`

Fetch a single creator by ID.

**Response `200 OK`:** Creator object  
**Response `404 Not Found`:** `{ "message": "Creator not found" }`

---

### 4.2 Auth Module

#### `POST /auth/login`

Stubbed login — validates credentials and returns a JWT.

**Request Body:**
```json
{ "email": "brand@example.com", "password": "secret" }
```

**Response `200 OK`:**
```json
{ "access_token": "<jwt>" }
```

**Response `401 Unauthorized`:** on bad credentials

---

### 4.3 Shortlist Module (JWT-Protected)

All routes require `Authorization: Bearer <token>` header via `JwtAuthGuard`.

#### `POST /shortlist`

Add a creator to the authenticated brand's shortlist.

**Request Body:**
```json
{ "creatorId": "<uuid>" }
```

**Response `201 Created`:** Shortlist entry  
**Response `400 Bad Request`:** If creator already shortlisted  
**Response `404 Not Found`:** If creator doesn't exist

---

#### `GET /shortlist`

List all creators in the authenticated brand's shortlist.

**Response `200 OK`:** Array of shortlisted creators

---

#### `DELETE /shortlist/:creatorId`

Remove a creator from the shortlist.

**Response `200 OK`:** Success message  
**Response `404 Not Found`:** If entry doesn't exist

---

## 5. Module Structure

```
src/
├── app.module.ts
├── main.ts                       # Global ValidationPipe, prefix setup
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/login.dto.ts
│   ├── guards/jwt-auth.guard.ts
│   └── strategies/jwt.strategy.ts
├── creators/
│   ├── creators.module.ts
│   ├── creators.controller.ts
│   ├── creators.service.ts
│   └── dto/query-creators.dto.ts
├── shortlist/
│   ├── shortlist.module.ts
│   ├── shortlist.controller.ts
│   ├── shortlist.service.ts
│   └── dto/add-to-shortlist.dto.ts
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

---

## 6. Validation Rules

### `QueryCreatorsDto`
- `q`: optional string
- `niche`, `platform`, `country`: optional strings
- `minFollowers`: optional, must be a positive integer (`@IsInt`, `@Min(0)`)
- `sortBy`: optional, must be one of `['followers', 'engagement']` (`@IsIn`)
- `order`: optional, must be `'asc'` or `'desc'`
- `page`: optional, positive integer, default `1`
- `limit`: optional, integer between 1–100, default `20`

### `AddToShortlistDto`
- `creatorId`: required, valid UUID (`@IsUUID`)

### `LoginDto`
- `email`: required, valid email (`@IsEmail`)
- `password`: required, non-empty string

**Bad requests must return `400` with field-level errors — never a `500`.**

---

## 7. Database Seed

- Seed script: `prisma/seed.ts`
- Generates ~200 creators with realistic, varied data across:
  - Platforms: `youtube`, `instagram`, `tiktok`
  - Niches: `fitness`, `tech`, `lifestyle`, `beauty`, `gaming`, `food`, `travel`, `finance`
  - Follower counts: 5k – 5M (varied)
  - Engagement rates: 1% – 12%
  - Countries: `IN`, `US`, `UK`, `BR`, `ID`, `NG`, `PH`
- Run via: `npx prisma db seed`

---

## 8. Error Handling

| Scenario | HTTP Status |
|---|---|
| Validation failure (bad query params / body) | `400 Bad Request` |
| Invalid or missing JWT | `401 Unauthorized` |
| Resource not found | `404 Not Found` |
| Creator already in shortlist | `400 Bad Request` |
| Unexpected server error | `500 Internal Server Error` |

---

## 9. Testing

Write Jest unit tests for `CreatorsService` targeting:

- `findAll`: verify pagination metadata calculation
- `findAll` with `?q=`: verify keyword search filter is applied
- `findAll` with `niche`, `platform`, `minFollowers`: verify filters compose correctly
- `findOne`: verify 404 throw when creator not found

Mock `PrismaService` using Jest mocks — no real DB calls in unit tests.

---

## 10. Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/upstagex"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

---

## 11. Setup Steps (README outline)

```bash
# 1. Install dependencies
npm install

# 2. Set up env
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Seed database
npx prisma db seed

# 5. Start dev server
npm run start:dev

# 6. Run tests
npm run test
```

---

## 12. Key Design Decisions

- **Prisma `where` composition**: Filters are built as a conditional Prisma `where` object — only defined query params are included. This avoids any raw SQL and keeps filters composable.
- **Stubbed auth**: `Brand` records are pre-seeded or created via a simple register endpoint. Password hashing uses `bcrypt`. JWT is issued on login and verified via `PassportJS` + `@nestjs/jwt`.
- **Pagination**: `skip = (page - 1) * limit`, `take = limit`. Total count fetched with `prisma.creator.count(sameWhere)` in the same request.
- **Shortlist uniqueness**: Enforced at the DB level via `@@unique([brandId, creatorId])` — duplicate adds return a `400` instead of a DB error.
- **Global ValidationPipe**: Set with `whitelist: true` (strips unknown fields) and `forbidNonWhitelisted: false` for lenient but clean input handling.