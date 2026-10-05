---
name: patchwork-schema-and-gamification
description: Crucial schema definitions, column names, and gamification logic for the Patchwork app.
---

# Patchwork Schema & Gamification Rules

## 1. Gamification Logic
- **Awards Count:** When displaying the number of "Verified Awards" a user has earned, you MUST filter out level badges (`badge_type != 'level'`). Level badges (Explorer, Maker, Builder) are background progressions, not discrete awards.
- **Credential Viewer ID:** When linking a user to view a specific credential/certificate, always pass the `user_badges.id`, NEVER the `badges.id`. 
- **Modals:** Gamification modals (Achievement Unlocked, Keep Building) should be triggered via global contexts/services relying on Supabase realtime listeners or `localStorage/SharedPreferences` cooldowns (7 days).

## 2. Schema Gotchas (DO NOT USE OUTDATED NAMES)
- **`user_badges` table**: The timestamp column is `issued_at` (do not use `awarded_at`).
- **`users` table**: The user's name column is `name` (do not use `display_name` or `full_name`).
- **`badges` table**: The styling columns are `icon_name` and `color_theme` (do not use `badge_icon` or `badge_color`).
