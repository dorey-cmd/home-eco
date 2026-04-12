import fs from 'fs';

const categories = [
  { id: '1', name: 'מוצרי חלב', order: 1 },
  { id: '2', name: 'פירות וירקות', order: 2 },
  { id: '3', name: 'ניקיון וטואלטיקה', order: 3 },
  { id: '4', name: 'יבשים', order: 4 },
];

const locations = [
  { id: '1', name: 'מקרר', order: 1 },
  { id: '2', name: 'מזווה', order: 2 },
  { id: '3', name: 'ארון חומרי ניקוי', order: 3 },
];

const stores = [
  { id: '1', name: 'שופרסל', order: 1 },
  { id: '2', name: 'רמי לוי', order: 2 },
  { id: '3', name: 'ירקניה', order: 3 },
];

const productsNameList = [
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

const generateId = () => Math.random().toString(36).substring(2, 11);

const products = productsNameList.map(p => ({
  id: generateId(),
  name: p.n,
  categoryId: p.c,
  locationId: p.l,
  storeId: p.s,
  price: p.price,
  targetQuantity: Math.floor(Math.random() * 3) + 1,
  currentQuantity: Math.floor(Math.random() * 2), // likely low quantity so it shows up in shopping list
  sku: "",
  image: "",
  purchaseUrl: "",
  timestamp: Date.now()
}));

const db = {
  products,
  categories,
  locations,
  stores,
  purchases: []
};

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log('seeded');
