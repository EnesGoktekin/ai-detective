# Detective AI - Database Schema

**Database:** Supabase (PostgreSQL)  
**Architecture:** Separation of Static Case Data and Dynamic Game State

---

## 📋 Overview

This database schema separates two types of data:
- **Static/Lookup Tables:** Define the world, suspects, and clues for each case
- **Dynamic/Session Tables:** Manage the state of a specific user's playthrough

---

## 🏛️ I. Static / Lookup Tables (Case Definition)

These tables define what the AI knows and what exists in each case.

### 1. `cases`
**Purpose:** Main case definitions and AI initial context

| Column | Type | Description |
|--------|------|-------------|
| `case_id` | UUID | Primary key (default: `uuid_generate_v4()`) |
| `title` | TEXT | Case title (NOT NULL) |
| `description` | TEXT | Case description (NOT NULL) |
| `initial_prompt_data` | JSONB | **Full system prompt/initial scene for the AI** (NOT NULL) |
| `suspects_list` | JSONB | **Simple list of suspect names for frontend UI** (NOT NULL) |
| `created_at` | TIMESTAMPTZ | Creation timestamp (default: `now()`) |

**Constraints:**
- Primary key: `cases_pkey` on `case_id`

**Key Points:**
- `initial_prompt_data` contains the complete AI system prompt and scene description
- `suspects_list` provides quick access to suspect names for UI rendering
- All core fields are required (NOT NULL)

---

### 2. `suspects`
**Purpose:** Suspect profiles and the solution key

| Column | Type | Description |
|--------|------|-------------|
| `suspect_id` | UUID | Primary key (default: `uuid_generate_v4()`) |
| `case_id` | UUID | Foreign key → `cases.case_id` (NOT NULL) |
| `name` | TEXT | Suspect name (NOT NULL) |
| `backstory` | TEXT | **Detailed info for AI knowledge** (NOT NULL) |
| `is_guilty` | BOOLEAN | **Truth-Blind flag (TRUE if killer)** (default: false) |
| `created_at` | TIMESTAMPTZ | Creation timestamp (default: `now()`) |

**Constraints:**
- Primary key: `suspects_pkey` on `suspect_id`
- Foreign key: `suspects_case_id_fkey` → `cases(case_id)` ON DELETE CASCADE
- Unique constraint: `unique_suspect_per_case` on `(case_id, name)`

**Key Points:**
- `backstory` provides rich context for AI interactions (no separate description field)
- `is_guilty` is the truth flag for accusation validation
- Unique constraint prevents duplicate suspect names within the same case
- Cascade delete when case is removed

---

### 3. `scene_objects`
**Purpose:** Defines physical, interactive locations/objects in the crime scene

| Column | Type | Description |
|--------|------|-------------|
| `object_id` | UUID | Primary key (default: `uuid_generate_v4()`) |
| `case_id` | UUID | Foreign key → `cases.case_id` (NOT NULL) |
| `name` | TEXT | Object/location name (NOT NULL) |
| `main_location` | TEXT | Primary location identifier (NOT NULL) |
| `initial_description` | TEXT | **Used by AI to describe before search** (NOT NULL) |
| `created_at` | TIMESTAMPTZ | Creation timestamp (default: `now()`) |

**Constraints:**
- Primary key: `scene_objects_pkey` on `object_id`
- Foreign key: `scene_objects_case_id_fkey` → `cases(case_id)` ON DELETE CASCADE
- Unique constraint: `unique_object_per_case` on `(case_id, name)`

**Key Points:**
- Used for interactive scene exploration
- `initial_description` helps AI describe objects before player searches them
- Unique constraint prevents duplicate object names within the same case
- Cascade delete when case is removed

---

### 4. `evidence_lookup`
**Purpose:** Defines all potential clues (crucial for game progression)

| Column | Type | Description |
|--------|------|-------------|
| `evidence_id` | UUID | Primary key (default: `uuid_generate_v4()`) |
| `case_id` | UUID | Foreign key → `cases.case_id` (NOT NULL) |
| `object_id` | UUID | Foreign key → `scene_objects.object_id` (NULLABLE) |
| `display_name` | TEXT | Evidence name (NOT NULL) |
| `description` | TEXT | Evidence description (NOT NULL) |
| `unlock_keywords` | TEXT[] | **Keywords for AI to confirm discovery** (NOT NULL) |
| `is_required_for_accusation` | BOOLEAN | **If TRUE, must be unlocked to enable accusation** (default: true) |
| `created_at` | TIMESTAMPTZ | Creation timestamp (default: `now()`) |

