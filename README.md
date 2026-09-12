# ?? SciTech Community — Enterprise Express & PostgreSQL Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white)](https://cloudinary.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

A high-performance, modular backend API built for the **SciTech Community** platform. Designed to handle real-time collaborative communication, community discovery, user governance, threaded discussions, and cloud media delivery at scale.

**Lead Developer & Architect:** [James Atagher](https://github.com/Atagherjames) | [Email](mailto:jamesatagher@gmail.com)

---

## ??? Architecture & Core Features

### 1. Robust Data Layer (Prisma ORM + PostgreSQL)
- Strongly typed relational database schemas powered by **Prisma**.
- Optimized join queries and cascade deletions across 9 core models:
  - **Users**: Account lifecycle, password hashing (cryptjs), profiles, email verification.
  - **Communities**: Group discovery, categorization (Science, Tech, AI, Biotech), membership pricing, privacy controls.
  - **CommunityMembers**: Many-to-many relationship mapping user memberships and role levels.
  - **Posts & Likes**: Community forum posts, rich text, media attachments, and user like reactions.
  - **Comments**: Hierarchical threaded discussions per post.
  - **Conversations & Messages**: 1-on-1 and group messaging with read receipts and timestamps.

### 2. Cloud Media Pipeline (Cloudinary CDN)
- Fully automated asset pipeline for user avatars, community banners, and post attachments.
- Multipart form parsing with **Multer**, streaming directly to **Cloudinary** for global edge CDN distribution and automatic format optimization.

### 3. Dual Real-Time Communication
- **Socket.io WebSockets**: Instant bi-directional messaging and live updates.
- **Server-Sent Events (SSE)**: Event streaming at \/api/realtime\ enabling reactive UI updates without client polling.

### 4. Enterprise Security
- Stateless **JWT (JSON Web Token)** authentication.
- Cryptographic password hashing using **bcryptjs** with 10 salt rounds.
- Configurable **CORS** middleware and strict input validation.

---

## ?? API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | \/api/health\ | Server status and health metrics | No |
| **POST** | \/api/collections/users/records\ | Register a new user account | No |
| **POST** | \/api/collections/users/auth-with-password\ | User authentication & JWT issuance | No |
| **GET** | \/api/collections/users/records/:id\ | Fetch user profile data | No |
| **PATCH** | \/api/collections/users/records/:id\ | Update profile or change password | Yes |
| **GET** | \/api/collections/all_communities/records\ | List all communities with creator & member counts | No |
| **GET** | \/api/collections/all_communities/records/:id\ | Retrieve community details | No |
| **POST** | \/api/collections/all_communities/records\ | Create a new community (with banner & avatar upload) | Yes |
| **PATCH** | \/api/collections/all_communities/records/:id\ | Join, leave, or modify community settings | Yes |
| **DELETE** | \/api/collections/all_communities/records/:id\ | Delete community and cascade relations | Yes |
| **GET** | \/api/collections/posts/records\ | Fetch community posts (supports filter & sorting) | No |
| **POST** | \/api/collections/posts/records\ | Publish new post with optional media attachment | Yes |
| **PATCH** | \/api/collections/posts/records/:id\ | Update post content or like reactions | Yes |
| **DELETE** | \/api/collections/posts/records/:id\ | Remove a post | Yes |
| **GET** | \/api/collections/comments/records\ | List comments by post ID | No |
| **POST** | \/api/collections/comments/records\ | Post a new comment | Yes |
| **GET** | \/api/collections/conversations/records\ | Fetch direct conversations for authenticated user | Yes |
| **POST** | \/api/collections/messages/records\ | Send direct chat message with real-time push | Yes |
| **GET** | \/api/realtime\ | SSE connection endpoint for reactive subscriptions | No |

---

## ?? Environment Variables

Create a \.env\ file in the root directory:

\\\env
# PostgreSQL Database Connection String
DATABASE_URL="postgresql://user:password@localhost:5432/scitech_db?schema=public"

# Express Port & Security
PORT=5000
JWT_SECRET="your-super-secret-jwt-key"
CLIENT_URL="http://localhost:5173"

# Cloudinary Cloud Storage Credentials
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
\\\

---

## ?? Quick Start (Local Development)

### 1. Install Dependencies
\\\ash
npm install
\\\

### 2. Generate Prisma Client & Sync Database
\\\ash
npx prisma generate
npx prisma db push
\\\

### 3. Seed Starter Data (Optional)
Creates an initial administrator account (\jamesatagher@gmail.com\ / \Password123!\) and starter tech/science communities:
\\\ash
npx tsx prisma/seed.ts
\\\

### 4. Start Development Server
\\\ash
npm run dev
\\\
The server will boot with hot-reloading at **\http://localhost:5000\**.

---

## ?? Production Deployment (100% Free Tier Guide)

### Database: [Neon.tech](https://neon.tech/) (Free Managed PostgreSQL)
1. Sign up on Neon.tech and create a project named \scitech-db\.
2. Copy the supplied \DATABASE_URL\ connection string.

### API Host: [Render.com](https://render.com/) (Free Node.js Web Service)
1. Create a **New Web Service** connected to your GitHub repository.
2. Configure build & start commands:
   - **Build Command:** \
pm install && npx prisma generate && npx prisma db push && npm run build\
   - **Start Command:** \
pm start\
3. Add your environment variables (\DATABASE_URL\, \JWT_SECRET\, \CLOUDINARY_*\, \CLIENT_URL\).
4. Click **Deploy Web Service** — Render automatically builds and hosts the API with SSL enabled!

---

## ????? Author & Contact

**James Atagher**  
- **GitHub:** [@Atagherjames](https://github.com/Atagherjames)  
- **Email:** [jamesatagher@gmail.com](mailto:jamesatagher@gmail.com)  
- **Project:** SciTech Community Full-Stack Platform
