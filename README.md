# SciTech Community Backend API

A high-performance REST API and real-time backend service built with Express.js, TypeScript, PostgreSQL, and Prisma ORM for the SciTech Community platform.

**Author:** James Atagher ([GitHub](https://github.com/Atagherjames) | [Email](mailto:jamesatagher@gmail.com))

---

## Technical Overview

The SciTech Community backend provides the data layer, authentication infrastructure, and real-time communication pipeline for community discovery, content publication, and collaborative networking.

### Core Capabilities
- **Relational Data Persistence:** Structured schemas and migrations managed via Prisma ORM connected to PostgreSQL.
- **Stateless Authentication:** JSON Web Token (JWT) session validation with bcryptjs cryptographic password hashing.
- **Cloud Media Storage:** Direct multipart media streaming to Cloudinary CDN for optimized asset storage and delivery.
- **Real-Time Engine:** Bi-directional event distribution using Socket.io and Server-Sent Events (SSE) for live message dispatch.
- **Backward-Compatible Architecture:** Endpoint routing tailored to client requirements, minimizing frontend overhead and refactoring.

---

## Tech Stack

- **Runtime & Language:** Node.js (v18+), TypeScript
- **Web Framework:** Express.js
- **Database:** PostgreSQL
- **Object-Relational Mapping:** Prisma ORM (v5)
- **Authentication & Security:** JWT (jsonwebtoken), bcryptjs, CORS
- **Media Pipeline:** Multer, Cloudinary SDK
- **Real-Time Transport:** Socket.io, Server-Sent Events (SSE)

---

## System Architecture & Data Schema

The database consists of 9 normalized relational models:

- **User:** Account credentials, display profile, bio, location, verification status.
- **Community:** Community metadata, category classification, privacy type, pricing tier, avatar, and banner.
- **CommunityMember:** Many-to-many junction model linking users to joined communities.
- **Post:** Threaded community discussions, text content, and Cloudinary media references.
- **PostLike:** Unique user engagement mapping per post.
- **Comment:** Chronological discussions attached to specific posts.
- **Conversation:** Direct messaging threads between authenticated participants.
- **ConversationParticipant:** Relational junction between users and conversation channels.
- **Message:** Real-time messages with sender, receiver, timestamp, and read receipts.

---

## API Reference

### Health Check
- GET /api/health — Returns service status and server uptime.

### Authentication & Users
- POST /api/collections/users/auth-with-password — Authenticates user credentials and returns a signed JWT.
- POST /api/collections/users/records — Registers a new user account.
- GET /api/collections/users/records/:id — Retrieves profile data for a specific user.
- PATCH /api/collections/users/records/:id — Updates user profile information, avatar, or password.

### Communities
- GET /api/collections/all_communities/records — Retrieves a list of all active communities with member relations.
- GET /api/collections/all_communities/records/:id — Fetches complete details for a single community.
- POST /api/collections/all_communities/records — Creates a new community with multipart banner and avatar upload.
- PATCH /api/collections/all_communities/records/:id — Updates community configuration, membership additions, or leaves.
- DELETE /api/collections/all_communities/records/:id — Removes a community and associated records.

### Posts & Comments
- GET /api/collections/posts/records — Returns posts filtered by community identifier and sorted chronologically.
- GET /api/collections/posts/records/:id — Fetches a single post by ID.
- POST /api/collections/posts/records — Publishes a new post with optional media attachment.
- PATCH /api/collections/posts/records/:id — Modifies post content or updates like lists.
- DELETE /api/collections/posts/records/:id — Deletes a post.
- GET /api/collections/comments/records — Lists comments associated with a specific post.
- POST /api/collections/comments/records — Adds a comment to an existing post.

### Direct Messaging & Real-Time
- GET /api/collections/conversations/records — Lists active conversation threads for the authenticated user.
- GET /api/collections/conversations/records/:id — Returns conversation metadata and message history.
- POST /api/collections/messages/records — Transmits a chat message and triggers real-time distribution.
- GET /api/realtime — Server-Sent Events (SSE) stream endpoint for live event subscriptions.

---

## Environment Configuration

Configure the following variables in a .env file at the root of the project:

`env
DATABASE_URL="postgresql://user:password@localhost:5432/scitech_db?schema=public"
PORT=5000
JWT_SECRET="your-jwt-secret"
CLIENT_URL="http://localhost:5173"

CLOUDINARY_CLOUD_NAME="dx0ll70so"
CLOUDINARY_API_KEY="637354963884816"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
CLOUDINARY_URL="cloudinary://key:secret@cloud_name"
`

---

## Local Development

### 1. Install Dependencies
`ash
npm install
`

### 2. Generate Prisma Client and Sync Database
`ash
npx prisma generate
npx prisma db push
`

### 3. Seed Initial Database Records (Optional)
`ash
npx tsx prisma/seed.ts
`

### 4. Run Development Server
`ash
npm run dev
`
The server listens on http://localhost:5000.

---

## Production Deployment Guide

### Database: Neon (Managed PostgreSQL)
1. Provision a free PostgreSQL instance on Neon.tech.
2. Copy the supplied connection string into DATABASE_URL.

### Application Hosting: Render
1. Create a new Web Service connected to this repository.
2. Set the build and start commands:
   - **Build Command:** 
pm install && npx prisma generate && npx prisma db push && npm run build
   - **Start Command:** 
pm start
3. Add the required environment variables in the Render dashboard.
4. Deploy the service to receive a public HTTPS endpoint.

---

## License & Authorship

Developed and maintained by **James Atagher**.  
Repository: [github.com/Atagherjames/scitech-community-backend](https://github.com/Atagherjames/scitech-community-backend)
