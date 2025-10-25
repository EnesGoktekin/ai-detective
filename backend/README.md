# Detective AI - Backend API

Node.js + Express v5 + TypeScript backend for Detective AI game.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

## 📡 API Endpoints

### Health & Testing
- `GET /api/health` - Server health check
- `GET /api/database/test` - Database connection test
- `GET /api/ai/test` - Gemini AI connection test
- `POST /api/ai/prompt` - Test AI prompt generation

### Cases
- `GET /api/cases` - List all available cases
- `GET /api/cases/ping` - Cases router health check
- `GET /api/cases/:case_id` - Get complete case data (suspects, evidence, scene objects)
- `GET /api/cases/:case_id/test` - Validate case data integrity

### Game Sessions
- `POST /api/games/start` - Start a new game session
- `GET /api/games/:game_id` - Get game details (messages, evidence, status)
- `DELETE /api/games/:game_id` - End game session (mark as completed)

### Chat (Main Gameplay)
- `POST /api/chat/:game_id/chat` - Send message and get AI response
  - Request: `{ "message": "Your question" }`
  - Response: `{ "success": true, "ai_response": "...", "new_evidence_unlocked": [...], "message_count": N, "summary_triggered": bool }`
  - Features:
    - Input validation (min 2 chars, alphabetic required)
    - Automatic evidence detection and unlocking
    - AI context management (summary + last 10 messages)
    - Message count tracking
    - Summarization trigger (every 5 messages)

### Evidence
- `GET /api/evidence/case/:case_id` - Get all evidence for a case
- `GET /api/evidence/game/:game_id/unlocked` - Get unlocked evidence for game
- `POST /api/evidence/game/:game_id/unlock` - Manually unlock evidence (testing)
- `GET /api/evidence/game/:game_id/stats` - Get evidence collection stats
  - Total evidence, unlocked count, progress percentage
  - Required evidence tracking
  - Accusation readiness check

### Accusation
- `POST /api/accusation/:game_id` - Make accusation against suspect
  - Validates required evidence unlocked
  - Checks if accused suspect is guilty
  - Marks game as completed
  - Returns win/loss result with details

## 🧪 Testing

```bash
# Run API tests
python test_api.py

# Test game session management
python test_game_api.py

# Test AI system components
python test_ai_system.py

# Test chat endpoint (full gameplay flow)
python test_chat_endpoint.py

# Test evidence endpoints
python test_evidence_endpoints.py

# Test accusation endpoint (win/loss scenarios)
python test_accusation_endpoint.py

# Test middleware (validation & error handling)
python test_middleware.py
```

**Test Results:**
- ✅ All endpoints functional
- ✅ Database queries working
- ✅ Case data retrieval successful
- ✅ Game session management working
- ✅ Chat AI integration successful
- ✅ Evidence detection and unlocking working
- ✅ Evidence management endpoints working
- ✅ Message storage and retrieval working
- ✅ Progress tracking and stats calculation working
- ✅ Accusation logic (correct/incorrect) working
- ✅ Game completion state management working
- ✅ Request validation middleware working
- ✅ Error handling middleware working
- ✅ XSS protection (sanitization) working
- ✅ 404 handler working
- ✅ Security validated

## 🗄️ Database

- **Provider:** Supabase (PostgreSQL)
- **Tables:** 7 tables (cases, suspects, scene_objects, evidence_lookup, games, messages, evidence_unlocked)
- **Schema:** See `DATABASE_SCHEMA.md` in project root

## 🛠️ Tech Stack

- **Runtime:** Node.js v24.2.0
- **Framework:** Express v5.1.0
- **Language:** TypeScript
- **Dev Tools:** ts-node, nodemon
- **Database Client:** @supabase/supabase-js
- **AI:** Google Generative AI (Gemini 2.5 Flash)

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts              # Main server file
│   ├── controllers/           # Route controllers
│   ├── routes/
│   │   └── cases.routes.ts   # Cases API routes
│   ├── services/
│   │   └── gemini.service.ts # AI service
│   ├── types/
│   │   └── database.types.ts # TypeScript database types
│   └── utils/
│       └── database.ts        # Supabase client
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

## 🔐 Environment Variables

Required in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

## 📊 Current Status

**Phase 3: Backend API ✅ COMPLETE**
- All core routes implemented
- Database integration working
- AI service connected
- Security validated (Snyk)

**Next Phase:** Game session management & chat endpoints
