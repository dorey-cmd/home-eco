import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../App';
import { Trash2, Plus, ArrowUp, ArrowDown, ChevronRight, Edit2 } from 'lucide-react';

const currentHost = window.location.hostname;
const baseURL = currentHost !== 'localhost' ? `http://${currentHost}:3001` : 'http://localhost:3001';

type EntityType = 'categories' | 'locations' | 'stores';

const titles: Record<EntityType, string> = {
  categories: 'ניהול קטגוריות',
  locations: 'ניהול מיקומים',
  stores: 'ניהול חנויות'
};

const EntityManagement = () => {
  const { type } = useParams<{ type: EntityType }>();
  const { refreshLookups } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');

  // We fetch locally inside this component so we can manage ordering aggressively
  useEffect(() => {
    if (type) loadItems();
  }, [type]);

  const loadItems = async () => {
    if (!type) return;
    try {
      const res = await axios.get(`${baseURL}/${type}`);
      const sorted = res.data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setItems(sorted);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!newItemName.trim() || !type) return;
    try {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) : 0;
      await axios.post(`${baseURL}/${type}`, { name: newItemName, order: maxOrder + 1 });
      setNewItemName('');
      await loadItems();
      refreshLookups();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!type) return;
    if (window.confirm('למחוק פריט זה? הפעולה לא תימחק מוצרים המשויכים אליו, אך עלולה לפגוע בסינון.')) {
      try {
        await axios.delete(`${baseURL}/${type}/${id}`);
        await loadItems();
        refreshLookups();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRename = async (id: string, currentName: string) => {
    if (!type) return;
    const newName = window.prompt('הכנס שם חדש:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
      try {
        await axios.patch(`${baseURL}/${type}/${id}`, { name: newName });
        await loadItems();
        refreshLookups();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!type) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[newIndex];
    newItems[newIndex] = temp;
    
    // Assign new orders locally to reflect instantly
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setItems([...newItems]);

    try {
      // Execute saves in parallel
      await Promise.all(
        newItems.map(item => axios.patch(`${baseURL}/${type}/${item.id}`, { order: item.order }))
      );
      refreshLookups();
    } catch (e) {
      console.error('Failed to save arrangement', e);
      loadItems(); // rollback
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="font-bold truncate">{item.name}</span>
              </div>
              
              <div className="flex gap-1 items-center" style={{ flexShrink: 0 }}>
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
