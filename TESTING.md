# Detective AI - Testing Checklist

**Phase 10: Testing & Quality Assurance**  
**Started:** October 25, 2025  
**Status:** In Progress

---

## 🎯 Phase 10.1: Manual Testing - Game Flow

### Test Environment
- ✅ Backend: http://localhost:3000 (Running)
- ✅ Frontend: http://localhost:5173 (Running)
- ✅ Database: Supabase connected
- ✅ AI: Gemini 2.0 Flash connected

### 1. Main Menu Tests
- [ ] **Load Main Menu**
  - [ ] Page loads without errors
  - [ ] Title displays correctly
  - [ ] Tagline displays correctly
  - [ ] All buttons visible and styled
  
- [ ] **New Game Button**
  - [ ] Navigates to case selection
  - [ ] No console errors
  
- [ ] **Resume Game Button**
  - [ ] Hidden when no saved game exists
  - [ ] Visible when saved game exists
  - [ ] Navigates to saved game correctly
  
- [ ] **How to Play Button**
  - [ ] Opens How to Play modal
  - [ ] Modal content displays correctly
  - [ ] Close button works
  - [ ] ESC key closes modal
  - [ ] Click outside closes modal

### 2. Case Selection Tests
- [ ] **Load Cases**
  - [ ] All cases display from database
  - [ ] Case cards show title and description
  - [ ] Difficulty level displays
  - [ ] Loading state shows while fetching
  
- [ ] **Select Case**
  - [ ] Clicking case card works
  - [ ] Navigates to session control
  - [ ] No console errors
  
- [ ] **Back Button**
  - [ ] Returns to main menu
  - [ ] No state corruption

### 3. Session Control Tests
- [ ] **No Existing Session**
  - [ ] Automatically creates new game
  - [ ] Navigates to game page
  - [ ] Game ID saved to localStorage
  
- [ ] **Existing Session**
  - [ ] Modal shows with options
  - [ ] Resume button loads existing game
  - [ ] New Game button creates new session
  - [ ] Back button returns to case selection
  
- [ ] **localStorage Management**
  - [ ] Game ID persists across page refresh
  - [ ] Correct game ID format (UUID)

### 4. Game Page Tests

#### 4.1 Layout & UI
- [ ] **Header**
  - [ ] Case title displays
  - [ ] How to Play button works
  - [ ] Make Accusation button visible
  - [ ] Exit Game button shows confirmation
  
- [ ] **Sidebar (Desktop)**
  - [ ] Suspects list displays
  - [ ] Evidence list displays
  - [ ] Progress bar shows correctly
  - [ ] Scrollable when content overflows
  
- [ ] **Mobile Evidence Button**
  - [ ] Visible on mobile (<768px)
  - [ ] Hidden on desktop
  - [ ] Opens MobileEvidenceSheet modal
  
- [ ] **Chat Interface**
  - [ ] Previous messages load
  - [ ] Messages display in correct order
  - [ ] Auto-scroll to latest message
  - [ ] User/AI messages styled differently

#### 4.2 Chat Functionality
- [ ] **Input Validation**
  - [ ] Empty messages rejected
  - [ ] Single character messages rejected
  - [ ] Non-alphabetic only messages rejected
  - [ ] Valid messages accepted
  
- [ ] **Message Sending**
  - [ ] User message appears immediately
  - [ ] Loading indicator shows
  - [ ] AI response appears after processing
  - [ ] Error handling for failed requests
  
- [ ] **Cooldown System**
  - [ ] 5-second cooldown after sending
  - [ ] Timer displays remaining time
  - [ ] Input disabled during cooldown
  - [ ] Cooldown completes and re-enables
  
- [ ] **AI Response Quality**
  - [ ] AI stays in character (Detective X)
  - [ ] Responses relevant to case
  - [ ] Language matching works (Turkish/English)
  - [ ] No inappropriate content

#### 4.3 Evidence System
- [ ] **Evidence Unlocking**
  - [ ] Evidence unlocks via keywords in chat
  - [ ] Progress bar updates
  - [ ] New evidence appears in list
  - [ ] Timestamp displays correctly
  
- [ ] **Evidence Details**
  - [ ] Click evidence opens modal
  - [ ] All details display (location, description, significance)
  - [ ] Modal closes properly
  
- [ ] **Progress Tracking**
  - [ ] Unlocked/Total count correct
  - [ ] Progress percentage accurate
  - [ ] "Ready to Accuse" shows when required evidence collected

#### 4.4 Suspects Display
- [ ] **Suspects List**
  - [ ] All suspects display
  - [ ] Names and descriptions visible
  - [ ] Cards styled correctly

### 5. Accusation Tests
- [ ] **Make Accusation Button**
  - [ ] Disabled when insufficient evidence
  - [ ] Enabled when required evidence collected
  - [ ] Navigates to accusation page
  
- [ ] **Accusation Page**
  - [ ] All suspects display as options
  - [ ] Radio selection works
  - [ ] Confirmation modal shows
  - [ ] Warning about finality displays
  
- [ ] **Submit Accusation**
  - [ ] Correct suspect = Win message
  - [ ] Wrong suspect = Lose message
  - [ ] Game marked as completed
  - [ ] Result details display
  
- [ ] **Post-Accusation**
  - [ ] Return to Main Menu works
  - [ ] Select New Case works
  - [ ] Can't continue completed game

### 6. Save/Resume Tests
- [ ] **Auto-Save**
  - [ ] Game state persists in database
  - [ ] Messages saved correctly
  - [ ] Evidence unlocks persist
  
- [ ] **Resume Game**
  - [ ] Loads correct game state
  - [ ] All messages restored
  - [ ] Evidence progress restored
  - [ ] Can continue playing
  
