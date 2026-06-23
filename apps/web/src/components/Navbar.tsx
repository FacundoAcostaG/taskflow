import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav
      data-testid="navbar"
      className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between"
    >
      <Link to="/projects" className="text-teal-700 font-bold text-lg">
        TaskFlow
      </Link>
      <button
        data-testid="logout-btn"
        onClick={handleLogout}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        Logout
      </button>
    </nav>
  )
}
