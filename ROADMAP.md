# Detective AI - Development Roadmap

**Project:** Detective AI - Chat-Based Detective Game  
**Approach:** Incremental, Test-Driven, Modular Development  
**Strategy:** One step at a time, test before proceeding

---

## 🏗️ Phase 1: Foundation & Setup

### Step 1.1: Initialize Frontend Project
- **Goal:** Create React + Vite + TypeScript project structure
- **Tasks:**
  - Initialize Vite project with React and TypeScript template
  - Install base dependencies (React Router, etc.)
  - Configure TypeScript settings
  - Set up folder structure (components, pages, types, utils, styles)
  - Create basic .env.example file
- **Test:** Run `npm run dev` and see default page
- **Deliverable:** Working frontend skeleton

### Step 1.2: Initialize Backend Project
- **Goal:** Create Node.js backend project structure
- **Tasks:**
  - Initialize Node.js project with TypeScript
  - Install base dependencies (Express, dotenv, cors)
  - Configure TypeScript for Node.js
  - Set up folder structure (routes, controllers, services, types, utils)
  - Create basic .env.example file
  - Set up basic Express server with test endpoint
- **Test:** Run server and hit test endpoint
- **Deliverable:** Working backend skeleton

### Step 1.3: Setup Supabase Project
- **Goal:** Initialize database and create basic connection
- **Tasks:**
  - Create Supabase project
  - Get connection credentials
  - Install Supabase client in backend
  - Create connection utility
  - Test database connection
- **Test:** Successfully connect to Supabase from backend
- **Deliverable:** Database connection established

### Step 1.4: Setup Gemini API Integration
- **Goal:** Establish basic AI connectivity
- **Tasks:**
  - Get Gemini API key
  - Install Gemini SDK
  - Create AI service utility
  - Test basic prompt/response
- **Test:** Send test prompt and receive response
- **Deliverable:** Working AI connection

---

## 🗄️ Phase 2: Database Schema & Core Data

**Note:** Database schema has been designed with separation of Static Case Data and Dynamic Game State.

### Step 2.1: Create Cases Table (Static)
- **Goal:** Store case metadata and AI initial context
- **Tasks:**
  - Create `cases` table with fields:
    - id (UUID, primary key)
    - title (text)
    - description (text)
    - difficulty_level (text)
    - initial_prompt_data (JSONB: Full system prompt/initial scene for AI)
    - suspects_list (JSONB: Simple list of suspect names for frontend UI)
    - created_at (timestamp)
  - Add sample data for testing
- **Test:** Query table and retrieve data
- **Deliverable:** Cases table with test data

### Step 2.2: Create Suspects Table (Static)
- **Goal:** Store suspect profiles with truth-blind flag
- **Tasks:**
  - Create `suspects` table with fields:
    - id (UUID, primary key)
    - case_id (UUID, foreign key)
    - name (text)
    - description (text)
    - backstory (TEXT: Detailed info for AI knowledge)
    - is_guilty (BOOL: Truth-blind flag, TRUE if killer)
  - Add sample suspects for test case
- **Test:** Query with case relationship
- **Deliverable:** Suspects table with test data

### Step 2.3: Create Scene Objects Table (Static)
- **Goal:** Define physical, interactive locations/objects in crime scene
- **Tasks:**
  - Create `scene_objects` table with fields:
    - id (UUID, primary key)
    - case_id (UUID, foreign key)
    - name (text)
    - main_location (text)
    - initial_description (TEXT: Used by AI to describe before search)
    - created_at (timestamp)
  - Add sample objects for test case
- **Test:** Query objects by case
- **Deliverable:** Scene objects table with test data

### Step 2.4: Create Evidence Lookup Table (Static)
- **Goal:** Define all potential clues for game progression
- **Tasks:**
  - Create `evidence_lookup` table with fields:
    - id (UUID, primary key)
    - case_id (UUID, foreign key)
    - object_id (UUID, foreign key: Links to scene_object)
    - name (text)
    - description (text)
    - unlock_keywords (TEXT[]: Secondary keywords for AI discovery)
    - is_required_for_accusation (BOOL: Must be unlocked to enable accusation)
    - category (text)
    - order_index (integer)
  - Add sample evidence for test case
- **Test:** Query evidence with keywords and required flag
- **Deliverable:** Evidence lookup table with test data

