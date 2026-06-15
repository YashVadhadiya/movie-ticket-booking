# Mini Theater Ticket Booking System

A complete ticket booking system for small society mini theaters. The admin can create theaters, define seat layouts, add movies and shows, and share public booking links. Users can open the link, select seats, book tickets, and receive confirmation via WhatsApp.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────┐
│  GitHub Pages   │────▶│  Express API     │────▶│  Redis  │
│  (React Static) │     │  (Render/Railway)│     │(Upstash)│
└─────────────────┘     └──────────────────┘     └─────────┘
       │                                                   
       └── WhatsApp CTA (client-side redirect)             
```

- **Frontend**: React (Vite) — static site, deploys to GitHub Pages
- **Backend**: Node.js + Express — deployed separately (Render/Fly.io/Railway)
- **Database**: Redis (via Upstash) — 24-hour TTL for all show/booking data
- **Notifications**: WhatsApp click-to-chat (no external SMS API needed)

## Features

### Admin Side
- Login-protected dashboard
- Theater designer — visual seat layout editor (add rows, block seats, choose screen position)
- Movie management (poster, duration, language, description)
- Show creation (pick theater + movie, set date/time/price)
- Auto-generated public booking link for each show
- View all bookings per show with seat map
- Cancel bookings or mark seats as unavailable
- SMS/WhatsApp delivery logs with retry

### User Side
- Open public booking link (no login required)
- View movie/show details and seat layout
- Select available seats (green/red/yellow visual guide)
- Enter name and mobile number
- Atomic booking — prevents double booking even under concurrent access
- Booking success screen with full ticket summary
- Send confirmation to WhatsApp with one click

## Project Structure

```
mini-theater-booking/
├── backend/                      # Express API
│   ├── src/
│   │   ├── routes/               # API endpoints
│   │   ├── services/
│   │   │   └── redis.js          # All Redis operations + Lua booking script
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT verification
│   │   ├── app.js                # Express setup
│   │   ├── config.js             # Environment config
│   │   └── server.js             # Entry point
│   └── .env                      # Environment variables
├── frontend/                     # React (Vite)
│   ├── src/
│   │   ├── pages/admin/          # Dashboard, Theaters, Movies, Shows, Bookings, SMS Logs
│   │   ├── pages/book/           # Public booking page + success page
│   │   ├── components/           # SeatGrid, AdminLayout, ProtectedRoute
│   │   ├── context/              # AuthContext (JWT-based admin auth)
│   │   ├── services/             # API client
│   │   └── styles/               # CSS
│   └── dist/                     # Build output (deploy to GitHub Pages)
└── README.md
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Redis (or a free Upstash account)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set REDIS_URL, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
npm install
npm run dev
```

The API runs on `http://localhost:3001`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`. Vite proxies `/api` requests to the backend.

### 3. Using the App

1. Open `http://localhost:5173/admin` — login with your admin credentials (default: `admin` / `admin123`)
2. Create a Theater → Design the seat layout (add rows, click seats to block/unblock)
3. Add a Movie
4. Create a Show → pick theater + movie → set date/time/price
5. Copy the public booking link from the Shows page
6. Open the booking link in an incognito window → select seats → book
7. On success, click "Send Confirmation to WhatsApp"

## Redis Data Schema

All show/booking data has a 24-hour TTL (auto-expires after the show).

| Key | Type | Purpose |
|-----|------|---------|
| `theater:{id}` | Hash | Name, location, seat layout JSON |
| `movie:{id}` | Hash | Title, poster, duration, language |
| `show:{id}` | Hash | Theater, movie, date, time, price, slug |
| `slug:{slug}` | String | Maps public slug → show ID |
| `show:{id}:seats:available` | Set | Unbooked seat IDs |
| `show:{id}:seats:booked` | Set | Booked seat IDs |
| `booking:{id}` | Hash | Customer name, mobile, seats, amount |
| `show:{id}:bookings` | Set | All booking IDs for this show |
| `smslog:{id}` | Hash | SMS delivery log |

## Atomic Booking (No Double Booking)

The booking system uses a **Redis Lua script** executed atomically on the server:

```lua
-- Runs as a single atomic operation
1. Check every requested seat is in the "available" set
2. If any seat is already taken → return error with conflicted seat
3. Move seats from "available" to "booked" set
4. Create booking record
5. Link booking to show
6. Set 24h TTLs
```

This guarantees that even if two users book the same seat simultaneously, only one succeeds.

## Deployment

### Frontend → GitHub Pages

```bash
cd frontend
npm run build
# Deploy the dist/ folder to GitHub Pages
```

### Backend → Render / Railway

1. Push the `backend/` folder to a GitHub repo (or use Railway's direct upload)
2. Set environment variables: `REDIS_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `FRONTEND_URL`
3. Start command: `npm start`

### Redis → Upstash (Free Tier)

1. Create a free Upstash account → get your Redis REST URL
2. Use that as `REDIS_URL` in your backend env vars

### Set FRONTEND_URL

After deploying frontend to GitHub Pages, set `FRONTEND_URL` in the backend environment to your GitHub Pages URL (e.g., `https://yourusername.github.io/repo-name`).

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | No | Admin login |
| GET | `/api/admin/verify` | Yes | Verify admin token |
| POST | `/api/theaters` | Yes | Create theater |
| GET | `/api/theaters` | Yes | List theaters |
| GET | `/api/theaters/:id` | No | Get theater |
| PUT | `/api/theaters/:id` | Yes | Update theater |
| DELETE | `/api/theaters/:id` | Yes | Delete theater |
| POST | `/api/movies` | Yes | Create movie |
| GET | `/api/movies` | No | List movies |
| PUT | `/api/movies/:id` | Yes | Update movie |
| DELETE | `/api/movies/:id` | Yes | Delete movie |
| POST | `/api/shows` | Yes | Create show |
| GET | `/api/shows` | Yes | List shows |
| GET | `/api/shows/slug/:slug` | No | Get show by public slug |
| GET | `/api/shows/:id` | No | Get show |
| GET | `/api/shows/:id/seats` | No | Get seat availability |
| POST | `/api/bookings` | No | Create booking |
| GET | `/api/bookings/:showId` | Yes | List show bookings |
| GET | `/api/bookings/all` | Yes | List all bookings |
| POST | `/api/bookings/:id/cancel` | Yes | Cancel booking |
| POST | `/api/bookings/:showId/block-seats` | Yes | Block seats |
| GET | `/api/sms` | Yes | List SMS logs |
| POST | `/api/sms/retry/:bookingId` | Yes | Retry WhatsApp notification |
| GET | `/api/stats` | Yes | Dashboard statistics |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | (required) | Secret for JWT tokens |
| `ADMIN_USERNAME` | `admin` | Admin login username |
| `ADMIN_PASSWORD` | `admin123` | Admin login password |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend origin (CORS) |
