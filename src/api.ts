import { supabase } from './supabase';

// INTERFACES
export interface Product { id: string; name: string; targetQuantity: number; currentQuantity: number; locationId: string; categoryId: string; storeId: string; sku: string; image: string; purchaseUrl: string; price?: number; timestamp: number; }
export interface Category { id: string; name: string; order?: number; image?: string; }
export interface Location { id: string; name: string; order?: number; image?: string; }
export interface Store { id: string; name: string; order?: number; image?: string; }
export interface Purchase { id: string; productId: string; storeId: string; quantityBought: number; pricePerItem: number; timestamp: number; }

// HELPERS
const getWorkspaceId = async () => {
    // Avoid costly DB lookup that fails with arrays. Instead pull what AuthContext synced securely to localStorage.
    const savedWsId = localStorage.getItem('rakbuy_active_workspace');
    if (savedWsId) return savedWsId;

    // Fallback exactly as before if for some reason localstorage is corrupted
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated user");
    const { data, error } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1).single();
    if (error || !data) throw new Error("No workspace found");
    
    localStorage.setItem('rakbuy_active_workspace', data.id);
    return data.id;
};

// Utilities to convert between JS camelCase and Postgres snake_case
const toSnake = (obj: any) => {
    const res: any = { ...obj };
    
    // Convert keys
    if (res.targetQuantity !== undefined) { res.target_quantity = res.targetQuantity; delete res.targetQuantity; }
    if (res.currentQuantity !== undefined) { res.current_quantity = res.currentQuantity; delete res.currentQuantity; }
    if (res.categoryId !== undefined) { res.category_id = res.categoryId; delete res.categoryId; }
    if (res.locationId !== undefined) { res.location_id = res.locationId; delete res.locationId; }
    if (res.storeId !== undefined) { res.store_id = res.storeId; delete res.storeId; }
    if (res.purchaseUrl !== undefined) { res.purchase_url = res.purchaseUrl; delete res.purchaseUrl; }
    if (res.quantityBought !== undefined) { res.quantity_bought = res.quantityBought; delete res.quantityBought; }
    if (res.pricePerItem !== undefined) { res.price_per_item = res.pricePerItem; delete res.pricePerItem; }

    // Sanitize Empty UUIDs to avoid Postgres crashing (invalid input syntax for type uuid)
    if (res.category_id === '') delete res.category_id;
    if (res.location_id === '') delete res.location_id;
    if (res.store_id === '') delete res.store_id;

    return res;
};

const toCamel = (obj: any) => {
    const res: any = { ...obj };
    if (res.target_quantity !== undefined) { res.targetQuantity = res.target_quantity; delete res.target_quantity; }
    if (res.current_quantity !== undefined) { res.currentQuantity = res.current_quantity; delete res.current_quantity; }
    if (res.category_id !== undefined) { res.categoryId = res.category_id; delete res.category_id; }
    if (res.location_id !== undefined) { res.locationId = res.location_id; delete res.location_id; }
    if (res.store_id !== undefined) { res.storeId = res.store_id; delete res.store_id; }
    if (res.purchase_url !== undefined) { res.purchaseUrl = res.purchase_url; delete res.purchase_url; }
    if (res.quantity_bought !== undefined) { res.quantityBought = res.quantity_bought; delete res.quantity_bought; }
    if (res.price_per_item !== undefined) { res.pricePerItem = res.price_per_item; delete res.price_per_item; }
    return res;
};

const sortByOrder = (arr: any[]) => arr.sort((a, b) => (a.order || 0) - (b.order || 0));

// --- PRODUCTS ---
export const fetchProducts = async (): Promise<Product[]> => {
    const workspaceId = await getWorkspaceId();
    const { data, error } = await supabase.from('products').select('*').eq('workspace_id', workspaceId);
    if (error) throw error;
    return (data || []).map(toCamel) as Product[];
};