**Constraints:**
- Primary key: `evidence_lookup_pkey` on `evidence_id`
- Foreign key: `evidence_lookup_case_id_fkey` → `cases(case_id)` ON DELETE CASCADE
- Foreign key: `evidence_lookup_object_id_fkey` → `scene_objects(object_id)` ON DELETE RESTRICT
- Unique constraint: `unique_evidence_per_case` on `(case_id, display_name)`

**Indexes:**
- `idx_evidence_object_id` on `object_id` (btree)

**Key Points:**
- `object_id` is NULLABLE - evidence can exist without being tied to a specific object
- `object_id` uses RESTRICT delete (cannot delete object if evidence exists)
- `unlock_keywords` used for AI-based discovery detection
- `is_required_for_accusation` defaults to TRUE (most evidence is required)
- Backend compares unlocked count against required count for accusation logic
- Unique constraint prevents duplicate evidence names within the same case

---

## 🎮 II. Dynamic / Session Tables (Game State)

These tables manage the state of a specific user's playthrough (Save/Resume functionality).

### 5. `games`
**Purpose:** Session Hub - Tracks overall game progress and AI context state

| Column | Type | Description |
|--------|------|-------------|
| `game_id` | UUID | Primary key (default: `uuid_generate_v4()`) |
| `case_id` | UUID | Foreign key → `cases.case_id` **(Which case is being played)** (NOT NULL) |
| `current_summary` | TEXT | **AI Context: Stores single, most recent summary** (NULLABLE) |
| `message_count` | INTEGER | **Triggers Summarizing AI every 5 user messages** (default: 0) |
| `is_completed` | BOOLEAN | Game completion status (default: false) |
| `final_outcome` | JSONB | Final game result data (NULLABLE) |
| `created_at` | TIMESTAMPTZ | Session creation time (default: `now()`) |
| `last_updated` | TIMESTAMPTZ | Last update time (default: `now()`) |

**Constraints:**
- Primary key: `games_pkey` on `game_id`
- Foreign key: `games_case_id_fkey` → `cases(case_id)` ON DELETE RESTRICT

**Indexes:**
- `idx_games_last_updated` on `last_updated DESC` (btree)

**Key Points:**
- `current_summary` is overwritten each time (not accumulated), starts NULL
- `message_count` triggers AI summarization every 5 user messages, starts at 0
- `final_outcome` stores JSONB result data when game completes
- No `session_token` field - `game_id` is used directly
- RESTRICT delete prevents case deletion if active games exist
- Indexed on `last_updated` for efficient recent game queries

---

### 6. `messages`
**Purpose:** Full, ordered chat history

| Column | Type | Description |
|--------|------|-------------|
| `message_id` | UUID | Primary key (default: `uuid_generate_v4()`) |
| `game_id` | UUID | Foreign key → `games.game_id` (NOT NULL) |
| `sequence_number` | INTEGER | **MANDATORY for ordering and retrieving last 5 messages** (NOT NULL) |
| `sender` | TEXT | 'user' or 'ai' (NOT NULL, CHECK constraint) |
| `content` | TEXT | Message content (NOT NULL) |
| `created_at` | TIMESTAMPTZ | Message timestamp (default: `now()`) |

**Constraints:**
- Primary key: `messages_pkey` on `message_id`
- Foreign key: `messages_game_id_fkey` → `games(game_id)` ON DELETE CASCADE
- Unique constraint: `unique_sequence_per_game` on `(game_id, sequence_number)`
- Check constraint: `check_sender_role` ensures `sender IN ('user', 'ai')`

**Indexes:**
- `idx_messages_game_sequence` on `(game_id, sequence_number DESC)` (btree)

**Key Points:**
- `sequence_number` is essential for AI context injection (last 5 messages)
- Unique constraint prevents duplicate sequence numbers within a game
- Messages must be ordered for proper conversation flow
- Cascade delete when game is removed
- Descending index optimizes "get latest messages" queries

---

### 7. `evidence_unlocked`
**Purpose:** Tracks player discovery status

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (default: `uuid_generate_v4()`) |
| `game_id` | UUID | Foreign key → `games.game_id` (NOT NULL) |
| `evidence_id` | UUID | Foreign key → `evidence_lookup.evidence_id` (NOT NULL) |
| `unlocked_at` | TIMESTAMPTZ | Discovery timestamp (default: `now()`) |

**Constraints:**
- Primary key: `evidence_unlocked_pkey` on `id`
- Foreign key: `evidence_unlocked_game_id_fkey` → `games(game_id)` ON DELETE CASCADE
- Foreign key: `evidence_unlocked_evidence_id_fkey` → `evidence_lookup(evidence_id)` ON DELETE RESTRICT
- Unique constraint: `unique_evidence_unlock` on `(game_id, evidence_id)`