### Step 2.5: Create Games Table (Dynamic)
- **Goal:** Session hub tracking overall game progress and AI context
- **Tasks:**
  - Create `games` table with fields:
    - id (UUID, primary key)
    - case_id (UUID, foreign key)
    - session_token (text, unique)
    - current_summary (TEXT: AI Context, stores most recent summary)
    - message_count (INT: Triggers summarizing AI every 5 user messages)
    - is_completed (boolean)
    - accused_suspect_id (UUID, nullable)
    - created_at (timestamp)
    - updated_at (timestamp)
  - Create index on session_token
- **Test:** Insert and query session
- **Deliverable:** Games table

### Step 2.6: Create Messages Table (Dynamic)
- **Goal:** Store full, ordered chat history
- **Tasks:**
  - Create `messages` table with fields:
    - id (UUID, primary key)
    - game_id (UUID, foreign key)
    - sequence_number (INT: MANDATORY for ordering and last 5 retrieval)
    - sender (text: 'user' or 'ai')
    - content (text)
    - created_at (timestamp)
  - Create index on game_id and sequence_number
- **Test:** Insert and retrieve messages in order
- **Deliverable:** Messages table

### Step 2.7: Create Evidence Unlocked Table (Dynamic)
- **Goal:** Track player discovery status
- **Tasks:**
  - Create `evidence_unlocked` table with fields:
    - id (UUID, primary key)
    - game_id (UUID, foreign key)
    - evidence_id (UUID, foreign key: Links to evidence_lookup)
    - unlocked_at (timestamp)
  - Create compound unique constraint (game_id, evidence_id)
- **Test:** Insert and query unlocked evidence
- **Deliverable:** Evidence unlocked table

### Step 2.8: Add TypeScript Type Definitions
- **Goal:** Create TypeScript interfaces for all tables
- **Tasks:**
  - Create type definitions for all static tables
  - Create type definitions for all dynamic tables
  - Export types from central types file
- **Test:** Import and use types in backend code
- **Deliverable:** Complete TypeScript type definitions

---

## 📝 Phase 3: Game Content Creation

### Step 3.1: Design Case 1 - Story & Suspects
- **Goal:** Create complete first case narrative and characters
- **Tasks:**
  - Write case title and description
  - Create detailed case story/background
  - Design 3-5 suspects with:
    - Names
    - Detailed backstories (for AI knowledge)
    - Identify the guilty suspect (is_guilty flag)
  - Write initial AI system prompt and scene description
  - Create suspects_list JSONB for frontend UI
- **Test:** Review for logical consistency and narrative quality
- **Deliverable:** Case 1 narrative document (Markdown or JSON)

### Step 3.2: Design Case 1 - Crime Scene & Objects
- **Goal:** Define interactive crime scene environment
- **Tasks:**
  - Identify main locations in the crime scene
  - Create 5-10 scene objects (items, locations, areas)
  - For each object define:
    - Name and main_location
    - Initial description (what AI describes before investigation)
  - Map out how objects relate to the crime
- **Test:** Review scene for completeness and investigative potential
- **Deliverable:** Scene objects document for Case 1

### Step 3.3: Design Case 1 - Evidence System
- **Goal:** Create evidence items with discovery mechanics
- **Tasks:**
  - Design 5-8 evidence items
  - For each evidence define:
    - Display name and description
    - Link to scene_object (which object contains it)
    - Unlock keywords (array of trigger words/phrases)
    - Mark if required for accusation (is_required_for_accusation)
  - Ensure at least 3-4 evidence items are required for win
  - Define logical discovery progression
- **Test:** Review unlock keywords for variety and discoverability
- **Deliverable:** Evidence design document for Case 1

### Step 3.4: Insert Case 1 into Database
- **Goal:** Populate Supabase with complete Case 1 data
- **Tasks:**
  - Insert case record (with initial_prompt_data JSONB and suspects_list JSONB)
  - Insert all suspects (with backstory and is_guilty flag)
  - Insert all scene_objects
  - Insert all evidence_lookup records (with object_id links and unlock_keywords arrays)
  - Verify all foreign key relationships
- **Test:** Query all Case 1 data using Supabase SQL editor
- **Deliverable:** Case 1 fully loaded in database

### Step 3.5: Test Case 1 Data Retrieval
- **Goal:** Verify backend can access Case 1 data
- **Tasks:**
  - Create backend endpoint GET /api/cases/:case_id
  - Query and return case with all related data
  - Test JSONB field parsing (initial_prompt_data, suspects_list)
  - Test array field handling (unlock_keywords)
  - Verify foreign key joins work correctly
