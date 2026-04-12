import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, updateProduct } from '../api';
import type { Product } from '../api';
import { AppContext } from '../App';
import { Plus, Minus, Search, Edit2 } from 'lucide-react';

const InventoryList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStore, setFilterStore] = useState('all');
  
  const { locations, categories, stores } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products', error);
    }
  };

  const changeQuantity = async (product: Product, delta: number) => {
    const newQuantity = Math.max(0, product.currentQuantity + delta);
    if (newQuantity === product.currentQuantity) return;

    // Optimistic update
    setProducts(products.map(p => p.id === product.id ? { ...p, currentQuantity: newQuantity } : p));
    
    try {
      await updateProduct(product.id, { currentQuantity: newQuantity });
    } catch (e) {
      // Rollback
      setProducts(products);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.includes(searchTerm) || p.sku.includes(searchTerm);
    const matchesLocation = filterLocation === 'all' || p.locationId === filterLocation;
    const matchesCategory = filterCategory === 'all' || p.categoryId === filterCategory;
    const matchesStore = filterStore === 'all' || p.storeId === filterStore;
    
    return matchesSearch && matchesLocation && matchesCategory && matchesStore;
  });

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '16px' }}>המלאי שלי</h1>
      
      <div className="glass-panel flex items-center px-4 mb-3" style={{ padding: '0 12px' }}>
        <Search size={20} className="text-secondary" />
        <input 
          type="text" 
          placeholder="חיפוש מוצר או ברקוד..." 
          className="glass-input"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <select 
          className="glass-input" 
          style={{ padding: '8px', fontSize: '0.85rem' }} 
          value={filterLocation} 
          onChange={e => setFilterLocation(e.target.value)}
        >
          <option value="all" style={{color: '#000'}}>כל המיקומים</option>
          {locations.map(loc => <option key={loc.id} value={loc.id} style={{color: '#000'}}>{loc.name}</option>)}
        </select>
        
        <select 
          className="glass-input" 
          style={{ padding: '8px', fontSize: '0.85rem' }} 
          value={filterCategory} 
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all" style={{color: '#000'}}>כל הקטגוריות</option>
          {categories.map(cat => <option key={cat.id} value={cat.id} style={{color: '#000'}}>{cat.name}</option>)}
        </select>
        
        <select 
          className="glass-input" 
          style={{ padding: '8px', fontSize: '0.85rem' }} 
          value={filterStore} 
          onChange={e => setFilterStore(e.target.value)}
        >
          <option value="all" style={{color: '#000'}}>כל החנויות</option>
          {stores.map(store => <option key={store.id} value={store.id} style={{color: '#000'}}>{store.name}</option>)}
        </select>
      </div>

      <div>
        {filteredProducts.map(p => {
          return (
            <div key={p.id} className="glass-panel list-row">
              {p.image ? (
                <img src={p.image} alt={p.name} className="tiny-img" />
              ) : (
                <div className="tiny-placeholder">{p.name.charAt(0)}</div>
              )}
              
              <div style={{ flex: 1, minWidth: 0, padding: '0 4px' }}>
                <div className="font-medium truncate" style={{ fontSize: '0.9rem' }}>{p.name}</div>
              </div>
              
              <div className="flex gap-3 items-center" style={{ flexShrink: 0 }}>
                <div className="quantity-control" style={{ padding: '2px' }}>
                  <button className="btn-q" onClick={() => changeQuantity(p, -1)} style={{ width: '24px', height: '24px', fontSize: '1rem' }}>
                    <Minus size={14} />
                  </button>
                  <span className="q-val font-medium" style={{ fontSize: '0.9rem', minWidth: '24px' }}>{p.currentQuantity}/{p.targetQuantity}</span>
                  <button className="btn-q" onClick={() => changeQuantity(p, 1)} style={{ width: '24px', height: '24px', fontSize: '1rem' }}>
                    <Plus size={14} />
                  </button>
                </div>
                
                <button onClick={() => navigate(`/edit/${p.id}`)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            אין מוצרים תואמים לחיפוש
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryList;
