import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Roster from './pages/Roster'
import Lineup from './pages/Lineup'
import Schedule from './pages/Schedule'
import GameCard from './pages/GameCard'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <div className="header-brand">
  <img src="/logo.png" alt="Marauders" className="logo-img" />
  <h1>Marauders</h1>
</div>
          <nav>
            <NavLink to="/" end>Roster</NavLink>
            <NavLink to="/lineup">Lineup</NavLink>
            <NavLink to="/schedule">Schedule</NavLink>
            <NavLink to="/gamecard">Game Card</NavLink>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Roster />} />
            <Route path="/lineup" element={<Lineup />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/gamecard" element={<GameCard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App