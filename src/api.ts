import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

const currentHost = window.location.hostname;
if (currentHost !== 'localhost') {
  api.defaults.baseURL = `http://${currentHost}:3001`;
}

// VERCEL MOCK LOGIC FOR CONCEPT TESTING
export const isVercel = currentHost.includes('vercel.app');

const generateId = () => Math.random().toString(36).substring(2, 11);

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, arr: any[]) => localStorage.setItem(key, JSON.stringify(arr));

if (isVercel) {
  const initCategories = [
    { id: '1', name: 'מוצרי חלב', order: 1 },
    { id: '2', name: 'פירות וירקות', order: 2 },
    { id: '3', name: 'ניקיון וטואלטיקה', order: 3 },
    { id: '4', name: 'יבשים', order: 4 },
  ];
  const initLocations = [
    { id: '1', name: 'מקרר', order: 1 },
    { id: '2', name: 'מזווה', order: 2 },
    { id: '3', name: 'ארון חומרי ניקוי', order: 3 },
  ];
  const initStores = [
    { id: '1', name: 'שופרסל', order: 1 },
    { id: '2', name: 'רמי לוי', order: 2 },
    { id: '3', name: 'ירקניה', order: 3 },
  ];
  const initProductsNameList = [
    { n: 'חלב 3%', c: '1', l: '1', s: '1', price: 6 },
    { n: 'גבינה צהובה העמק', c: '1', l: '1', s: '1', price: 15 },
    { n: 'קוטג 5%', c: '1', l: '1', s: '2', price: 5 },
    { n: 'מעדן שוקולד יוטבתה', c: '1', l: '1', s: '1', price: 4 },
    { n: 'ביצים M', c: '1', l: '1', s: '2', price: 12 },
    { n: 'עגבניות', c: '2', l: '1', s: '3', price: 8 },
    { n: 'מלפפונים', c: '2', l: '1', s: '3', price: 7 },
    { n: 'בצל יבש', c: '2', l: '2', s: '3', price: 5 },
    { n: 'אבוקדו', c: '2', l: '1', s: '3', price: 15 },
    { n: 'תפוחי עץ', c: '2', l: '1', s: '3', price: 10 },
    { n: 'סבון כלים פיירי', c: '3', l: '3', s: '1', price: 12 },
    { n: 'מרכך כביסה סוד', c: '3', l: '3', s: '2', price: 20 },
    { n: 'נייר טואלט', c: '3', l: '3', s: '1', price: 35 },
    { n: 'מגבונים לחים', c: '3', l: '3', s: '2', price: 15 },
    { n: 'אורז בסמטי סוגת', c: '4', l: '2', s: '2', price: 11 },
    { n: 'פתיתים', c: '4', l: '2', s: '1', price: 8 },
    { n: 'פסטה ברילה', c: '4', l: '2', s: '2', price: 10 },
    { n: 'שמן קנולה', c: '4', l: '2', s: '1', price: 12 },
    { n: 'רסק עגבניות', c: '4', l: '2', s: '2', price: 5 },
    { n: 'טונה בשמן', c: '4', l: '2', s: '1', price: 25 },
  ];
  const initProducts = initProductsNameList.map(p => ({
    id: generateId(), name: p.n, categoryId: p.c, locationId: p.l, storeId: p.s, price: p.price,
    targetQuantity: Math.floor(Math.random() * 3) + 1, currentQuantity: 0, sku: "", image: "", purchaseUrl: "", timestamp: Date.now()
  }));

  if (!localStorage.getItem('categories')) setLocal('categories', initCategories);
  if (!localStorage.getItem('stores')) setLocal('stores', initStores);
  if (!localStorage.getItem('locations')) setLocal('locations', initLocations);
  if (!localStorage.getItem('products')) setLocal('products', initProducts);
  if (!localStorage.getItem('purchases')) setLocal('purchases', []);
}

