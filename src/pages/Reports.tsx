import { useEffect, useState, useContext, useMemo } from 'react';
import { fetchPurchases, fetchProducts } from '../api';
import type { Purchase, Product } from '../api';
import { AppContext } from '../App';
import { BarChart3, Filter, ShoppingBag, TrendingUp } from 'lucide-react';

const Reports = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [dateFilter, setDateFilter] = useState<'30' | '90' | '365' | 'all'>('30');
  const [storeFilter, setStoreFilter] = useState('all');
  
  const { stores } = useContext(AppContext);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [purchasesData, productsData] = await Promise.all([
      fetchPurchases(),
      fetchProducts()
    ]);
    // Sort purchases by newest first
    setPurchases((purchasesData || []).sort((a: Purchase,b: Purchase) => b.timestamp - a.timestamp));
    setProducts(productsData || []);
  };

  const filteredPurchases = useMemo(() => {
    let result = purchases;
    
    // Time filter
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
      result = result.filter(p => p.timestamp >= cutoff);
    }
    
    // Store filter
    if (storeFilter !== 'all') {
      result = result.filter(p => p.storeId === storeFilter);
    }
    
    return result;
  }, [purchases, dateFilter, storeFilter]);

  const totalSpent = filteredPurchases.reduce((sum, p) => sum + (p.quantityBought * p.pricePerItem), 0);
  const totalItems = filteredPurchases.reduce((sum, p) => sum + p.quantityBought, 0);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('he-IL', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <h1 className="page-title mb-4">דוחות והיסטוריה</h1>
      
      <div className="glass-panel p-4 mb-4" style={{ padding: '16px' }}>
        <div className="flex gap-2 items-center mb-4 text-secondary">
          <Filter size={18} />
          <span className="font-bold">סינון מותאם</span>
        </div>
        
        <div className="flex gap-2 mb-2">
          <select className="glass-input" style={{ flex: 1, padding: '8px' }} value={dateFilter} onChange={e => setDateFilter(e.target.value as any)}>
            <option value="30" style={{color: '#000'}}>30 ימים אחרונים</option>
            <option value="90" style={{color: '#000'}}>3 חודשים אחרונים</option>
            <option value="365" style={{color: '#000'}}>שנה אחרונה</option>
            <option value="all" style={{color: '#000'}}>כל הזמנים</option>
          </select>
          <select className="glass-input" style={{ flex: 1, padding: '8px' }} value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
            <option value="all" style={{color: '#000'}}>כל החנויות</option>
            {stores.map(s => <option key={s.id} value={s.id} style={{color: '#000'}}>{s.name}</option>)}
          </select>
        </div>
      </div>
      
      <div className="flex gap-4 mb-4">
        <div className="glass-panel flex-1" style={{ padding: '16px', textAlign: 'center' }}>
          <TrendingUp size={24} className="mb-2 text-accent" style={{ margin: '0 auto' }} />
          <div className="text-secondary text-sm">הוצאה כוללת</div>
          <div className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}>₪{totalSpent.toFixed(2)}</div>
        </div>
        <div className="glass-panel flex-1" style={{ padding: '16px', textAlign: 'center' }}>
          <ShoppingBag size={24} className="mb-2 text-success" style={{ margin: '0 auto' }} />
          <div className="text-secondary text-sm">פריטים שנקנו</div>
          <div className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--success-color)' }}>{totalItems}</div>
        </div>
      </div>
      
      <h2 className="font-bold text-secondary mb-2" style={{ marginTop: '24px' }}>היסטוריית קניות</h2>
      
      {filteredPurchases.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <div>אין היסטוריית קניות התואמת לסינון זה.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredPurchases.map(p => {
            const product = products.find(prod => prod.id === p.productId);
            const storeName = stores.find(s => s.id === p.storeId)?.name || 'חנות לא ידועה';
            const productName = product?.name || 'מוצר שנמחק';
            const totalRowPrice = p.quantityBought * p.pricePerItem;
            
            return (
              <div key={p.id} className="glass-panel list-row" style={{ padding: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold truncate" style={{ fontSize: '1rem' }}>{productName}</div>
                  <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                    {formatDate(p.timestamp)} • {storeName}
                  </div>
                </div>
                
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div className="font-bold">₪{totalRowPrice.toFixed(2)}</div>
                  <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                    {p.quantityBought} יח' x ₪{p.pricePerItem.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reports;
