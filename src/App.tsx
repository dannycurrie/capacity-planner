import { useState } from 'react'
import './App.css'
import { RosterView } from './components/RosterView'
import { CapacityView } from './components/CapacityView'
import { InitiativesView } from './components/InitiativesView'
import { LoadView } from './components/LoadView'

type View = 'roster' | 'capacity' | 'initiatives' | 'load'

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
        <button
          className={activeView === 'load' ? 'active' : ''}
          onClick={() => setActiveView('load')}
        >
          Load
        </button>
      </nav>

      {activeView === 'roster' && <RosterView />}
      {activeView === 'capacity' && <CapacityView />}
      {activeView === 'initiatives' && <InitiativesView />}
      {activeView === 'load' && <LoadView />}
    </>
  )
}

export default App
