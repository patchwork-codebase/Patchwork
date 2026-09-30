# Chat Inbox & Direct Messaging Scope

Based on your feedback, burying the chat inside the Room screen adds too much friction. Instead, we should elevate Chat to a global "Inbox" level.

## 1. Global Navigation (The Inbox)
- **New Nav Tab:** Add a **"Messages"** (or Inbox) tab to the main bottom navigation bar in `home_screen.dart`.
- **Accessibility:** Available to both Builders and Observers.
- **Inbox UI:** Displays a list of all your active conversations. Each conversation corresponds to a **Room** you are a part of (e.g., rooms created from Bounty Matches).
- **Preview:** Each list item will show the Room Name, the Avatar of the other person, the latest message snippet, and a timestamp.

## 2. The Chat Thread Screen
- **Dedicated UI:** When you tap a conversation in the Inbox, it opens a dedicated `chat_thread_screen.dart`.
- **Header:** The App Bar will display the Room Name (e.g., *"Bounty: who is building!?"*).
- **Messaging UX:** Traditional chat bubbles (yours on the right, theirs on the left).
- **Real-time:** Powered by Supabase Realtime so messages appear instantly without pulling to refresh.

## 3. Database & Security (Supabase)
- **New Table:** `room_messages`
  - `id` (UUID, Primary Key)
  - `room_id` (UUID) - Links the chat to the specific bounty/project room.
  - `sender_id` (UUID) - The user sending the message.
  - `content` (TEXT) - The message text.
  - `created_at` (Timestamp)
- **RLS Security:** Only users who are officially part of the room (the Builder or the approved Observers/Co-founders) can read or insert messages in that thread.

## 4. Implementation Steps
1. **SQL Migration:** Create the `room_messages` table and setup Row Level Security (RLS) policies.
2. **Mobile UI - Inbox:** Create `messages_screen.dart` and add it to the global bottom nav bar.
3. **Mobile UI - Chat:** Create `chat_thread_screen.dart` with real-time listeners.
4. **Integration:** Ensure the "Say Hello" or "Go to Chat" button from the Bounty Match screen deep-links directly into this new chat thread.

---
*Does this align with your vision for how Observers and Builders should communicate?*
