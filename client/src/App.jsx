import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Process from './pages/Process'
import Results from './pages/Results'
import History from './pages/History'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="process" element={<Process />} />
        <Route path="results" element={<Results />} />
        <Route path="history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
