import { Category, Store, ShoppingList } from '../types/models';

export const defaultCategories: Record<string, Category> = {
  dairy: { name: 'חלב וביצים', icon: '🥛', color: '#E3F2FD', order: 0 },
  bread: { name: 'לחם ומאפים', icon: '🥖', color: '#FFF3E0', order: 1 },
  fruits: { name: 'ירקות ופירות', icon: '🥬', color: '#E8F5E9', order: 2 },
  meat: { name: 'בשר ודגים', icon: '🥩', color: '#FFEBEE', order: 3 },
  frozen: { name: 'קפואים', icon: '🧊', color: '#E1F5FE', order: 4 },
  canned: { name: 'שימורים ויבשים', icon: '🥫', color: '#FBE9E7', order: 5 },
  snacks: { name: 'חטיפים ומתוקים', icon: '🍪', color: '#FFF8E1', order: 6 },
  drinks: { name: 'משקאות', icon: '🥤', color: '#F3E5F5', order: 7 },
  cleaning: { name: 'ניקיון', icon: '🧹', color: '#E0F7FA', order: 8 },
  hygiene: { name: 'טיפוח והיגיינה', icon: '🧴', color: '#FCE4EC', order: 9 },
  other: { name: 'אחר', icon: '📦', color: '#ECEFF1', order: 100 },
};

export const defaultStores: Store[] = [
  { id: 'rami_levy', name: 'רמי לוי' },
  { id: 'shufersal', name: 'שופרסל' },
  { id: 'mega', name: 'מגה' },
  { id: 'yochananof', name: 'יוחננוף' },
  { id: 'victory', name: 'ויקטורי' },
];

export const defaultLists: ShoppingList[] = [
  { id: 'default', name: 'רשימה ראשית' },
];

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCPaSIZXZdUfyfeyDN8XobScj8fnkmTZsw',
  authDomain: 'shopping-list-app-453ae.firebaseapp.com',
  projectId: 'shopping-list-app-453ae',
  storageBucket: 'shopping-list-app-453ae.firebasestorage.app',
  messagingSenderId: '902574729038',
  appId: '1:902574729038:web:b72a91a60d44d07101201f',
  measurementId: 'G-NR3SWHS6W1',
};

export const GOOGLE_WEB_CLIENT_ID = '902574729038-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';
