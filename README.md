# upstageX — Creator Discovery API

A REST API service that powers creator discovery for the upstageX marketplace. Brands can search, filter, and shortlist creators (YouTubers, Instagram creators, etc.) for campaigns.

---

## 🚀 Tech Stack

- **Framework:** NestJS
- **ORM:** Prisma v7
- **Database:** PostgreSQL (with Neon Serverless driver adapter)
- **Validation:** `class-validator` + `class-transformer`
- **Auth:** JWT (`PassportJS`)
- **Language:** TypeScript

---

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in the configuration details:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/upstagex"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Migrations
Apply the migrations to set up your PostgreSQL database schema:
```bash
npx prisma migrate dev
```

### 5. Seed the Database
Seed the database with ~200 mock creators (across various niches, follower sizes, and countries) and 2 brand accounts (`brand@example.com` and `acme@example.com` with password `password123`):
```bash
npx prisma db seed
```

### 6. Build and Start the Application
```bash
# Compile project
npm run build

# Start server in production mode
npm run start

# Start server in development mode (watch mode)
npm run start:dev
```
The application will run on `http://localhost:3000/api`.

---

## 📖 API Documentation

### Table of Endpoints

| Category | Endpoint | HTTP Method | Auth Required | Description |
|---|---|---|---|---|
| **Auth** | `/auth/login` | `POST` | No | Authenticate brand and receive JWT token |
| **Creators** | `/creators` | `GET` | No | Search, filter, and paginate creators |
| **Creators** | `/creators/:id` | `GET` | No | Fetch a single creator by ID |
| **Shortlist** | `/shortlist` | `POST` | **Yes (JWT)** | Add a creator to the brand's shortlist |
| **Shortlist** | `/shortlist` | `GET` | **Yes (JWT)** | Retrieve all shortlisted creators |
| **Shortlist** | `/shortlist/:creatorId` | `DELETE` | **Yes (JWT)** | Remove a creator from the shortlist |

---

### Auth Module

#### Authenticate / Login (`POST /auth/login`)
Validates brand credentials and returns a JWT token.

* **Request Body:**
  ```json
  {
    "email": "brand@example.com",
    "password": "password123"
  }
  ```