**Indexes:**
- `idx_unlocked_evidence_game_id` on `game_id` (btree)

**Key Points:**
- **Accusation Check:** Backend compares count of records here against required evidence count in `evidence_lookup`
- Prevents duplicate unlocks with unique constraint
- Cascade delete when game is removed
- RESTRICT delete prevents evidence deletion if it has been unlocked in any game

---

## 🔗 Relationships

```
Static Tables:
cases (1) ──→ (N) suspects [CASCADE]
cases (1) ──→ (N) scene_objects [CASCADE]
cases (1) ──→ (N) evidence_lookup [CASCADE]
scene_objects (1) ──→ (N) evidence_lookup [RESTRICT] (nullable)

Dynamic Tables:
cases (1) ──→ (N) games [RESTRICT]
games (1) ──→ (N) messages [CASCADE]
games (1) ──→ (N) evidence_unlocked [CASCADE]
evidence_lookup (1) ──→ (N) evidence_unlocked [RESTRICT]
```

**Delete Behavior:**
- **CASCADE:** Child records deleted automatically
- **RESTRICT:** Delete blocked if child records exist

---

## 🧠 AI Context Management

The AI receives context from:
1. **Initial Prompt:** `cases.initial_prompt_data` (JSONB)
2. **Current Summary:** `games.current_summary` (TEXT, single most recent, can be NULL)
3. **Recent Messages:** Last 5 from `messages` (ordered by `sequence_number DESC`)
4. **Case Data:** Suspects, scene objects, evidence from static tables

**Query Example for Last 5 Messages:**
```sql
SELECT content, sender 
FROM messages 
WHERE game_id = ?
ORDER BY sequence_number DESC
LIMIT 5
```

---

## 🎯 Game Logic Implementation

### Evidence Unlocking
1. User sends message to AI
2. Backend checks message content against `unlock_keywords` array in `evidence_lookup`
3. If match found, insert record into `evidence_unlocked` (unique constraint prevents duplicates)
4. Return newly unlocked evidence to frontend

### Accusation Validation
1. Check if all required evidence unlocked:
   ```sql
   SELECT COUNT(*) 
   FROM evidence_unlocked eu
   JOIN evidence_lookup el ON eu.evidence_id = el.evidence_id
   WHERE eu.game_id = ? 
   AND el.is_required_for_accusation = TRUE
   ```
2. Compare against total required count:
   ```sql
   SELECT COUNT(*) 
   FROM evidence_lookup 
   WHERE case_id = ? 
   AND is_required_for_accusation = TRUE
   ```
3. If counts match, enable accusation button
4. Validate accused suspect against `suspects.is_guilty`
5. Store result in `games.final_outcome` (JSONB)

### Summary Trigger
1. Increment `games.message_count` on each user message
2. When `message_count % 5 === 0`:
   - Fetch last 5 messages from `messages` (ORDER BY sequence_number DESC LIMIT 5)
   - Fetch current `games.current_summary` (can be NULL initially)
   - Send to Summarizing AI
   - **UPDATE** `games.current_summary` with new summary (overwrite)
   - Keep `message_count` (don't reset, just continue incrementing)
3. Update `games.last_updated` timestamp

---

## 📝 Implementation Notes

### UUIDs
- All primary keys use `extensions.uuid_generate_v4()`
- Requires `uuid-ossp` or `pgcrypto` extension

### Timestamps
- All timestamps use `TIMESTAMPTZ` for timezone awareness
- Default values use `now()` function

### Data Types
- **JSONB:** Used for `initial_prompt_data`, `suspects_list`, `final_outcome`
- **TEXT[]:** Used for `unlock_keywords` array
- **TEXT:** Used for all string fields (no VARCHAR)

### Constraints Strategy
- **CASCADE:** Used for "child owns parent" relationships (delete case → delete children)
- **RESTRICT:** Used for referential integrity (cannot delete if referenced)
- **UNIQUE:** Prevents duplicates within scope (case_id + name)
- **CHECK:** Validates enum values (sender role)

### Indexing Strategy
- Primary keys auto-indexed
- Foreign keys with high query frequency indexed
- Composite indexes for common queries (game_id + sequence_number)
- Descending indexes for "latest" queries

### Security Considerations
- Row Level Security (RLS) policies should be added for production
- Consider adding user authentication and session management
- Evidence unlock validation should prevent timing attacks

---

**Schema Version:** 1.0  
**Last Updated:** October 25, 2025  
**PostgreSQL Version:** 14+
