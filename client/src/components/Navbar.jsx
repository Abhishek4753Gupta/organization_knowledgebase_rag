import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, LogOut, User, LayoutDashboard, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-xl">
          <Brain className="h-7 w-7" />
          <span>RAG Platform</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {isAdmin ? <Shield className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4" />}
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{user.organization?.name}</span>
              </div>
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600 font-medium">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Register Org</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
