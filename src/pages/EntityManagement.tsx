import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, ArrowUp, ArrowDown, ChevronRight, Edit2, Image as ImageIcon } from 'lucide-react';
import { fetchCategories, fetchLocations, fetchStores, addCategory, addLocation, addStore, updateCategory, updateLocation, updateStore, deleteCategory, deleteLocation, deleteStore } from '../api';

type EntityType = 'categories' | 'locations' | 'stores';

const apiMap = {
  categories: { fetch: fetchCategories, add: addCategory, update: updateCategory, delete: deleteCategory },
  locations: { fetch: fetchLocations, add: addLocation, update: updateLocation, delete: deleteLocation },
  stores: { fetch: fetchStores, add: addStore, update: updateStore, delete: deleteStore }
};

const EntityManagement = () => {
  const { type } = useParams<{ type: EntityType }>();
  const { refreshLookups } = useContext(AppContext);
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const isBusiness = profile?.role === 'BUSINESS';
  const titles: Record<EntityType, string> = {
    categories: 'ניהול קטגוריות',
    locations: isBusiness ? 'ניהול סניפים' : 'ניהול מיקומים',
    stores: isBusiness ? 'ניהול ספקים' : 'ניהול חנויות'
  };

  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    if (type) loadItems();
  }, [type]);

  const loadItems = async () => {
    if (!type || !apiMap[type]) return;
    try {
      const data = await apiMap[type].fetch();
      setItems(data); // fetch returns sorted already!
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!newItemName.trim() || !type || !apiMap[type]) return;
    try {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) : 0;
      await apiMap[type].add({ name: newItemName, order: maxOrder + 1 });
      setNewItemName('');
      await loadItems();
      refreshLookups();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!type || !apiMap[type]) return;
    if (window.confirm('למחוק פריט זה? הפעולה לא תימחק מוצרים המשויכים אליו, אך עלולה לפגוע בסינון.')) {
      try {
        await apiMap[type].delete(id);
        await loadItems();
        refreshLookups();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRename = async (id: string, currentName: string) => {
    if (!type || !apiMap[type]) return;
    const newName = window.prompt('הכנס שם חדש:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
      try {
        await apiMap[type].update(id, { name: newName });
        await loadItems();
        refreshLookups();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSetImage = async (id: string, currentImage?: string) => {
    if (!type || !apiMap[type]) return;
    const newImage = window.prompt('הדבק כתובת (URL) של תמונה:', currentImage || '');
    if (newImage !== null && newImage !== currentImage) {
      try {
        await apiMap[type].update(id, { image: newImage });
        await loadItems();
        refreshLookups();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!type || !apiMap[type]) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[newIndex];
    newItems[newIndex] = temp;
    
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setItems([...newItems]);

    try {
      await Promise.all(
        newItems.map(item => apiMap[type!].update(item.id, { order: item.order }))
      );
      refreshLookups();
    } catch (e) {
      console.error('Failed to save arrangement', e);
      loadItems();
    }
  };

  if (!type || !titles[type]) return <div style={{ padding: '20px' }}>Page not found</div>;

  return (
    <div style={{ paddingBottom: '90px' }}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate('/settings')} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)' }}>
          <ChevronRight size={28} />
        </button>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{titles[type]}</h1>
      </div>
      
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
        <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>
          הזז פריטים מעלה או מטה כדי לשנות את סדר ההופעה שלהם בתפריטים ברחבי האפליקציה. הפריטים מסודרים מהגבוה לנמוך.
        </p>
        
        <div className="flex gap-2 mb-4">
          <input 
            className="glass-input" 
            style={{ flex: 1 }} 
            value={newItemName} 
            onChange={e => setNewItemName(e.target.value)} 
            placeholder={`הוסף חדש...`} 
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="glass-button" onClick={handleAdd} style={{ padding: '0 16px', background: 'var(--success-color)', color: 'white' }}>
            <Plus size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={item.id} className="glass-panel list-row" style={{ padding: '12px' }}>
              {item.image ? (
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, marginLeft: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0, marginLeft: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                  <ImageIcon size={18} style={{ opacity: 0.3 }} />
                </div>
              )}
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="font-bold truncate" style={{ fontSize: '1rem' }}>{item.name}</span>
              </div>
              
              <div className="flex gap-1 items-center" style={{ flexShrink: 0 }}>
                <button className="glass-button secondary" style={{ padding: '4px', border: 'none' }} onClick={() => handleSetImage(item.id, item.image)} title="הגדר תמונה">
                  <ImageIcon size={16} />
                </button>
                <button className="glass-button secondary" style={{ padding: '4px', border: 'none' }} onClick={() => handleRename(item.id, item.name)} title="שנה שם">
                  <Edit2 size={16} />
                </button>
                <button className="glass-button secondary" style={{ padding: '4px', border: 'none' }} onClick={() => handleMove(index, -1)} disabled={index === 0}>
                  <ArrowUp size={18} style={{ opacity: index === 0 ? 0.3 : 1 }} />
                </button>
                <button className="glass-button secondary" style={{ padding: '4px', border: 'none' }} onClick={() => handleMove(index, 1)} disabled={index === items.length - 1}>
                  <ArrowDown size={18} style={{ opacity: index === items.length - 1 ? 0.3 : 1 }} />
                </button>
                
                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 4px' }}></div>
                
                <button className="glass-button secondary" style={{ padding: '4px', border: 'none' }} onClick={() => handleRename(item.id, item.name)}>
                  <Edit2 size={16} />
                </button>
                <button className="glass-button secondary" style={{ padding: '4px', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EntityManagement;
