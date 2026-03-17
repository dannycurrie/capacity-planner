import { useState } from 'react'
import './App.css'
import { RosterView } from './components/RosterView'
import { CapacityView } from './components/CapacityView'

type View = 'roster' | 'capacity'

function App() {
  const [activeView, setActiveView] = useState<View>('roster')

  return (
    <>
      <nav className="app-nav">
        <button
          className={activeView === 'roster' ? 'active' : ''}
          onClick={() => setActiveView('roster')}
        >
          Roster
        </button>
        <button
          className={activeView === 'capacity' ? 'active' : ''}
          onClick={() => setActiveView('capacity')}
        >
          Capacity
        </button>
      </nav>

      {activeView === 'roster' ? <RosterView /> : <CapacityView />}
    </>
  )
}

export default App
