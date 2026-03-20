import { useState } from 'react'
import './App.css'
import { RosterView } from './components/RosterView'
import { CapacityView } from './components/CapacityView'
import { InitiativesView } from './components/InitiativesView'

type View = 'roster' | 'capacity' | 'initiatives'

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
        <button
          className={activeView === 'initiatives' ? 'active' : ''}
          onClick={() => setActiveView('initiatives')}
        >
          Initiatives
        </button>
      </nav>

      {activeView === 'roster' && <RosterView />}
      {activeView === 'capacity' && <CapacityView />}
      {activeView === 'initiatives' && <InitiativesView />}
    </>
  )
}

export default App
