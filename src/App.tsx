import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Plus, Settings, BarChart3 } from 'lucide-react';

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

  return (
    <nav className="bottom-nav glass-panel">
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
  const { user } = useAuth();

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
        <header className="app-header">
          <img src="/rakbuy-logo.png" alt="RakBuy" className="app-header-logo" />
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
