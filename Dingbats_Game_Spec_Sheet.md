# Dingbats Multiplayer Game
**Technical Specification & Product Requirements Document**

---

> **Executive Summary**
> This document outlines the technical and functional specifications for a real-time multiplayer party game (similar to Dingbats). The app allows a Host to create a room, share a joining link, and display image-based puzzles to joined players. Players submit text-based answers in real-time, earning points for correct matches, culminating in a competitive leaderboard.

## 1. Core Workflows & User Roles

### 1.1 The Host (Game Master)
* **Room Creation:** Instantiates a new game session, generating a unique, shareable room URL (e.g., `/room/abcd-1234`).
* **Lobby Management:** Views incoming players in real-time and clicks "Start Game" when all colleagues have joined.
* **Game Control:** Advances rounds manually. Reveals the current picture to all players simultaneously.
* **Scoring Authority:** (Optional but recommended) Can see player guesses and manually override points in case of minor typos, though auto-matching is the default.

### 1.2 The Players
* **Joining:** Clicks the invite link, lands on a lobby screen, and enters their display name.
* **Gameplay:** Views the puzzle image displayed on their screen synced with the Host.
* **Interaction:** Submits guesses via a text input field before the round timer expires.
* **Feedback:** Receives immediate visual feedback on points scored and views the global leaderboard at the end.

## 2. Technical Architecture

Given the requirement for a **Vercel deployment**, relying heavily on a traditional stateful WebSocket server (like Socket.io on a Node/Express backend) is problematic due to Vercel's serverless architecture. To achieve seamless real-time syncing, a Serverless/Edge-compatible real-time architecture is required.

| Layer | Technology Recommendation |
| :--- | :--- |
| **Frontend** | **React.js (Next.js App Router)** with **Tailwind CSS**. Provides fast rendering, easy Vercel integration, and minimal aesthetic capabilities via Tailwind. |
| **Backend / API** | **Next.js Serverless Route Handlers**. Used for room creation, fetching image data, and validating answers. |
| **Real-Time Sync** | **Pusher (Channels)** OR **Supabase Realtime**. Since Vercel shuts down serverless functions after execution, a managed WebSocket service is mandatory to broadcast "Next Round", "Image Reveal", and "New Guess" events to all clients. |
| **Database** | **Supabase (PostgreSQL)** or **Upstash (Redis)**. Supabase is ideal for storing the library of images/answers and persisting final leaderboards. Upstash is great for transient room state. |
| **Hosting** | **Vercel** (Frontend & Serverless APIs). **AWS S3** or **Cloudinary** for fast image hosting/delivery. |

## 3. Real-Time Event Dictionary

The communication between the Host and Players relies on pub/sub channels. Each room has a unique channel ID.

* `player_joined` - Triggered when a new user enters their name. Updates the Host's lobby UI.
* `game_started` - Broadcast by the Host. Transitions all players from Lobby to the Active Game View.
* `round_update` - Broadcast by Host. Payload contains the image URL and round timer.
* `guess_submitted` - Sent by Player to the server. Validates the answer. If correct, triggers `score_update`.
* `show_leaderboard` - Broadcast by Host when all rounds are complete. Transitions UI to the final podium.

## 4. Data Schema (Relational Representation)

### Game_Rooms Table
* `id` (UUID, Primary Key)
* `host_id` (String)
* `status` (Enum: 'LOBBY', 'PLAYING', 'FINISHED')
* `current_round` (Integer)
* `created_at` (Timestamp)

### Players Table
* `id` (UUID, Primary Key)
* `room_id` (Foreign Key -> Game_Rooms)
* `name` (String)
* `score` (Integer, Default: 0)

### Puzzles Table
* `id` (UUID, Primary Key)
* `image_url` (String - S3/Cloudinary link)
* `answer` (String - Normalized to lowercase, stripped of special chars)
* `points_value` (Integer)

## 5. UI & UX Design System

To achieve the requested "minimal and aesthetic" look, the UI should strictly adhere to modern minimalist principles (e.g., Scandinavian or Swiss design).

* **Color Palette:** Monochromatic base with one vibrant accent color.
    * Background: `#FAFAFA` (Off-white/light gray)
    * Surface: `#FFFFFF` (Pure white for puzzle cards and inputs)
    * Text Primary: `#111827` (Dark slate)
    * Accent/Primary Action: `#000000` or `#4F46E5` (Indigo) for primary buttons.
* **Typography:** Use **Inter** or **SF Pro**. Heavy weights for headings (Bold/800), clean light weights for body text. Eliminate unnecessary borders; use negative space to separate elements.
* **Inputs & Forms:** * Text boxes should have zero borders, just a subtle `border-b-2` (bottom border) that highlights on focus.
    * Buttons should be flat, with pill shapes or slight rounded corners (`rounded-md`), incorporating a smooth hover transition.
* **Transitions:** Use Framer Motion or Tailwind's built-in transition utilities to softly fade in puzzle images and slide in leaderboard entries.

---
> **💡 Crucial Development Note for Vercel:** Avoid using `setInterval` or standard WebSockets directly inside your Next.js API routes, as Vercel serverless functions will timeout (usually after 10-50 seconds). By using a third-party real-time provider like **Pusher** or **Supabase**, your clients connect directly to their persistent WebSocket edge servers, bypassing Vercel's serverless timeout limitations while maintaining perfect real-time sync.
