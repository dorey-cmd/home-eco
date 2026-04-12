import { useEffect, useState, useContext } from 'react';
import { fetchProducts, updateProduct, addPurchase } from '../api';
import type { Product } from '../api';
import { AppContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, CheckCircle, ExternalLink, Download, FileText, CheckSquare, Square, Share2, ChevronDown, ChevronUp } from 'lucide-react';

const ShoppingList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const { stores } = useContext(AppContext);
  const { profile } = useAuth();
  const isBusiness = profile?.role === 'BUSINESS';

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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleStore = (storeName: string) => {
    const next = new Set(expandedStores);
    if (next.has(storeName)) next.delete(storeName);
    else next.add(storeName);
    setExpandedStores(next);
  };

  const selectAllForStore = (storeProducts: Product[]) => {
    const ids = storeProducts.map(p => p.id);
    const newSelected = new Set(selectedIds);
    const allSelected = ids.every(id => newSelected.has(id));
    
    if (allSelected) {
      ids.forEach(id => newSelected.delete(id)); // toggle off if all selected
    } else {
      ids.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const checkoutStore = async (storeProducts: Product[]) => {
    const productsToUpdate = storeProducts.filter(p => selectedIds.has(p.id));
    if (productsToUpdate.length === 0) {
      alert('לא נבחרו מוצרים לקנייה בחנות זו');
      return;
    }
    
    // optimistically update local state so they get removed from list
    const updatedIds = new Set(productsToUpdate.map(p => p.id));
    setProducts(products.map(p => {
       if (updatedIds.has(p.id)) return { ...p, currentQuantity: p.targetQuantity };
       return p;
    }));
    
    const newSelected = new Set(selectedIds);
    updatedIds.forEach(id => newSelected.delete(id));
    setSelectedIds(newSelected);

    try {
      const timestamp = Date.now();
      await Promise.all(productsToUpdate.map(async p => {
        const amountNeeded = p.targetQuantity - p.currentQuantity;
        if (amountNeeded <= 0) return;
        
        await updateProduct(p.id, { currentQuantity: p.targetQuantity });
        await addPurchase({
          productId: p.id,
          storeId: p.storeId,
          quantityBought: amountNeeded,
          pricePerItem: p.price || 0,
          timestamp
        });
      }));
    } catch (error) {
      console.error('Checkout failed', error);
      loadProducts(); // rollback
    }
  };

  const toBuyList = products.filter(p => p.targetQuantity > p.currentQuantity);
  
  // Group by store
  const groupedList = toBuyList.reduce((acc, p) => {
    const storeObj = stores.find(s => s.id === p.storeId);
    const fallbackName = isBusiness ? 'שונות (ללא ספק)' : 'שונות (ללא חנות)';
    const storeName = storeObj ? storeObj.name : fallbackName;
    if (!acc[storeName]) acc[storeName] = [];
    acc[storeName].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const totalItemsCount = toBuyList.reduce((sum, p) => sum + (p.targetQuantity - p.currentQuantity), 0);
  const totalEstimatedCost = toBuyList.reduce((sum, p) => sum + ((p.targetQuantity - p.currentQuantity) * (p.price || 0)), 0);

  const exportCSV = () => {
    const headers = ['שם מוצר', 'כמות חסרה', 'מחיר יחידה משוער', isBusiness ? 'ספק' : 'חנות'];
    const rows = toBuyList.map(p => {
      const storeName = stores.find(s => s.id === p.storeId)?.name || 'שונות';
      return [p.name, p.targetQuantity - p.currentQuantity, p.price || 0, storeName].join(',');
    });
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    downloadFile('shopping-list.csv', csvContent, 'text/csv;charset=utf-8;');
  };

  const exportTXT = () => {
    const lines = toBuyList.map(p => {
      const storeName = stores.find(s => s.id === p.storeId)?.name || '';
      return `- ${p.name} (חסר: ${p.targetQuantity - p.currentQuantity}) ${storeName ? `[${storeName}]` : ''}`;
    });
    const txtContent = 'רשימת קניות:\n\n' + lines.join('\n');
    downloadFile('shopping-list.txt', txtContent, 'text/plain;charset=utf-8;');
  };

  const shareAll = () => {
    const lines = toBuyList.map(p => {
      const storeName = stores.find(s => s.id === p.storeId)?.name || '';
      return `- ${p.name} (חסר: ${p.targetQuantity - p.currentQuantity}) ${storeName ? `[${storeName}]` : ''}`;
    });
    const text = 'רשימת קניות:\n\n' + lines.join('\n');
    if (navigator.share) {
      navigator.share({ title: 'רשימת קניות', text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text).then(() => alert('הרשימה הועתקה ללוח!')).catch(console.error);
    }
  };

  const shareStore = (storeName: string, storeProducts: Product[]) => {
    const lines = storeProducts.map(p => `- ${p.name} (חסר: ${p.targetQuantity - p.currentQuantity})`);
    const text = `רשימת קניות - ${storeName}:\n\n` + lines.join('\n');
    if (navigator.share) {
      navigator.share({ title: `רשימת קניות - ${storeName}`, text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text).then(() => alert('הרשימה הועתקה ללוח!')).catch(console.error);
    }
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ marginBottom: 0 }}>רשימת קניות</h1>
        
        <div className="flex gap-2">
          <button className="glass-button secondary" onClick={shareAll} style={{ padding: '8px' }} title="שתף לווטסאפ/אפליקציות">
            <Share2 size={20} />
          </button>
          <button className="glass-button secondary" onClick={exportTXT} style={{ padding: '8px' }} title="ייצא ל-TXT">
            <FileText size={20} />
          </button>
          <button className="glass-button secondary" onClick={exportCSV} style={{ padding: '8px' }} title="ייצא ל-CSV">
            <Download size={20} />
          </button>
        </div>
      </div>
      
      <div className="glass-panel p-4 mb-4" style={{ padding: '16px' }}>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-secondary text-sm">סה"כ פריטים חסרים</div>
            <div className="font-bold" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}>{totalItemsCount}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div className="text-secondary text-sm">עלות משוערת</div>
            <div className="font-bold" style={{ fontSize: '1.5rem' }}>₪{totalEstimatedCost.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {Object.keys(groupedList).length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <div>המלאי מלא! אין מה לקנות כרגע.</div>
        </div>
      ) : (
        Object.entries(groupedList).map(([storeName, storeProducts]) => {
          const storeSelectedCount = storeProducts.filter(p => selectedIds.has(p.id)).length;
          const isExpanded = expandedStores.has(storeName);
          
          return (
            <div key={storeName} className="mb-4">
              <div className="glass-panel mb-2" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => toggleStore(storeName)}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp size={24} className="text-secondary" /> : <ChevronDown size={24} className="text-secondary" />}
                    <h2 className="font-bold m-0" style={{ fontSize: '1.2rem', color: isExpanded ? 'var(--accent-color)' : 'inherit' }}>
                      {storeName} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({storeProducts.length})</span>
                    </h2>
                  </div>
                  {isExpanded && (
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button className="glass-button secondary" style={{ padding: '6px' }} onClick={() => shareStore(storeName, storeProducts)}>
                        <Share2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                {isExpanded && (
                  <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
                    <button 
                      className="glass-button secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => selectAllForStore(storeProducts)}
                    >
                      {storeSelectedCount === storeProducts.length ? 'בטל הכל' : 'בחר הכל'}
                    </button>
                    <button 
                      className="glass-button" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem', background: storeSelectedCount > 0 ? 'var(--success-color)' : 'var(--glass-bg)', color: storeSelectedCount > 0 ? 'white' : 'var(--text-secondary)' }}
                      onClick={() => checkoutStore(storeProducts)}
                      disabled={storeSelectedCount === 0}
                    >
                      <CheckCircle size={16} className="ml-1" />
                      <span>סיום קנייה ({storeSelectedCount})</span>
                    </button>
                  </div>
                )}
              </div>
              
              {isExpanded && (
                <div className="flex flex-col gap-2">
                  {storeProducts.map(p => {
                    const amountNeeded = p.targetQuantity - p.currentQuantity;
                    const isSelected = selectedIds.has(p.id);
                    return (
                      <div 
                        key={p.id} 
                        className="glass-panel list-row" 
                        style={{ cursor: 'pointer', border: isSelected ? '1px solid var(--success-color)' : '1px solid var(--glass-border)', opacity: isSelected ? 0.8 : 1 }}
                        onClick={() => toggleSelection(p.id)}
                      >
                        <div style={{ color: isSelected ? 'var(--success-color)' : 'var(--text-secondary)', display: 'flex' }}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                        
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="tiny-img" />
                        ) : (
                          <div className="tiny-placeholder">{p.name.charAt(0)}</div>
                        )}
                        
                        <div style={{ flex: 1, minWidth: 0, padding: '0 4px' }}>
                          <div className="font-bold truncate" style={{ fontSize: '1rem', color: isSelected ? 'var(--success-color)' : 'inherit' }}>{p.name}</div>
                        </div>
                        
                        <div className="flex gap-2 items-center" style={{ flexShrink: 0 }}>
                          {p.purchaseUrl && (
                            <a href={p.purchaseUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--accent-color)' }}>
                              <ExternalLink size={18} />
                            </a>
                          )}
                          <span className="badge font-bold" style={{ background: 'var(--danger-color)', color: 'white', padding: '4px 8px' }}>
                            חסר: {amountNeeded} {p.price ? `| ₪${p.price}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  );
};

export default ShoppingList;
