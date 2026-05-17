# 🧩 Dingbats Multiplayer

The ultimate real-time party game for visual puzzle masters. Decode the image, race the clock, and claim your spot on the podium.

---

## 💡 Introduction

**Dingbats Multiplayer** is a high-energy, real-time party game where players compete to solve visual wordplay puzzles (Dingbats). Designed with a minimalist Swiss aesthetic and built for seamless web-based play, it allows a Host to create rooms instantly and challenge friends to decode cryptic images.

Unlike traditional socket-based games that struggle with serverless timeouts, this project leverages **Supabase Realtime** to provide a rock-solid, low-latency experience on Vercel. No accounts, no friction—just pure, competitive fun.

## ✨ Features

*   **⚡ Real-Time Synchronization:** Instant updates for player joins, round transitions, and live guess feeds using Supabase Realtime.
*   **⏱️ Dynamic Scoring:** Earn points based on the difficulty of the puzzle plus a time-bonus multiplier for those who solve it the fastest.
*   **🎨 Minimalist Aesthetic:** A clean, "Meoowwww 🐱" branded UI featuring a bold orange color palette (`#E87722`) and smooth animations.
*   **📦 Puzzle Management:** Support for custom puzzle packs, image uploads via Cloudinary, and "shuffle-bag" logic to ensure no repeats.
*   **👤 Anonymous Play:** No tedious sign-ups. Users join via unique, ephemeral sessions stored in local storage.
*   **🛠️ Host Controls:** Manually advance rounds, pause the game, or kick players from the lobby.

## 🚀 Quick Start

### Prerequisites

*   **Node.js** (v20 or later)
*   **Supabase Account** (for Database & Real-time)
*   **Cloudinary Account** (for image hosting)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Harsh502s/Dingbats-Game.git
    cd Dingbats-Game
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    Create a `.env.local` file in the root directory (see [Configuration](#-configuration)).

4.  **Initialize Database:**
    Run the SQL migration found in `supabase/migrations/001_init.sql` inside your Supabase SQL Editor.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Seed Puzzles:**
    ```bash
    npx tsx scripts/seed-puzzles.ts
    ```

## 💻 Usage

### For the Host
1.  Navigate to the home page and enter your name.
2.  Select the number of rounds (1–20) and click **Create Room**.
3.  Share the generated **Join Link** with your friends.
4.  Once everyone is in the lobby, hit **Start Game**.

### For the Player
1.  Open the link provided by the Host.
2.  Enter your display name.
3.  When the puzzle appears, type your answer into the bottom border input and press **Enter**.
4.  Watch the live leaderboard to see your rank!

## 🔌 API Endpoints

| Method | Endpoint | Description | Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/rooms` | Creates a new game room | `hostId`, `hostName`, `totalRounds` |
| `POST` | `/api/rooms/[id]/players` | Joins a player to a room | `name` |
| `DELETE` | `/api/rooms/[id]/players/[pId]` | Kicks a player (Host only) | `x-host-id` (Header) |
| `POST` | `/api/rooms/[id]/start` | Transitions room to 'PLAYING' | `x-host-id` (Header) |
| `POST` | `/api/rooms/[id]/guess` | Validates a player's answer | `playerId`, `guess` |
| `POST` | `/api/rooms/[id]/next-round` | Advances to the next puzzle | `x-host-id` (Header) |

## 🛠️ Technologies Used

*   **Frontend:** Next.js 15+ (App Router), Tailwind CSS, Framer Motion
*   **Backend:** Next.js Serverless Route Handlers
*   **Database:** Supabase PostgreSQL
*   **Real-time:** Supabase Realtime (Pub/Sub)
*   **Storage:** Cloudinary (Puzzle Images)
*   **Validation:** Zod

## 📁 Project Structure

```text
.
├── app/                  # Next.js App Router (Pages & API)
│   ├── api/              # Serverless Route Handlers
│   ├── room/             # Dynamic routes for host/join/play views
│   └── page.tsx          # Landing / Room Creation
├── components/           # Reusable UI components
│   └── ui/               # Atomic design elements (Buttons, Inputs)
├── lib/                  # Shared utilities and configurations
│   ├── supabase/         # Browser/Server clients
│   └── realtime/         # Custom hooks for game synchronization
├── scripts/              # Seed scripts for puzzle data
├── supabase/             # SQL migrations and schema definitions
└── public/               # Static assets
```

## ⚙️ Configuration

Your `.env.local` must contain the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # For answer validation
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

## 🤝 Contributing

We welcome contributions! To get started:

1.  **Fork** the repository.
2.  **Create a branch** for your feature: `git checkout -b feature/amazing-feature`.
3.  **Commit** your changes: `git commit -m 'Add amazing feature'`.
4.  **Push** to the branch: `git push origin feature/amazing-feature`.
5.  Open a **Pull Request**.

Please ensure your code passes the rigorous testing plan outlined in `RIGOROUS_TESTING.md`.

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.

---

**Meoowwww 🐱 Happy Decoding!**