- [ ] **Multiple Sessions**
  - [ ] Can start new game for different case
  - [ ] localStorage updates to new game
  - [ ] Old game still accessible via direct URL

### 7. Error Handling Tests
- [ ] **Network Errors**
  - [ ] Lost connection displays error
  - [ ] Retry mechanism works
  - [ ] User can recover
  
- [ ] **API Errors**
  - [ ] Invalid game ID handled
  - [ ] Missing case handled
  - [ ] AI failure handled gracefully
  
- [ ] **Edge Cases**
  - [ ] Very long messages (>500 chars)
  - [ ] Special characters in input
  - [ ] Rapid clicking/spamming
  - [ ] Browser back button

---

## 🎯 Phase 10.2: Edge Cases Testing

### Input Edge Cases
- [ ] Very long messages (1000+ characters)
- [ ] Special characters: `!@#$%^&*()_+-={}[]|:";'<>?,./`
- [ ] Unicode characters: emoji, Turkish chars (ç, ğ, ı, ö, ş, ü)
- [ ] Only whitespace
- [ ] Only numbers
- [ ] Mixed languages in single message

### Session Edge Cases
- [ ] Multiple browser tabs with same game
- [ ] Different games in different tabs
- [ ] localStorage cleared mid-game
- [ ] Session expired (old game ID)

### Network Edge Cases
- [ ] Slow 3G connection
- [ ] Connection lost during AI request
- [ ] Connection lost during evidence unlock
- [ ] Intermittent connectivity

---

## 🎯 Phase 10.3: AI Response Quality Testing

### Persona Tests
- [ ] Detective X character consistency
- [ ] Professional detective language
- [ ] Helpful without revealing solution
- [ ] Stays on topic

### Evidence Detection Tests
- [ ] All evidence unlocks via correct keywords
- [ ] No false positives (wrong evidence unlocked)
- [ ] Plural forms recognized
- [ ] Case-insensitive matching

### Language Tests
- [ ] Turkish conversation flows naturally
- [ ] English conversation flows naturally
- [ ] Mixed language handling
- [ ] Language switches mid-conversation

### Guardrail Tests
- [ ] Refuses to directly reveal killer
- [ ] Refuses off-topic conversations
- [ ] Handles inappropriate requests
- [ ] Maintains professional tone

---

## 🎯 Phase 10.4: Performance Testing

### Page Load Times
- [ ] Main Menu: < 1 second
- [ ] Case Selection: < 2 seconds
- [ ] Game Page: < 3 seconds
- [ ] Initial messages load: < 2 seconds

### API Response Times
- [ ] GET /api/cases: < 500ms
- [ ] POST /api/games/start: < 1s
- [ ] POST /api/chat: < 5s (AI response)
- [ ] GET /api/evidence: < 500ms

### Bundle Sizes
- [ ] Frontend JS bundle: < 500KB gzipped
- [ ] Frontend CSS: < 50KB gzipped
- [ ] No unused dependencies
- [ ] Code splitting working

### Network Performance
- [ ] Test on Slow 3G
- [ ] Test on Fast 3G
- [ ] Test on 4G
- [ ] Test on WiFi

---

## 🎯 Phase 10.5: Browser Compatibility

### Chrome (Latest)
- [ ] All features working
- [ ] No console errors
- [ ] Responsive design works
- [ ] Performance good

### Firefox (Latest)
- [ ] All features working
- [ ] No console errors
- [ ] Responsive design works
- [ ] Performance good

### Safari (Latest)
- [ ] All features working
- [ ] No console errors
- [ ] Responsive design works
- [ ] Performance good

### Edge (Latest)
- [ ] All features working
- [ ] No console errors
- [ ] Responsive design works
- [ ] Performance good

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile
- [ ] Samsung Internet

---

## 🎯 Phase 10.6: Security Review

### API Security
- [ ] No exposed API keys in frontend
- [ ] Environment variables properly used
- [ ] CORS configured correctly
- [ ] Rate limiting present

### Input Validation
- [ ] XSS prevention working
- [ ] SQL injection prevention (Supabase handles)
- [ ] Input sanitization active
- [ ] Message length limits enforced

### Database Security
- [ ] RLS policies configured (if applicable)
- [ ] No direct database access from frontend
- [ ] Sensitive data not exposed
- [ ] Game isolation working

### Session Security
- [ ] localStorage used appropriately
- [ ] No sensitive data in localStorage
- [ ] Session hijacking prevented
- [ ] HTTPS enforced in production (deployment step)

---

## 📝 Test Results

### Issues Found
_Document all bugs and issues here_

| # | Severity | Component | Description | Status |
|---|----------|-----------|-------------|--------|
| 1 | Low | Backend | Health check table not found (FIXED) | ✅ Fixed |

### Performance Metrics
_Document measured performance_

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Main Menu Load | < 1s | TBD | ⏳ |
| Case Selection | < 2s | TBD | ⏳ |
| Game Page Load | < 3s | TBD | ⏳ |
| AI Response | < 5s | TBD | ⏳ |

### Browser Compatibility
_Document browser test results_

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | ⏳ | Not tested yet |
| Firefox | Latest | ⏳ | Not tested yet |
| Safari | Latest | ⏳ | Not tested yet |
| Edge | Latest | ⏳ | Not tested yet |

---

## ✅ Sign-off

- [ ] All Phase 10.1 tests passed
- [ ] All Phase 10.2 tests passed
- [ ] All Phase 10.3 tests passed
- [ ] All Phase 10.4 tests passed
- [ ] All Phase 10.5 tests passed
- [ ] All Phase 10.6 tests passed
- [ ] All critical bugs fixed
- [ ] Performance acceptable
- [ ] Ready for deployment

**Tested by:** _Name_  
**Date:** _Date_  
**Approved by:** _Name_  
**Date:** _Date_