// HELPER FOR MOCKING HTTP VERBS
const mockGet = async (key: string) => getLocal(key);
const mockPost = async (key: string, data: any) => {
  const arr = getLocal(key);
  const newItem = { id: generateId(), ...data };
  arr.push(newItem);
  setLocal(key, arr);
  return newItem;
};
const mockPatch = async (key: string, id: string, data: any) => {
  const arr = getLocal(key);
  const idx = arr.findIndex((item: any) => item.id === String(id));
  if (idx !== -1) {
    arr[idx] = { ...arr[idx], ...data };
    setLocal(key, arr);
    return arr[idx];
  }
  throw new Error('Not found');
};
const mockDelete = async (key: string, id: string) => {
  const arr = getLocal(key);
  setLocal(key, arr.filter((item: any) => item.id !== String(id)));
  return {};
};

// INTERFACES
export interface Product { id: string; name: string; targetQuantity: number; currentQuantity: number; locationId: string; categoryId: string; storeId: string; sku: string; image: string; purchaseUrl: string; price?: number; timestamp: number; }
export interface Category { id: string; name: string; order?: number; }
export interface Location { id: string; name: string; order?: number; }
export interface Store { id: string; name: string; order?: number; }
export interface Purchase { id: string; productId: string; storeId: string; quantityBought: number; pricePerItem: number; timestamp: number; }

const sortByOrder = (arr: any[]) => arr.sort((a, b) => (a.order || 0) - (b.order || 0));

// PRODUCTS
export const fetchProducts = (): Promise<Product[]> => isVercel ? mockGet('products') : api.get<Product[]>('/products').then(res => res.data);
export const addProduct = (p: Omit<Product, 'id'>): Promise<Product> => isVercel ? mockPost('products', p) : api.post<Product>('/products', p).then(res => res.data);
export const updateProduct = (id: string, p: Partial<Product>): Promise<Product> => isVercel ? mockPatch('products', id, p) : api.patch<Product>(`/products/${id}`, p).then(res => res.data);
export const deleteProduct = (id: string): Promise<any> => isVercel ? mockDelete('products', id) : api.delete(`/products/${id}`);

// PURCHASES
export const fetchPurchases = (): Promise<Purchase[]> => isVercel ? mockGet('purchases') : api.get<Purchase[]>('/purchases').then(res => res.data);
export const addPurchase = (p: Omit<Purchase, 'id'>): Promise<Purchase> => isVercel ? mockPost('purchases', p) : api.post<Purchase>('/purchases', p).then(res => res.data);

// CATEGORIES
export const fetchCategories = (): Promise<Category[]> => (isVercel ? mockGet('categories') : api.get<Category[]>('/categories').then(res => res.data)).then(sortByOrder);
export const addCategory = (c: Partial<Category>): Promise<Category> => isVercel ? mockPost('categories', c) : api.post<Category>('/categories', c).then(res => res.data);
export const updateCategory = (id: string, p: Partial<Category>): Promise<Category> => isVercel ? mockPatch('categories', id, p) : api.patch<Category>(`/categories/${id}`, p).then(res => res.data);
export const deleteCategory = (id: string): Promise<any> => isVercel ? mockDelete('categories', id) : api.delete(`/categories/${id}`);

// LOCATIONS
export const fetchLocations = (): Promise<Location[]> => (isVercel ? mockGet('locations') : api.get<Location[]>('/locations').then(res => res.data)).then(sortByOrder);
export const addLocation = (c: Partial<Location>): Promise<Location> => isVercel ? mockPost('locations', c) : api.post<Location>('/locations', c).then(res => res.data);
export const updateLocation = (id: string, p: Partial<Location>): Promise<Location> => isVercel ? mockPatch('locations', id, p) : api.patch<Location>(`/locations/${id}`, p).then(res => res.data);
export const deleteLocation = (id: string): Promise<any> => isVercel ? mockDelete('locations', id) : api.delete(`/locations/${id}`);

// STORES
export const fetchStores = (): Promise<Store[]> => (isVercel ? mockGet('stores') : api.get<Store[]>('/stores').then(res => res.data)).then(sortByOrder);
export const addStore = (c: Partial<Store>): Promise<Store> => isVercel ? mockPost('stores', c) : api.post<Store>('/stores', c).then(res => res.data);
export const updateStore = (id: string, p: Partial<Store>): Promise<Store> => isVercel ? mockPatch('stores', id, p) : api.patch<Store>(`/stores/${id}`, p).then(res => res.data);
export const deleteStore = (id: string): Promise<any> => isVercel ? mockDelete('stores', id) : api.delete(`/stores/${id}`);
