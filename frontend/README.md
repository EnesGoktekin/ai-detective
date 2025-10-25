# Detective AI - Frontend

AI-powered detective game frontend built with React, TypeScript, and Vite.

## 🚀 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Routing:** React Router v7
- **State Management:** Zustand
- **Styling:** Tailwind CSS v3
- **Theme:** Dark theme with gold accents

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── store/          # Zustand store
│   ├── services/       # API services
│   ├── hooks/          # Custom React hooks
│   ├── assets/         # Static assets
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Public assets
└── index.html          # HTML template
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Environment Variables

Create a `.env` file based on `.env.example`:

```
VITE_API_URL=http://localhost:3000
```

## 🎨 Design System

- **Primary Color:** Gold (#FFD700)
- **Background:** Dark (#0a0a0a)
- **Surface:** Darker (#1a1a1a)
- **Typography:** Inter, system-ui

## 📝 Features Implemented

### ✅ Foundation (Phase 6.0)
- Vite + React + TypeScript setup
- React Router v7 configured
- Zustand state management
- Tailwind CSS with dark theme
- Path aliases (@/ prefix)
- Development server with HMR
- TypeScript strict mode
- API proxy to backend

### ✅ Design System & Theme (Phase 6.1)
- Complete design tokens in `src/utils/theme.ts`
- Colors: Dark backgrounds + 10-shade gold palette
- Typography: Inter font, 10 sizes, 4 weights
- Spacing, shadows, border radius, breakpoints
- Tailwind CSS extended with custom theme

### ✅ UI Component Library (Phase 6.2)
- **Button**: Primary/Secondary/Ghost variants, loading states, 3 sizes
- **Input**: Dark themed, validation errors, labels, full-width
- **Card**: Hoverable containers, customizable padding
- **Modal**: Accessible dialogs, ESC key support, backdrop
- **Loading**: Gold spinner, 3 sizes, optional text
- **Typography**: Heading (h1-h6) and Text components with variants
- **Component Showcase**: Visual testing page at `/showcase`

## 🔗 Backend Integration

The frontend is configured to proxy API requests to the backend running on `http://localhost:3000`.

## 📱 Responsive Design

The app is designed to work seamlessly on:
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (320px - 767px)

## 🚧 Coming Next

Phase 6 Frontend Implementation:
- Design system & theme
- Reusable UI components
- Main menu page
- Case selection
- Game page with chat interface
- Evidence display
- Accusation system

---

**Status:** Foundation complete ✅  
**Ready for:** Phase 6 UI implementation
