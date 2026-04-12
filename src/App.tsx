import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Plus, Settings, BarChart3 } from 'lucide-react';

import InventoryList from './pages/InventoryList';
import ShoppingList from './pages/ShoppingList';
import AddEditProduct from './pages/AddEditProduct';
import AppSettings from './pages/AppSettings';
import Reports from './pages/Reports';
import EntityManagement from './pages/EntityManagement';
import { fetchCategories, fetchLocations, fetchStores } from './api';
import type { Category, Location, Store } from './api';

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

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const refreshLookups = async () => {
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
  }, []);

  return (
    <AppContext.Provider value={{ categories, locations, stores, refreshLookups }}>
      <BrowserRouter>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<InventoryList />} />
              <Route path="/shopping" element={<ShoppingList />} />
              <Route path="/add" element={<AddEditProduct />} />
              <Route path="/edit/:id" element={<AddEditProduct />} />
              <Route path="/settings" element={<AppSettings />} />
              <Route path="/settings/:type" element={<EntityManagement />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
