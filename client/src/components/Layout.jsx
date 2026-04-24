import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Upload,
  FileStack,
  CheckCircle,
  History,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import { useState } from 'react'
import './Layout.css'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/upload', icon: Upload, label: 'Upload' },
  { path: '/process', icon: FileStack, label: 'Processar' },
  { path: '/results', icon: CheckCircle, label: 'Resultados' },
  { path: '/history', icon: History, label: 'Histórico' }
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app-layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <HelpCircle size={28} color="var(--accent)" />
            {!collapsed && <h1>QuestãoFlow</h1>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              end={path === '/'}
            >
              <Icon size={20} />
              {!collapsed && <span className="nav-text">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
