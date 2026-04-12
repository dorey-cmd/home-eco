import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

// Since we're accessing this from mobile, localhost might not work.
// Ideally, the baseURL should be the IP of the machine running json-server.
// We can dynamically infer it if we know we are on the same network:
const currentHost = window.location.hostname;
if (currentHost !== 'localhost') {
  api.defaults.baseURL = `http://${currentHost}:3001`;
}

export interface Product {
  id: string;
  name: string;
  targetQuantity: number;
  currentQuantity: number;
  locationId: string;
  categoryId: string;
  storeId: string;
  sku: string;
  image: string;
  purchaseUrl: string;
  price?: number;
  timestamp: number;
}

export interface Category { id: string; name: string; order?: number; }
export interface Location { id: string; name: string; order?: number; }
export interface Store { id: string; name: string; order?: number; }

export interface Purchase {
  id: string;
  productId: string;
  storeId: string;
  quantityBought: number;
  pricePerItem: number;
  timestamp: number;
}

export const fetchProducts = () => api.get<Product[]>('/products').then(res => res.data);
export const addProduct = (p: Omit<Product, 'id'>) => api.post<Product>('/products', p).then(res => res.data);
export const updateProduct = (id: string, p: Partial<Product>) => api.patch<Product>(`/products/${id}`, p).then(res => res.data);
export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

const sortByOrder = (arr: any[]) => arr.sort((a, b) => (a.order || 0) - (b.order || 0));

export const fetchCategories = () => api.get<Category[]>('/categories').then(res => sortByOrder(res.data));
export const fetchLocations = () => api.get<Location[]>('/locations').then(res => sortByOrder(res.data));
export const fetchStores = () => api.get<Store[]>('/stores').then(res => sortByOrder(res.data));

export const updateCategory = (id: string, p: Partial<Category>) => api.patch<Category>(`/categories/${id}`, p).then(res => res.data);
export const updateLocation = (id: string, p: Partial<Location>) => api.patch<Location>(`/locations/${id}`, p).then(res => res.data);
export const updateStore = (id: string, p: Partial<Store>) => api.patch<Store>(`/stores/${id}`, p).then(res => res.data);

export const fetchPurchases = () => api.get<Purchase[]>('/purchases').then(res => res.data);
export const addPurchase = (p: Omit<Purchase, 'id'>) => api.post<Purchase>('/purchases', p).then(res => res.data);
