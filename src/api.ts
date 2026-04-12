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
  if (!localStorage.getItem('categories')) setLocal('categories', [{id: '1', name: 'כללי'}]);
  if (!localStorage.getItem('stores')) setLocal('stores', [{id: '1', name: 'סופרמרקט'}]);
  if (!localStorage.getItem('locations')) setLocal('locations', [{id: '1', name: 'מזווה'}]);
  if (!localStorage.getItem('products')) setLocal('products', []);
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
