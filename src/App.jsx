import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import PitchLens from './pages/PitchLens'
import BondLens from './pages/BondLens'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pitchlens" element={<PitchLens />} />
        <Route path="/bondlens" element={<BondLens />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}
