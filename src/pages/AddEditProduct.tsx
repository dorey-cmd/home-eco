import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Barcode, Save, Trash2 } from 'lucide-react';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '../api';
import type { Product } from '../api';
import { supabase } from '../supabase';
import { resizeImage } from '../imageUtils';
import { AppContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { BarcodeScanner } from '../components/BarcodeScanner';

const AddEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, locations, stores } = useContext(AppContext);
  const { profile } = useAuth();
  const isBusiness = profile?.role === 'BUSINESS';
  
  // Find default categories, locations and stores
  const generalCategory = categories.find(c => c.name === 'כללי') || categories.find(c => c.name === 'כללית') || categories[0];
  const generalLocation = locations.find(l => l.name === 'מיקום כללי') || locations[0];
  const generalStore = stores.find(s => s.name === 'קניות כללי') || stores.find(s => s.name === 'חנות כללית') || { id: '' };

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    targetQuantity: 1,
    currentQuantity: 0,
    price: 0,
    locationId: generalLocation?.id || '',
    categoryId: generalCategory?.id || '',
    storeId: generalStore?.id || '', // Default to 'קניות כללי'
    sku: '',
    image: '',
    purchaseUrl: ''
  });

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      const all = await fetchProducts();
      const p = all.find((x: Product) => x.id === productId);
      if (p) setFormData(p);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const resizedFile = await resizeImage(file, 400, 400);
      const fileName = `product_${Date.now()}_${Math.random()}.jpg`;
      
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, resizedFile);
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image: publicUrlData.publicUrl }));
    } catch (err) {
      console.error('Error uploading product image', err);
      alert('תקלה בהעלאת התמונה.');
    }
  };

  // Handled by BarcodeScanner component

  const onSave = async () => {
    try {
      let formattedUrl = formData.purchaseUrl || '';
      if (formattedUrl && !formattedUrl.startsWith('http')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      const payload = {
        ...formData,
        purchaseUrl: formattedUrl,
        timestamp: formData.timestamp || Date.now()
      } as Omit<Product, 'id'>;

      if (id) {
        await updateProduct(id, payload);
      } else {
        await addProduct(payload);
      }
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('שגיאה בשמירת המוצר');
    }
  };

  const onDelete = async () => {
    if (id && window.confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
      try {
        await deleteProduct(id);
        navigate('/');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          {id ? 'עריכת מוצר' : 'הוספת מוצר'}
        </h1>
        {id && (
          <button className="glass-button danger" onClick={onDelete} style={{ padding: '8px' }}>
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        
        {/* Top Header - Large Cover Image */}
        <div style={{ width: '100%', height: '260px', borderRadius: '16px', overflow: 'hidden', position: 'relative', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          {formData.image ? (
            <img src={formData.image} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'var(--rakbuy-blue-light)' }}>
              <Camera size={48} style={{ opacity: 0.5 }} />
              <span className="mt-2 font-bold opacity-50">אין תמונה למוצר</span>
            </div>
          )}
          <label className="absolute bottom-4 right-4 glass-button p-3" style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.95)', color: 'var(--rakbuy-navy)', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            <Camera size={24} />
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageCapture} />
          </label>
        </div>

        {/* Name and Price */}
        <div className="flex flex-col gap-3 mt-3">
           <input className="glass-input text-center" style={{ fontWeight: '900', fontSize: '1.6rem', padding: '20px', background: 'var(--glass-bg)' }} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="שם המוצר..." />
           
           <div className="flex items-center gap-3">
             <div className="glass-panel text-center flex-1" style={{ padding: '16px' }}>
               <label className="text-secondary font-bold text-xs block mb-2">מחיר פריט</label>
               <div className="flex items-center justify-center gap-1">
                 <span className="font-bold text-secondary text-lg">₪</span>
                 <input type="number" step="0.1" className="glass-input text-center" style={{ width: '80px', fontSize: '1.4rem', background: 'transparent', border: 'none', padding: 0, fontWeight: 'bold' }} value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="0.0" />
               </div>
             </div>
             
             <div className="glass-panel text-center flex-1" style={{ padding: '16px' }}>
               <label className="text-secondary font-bold text-xs block mb-2">מק"ט / ברקוד</label>
               <div className="flex items-center justify-center gap-2">
                 <input className="glass-input text-center" style={{ width: '80px', fontSize: '1.1rem', background: 'transparent', border: 'none', padding: 0, fontWeight: 'bold' }} value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="סרוק..." />
                 <button className="text-accent" onClick={() => setIsScanning(true)}>
                   <Barcode size={24} />
                 </button>
               </div>
             </div>
           </div>
        </div>

        {/* Quantities in a highly visible card */}
        <div className="glass-panel mt-3" style={{ padding: '20px 16px' }}>
          <h3 className="text-center font-bold text-secondary mb-4" style={{ fontSize: '1rem' }}>ניהול מלאי</h3>
          <div className="flex items-center justify-center gap-6">
            <div style={{ flex: 1, textAlign: 'center' }}>
              <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>מוצרים שיש כרגע</label>
              <input type="number" className="glass-input text-center" style={{ padding: '4px', fontSize: '2.5rem', background: 'transparent', border: 'none', fontWeight: '900', width: '100%', color: 'var(--rakbuy-navy)' }} value={formData.currentQuantity} onChange={e => setFormData({...formData, currentQuantity: Number(e.target.value)})} />
            </div>
            <div style={{ width: '2px', height: '80px', background: 'var(--glass-border)', borderRadius: '2px' }}></div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <label className="text-secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>כמות יעד רצויה</label>
              <input type="number" className="glass-input text-center" style={{ padding: '4px', fontSize: '2.5rem', background: 'transparent', border: 'none', fontWeight: '900', width: '100%', color: 'var(--rakbuy-green)' }} value={formData.targetQuantity} onChange={e => setFormData({...formData, targetQuantity: Number(e.target.value)})} />
            </div>
          </div>
        </div>

        {/* Dropdowns logic */}
        <div className="glass-panel mt-3" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="text-secondary font-bold text-xs block mb-2">קטגוריה</label>
            <select className="glass-input w-full" style={{ fontSize: '1.1rem', padding: '14px', fontWeight: 'bold' }} value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
              <option value="" disabled>בחר קטגוריה</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-secondary font-bold text-xs block mb-2">{isBusiness ? 'סניף אחסון' : 'מיקום אחסון'}</label>
            <select className="glass-input w-full" style={{ fontSize: '1.1rem', padding: '14px', fontWeight: 'bold' }} value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value})}>
              <option value="" disabled>בחר מיקום</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-secondary font-bold text-xs block mb-2">{isBusiness ? 'מסופק על ידי...' : 'קונים ב...'}</label>
            <select className="glass-input w-full" style={{ fontSize: '1.1rem', padding: '14px', fontWeight: 'bold' }} value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})}>
               <option value="" disabled>בחר מקור</option>
               {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="mt-2">
            <input type="url" className="glass-input text-center w-full" style={{ fontSize: '1rem', padding: '14px' }} value={formData.purchaseUrl || ''} onChange={e => setFormData({...formData, purchaseUrl: e.target.value})} placeholder="קישור חיצוני לרכישה ברשת (URL)" dir="ltr" />
          </div>
        </div>

        {isScanning && (
          <BarcodeScanner 
            onResult={(decodedText) => {
              setFormData(prev => ({ ...prev, sku: decodedText }));
              setIsScanning(false);
            }} 
            onClose={() => setIsScanning(false)} 
          />
        )}

      </div>

      <div style={{ position: 'fixed', bottom: '70px', left: 0, right: 0, padding: '16px', zIndex: 99, background: 'linear-gradient(to top, var(--bg-color) 60%, transparent)' }}>
        <button className="glass-button" style={{ width: '100%' }} onClick={onSave} disabled={!formData.name}>
          <Save size={20} />
          <span>שמור מוצר</span>
        </button>
      </div>

    </div>
  );
};

export default AddEditProduct;