- **Test:** Successfully retrieve complete Case 1 via API
- **Deliverable:** Working case data endpoint

### Step 3.6: Design Cases 2-5 Content (Simplified for MVP)
- **Goal:** Create remaining cases at functional level
- **Tasks:**
  - For each case (2-5):
    - Write basic story outline
    - Create 3-4 suspects with backstories
    - Define 4-6 evidence items
    - Create 3-5 scene objects
    - Write basic initial prompt
  - Note: Can be enhanced post-MVP
- **Test:** Review each case for playability
- **Deliverable:** Cases 2-5 content documents

### Step 3.7: Insert Cases 2-5 into Database
- **Goal:** Populate database with all remaining cases
- **Tasks:**
  - Insert all case records (with JSONB fields)
  - Insert suspects for each case
  - Insert scene_objects for each case
  - Insert evidence_lookup for each case
  - Verify data integrity across all cases
- **Test:** Query all 5 cases successfully
- **Deliverable:** Complete game content in database

---

## 🤖 Phase 4: AI System Implementation

### Step 4.1: Create Chat AI Service
- **Goal:** Build main conversational AI
- **Tasks:**
  - Create ChatAI service class
  - Implement system prompt builder
  - Implement message formatting
  - Add context injection (case data, evidence, suspects)
  - Handle API errors gracefully
- **Test:** Send test conversation and get response
- **Deliverable:** Working Chat AI service

### Step 4.2: Create Summarizing AI Service
- **Goal:** Build conversation summarizer
- **Tasks:**
  - Create SummarizingAI service class
  - Implement summarization prompt
  - Handle summary generation
  - Add error handling
- **Test:** Summarize test conversation
- **Deliverable:** Working Summarizing AI service

### Step 4.3: Implement Evidence Detection Logic
- **Goal:** Auto-unlock evidence based on keywords
- **Tasks:**
  - Create evidence scanner utility
  - Implement keyword matching algorithm
  - Handle case-insensitive matching
  - Consider multi-language keywords
  - Return matched evidence IDs
- **Test:** Test with various messages
- **Deliverable:** Evidence detection utility

### Step 4.4: Create AI Context Manager
- **Goal:** Manage what context AI receives
- **Tasks:**
  - Implement last 5 messages retrieval
  - Implement summary retrieval
  - Combine context properly
  - Format for AI consumption
- **Test:** Verify correct context assembly
- **Deliverable:** Context manager utility

### Step 4.5: Implement Summary Trigger Logic
- **Goal:** Auto-summarize every 5 user messages
- **Tasks:**
  - Create message counter
  - Trigger summarization at threshold
  - Store summary in database
  - Reset counter
- **Test:** Simulate 5+ messages and verify summary
- **Deliverable:** Auto-summarization feature

---

## 🔌 Phase 5: Backend API Implementation

### Step 5.1: Create Session Management Endpoints
- **Goal:** Handle game session lifecycle
- **Tasks:**
  - POST /api/sessions/new - Create new session
  - GET /api/sessions/:token - Get session details
  - GET /api/sessions/:token/evidence - Get unlocked evidence
- **Test:** Create and retrieve session via API
- **Deliverable:** Session endpoints working

### Step 5.2: Create Chat Endpoint
- **Goal:** Main gameplay interaction endpoint
- **Tasks:**
  - POST /api/chat - Process user message
  - Validate message (alphabetic check, length check)
  - Store user message in database
  - Get AI context (last 5 messages + summary)
  - Call Chat AI
  - Check for evidence unlocks
  - Store AI response
  - Return response with new evidence
- **Test:** Send message and receive proper response
- **Deliverable:** Chat endpoint working

### Step 5.3: Create Evidence Endpoints
- **Goal:** Retrieve evidence information
- **Tasks:**
  - GET /api/cases/:caseId/evidence - Get all case evidence
  - POST /api/sessions/:token/evidence/unlock - Manual unlock (for testing)
- **Test:** Retrieve evidence via API
- **Deliverable:** Evidence endpoints working

### Step 5.4: Create Accusation Endpoint
- **Goal:** Handle player accusations
- **Tasks:**
  - POST /api/sessions/:token/accuse - Submit accusation
  - Verify all evidence unlocked
  - Check if accusation correct
  - Mark session complete
  - Return result
- **Test:** Make accusation and verify result
- **Deliverable:** Accusation endpoint working

