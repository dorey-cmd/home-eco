import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Plus, Settings, BarChart3, Building } from 'lucide-react';

import InventoryList from './pages/InventoryList';
import ShoppingList from './pages/ShoppingList';
import AddEditProduct from './pages/AddEditProduct';
import AppSettings from './pages/AppSettings';
import ProfileSettings from './pages/ProfileSettings';
import WorkspaceSettings from './pages/WorkspaceSettings';
import Reports from './pages/Reports';
import EntityManagement from './pages/EntityManagement';
import AdminDashboard from './pages/AdminDashboard';
import { fetchCategories, fetchLocations, fetchStores } from './api';
import type { Category, Location, Store } from './api';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

// Context for global state mapping
export const AppContext = React.createContext<{
  categories: Category[];
  locations: Location[];
  stores: Store[];
  refreshLookups: () => void;
}>({ categories: [], locations: [], stores: [], refreshLookups: () => {} });

const BottomNav = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > lastScrollY && window.scrollY > 50) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
          lastScrollY = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`bottom-nav glass-panel ${isVisible ? '' : 'nav-hidden'}`}>
      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home />
        <span>מלאי</span>
      </NavLink>
      <NavLink to="/shopping" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingCart />
        <span>קניות</span>
      </NavLink>
      
      <div 
        className="fab"
        onClick={() => navigate('/add')}
      >
        <Plus size={28} />
      </div>

      <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BarChart3 />
        <span>דוחות</span>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings />
        <span>הגדרות</span>
      </NavLink>
    </nav>
  );
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-accent">טוען נתונים...</div></div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const { user, workspaces, activeWorkspace, setActiveWorkspaceId } = useAuth();

  const refreshLookups = async () => {
    if (!user) return;
    const [c, l, s] = await Promise.all([
      fetchCategories(),
      fetchLocations(),
      fetchStores()
    ]);
    setCategories(c || []);
    setLocations(l || []);
    setStores(s || []);
  };

  useEffect(() => {
    refreshLookups();
  }, [user]);

  return (
    <AppContext.Provider value={{ categories, locations, stores, refreshLookups }}>
      <div className="app-container">
        <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
          <img src="/rakbuy-logo.png" alt="RakBuy" className="app-header-logo" style={{ margin: 0 }} />
          
          {workspaces.length > 1 && (
            <div className="relative">
              <div className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <div style={{ background: 'var(--glass-bg)', padding: '6px', borderRadius: '50%', border: '1px solid var(--glass-border)' }}>
                  <Building size={20} style={{ color: 'var(--rakbuy-green)' }} />
                </div>
                <span className="text-sm font-bold text-secondary text-right" style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}>
                  {activeWorkspace?.owner_id !== user?.id && activeWorkspace?.owner_email ? 
                    `${activeWorkspace.name} - ${activeWorkspace.owner_email}` : 
                    activeWorkspace?.name}
                </span>
              </div>
              
              <select 
                className="absolute inset-0 w-full h-full opacity-0"
                style={{ cursor: 'pointer' }}
                value={activeWorkspace?.id || ''}
                onChange={(e) => {
                    setActiveWorkspaceId(e.target.value);
                    window.location.reload();
                }}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.owner_id !== user?.id ? `${ws.name} - ${ws.owner_email}` : ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<InventoryList />} />
            <Route path="/shopping" element={<ShoppingList />} />
            <Route path="/add" element={<AddEditProduct />} />
            <Route path="/edit/:id" element={<AddEditProduct />} />
            <Route path="/settings" element={<AppSettings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/settings/workspaces" element={<WorkspaceSettings />} />
            <Route path="/settings/:type" element={<EntityManagement />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </AppContext.Provider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedLayout>
          <AppContent />
        </ProtectedLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
