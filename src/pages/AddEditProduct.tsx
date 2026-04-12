import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useZxing } from 'react-zxing';
import { Camera, Barcode, Save, Trash2, X } from 'lucide-react';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '../api';
import type { Product } from '../api';
import { AppContext } from '../App';

const AddEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, locations, stores } = useContext(AppContext);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    targetQuantity: 1,
    currentQuantity: 0,
    price: 0,
    locationId: locations[0]?.id || '',
    categoryId: categories[0]?.id || '',
    storeId: stores[0]?.id || '',
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

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setFormData(prev => ({ ...prev, image: compressedBase64 }));
          } else {
            setFormData(prev => ({ ...prev, image: reader.result as string }));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const { ref: barcodeRef } = useZxing({
    constraints: { video: { facingMode: 'environment' } },
    onResult(result: any) {
      setFormData(prev => ({ ...prev, sku: result.getText() }));
      setIsScanning(false);
    },
    paused: !isScanning,
  });

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

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* תמונה */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {formData.image ? (
            <img src={formData.image} alt="Product" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '16px', border: '2px solid var(--glass-border)' }} />
          ) : (
            <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Camera size={40} />
            </div>
          )}
          <label className="glass-button secondary" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
            <span>{formData.image ? 'שנה תמונה' : 'צלם/הוסף תמונה'}</span>
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageCapture} />
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <div>
            <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>שם המוצר</label>
            <input className="glass-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="למשל: חלב תנובה 3%" />
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>צריך שיהיה (יעד)</label>
              <input type="number" className="glass-input" value={formData.targetQuantity} onChange={e => setFormData({...formData, targetQuantity: Number(e.target.value)})} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>יש כרגע</label>
              <input type="number" className="glass-input" value={formData.currentQuantity} onChange={e => setFormData({...formData, currentQuantity: Number(e.target.value)})} />
            </div>
          </div>

          <div>
            <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>מחיר (₪)</label>
            <input type="number" step="0.1" className="glass-input" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="אופציונלי" />
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>מיקום בבית</label>
              <select className="glass-input" value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value})}>
                {locations.map(l => <option key={l.id} value={l.id} style={{color: '#000'}}>{l.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>קטגוריה</label>
              <select className="glass-input" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                {categories.map(c => <option key={c.id} value={c.id} style={{color: '#000'}}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>קונים ב...</label>
            <select className="glass-input" value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})}>
              {stores.map(s => <option key={s.id} value={s.id} style={{color: '#000'}}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>מק"ט / ברקוד</label>
            <div className="flex gap-2">
              <input className="glass-input" style={{ flex: 1 }} value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="סרוק או הקלד" />
              <button className="glass-button secondary" onClick={() => setIsScanning(true)} style={{ padding: '0 16px' }}>
                <Barcode size={20} />
              </button>
            </div>
          </div>

          {isScanning && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#000' }}>
              <video ref={barcodeRef} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1001 }}>
                <button className="glass-button secondary" onClick={() => setIsScanning(false)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: '8px' }}><X size={24} /></button>
              </div>
              <div style={{ position: 'absolute', bottom: '32px', left: 0, right: 0, textAlign: 'center', color: 'white', zIndex: 1001, textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                סורק ברקוד...
              </div>
            </div>
          )}

          <div>
            <label className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>קישור לרכישה</label>
            <input type="url" className="glass-input" value={formData.purchaseUrl || ''} onChange={e => setFormData({...formData, purchaseUrl: e.target.value})} placeholder="https://..." dir="ltr" />
          </div>

        </div>

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