### Step 5.5: Create Cases Endpoint
- **Goal:** Retrieve available cases
- **Tasks:**
  - GET /api/cases - List all cases
  - GET /api/cases/:id - Get specific case details
  - GET /api/cases/:id/suspects - Get case suspects
- **Test:** Retrieve cases list
- **Deliverable:** Cases endpoints working

### Step 5.6: Add Request Validation Middleware
- **Goal:** Validate all incoming requests
- **Tasks:**
  - Create validation middleware
  - Validate session tokens
  - Validate message content
  - Validate request bodies
  - Return proper error responses
- **Test:** Send invalid requests and verify errors
- **Deliverable:** Validation middleware

### Step 5.7: Add Error Handling Middleware
- **Goal:** Centralized error handling
- **Tasks:**
  - Create error handling middleware
  - Format error responses consistently
  - Log errors properly
  - Don't expose sensitive info
- **Test:** Trigger errors and verify handling
- **Deliverable:** Error handling middleware

---

## 🎨 Phase 6: Frontend UI Implementation

### Step 6.1: Create Design System & Theme
- **Goal:** Establish visual foundation
- **Tasks:**
  - Define color palette (dark theme + yellow/gold)
  - Create typography system
  - Define spacing and layout constants
  - Create base CSS/styled-components theme
  - Set up global styles
- **Test:** Apply theme and verify consistency
- **Deliverable:** Design system files

### Step 6.2: Create Reusable UI Components
- **Goal:** Build component library
- **Tasks:**
  - Button component (primary, secondary)
  - Input component
  - Card component
  - Modal component
  - Loading spinner
  - Typography components
- **Test:** Render each component in isolation
- **Deliverable:** UI component library

### Step 6.3: Create Main Menu Page
- **Goal:** Landing page for game
- **Tasks:**
  - Create MainMenu component
  - Add "New Game" button
  - Add "Resume Game" button (if session exists)
  - Add "How to Play" button
  - Apply dark theme styling
- **Test:** Navigate to page and verify UI
- **Deliverable:** Main Menu page

### Step 6.4: Create How to Play Modal
- **Goal:** Tutorial/instructions overlay
- **Tasks:**
  - Create HowToPlay modal component
  - Write clear instructions
  - Add close functionality
  - Style with theme
- **Test:** Open and close modal
- **Deliverable:** How to Play modal

### Step 6.5: Create Case Selection Page
- **Goal:** Display available cases
- **Tasks:**
  - Create CaseSelection component
  - Fetch cases from API
  - Display case cards with title, description, difficulty
  - Handle case selection
  - Add back button
- **Test:** Display cases and select one
- **Deliverable:** Case Selection page

### Step 6.6: Create Session Control Modal
- **Goal:** Resume or start new game
- **Tasks:**
  - Create SessionControl modal
  - Show "Resume" option if session exists
  - Show "New Game" option
  - Handle selection
  - Create or load session accordingly
- **Test:** Test both resume and new game paths
- **Deliverable:** Session control modal

### Step 6.7: Create Game Page Layout
- **Goal:** Main gameplay interface structure
- **Tasks:**
  - Create GamePage component
  - Layout: sidebar (evidence) + main (chat)
  - Add header with case title
  - Make responsive (mobile: stack vertically)
  - Add "Make Accusation" button (initially disabled)
  - Add "How to Play" button
- **Test:** Verify layout on desktop and mobile
- **Deliverable:** Game page layout

### Step 6.8: Create Chat Interface Component
- **Goal:** Conversation UI
- **Tasks:**
  - Create ChatInterface component
  - Display message history (user and detective)
  - Style messages differently by role
  - Auto-scroll to latest message
  - Show loading indicator when AI thinking
- **Test:** Display mock messages
- **Deliverable:** Chat display component

### Step 6.9: Create Chat Input Component
- **Goal:** Message sending interface
- **Tasks:**
  - Create ChatInput component
  - Add text input field
  - Add send button
  - Implement input validation:
    - No empty messages
    - Must contain alphabetic characters
    - Minimum 2 characters
  - Show validation errors
  - Disable input during cooldown (5 seconds)
  - Show cooldown timer
- **Test:** Try valid and invalid inputs
- **Deliverable:** Chat input component

### Step 6.10: Create Evidence Display Component
- **Goal:** Show discovered evidence
- **Tasks:**
  - Create EvidencePanel component
  - Display unlocked evidence items
  - Show "No evidence yet" when empty
  - Make each evidence item clickable for details
  - Style with theme (gold highlights)
  - Show evidence counter
