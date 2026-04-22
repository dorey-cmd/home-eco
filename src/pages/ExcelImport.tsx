import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { ChevronLeft, FileSpreadsheet, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import * as xlsx from 'xlsx';

export const ExcelImport = () => {
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          setError('הקובץ ריק או לא תקין.');
          setPreviewData([]);
        } else {
          setPreviewData(data);
        }
      } catch (err: any) {
        setError('שגיאה בקריאת הקובץ: ' + err.message);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleImport = async () => {
    if (!activeWorkspace) {
      setError('מסגרת עבודה (Workspace) לא נבחרה.');
      return;
    }
    if (previewData.length === 0) {
      setError('אין נתונים לייבוא.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const productsToInsert = previewData.map((row: any) => {
        // Map columns intelligently based on Hebrew names that might be used
        const name = row['שם מוצר'] || row['מוצר'] || row['name'] || row['Name'];
        const barcode = row['ברקוד'] || row['Barcode'] || row['barcode'] || null;
        const currentQty = row['כמות נוכחית'] || row['כמות בפועל'] || row['מלאי'] || row['currentQuantity'] || 0;
        const targetQty = row['כמות יעד'] || row['יעד'] || row['targetQuantity'] || 0;
        const price = row['מחיר'] || row['price'] || 0;

        if (!name) return null; // Name is required

        return {
          workspace_id: activeWorkspace.id,
          name: String(name).trim(),
          barcode: barcode ? String(barcode).trim() : null,
          current_quantity: Number(currentQty) || 0,
          target_quantity: Number(targetQty) || 0,
          price: Number(price) || 0,
          image_url: null,
          category_id: null,
          store_id: null,
          location_id: null
        };
      }).filter(Boolean); // Remove invalid rows

      if (productsToInsert.length === 0) {
        throw new Error('לא נמצאו מוצרים תקינים (נדרשת עמודת "שם מוצר").');
      }

      // Upsert logic - if barcode matches, update? Usually Supabase insert without conflict resolution will fail if there's a unique constraint constraint, but no unique constraint exists. Let's just insert.
      const { error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (insertError) throw insertError;

      setSuccess(`יובאו בהצלחה ${productsToInsert.length} מוצרים!`);
      setFile(null);
      setPreviewData([]);
    } catch (err: any) {
      setError('שגיאת ייבוא: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title m-0">ייבוא מאקסל</h1>
      </div>

      <div className="glass-panel p-6 mb-6">
        <div className="flex justify-center mb-4">
          <div style={{ background: 'var(--rakbuy-blue-light)', padding: '16px', borderRadius: '50%' }}>
            <FileSpreadsheet size={40} style={{ color: 'var(--rakbuy-navy)' }} />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--rakbuy-navy)' }}>
          העלאת מוצרים מהירה
        </h2>
        <p className="text-secondary text-center mb-6" style={{ fontSize: '0.9rem' }}>
          העלה קובץ אקסל (.xlsx) או CSV המכיל את רשימת המוצרים שלך. חובה לכלול עמודה בשם <strong>"שם מוצר"</strong>. עמודות אופציונליות: "ברקוד", "כמות יעד", "כמות נוכחית", "מחיר".
        </p>

        {error && (
          <div className="mb-4 p-3 rounded flex items-start gap-2" style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div style={{ fontSize: '0.9rem' }}>{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded flex items-start gap-2" style={{ background: 'rgba(46, 204, 113, 0.1)', color: 'var(--rakbuy-green)' }}>
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div style={{ fontSize: '0.9rem' }}>{success}</div>
          </div>
        )}

        <label className="btn-primary w-full flex items-center justify-center gap-2" style={{ cursor: 'pointer', padding: '14px' }}>
          <Upload size={20} />
          {file ? `הוחלף: ${file.name}` : 'בחר קובץ אקסל'}
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {previewData.length > 0 && (
        <div className="glass-panel p-4 animate-fade-in mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-secondary">תצוגה מקדימה ({previewData.length} שורות)</h3>
          </div>
          
          <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '8px', textAlign: 'right' }}>שם מוצר</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>ברקוד</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>כמות נוכחית</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>כמות יעד</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 50).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '8px' }}>{row['שם מוצר'] || row['מוצר'] || row['name'] || '-'}</td>
                    <td style={{ padding: '8px' }}>{row['ברקוד'] || row['Barcode'] || row['barcode'] || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{row['כמות נוכחית'] || row['כמות בפועל'] || row['מלאי'] || '0'}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{row['כמות יעד'] || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <div className="text-center text-secondary py-2 text-xs" style={{ background: 'var(--glass-bg)' }}>
                מוצגות 50 שורות ראשונות...
              </div>
            )}
          </div>

          <button 
            onClick={handleImport} 
            disabled={isLoading}
            className="btn-primary w-full mt-4"
            style={{ padding: '14px', background: 'var(--rakbuy-navy)' }}
          >
            {isLoading ? 'מייבא מוצרים...' : 'התחל ייבוא נתונים'}
          </button>
        </div>
      )}
    </div>
  );
};
