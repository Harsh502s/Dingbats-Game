# Rigorous Testing Plan - Dingbats Multiplayer V2

This document outlines the rigorous testing steps required to ensure the Dingbats Multiplayer application is production-ready and all V2 features are functioning correctly.

## 1. Room Lifecycle & Management
- [ ] **Create Room**: Host can create a room and is redirected to `/room/[roomId]/host`.
- [ ] **Share Link**: Copy link button works and contains the correct `/room/[roomId]/join` URL.
- [ ] **Player Join**: Multiple players can join. Host sees them in the lobby list in real-time.
- [ ] **Player Kick**: Host can kick a player. Kicked player is redirected to a "Removed" screen.
- [ ] **Player Rejoin**: Kicked player can rejoin and appears back in the list.

## 2. Puzzle Library & Packs (V2 Core)
- [ ] **Custom Upload**: Host can upload 10+ images with answers. Thumbnails show correctly.
- [ ] **Create Pack**: 
    - [ ] Create a pack named "Test Pack 1".
    - [ ] Upload 3 images with answers.
    - [ ] Verify they are saved to the library.
- [ ] **Select Pack**: Switch between "Custom", "Library", and "Create" tabs without losing selection.
- [ ] **Delete Pack**: 
    - [ ] Delete "Test Pack 1".
    - [ ] Verify it disappears from the grid.
    - [ ] Verify NO foreign key constraint errors even if the pack was used in a previous game.
- [ ] **Content Hashing**: Upload the exact same image twice in the same pack. Verify it handles it without error (deduplication/upsert).

## 3. Real-time Game Interaction
- [ ] **Start Game**: Clicking "Start Game" with a Library Pack populates the game correctly.
- [ ] **Live Typing Feed**:
    - [ ] Player types in the input box.
    - [ ] Host sees the player's name and current text in the "Active Typing" section in real-time.
- [ ] **Guess Feedback**:
    - [ ] **Correct Guess**: Player gets points, toast appears, "Correct" syncs to host.
    - [ ] **Wrong Guess**: Player sees "❌ Not quite — try again!" toast. Input clears.
- [ ] **Typing Clear**: After a correct guess, the player's name disappears from the host's "Active Typing" section.

## 4. Timer & Controls
- [ ] **Pause/Resume**: 
    - [ ] Host clicks Pause. Timer stops for everyone. Ring turns amber.
    - [ ] Host clicks Resume. Timer continues.
- [ ] **Skip Round**: Host can skip to the next round. Current round guesses are cleared.
- [ ] **Timer Expiry**: When time runs out, the round ends automatically.

## 5. End Game & Branding
- [ ] **Leaderboard**: Final scores are shown accurately.
- [ ] **Branding**: All UI elements are Orange (`#E87722`). No purple/indigo remains.
- [ ] **The "Meoowwww" Message**: Verify the leaderboard title or final results are replaced with "Meoowwww 🐱".

---
## Execution Log
*Tests performed by Antigravity on 2026-05-16*