- **Test:** Display mock evidence
- **Deliverable:** Evidence panel component

### Step 6.11: Create Evidence Detail Modal
- **Goal:** Show full evidence information
- **Tasks:**
  - Create EvidenceDetail modal
  - Display evidence name, description, category
  - Add close button
  - Style attractively
- **Test:** Click evidence and view details
- **Deliverable:** Evidence detail modal

### Step 6.12: Create Suspects Display Component
- **Goal:** Show available suspects
- **Tasks:**
  - Create SuspectsPanel component
  - Display all suspects for case
  - Show suspect names and brief info
  - Make clickable for details
- **Test:** Display mock suspects
- **Deliverable:** Suspects panel component

### Step 6.13: Create Suspect Detail Modal
- **Goal:** Show full suspect information
- **Tasks:**
  - Create SuspectDetail modal
  - Display suspect name, description, backstory
  - Add close button
  - Style with theme
- **Test:** Click suspect and view details
- **Deliverable:** Suspect detail modal

### Step 6.14: Create Accusation Window
- **Goal:** Make final accusation interface
- **Tasks:**
  - Create AccusationWindow modal
  - Display all suspects as options
  - Add confirmation step
  - Style dramatically (important decision)
  - Handle submission
- **Test:** Open window and select suspect
- **Deliverable:** Accusation modal

### Step 6.15: Create End Game Window
- **Goal:** Show game result
- **Tasks:**
  - Create EndGameWindow component
  - Show success or failure message
  - Display correct solution
  - Show case summary
  - Style based on outcome
- **Test:** Display both win and lose scenarios
- **Deliverable:** End game window

### Step 6.16: Create Exit Window
- **Goal:** Post-game options
- **Tasks:**
  - Create ExitWindow modal
  - Add "Play Again" button
  - Add "Return to Main Menu" button
  - Handle navigation
- **Test:** Test both navigation options
- **Deliverable:** Exit window

---

## 🔗 Phase 7: Frontend-Backend Integration ✅ COMPLETE

**Status:** ✅ Complete (January 25, 2025)

All integration steps completed successfully during Phase 6 development.

### Step 7.1: Setup API Client ✅
- Centralized backend communication in `frontend/src/services/api.ts`
- Base URL configured with environment variable support
- Error handling and TypeScript types

### Step 7.2: Integrate Case Selection ✅
- Real cases loaded from backend GET /api/cases
- Loading and error states implemented
- CaseSelectionPage fully functional

### Step 7.3: Integrate Session Management ✅
- Session creation via POST /api/game/start
- localStorage persistence for session tokens
- Resume functionality in SessionControl component

### Step 7.4: Integrate Chat Functionality ✅
- Real-time chat via POST /api/chat
- AI response handling with Detective X persona
- Evidence unlock detection and updates
- 5-second cooldown implemented

### Step 7.5: Integrate Evidence System ✅
- Evidence fetching via GET /api/evidence/:gameId
- Dynamic unlock through conversation keywords
- EvidencePanel component with unlock notifications

### Step 7.6: Integrate Suspects Display ✅
- Suspects loaded from backend
- SuspectsList component with details view
- Integrated into GamePage sidebar

### Step 7.7: Integrate Accusation System ✅
- Accusation submission via POST /api/accusation
- Win/lose validation from backend
- AccusationPage with result display

### Step 7.8: Implement State Persistence ✅
- Full state save/resume via localStorage
- Chat history, evidence, and game progress synced
- Seamless session continuity

---

## 🎮 Phase 8: Game Logic & Polish ✅ COMPLETE

**Status:** ✅ Complete (January 26, 2025)

All 7 polish steps completed - game is production-ready!

### Step 8.1: Complete Game Flow ✅
- End-to-end playthrough: MainMenu → CaseSelection → SessionControl → GamePage → AccusationPage
- All navigation working smoothly
- Proper state transitions throughout

### Step 8.2: Loading States ✅
- Loading component used consistently across all pages
- "AI is thinking..." feedback during chat
- Skeleton screens and spinners where appropriate

### Step 8.3: Error Boundaries ✅
- **ErrorBoundary component** created (class-based error catching)
- Entire app wrapped for global error handling
- Friendly error UI with Try Again / Reload / Go Home options
- Development mode shows error details

### Step 8.4: Input Cooldown ✅
- 5-second cooldown timer in ChatInput
- Visual countdown feedback
- Prevents spam and manages API costs

