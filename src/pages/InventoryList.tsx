import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, updateProduct } from '../api';
import type { Product } from '../api';
import { AppContext } from '../App';
import { Plus, Minus, Search, Edit2, Barcode, LayoutGrid, List } from 'lucide-react';
import { BarcodeScanner } from '../components/BarcodeScanner';

const InventoryList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStore, setFilterStore] = useState('all');
  const [isScanning, setIsScanning] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
    const matchesSearch = p.name.includes(searchTerm) || (p.sku || '').includes(searchTerm);
    const matchesLocation = filterLocation === 'all' || p.locationId === filterLocation;
    const matchesCategory = filterCategory === 'all' || p.categoryId === filterCategory;
    const matchesStore = filterStore === 'all' || p.storeId === filterStore;
    
    return matchesSearch && matchesLocation && matchesCategory && matchesStore;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ marginBottom: 0 }}>המלאי שלי</h1>
        <div className="flex gap-2 bg-white rounded-xl p-1" style={{ border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            style={{ padding: '6px', borderRadius: '8px', border: 'none', background: isSearchOpen ? 'var(--rakbuy-blue-light)' : 'transparent', color: isSearchOpen ? 'var(--rakbuy-navy)' : 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <Search size={20} />
          </button>
          
          <div style={{ width: '1px', background: 'var(--glass-border)', margin: '4px 0' }}></div>
          
          <button 
            onClick={() => setViewMode('grid')}
            style={{ padding: '6px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? 'var(--rakbuy-blue-light)' : 'transparent', color: viewMode === 'grid' ? 'var(--rakbuy-navy)' : 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            style={{ padding: '6px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? 'var(--rakbuy-blue-light)' : 'transparent', color: viewMode === 'list' ? 'var(--rakbuy-navy)' : 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <List size={20} />
          </button>
        </div>
      </div>
      
      {isSearchOpen && (
        <div className="mb-4 animate-fade-in">
          <div className="glass-panel flex items-center px-4 mb-3" style={{ padding: '0 12px' }}>
            <Search size={20} className="text-secondary" />
            <input 
              type="text" 
              placeholder="חיפוש מוצר או ברקוד..." 
              className="glass-input flex-1"
              style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button onClick={() => setIsScanning(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '4px' }}>
              <Barcode size={20} />
            </button>
          </div>

          <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <select 
              className="glass-input" 
              style={{ padding: '8px', fontSize: '0.85rem' }} 
              value={filterLocation} 
              onChange={e => setFilterLocation(e.target.value)}
            >
              <option value="all">מיקומים</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
            
            <select 
              className="glass-input" 
              style={{ padding: '8px', fontSize: '0.85rem' }} 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">קטגוריות</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            
            <select 
              className="glass-input" 
              style={{ padding: '8px', fontSize: '0.85rem' }} 
              value={filterStore} 
              onChange={e => setFilterStore(e.target.value)}
            >
              <option value="all">חנויות</option>
              {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {isScanning && (
        <BarcodeScanner 
          onResult={(decodedText) => {
            setSearchTerm(decodedText);
            setIsScanning(false);
          }} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      <div className={viewMode === 'grid' ? 'product-grid' : ''}>
        {filteredProducts.map(p => {
          if (viewMode === 'list') {
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
          }

          // Grid View Card
          return (
            <div key={p.id} className="glass-panel product-card relative">
              
              <button 
                onClick={() => navigate(`/edit/${p.id}`)} 
                className="absolute top-2 left-2 z-10 glass-button secondary p-2"
                style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Edit2 size={16} className="text-secondary" />
              </button>

              <div className="product-card-img-container">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="product-card-img" />
                ) : (
                  <div style={{ fontSize: '3rem', color: 'rgba(0,0,0,0.1)', fontWeight: 'bold' }}>{p.name.charAt(0)}</div>
                )}
              </div>
              
              <div className="product-card-details">
                <div className="font-bold truncate" style={{ fontSize: '1.05rem', color: 'var(--text-color)' }}>{p.name}</div>
                
                <div className="quantity-control w-full" style={{ padding: '4px', marginTop: 'auto' }}>
                  <button className="btn-q" onClick={() => changeQuantity(p, -1)} style={{ width: '36px', height: '36px', fontSize: '1.2rem', padding: 0 }}>
                    <Minus size={18} />
                  </button>
                  <div className="flex items-center justify-center flex-1">
                    <span className="q-val font-bold" style={{ fontSize: '1.2rem', padding: '0 4px', direction: 'ltr' }}>{p.currentQuantity} <span className="text-secondary text-sm font-bold">/ {p.targetQuantity}</span></span>
                  </div>
                  <button className="btn-q" onClick={() => changeQuantity(p, 1)} style={{ width: '36px', height: '36px', fontSize: '1.2rem', padding: 0, background: 'var(--rakbuy-green)', color: 'white' }}>
                    <Plus size={18} />
                  </button>
                </div>
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
