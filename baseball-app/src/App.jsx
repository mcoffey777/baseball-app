import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Roster from './pages/Roster'
import Lineup from './pages/Lineup'
import Schedule from './pages/Schedule'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <h1>⚾ Team Manager</h1>
          <nav>
            <NavLink to="/" end>Roster</NavLink>
            <NavLink to="/lineup">Lineup</NavLink>
            <NavLink to="/schedule">Schedule</NavLink>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Roster />} />
            <Route path="/lineup" element={<Lineup />} />
            <Route path="/schedule" element={<Schedule />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App