### Step 8.5: Confirmation Dialogs ✅
- **ConfirmationModal component** created (reusable)
- Exit Game confirmation in GamePage
- Final Accusation confirmation in AccusationPage
- Keyboard navigation (Enter/ESC support)

### Step 8.6: AI Prompt Optimization ✅
- **JSON-based system instruction format** implemented
- DETECTIVE_SYSTEM_INSTRUCTION structure with:
  - LANGUAGE_HANDLING_RULE (auto-detect and match user's language)
  - CORE_IDENTITY_RULE (human detective, not AI)
  - GUARDRAIL_1 (hijack & OOC prevention)
  - GUARDRAIL_2 (moral/legal limits)
  - KNOWLEDGE_BOUNDARY (secret vault architecture)
  - STUCK_LOOP_RULE (proactive assistance)
  - EVIDENCE_OUTPUT_RULE & HIDDEN_ACTION_RULE
- Better structured, maintainable prompt system
- Snyk scan: 0 security issues

### Step 8.7: Summary Generation Optimization ✅
- **JSON-based summarization prompt** with smart focus areas
- Language matching (Turkish/English/multilingual)
- Professional detective case notes style
- Incremental summaries (builds on previous, avoids repetition)
- 4-6 sentence structured paragraphs
- Focus on investigation actions, evidence, suspects, theories
- Snyk scan: 0 security issues

---

## 📱 Phase 9: Responsive Design & Accessibility

**Status:** 🚧 In Progress (Starting January 26, 2025)
## 📱 Phase 9: Responsive Design & Accessibility

**Status:** 🚧 In Progress (Starting January 26, 2025)

### Step 9.1: Mobile Layout Refinement
- **Goal:** Perfect mobile experience
- **Tasks:**
  - Test all pages on mobile viewport (320px - 640px)
  - Adjust spacing and typography for small screens
  - Ensure touch targets are large enough (min 44px)
  - Test landscape and portrait modes
  - Optimize chat interface for mobile
  - Test virtual keyboard interactions
- **Test:** Full playthrough on mobile device
- **Deliverable:** Mobile-optimized UI

### Step 9.2: Tablet Layout Refinement
- **Goal:** Optimize for tablet sizes
- **Tasks:**
  - Test on tablet viewports (768px - 1024px)
  - Adjust layouts for medium screens
  - Utilize available space effectively
  - Ensure comfortable gameplay experience
  - Test both orientations
- **Test:** Playthrough on tablet size
- **Deliverable:** Tablet-optimized UI

### Step 9.3: Desktop Layout Refinement
- **Goal:** Best desktop experience
- **Tasks:**
  - Utilize large screen space effectively (1280px+)
  - Ensure readability at large sizes
  - Test on various desktop resolutions (1920x1080, 2560x1440, etc.)
  - Optimize sidebar layouts and spacing
  - Maximum width constraints for readability
- **Test:** Playthrough on desktop (multiple resolutions)
- **Deliverable:** Desktop-optimized UI

### Step 9.4: Add Keyboard Navigation
- **Goal:** Full keyboard accessibility
- **Tasks:**
  - Ensure tab navigation works throughout app
  - Add keyboard shortcuts:
    - Enter to send chat message
    - ESC to close modals
    - Tab through suspects/evidence
  - Test and fix focus states (visible focus indicators)
  - Add skip links for screen readers
  - Ensure logical tab order
- **Test:** Navigate entire app using only keyboard
- **Deliverable:** Keyboard-accessible UI
- **Test:** Navigate using only keyboard
- **Deliverable:** Keyboard navigation

### Step 9.5: ARIA Labels and Screen Reader Support
- **Goal:** Accessibility for visually impaired users
- **Tasks:**
  - Add ARIA labels to all interactive elements
  - Add ARIA live regions for chat updates
  - Add ARIA descriptions for evidence/suspects
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - Ensure proper heading hierarchy (h1, h2, h3)
  - Add alt text for any images/icons
- **Test:** Navigate with screen reader
- **Deliverable:** Screen reader accessible UI

### Step 9.6: Touch Gesture Support
- **Goal:** Better mobile interaction
- **Tasks:**
  - Optimize touch targets (minimum 44x44px)
  - Add swipe gestures where appropriate
  - Test touch scrolling in all containers
  - Ensure no hover-only interactions
  - Add haptic feedback where appropriate
- **Test:** Use on actual touch devices
- **Deliverable:** Touch-optimized UI

### Step 9.7: Responsive Testing & Fixes
- **Goal:** Perfect responsive behavior
- **Tasks:**
  - Test all breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
  - Fix any layout issues at breakpoints
  - Test text wrapping and overflow
  - Ensure modals work on all screen sizes
  - Test chat interface responsiveness
  - Fix any visual bugs
- **Test:** Resize browser through all breakpoints
- **Deliverable:** Fully responsive UI

---

## 🧪 Phase 10: Testing & Quality Assurance

**Status:** 🔜 Not Started

### Step 10.1: Manual Testing - Game Flow
- **Goal:** Verify all user paths
- **Tasks:**
  - Test complete game with each case
  - Test save/resume functionality
  - Test all UI interactions
  - Document any issues found
- **Test:** Complete testing checklist
- **Deliverable:** Test results document

### Step 10.2: Manual Testing - Edge Cases
- **Goal:** Test unusual scenarios
- **Tasks:**
  - Test with very long messages
  - Test with special characters
  - Test with multiple browser tabs
  - Test session expiration
  - Test network failures
- **Test:** Document all edge case results
- **Deliverable:** Edge case test results

### Step 10.3: Manual Testing - AI Responses
- **Goal:** Validate AI quality
- **Tasks:**
  - Test AI staying in character
  - Test evidence unlock reliability
  - Test multilingual conversations
  - Test AI handling off-topic questions
- **Test:** Document AI behavior
- **Deliverable:** AI quality report

### Step 10.4: Performance Testing
- **Goal:** Ensure good performance
- **Tasks:**
  - Test page load times
  - Test API response times
  - Test with slow network
  - Check bundle sizes
  - Identify bottlenecks
- **Test:** Performance metrics document
- **Deliverable:** Performance report

### Step 10.5: Browser Compatibility Testing
- **Goal:** Work across browsers
- **Tasks:**
  - Test on Chrome
  - Test on Firefox
  - Test on Safari
  - Test on Edge
  - Fix compatibility issues
- **Test:** Works on all major browsers
- **Deliverable:** Compatibility report

### Step 10.6: Security Review
- **Goal:** Identify security issues
- **Tasks:**
  - Review API endpoints for vulnerabilities
  - Check for exposed secrets
  - Validate input sanitization
  - Review database security (RLS)
  - Check XSS vulnerabilities
- **Test:** Security checklist completed
- **Deliverable:** Security audit report

---

## 🚀 Phase 11: Deployment & Launch

### Step 11.1: Environment Configuration
- **Goal:** Prepare for deployment
- **Tasks:**
  - Set up production environment variables
  - Configure Vercel project
  - Link GitHub repository
  - Set up environment secrets
- **Test:** Verify all configs
- **Deliverable:** Production configs ready

### Step 11.2: Database Migration to Production
- **Goal:** Production database ready
- **Tasks:**
  - Create production Supabase instance
  - Run migrations on production
  - Insert all case data
  - Configure RLS policies
  - Backup database
- **Test:** Query production database
- **Deliverable:** Production database ready

### Step 11.3: Deploy Backend to Vercel
- **Goal:** Backend live in production
- **Tasks:**
  - Configure Vercel for API routes
  - Deploy backend
  - Test API endpoints in production
  - Configure CORS properly
- **Test:** Hit production API endpoints
- **Deliverable:** Backend deployed

### Step 11.4: Deploy Frontend to Vercel
- **Goal:** Frontend live in production
- **Tasks:**
  - Build production frontend
  - Deploy to Vercel
  - Configure domain (if custom)
  - Test deployment
- **Test:** Access production site
- **Deliverable:** Frontend deployed

### Step 11.5: End-to-End Production Testing
- **Goal:** Verify production works
- **Tasks:**
  - Complete full playthrough in production
  - Test all features in production
  - Test from different devices/networks
  - Fix any production-specific issues
- **Test:** Full production playthrough
- **Deliverable:** Production validated

### Step 11.6: Setup Monitoring & Logging
- **Goal:** Track production health
- **Tasks:**
  - Set up error tracking (e.g., Sentry)
  - Set up analytics (optional for MVP)
  - Configure log retention
  - Set up alerts for critical errors
- **Test:** Trigger test error and verify logging
- **Deliverable:** Monitoring active

### Step 11.7: Create Documentation
- **Goal:** Document for future maintenance
- **Tasks:**
  - Write deployment guide
  - Document API endpoints
  - Document database schema
  - Write troubleshooting guide
  - Create README for developers
- **Test:** Review documentation completeness
- **Deliverable:** Complete documentation

### Step 11.8: Launch Preparation
- **Goal:** Final pre-launch checks
- **Tasks:**
  - Final security review
  - Final performance check
  - Prepare rollback plan
  - Create launch checklist
  - Backup everything
- **Test:** Review all launch criteria
- **Deliverable:** Launch-ready

### Step 11.9: MVP Launch 🎉
- **Goal:** Go live!
- **Tasks:**
  - Announce launch
  - Monitor for issues
  - Be ready to respond to bugs
  - Collect user feedback
- **Test:** Real user testing
- **Deliverable:** Live MVP

---

## 📈 Phase 12: Post-Launch & Iteration

### Step 12.1: Monitor Early Usage
- **Goal:** Catch critical issues early
- **Tasks:**
  - Watch error logs
  - Monitor API performance
  - Check database performance
  - Gather user feedback
- **Test:** Daily monitoring
- **Deliverable:** Monitoring reports

### Step 12.2: Fix Critical Bugs
- **Goal:** Address urgent issues
- **Tasks:**
  - Prioritize reported bugs
  - Fix critical bugs first
  - Deploy hotfixes as needed
  - Test thoroughly
- **Test:** Verify bug fixes
- **Deliverable:** Stable application

### Step 12.3: Optimize Based on Data
- **Goal:** Improve performance
- **Tasks:**
  - Analyze performance metrics
  - Identify slow queries
  - Optimize hot paths
  - Reduce bundle sizes if needed
- **Test:** Measure improvements
- **Deliverable:** Optimized application

### Step 12.4: Gather User Feedback
- **Goal:** Understand user experience
- **Tasks:**
  - Create feedback mechanism
  - Analyze user behavior
  - Identify pain points
  - Plan improvements
- **Test:** Review feedback
- **Deliverable:** Improvement backlog

---

## 🔮 Phase 13: Future Enhancements (Post-MVP)

### Future Step: Implement Truth-Blind AI
- Separate truth data from AI access
- Build closed system architecture
- Redesign prompts for limited knowledge

### Future Step: Add Edge Functions
- Migrate to Supabase Edge Functions
- Improve performance and scalability

### Future Step: User Login System
- Add authentication
- Track user progress across sessions
- Add leaderboards, achievements

### Future Step: Additional Cases
- Expand case library beyond initial 5
- Add varying difficulty levels

### Future Step: Enhanced UI Features
- Animations and transitions
- Sound effects
- Dark/light theme toggle

### Future Step: Multiplayer
- Cooperative case-solving
- Competitive modes

---

## 📋 Development Guidelines

### Workflow for Each Step:
1. **Read & Understand:** Review all relevant code and context
2. **Ask Questions:** Clarify any uncertainties before coding
3. **Implement:** Write code with explanatory comments
4. **Self-Review:** Check your own work
5. **Present:** Show code to user
6. **Wait:** User tests locally
7. **Commit:** After successful test, commit and push to GitHub
8. **Move On:** Proceed to next step only after approval

### Code Standards:
- Use TypeScript strictly (no `any` types without justification)
- Write descriptive comments for each code block
- Follow modular, testable architecture
- Keep functions small and single-purpose
- Use meaningful variable and function names
- Handle errors gracefully
- Validate all inputs
- No hardcoded values (use environment variables)

### Testing Standards:
- Each step must have clear test criteria
- Test happy path and error cases
- Test on target environment (browser/Node.js)
- Document test results
- Don't proceed if tests fail

---

## 📊 Progress Tracking

**Total Steps:** ~140+  
**Current Step:** Not started  
**Completion:** 0%

**Phases:**
- ☐ Phase 1: Foundation & Setup (4 steps)
- ☐ Phase 2: Database Schema (8 steps)
- ☐ Phase 3: Game Content (4 steps)
- ☐ Phase 4: AI Implementation (5 steps)
- ☐ Phase 5: Backend API (7 steps)
- ☐ Phase 6: Frontend UI (16 steps)
- ☐ Phase 7: Integration (8 steps)
- ☐ Phase 8: Game Logic & Polish (7 steps)
- ☐ Phase 9: Responsive Design (5 steps)
- ☐ Phase 10: Testing (6 steps)
- ☐ Phase 11: Deployment (9 steps)
- ☐ Phase 12: Post-Launch (4 steps)
- ☐ Phase 13: Future Enhancements (TBD)

---

**Ready to begin Step 1.1!** 🚀
