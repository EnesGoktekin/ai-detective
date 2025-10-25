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
| `id` | UUID | Primary key |
| `title` | TEXT | Case title |
| `description` | TEXT | Case description |
| `difficulty_level` | TEXT | Difficulty indicator |
| `initial_prompt_data` | JSONB | **Full system prompt/initial scene for the AI** |
| `suspects_list` | JSONB | **Simple list of suspect names for frontend UI** |
| `created_at` | TIMESTAMP | Creation timestamp |

**Key Points:**
- `initial_prompt_data` contains the complete AI system prompt and scene description
- `suspects_list` provides quick access to suspect names for UI rendering

---

### 2. `suspects`
**Purpose:** Suspect profiles and the solution key

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key → `cases.id` |
| `name` | TEXT | Suspect name |
| `description` | TEXT | Brief description |
| `backstory` | TEXT | **Detailed info for AI knowledge** |
| `is_guilty` | BOOLEAN | **Truth-Blind flag (TRUE if killer)** |
| `created_at` | TIMESTAMP | Creation timestamp |

**Key Points:**
- `backstory` provides rich context for AI interactions
- `is_guilty` is the truth flag for accusation validation

---

### 3. `scene_objects`
**Purpose:** Defines physical, interactive locations/objects in the crime scene

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key → `cases.id` |
| `name` | TEXT | Object/location name |
| `main_location` | TEXT | Primary location identifier |
| `initial_description` | TEXT | **Used by AI to describe before search** |
| `created_at` | TIMESTAMP | Creation timestamp |

**Key Points:**
- Used for interactive scene exploration
- `initial_description` helps AI describe objects before player searches them

---

### 4. `evidence_lookup`
**Purpose:** Defines all potential clues (crucial for game progression)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key → `cases.id` |
| `object_id` | UUID | Foreign key → `scene_objects.id` **(Links evidence to specific object)** |
| `name` | TEXT | Evidence name |
| `description` | TEXT | Evidence description |
| `unlock_keywords` | TEXT[] | **Secondary keywords for AI to confirm discovery** |
| `is_required_for_accusation` | BOOLEAN | **If TRUE, must be unlocked to enable accusation button** |
| `category` | TEXT | Evidence category |
| `order_index` | INTEGER | Display order |
| `created_at` | TIMESTAMP | Creation timestamp |

**Key Points:**
- `object_id` links evidence to the scene object that contains it
- `unlock_keywords` used for AI-based discovery detection
- `is_required_for_accusation` determines if evidence is mandatory for winning
- Backend compares unlocked count against required count for accusation logic

---

## 🎮 II. Dynamic / Session Tables (Game State)

These tables manage the state of a specific user's playthrough (Save/Resume functionality).

### 5. `games`
**Purpose:** Session Hub - Tracks overall game progress and AI context state

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key → `cases.id` **(Which case is being played)** |
| `session_token` | TEXT | Unique session identifier |
| `current_summary` | TEXT | **AI Context: Stores single, most recent summary (overwrites last one)** |
| `message_count` | INTEGER | **Used to trigger Summarizing AI every 5 user messages** |
| `is_completed` | BOOLEAN | Game completion status |
| `accused_suspect_id` | UUID | Foreign key → `suspects.id` (nullable) |
| `created_at` | TIMESTAMP | Session creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Key Points:**
- `current_summary` is overwritten each time (not accumulated)
- `message_count` triggers AI summarization every 5 user messages
- `session_token` used for session identification (indexed)

**Indexes:**
- Unique index on `session_token`

---

### 6. `messages`
**Purpose:** Full, ordered chat history

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `game_id` | UUID | Foreign key → `games.id` |
| `sequence_number` | INTEGER | **MANDATORY for ordering and retrieving last 5 messages** |
| `sender` | TEXT | 'user' or 'ai' |
| `content` | TEXT | Message content |
| `created_at` | TIMESTAMP | Message timestamp |

**Key Points:**
- `sequence_number` is essential for AI context injection (last 5 messages)
- Messages must be ordered for proper conversation flow

**Indexes:**
- Composite index on `(game_id, sequence_number)`

---

### 7. `evidence_unlocked`
**Purpose:** Tracks player discovery status

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `game_id` | UUID | Foreign key → `games.id` |
| `evidence_id` | UUID | Foreign key → `evidence_lookup.id` |
| `unlocked_at` | TIMESTAMP | Discovery timestamp |

**Key Points:**
- **Accusation Check:** Backend compares count of records here against required evidence count in `evidence_lookup`
- Prevents duplicate unlocks with compound unique constraint

**Constraints:**
- Unique constraint on `(game_id, evidence_id)`

---

## 🔗 Relationships

```
Static Tables:
cases (1) ──→ (N) suspects
cases (1) ──→ (N) scene_objects
cases (1) ──→ (N) evidence_lookup
scene_objects (1) ──→ (N) evidence_lookup

Dynamic Tables:
cases (1) ──→ (N) games
games (1) ──→ (N) messages
games (1) ──→ (N) evidence_unlocked
suspects (1) ──→ (N) games (via accused_suspect_id)
evidence_lookup (1) ──→ (N) evidence_unlocked
```

---

## 🧠 AI Context Management

The AI receives context from:
1. **Initial Prompt:** `cases.initial_prompt_data`
2. **Current Summary:** `games.current_summary` (single, most recent)
3. **Recent Messages:** Last 5 from `messages` (ordered by `sequence_number`)
4. **Case Data:** Suspects, scene objects, evidence from static tables

---

## 🎯 Game Logic Implementation

### Evidence Unlocking
1. User sends message to AI
2. Backend checks message against `unlock_keywords` in `evidence_lookup`
3. If match found, insert record into `evidence_unlocked`
4. Return newly unlocked evidence to frontend

### Accusation Validation
1. Check if all required evidence unlocked:
   ```sql
   COUNT(*) FROM evidence_unlocked 
   WHERE game_id = ? 
   AND evidence_id IN (
     SELECT id FROM evidence_lookup 
     WHERE case_id = ? 
     AND is_required_for_accusation = TRUE
   )
   ```
2. If count matches required count, enable accusation button
3. Validate accused suspect against `suspects.is_guilty`

### Summary Trigger
1. Increment `games.message_count` on each user message
2. When `message_count % 5 === 0`:
   - Fetch last 5 user + AI messages from `messages`
   - Fetch current `games.current_summary`
   - Send to Summarizing AI
   - **Overwrite** `games.current_summary` with new summary
   - Keep `message_count` (don't reset, just increment)

---

## 📝 Notes

- All UUIDs use PostgreSQL `gen_random_uuid()`
- Timestamps use `TIMESTAMPTZ` for timezone awareness
- JSONB fields allow flexible data structures
- TEXT[] arrays for keyword lists
- Foreign keys enforce referential integrity
- Indexes optimize common queries

---

**Schema Version:** 1.0  
**Last Updated:** October 25, 2025