export const addProduct = async (p: Omit<Product, 'id'>): Promise<Product> => {
    const workspace_id = await getWorkspaceId();
    const payload = toSnake({ ...p, workspace_id });
    const { data, error } = await supabase.from('products').insert(payload).select().single();
    if (error) throw error;
    return toCamel(data) as Product;
};

export const updateProduct = async (id: string, p: Partial<Product>): Promise<Product> => {
    const payload = toSnake(p);
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return toCamel(data) as Product;
};

export const deleteProduct = async (id: string): Promise<any> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return {};
};

// --- PURCHASES ---
export const fetchPurchases = async (): Promise<Purchase[]> => {
    const workspaceId = await getWorkspaceId();
    const { data, error } = await supabase.from('purchases').select('*').eq('workspace_id', workspaceId);
    if (error) throw error;
    return (data || []).map(toCamel) as Purchase[];
};

export const addPurchase = async (p: Omit<Purchase, 'id'>): Promise<Purchase> => {
    const workspace_id = await getWorkspaceId();
    const payload = toSnake({ ...p, workspace_id });
    const { data, error } = await supabase.from('purchases').insert(payload).select().single();
    if (error) throw error;
    return toCamel(data) as Purchase;
};

// --- CATEGORIES ---
export const fetchCategories = async (): Promise<Category[]> => {
    const workspaceId = await getWorkspaceId();
    const { data, error } = await supabase.from('categories').select('*').eq('workspace_id', workspaceId);
    if (error) throw error;
    return sortByOrder((data || []).map(toCamel));
};

export const addCategory = async (c: Partial<Category>): Promise<Category> => {
    const workspace_id = await getWorkspaceId();
    const payload = toSnake({ ...c, workspace_id });
    const { data, error } = await supabase.from('categories').insert(payload).select().single();
    if (error) throw error;
    return toCamel(data) as Category;
};

export const updateCategory = async (id: string, p: Partial<Category>): Promise<Category> => {
    const payload = toSnake(p);
    const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return toCamel(data) as Category;
};

export const deleteCategory = async (id: string): Promise<any> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return {};
};

// --- LOCATIONS ---
export const fetchLocations = async (): Promise<Location[]> => {
    const workspaceId = await getWorkspaceId();
    const { data, error } = await supabase.from('locations').select('*').eq('workspace_id', workspaceId);
    if (error) throw error;
    return sortByOrder((data || []).map(toCamel));
};

export const addLocation = async (c: Partial<Location>): Promise<Location> => {
    const workspace_id = await getWorkspaceId();
    const payload = toSnake({ ...c, workspace_id });
    const { data, error } = await supabase.from('locations').insert(payload).select().single();
    if (error) throw error;
    return toCamel(data) as Location;
};

export const updateLocation = async (id: string, p: Partial<Location>): Promise<Location> => {
    const payload = toSnake(p);
    const { data, error } = await supabase.from('locations').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return toCamel(data) as Location;
};

export const deleteLocation = async (id: string): Promise<any> => {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
    return {};
};

// --- STORES ---
export const fetchStores = async (): Promise<Store[]> => {
    const workspaceId = await getWorkspaceId();
    const { data, error } = await supabase.from('stores').select('*').eq('workspace_id', workspaceId);
    if (error) throw error;
    return sortByOrder((data || []).map(toCamel));
};

export const addStore = async (c: Partial<Store>): Promise<Store> => {
    const workspace_id = await getWorkspaceId();
    const payload = toSnake({ ...c, workspace_id });
    const { data, error } = await supabase.from('stores').insert(payload).select().single();
    if (error) throw error;
    return toCamel(data) as Store;
};

export const updateStore = async (id: string, p: Partial<Store>): Promise<Store> => {
    const payload = toSnake(p);
    const { data, error } = await supabase.from('stores').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return toCamel(data) as Store;
};

export const deleteStore = async (id: string): Promise<any> => {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) throw error;
    return {};
};
