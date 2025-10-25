**Detective AI: Project Plan**

**1. Overview**

**Detective AI** is a chat-based **role-playing game** where users solve numerous cases **in their own way by talking** with their **detective colleague who is** at the crime scene. The **main objective** of this project is **to give** users the **feeling that** they are chatting with a **real detective**.

**2. Core Mission**

An **AI-powered** detective game where players investigate crime cases through **natural conversation**. Players should feel like a real detective texting their partner at the crime scene, **rather than simply** playing a game.

**3. MVP Objectives**

- **Five** different cases.
- Basic database schema: (1. **Save/Resume** functionality, 2. **Frontend information** (case selection page, game page **with fixed** suspects, interactive **evidence**, and title), 3. **Game Information**).
- Automatic **Evidence** **Unlocking**.
- **The "Make an Accusation" button** **will only be touchable** when all **evidence has been** found.
- **Prevent exploits** by **disallowing** messages that **do not contain** any **alphabetic** character and **disallowing** single-character messages. (This control **will be implemented** at the input part **before** the user sends the message.)
- A **5-second cooldown** between user messages, with the button becoming **non-interactive** during this time.
- Mobile and Desktop **Responsiveness**.
- Monolingual UI.
- **Multilingual** AI Chat.
- **Traceable** backend connection.
- **Well-Designed** System **Instructions**/Prompt.
- "How to Play" button on the Game **Page**.
- Basic game **saving** system that saves the entire gameplay context for **future resumption** (**Resume/Save**): (Chat history, found **evidence**, all API **information**).
- Interactive **evidence display** on the frontend. (Initially, the evidence window will be empty. As the user **uncovers** new **evidence** throughout the game, **it will be added** to the evidence part of the Game **Page**.)
- For the MVP, the AI will have **access** to **all data**, both what the user should know and what they shouldn't. **This is because** building the necessary background for an AI that **doesn't have access to sensitive** data is **unnecessary** for the MVP.
- **Message Queue (Last 5 User & AI Messages):** Instead of the entire chat history, **only the** last 5 User **and** AI messages will **be fed** to the AI, **in addition** to a summary.
- **Summarizing AI:** **After** every 5 user messages, the previous summary plus the **most recent** 5 user and 5 AI messages will be summarized by an **additional** AI, **separate from** the Chat AI.
-----
**4. User Flow**

1. **Main Menu**
1. **Case Selection** Menu
1. **Session Control** (Resume / New Game)
1. **Game Menu** (Chat)
1. **Accusation Window**
1. **End Game Window**
1. **Exit Window** (Play Again / Return to Main Menu)
-----
**5. Technical Architecture**

- **Database:** Supabase (PostgreSQL)
  - 7 tables: cases, suspects, scene_objects, evidence_lookup, games, messages, evidence_unlocked
  - Full schema documented in DATABASE_SCHEMA.md
- **Backend:** Node.js (v24.2.0) + Express v5 + TypeScript
  - Port: 3000
  - Development: ts-node + nodemon
  - API Routes: /api/cases, /api/health, /api/database/test, /api/ai/test
- **Frontend:** React + Vite + TypeScript
- **AI:** Gemini 2.5 Flash
- **Deployment:** Vercel (planned)
-----
**6. AI Logic**

1. **Chat AI:** The main, **interactive** AI for the game. **It converses** with the user and **retrieves** information from the database.
2. **Summarizing AI:** This AI will summarize the chat history **after** every **10** user messages. **This approach ensures** the Chat AI **does not have to process the** entire chat history.
-----
**7. Future Roadmap**

- **Implement a "Truth-Blind" AI:** **In the future, this structure will be changed to a closed system where the truth data is isolated, and the AI will not have access to the solution.**
- **Utilize Edge Functions**
- **User Login System**
-----
**8. System Design**

A **dark and mysterious** design with **yellow/gold accents used for key elements**.

