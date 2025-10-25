import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './pages/MainMenu'
import { CaseSelection } from './pages/CaseSelection'
import { SessionControl } from './pages/SessionControl'
import GamePage from './pages/GamePage'
import AccusationPage from './pages/AccusationPage'
import { ComponentShowcase } from './pages/ComponentShowcase'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/cases" element={<CaseSelection />} />
        <Route path="/session/:caseId" element={<SessionControl />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/game/:gameId/accuse" element={<AccusationPage />} />
        <Route path="/showcase" element={<ComponentShowcase />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