* **Example cURL Request:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "brand@example.com", "password": "password123"}'
  ```
* **Response `200 OK`:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
* **Response `401 Unauthorized`:** (Bad credentials)
  ```json
  {
    "statusCode": 401,
    "message": "Invalid credentials",
    "error": "Unauthorized"
  }
  ```

---

### Creators Module (Public)

#### List Creators (`GET /creators`)
Retrieve creators with full support for search keywords, filters, sorting, and pagination.

* **Query Parameters:**
  - `q` (string, optional): Keyword search over `name`, `bio`, and `niche`.
  - `niche` (string, optional): Filter by exact niche (e.g. `fitness`, `tech`, `lifestyle`, `beauty`, `gaming`, `food`, `travel`, `finance`).
  - `platform` (string, optional): Filter by platform (`youtube`, `instagram`, `tiktok`).
  - `minFollowers` (integer, optional, `>= 0`): Minimum follower count.
  - `country` (string, optional): Filter by audience country code (e.g. `IN`, `US`, `UK`, `BR`, `ID`, `NG`, `PH`).
  - `sortBy` (string, optional): Field to sort by. Must be `'followers'` or `'engagement'`.
  - `order` (string, optional): Sort direction. Must be `'asc'` or `'desc'` (default: `'desc'`).
  - `page` (integer, optional): Page number (default: `1`).
  - `limit` (integer, optional): Items per page (default: `20`, max: `100`).

* **Example cURL Request (Get 1 beauty YouTuber sorted by followers):**
  ```bash
  curl "http://localhost:3000/api/creators?platform=youtube&niche=beauty&sortBy=followers&order=desc&limit=1"
  ```
* **Response `200 OK`:**
  ```json
  {
    "data": [
      {
        "id": "a454a9e1-b872-4447-be0b-88b49c8f3877",
        "name": "Priya Sharma",
        "platform": "youtube",
        "niche": "beauty",
        "bio": "Helping people navigate beauty one post at a time. Follow Priya Sharma on youtube.",
        "followerCount": 1840057,
        "engagementRate": 1.2,
        "audienceCountry": "US",
        "sampleContent": "https://example.com/youtube/priya-sharma-1",
        "createdAt": "2026-06-12T10:29:18.123Z"
      }
    ],
    "meta": {
      "total": 200,
      "page": 1,
      "limit": 1,
      "totalPages": 200
    }
  }
  ```

#### Fetch Single Creator (`GET /creators/:id`)
Retrieve a single creator's details by their ID.

* **Example cURL Request:**
  ```bash
  curl http://localhost:3000/api/creators/a454a9e1-b872-4447-be0b-88b49c8f3877
  ```
* **Response `200 OK`:**
  ```json
  {
    "id": "a454a9e1-b872-4447-be0b-88b49c8f3877",
    "name": "Priya Sharma",
    "platform": "youtube",
    "niche": "beauty",
    "bio": "Helping people navigate beauty one post at a time. Follow Priya Sharma on youtube.",
    "followerCount": 1840057,
    "engagementRate": 1.2,
    "audienceCountry": "US",
    "sampleContent": "https://example.com/youtube/priya-sharma-1",
    "createdAt": "2026-06-12T10:29:18.123Z"
  }
  ```
* **Response `404 Not Found`:**
  ```json
  {
    "statusCode": 404,
    "message": "Creator not found",
    "error": "Not Found"
  }
  ```

---

### Shortlist Module (Protected)

Requires `Authorization: Bearer <token>` header.

#### Add to Shortlist (`POST /shortlist`)
Saves a creator to the authenticated brand's shortlist.

* **Request Body:**
  ```json
  {
    "creatorId": "d79a5509-4991-4b14-af50-a82dd3e00122"
  }
  ```
* **Example cURL Request:**
  ```bash
  curl -X POST http://localhost:3000/api/shortlist \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn..." \
    -H "Content-Type: application/json" \
    -d '{"creatorId": "d79a5509-4991-4b14-af50-a82dd3e00122"}'
  ```
* **Response `201 Created`:**
  ```json
  {
    "id": "0668d504-3ec6-4729-b101-63fab11d5cc1",
    "brandId": "5bf29b1e-9e37-4ebf-bb90-9aa87820e722",
    "creatorId": "d79a5509-4991-4b14-af50-a82dd3e00122",
    "createdAt": "2026-06-12T10:33:32.493Z",
    "creator": {
      "id": "d79a5509-4991-4b14-af50-a82dd3e00122",
      "name": "Alex Rivera",
      "platform": "youtube",
      "niche": "beauty",
      "bio": "Award-winning beauty influencer on youtube. Partnered with top brands worldwide.",
      "followerCount": 3884343,
      "engagementRate": 6.35,
      "audienceCountry": "ID",
      "sampleContent": "https://example.com/youtube/alex-rivera-0",
      "createdAt": "2026-06-12T10:29:18.123Z"
    }
  }
  ```
* **Response `400 Bad Request`:** (If creator is already shortlisted)
  ```json
  {
    "statusCode": 400,
    "message": "Creator already shortlisted",
    "error": "Bad Request"
  }
  ```
* **Response `404 Not Found`:** (If creator does not exist)
  ```json
  {
    "statusCode": 404,
    "message": "Creator not found",
    "error": "Not Found"
  }
  ```

#### Get Shortlist (`GET /shortlist`)
Retrieve all creators added to the authenticated brand's shortlist.

* **Example cURL Request:**
  ```bash
  curl http://localhost:3000/api/shortlist \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn..."
  ```
* **Response `200 OK`:**
  ```json
  [
    {
      "id": "d79a5509-4991-4b14-af50-a82dd3e00122",
      "name": "Alex Rivera",
      "platform": "youtube",
      "niche": "beauty",
      "bio": "Award-winning beauty influencer on youtube. Partnered with top brands worldwide.",
      "followerCount": 3884343,
      "engagementRate": 6.35,
      "audienceCountry": "ID",
      "sampleContent": "https://example.com/youtube/alex-rivera-0",
      "createdAt": "2026-06-12T10:29:18.123Z"
    }
  ]
  ```

#### Remove from Shortlist (`DELETE /shortlist/:creatorId`)
Removes a creator from the authenticated brand's shortlist.

* **Example cURL Request:**
  ```bash
  curl -X DELETE http://localhost:3000/api/shortlist/d79a5509-4991-4b14-af50-a82dd3e00122 \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn..."
  ```
* **Response `200 OK`:**
  ```json
  {
    "message": "Creator removed from shortlist"
  }
  ```
* **Response `404 Not Found`:** (If the shortlist record doesn't exist for the brand)
  ```json
  {
    "statusCode": 404,
    "message": "Shortlist entry not found",
    "error": "Not Found"
  }
  ```

---

## 🧪 Quick Test Workflow Script (cURL + jq)

Make sure the server is running on `http://localhost:3000`. You can copy and execute the script below to verify the entire flow:

```bash
# 1. Log in and retrieve the Access Token
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"brand@example.com","password":"password123"}' \
  http://localhost:3000/api/auth/login | jq -r .access_token)

echo "Auth Token: ${TOKEN:0:15}..."

# 2. Query creators with platform & niche filtering
CREATOR_ID=$(curl -s "http://localhost:3000/api/creators?platform=youtube&niche=beauty&limit=1" \
  | jq -r '.data[0].id')

echo "Selected Creator ID: $CREATOR_ID"

# 3. Add the creator to your brand shortlist
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"creatorId\":\"$CREATOR_ID\"}" \
  http://localhost:3000/api/shortlist

# 4. View your brand's current shortlist
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/shortlist

# 5. Remove the creator from your shortlist
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/shortlist/$CREATOR_ID
```
