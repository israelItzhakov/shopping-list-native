import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../utils/constants';
import { Item, Family, UserDoc, Product, Category, Store, ShoppingList } from '../types/models';
import { defaultCategories, defaultStores, defaultLists } from '../utils/constants';
import { normalizeProductName } from './productMatcher';
import commonProducts from '../assets/common-products.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Auth ---

export async function signInWithGoogleToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// --- User / Family ---

export async function getOrCreateFamily(user: User): Promise<string> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data() as UserDoc;
    if (data.familyId) {
      return data.familyId;
    }
  }

  // First-time user: create family
  const familyId = 'fam_' + user.uid.substring(0, 8);

  await setDoc(userRef, {
    familyId,
    email: user.email,
    displayName: user.displayName,
    joinedAt: serverTimestamp(),
  });

  // Create family doc with defaults
  const familyRef = doc(db, 'families', familyId);
  const familySnap = await getDoc(familyRef);

  if (!familySnap.exists()) {
    await setDoc(familyRef, {
      categories: defaultCategories,
      stores: defaultStores,
      lists: defaultLists,
      currentListId: 'default',
      currentStore: '',
      productDatabase: {},
      locationPhotos: {},
      members: [user.email],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Load common products
    await loadCommonProducts(familyId);
  }

  return familyId;
}

export async function joinFamily(userId: string, email: string, displayName: string, familyCode: string): Promise<boolean> {
  const familyRef = doc(db, 'families', familyCode);
  const familySnap = await getDoc(familyRef);

  if (!familySnap.exists()) return false;

  // Update user's familyId
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    familyId: familyCode,
    email,
    displayName,
    joinedAt: serverTimestamp(),
  }, { merge: true });

  // Add to family members
  const familyData = familySnap.data() as Family;
  const members = familyData.members || [];
  if (!members.includes(email!)) {
    await updateDoc(familyRef, {
      members: [...members, email],
      updatedAt: serverTimestamp(),
    });
  }

  return true;
}

// --- Items ---

export async function addItem(familyId: string, item: Omit<Item, 'createdAt' | 'updatedAt'>): Promise<void> {
  const itemRef = doc(db, 'families', familyId, 'items', String(item.id));
  await setDoc(itemRef, {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateItem(familyId: string, itemId: string, updates: Partial<Item>): Promise<void> {
  const itemRef = doc(db, 'families', familyId, 'items', String(itemId));
  await updateDoc(itemRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItem(familyId: string, itemId: string): Promise<void> {
  const itemRef = doc(db, 'families', familyId, 'items', String(itemId));
  await deleteDoc(itemRef);
}

export async function batchAddItems(familyId: string, items: Omit<Item, 'createdAt' | 'updatedAt'>[]): Promise<void> {
  const batch = writeBatch(db);
  items.forEach((item) => {
    const itemRef = doc(db, 'families', familyId, 'items', String(item.id));
    batch.set(itemRef, {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function clearCompletedItems(familyId: string, listId: string, items: Item[]): Promise<void> {
  const batch = writeBatch(db);
  items
    .filter((item) => item.inCart && item.listId === listId)
    .forEach((item) => {
      const itemRef = doc(db, 'families', familyId, 'items', String(item.id));
      batch.delete(itemRef);
    });
  await batch.commit();
}

export async function clearAllItems(familyId: string, listId: string, items: Item[]): Promise<void> {
  const batch = writeBatch(db);
  items
    .filter((item) => item.listId === listId)
    .forEach((item) => {
      const itemRef = doc(db, 'families', familyId, 'items', String(item.id));
      batch.delete(itemRef);
    });
  await batch.commit();
}

// --- Items Listener ---

export function subscribeToItems(
  familyId: string,
  listId: string,
  callback: (items: Item[]) => void
): Unsubscribe {
  const itemsRef = collection(db, 'families', familyId, 'items');
  const q = query(
    itemsRef,
    where('listId', '==', listId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items: Item[] = [];
    snapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as Item);
    });
    callback(items);
  });
}

// --- Family Data Listener ---

export function subscribeToFamily(
  familyId: string,
  callback: (family: Family) => void
): Unsubscribe {
  const familyRef = doc(db, 'families', familyId);
  return onSnapshot(familyRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Family);
    }
  });
}

// --- Family Data Updates ---

export async function updateFamilyData(
  familyId: string,
  updates: Partial<Family>
): Promise<void> {
  const familyRef = doc(db, 'families', familyId);
  await updateDoc(familyRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function updateCategories(familyId: string, categories: Record<string, Category>): Promise<void> {
  return updateFamilyData(familyId, { categories });
}

export async function updateStores(familyId: string, stores: Store[]): Promise<void> {
  return updateFamilyData(familyId, { stores });
}

export async function updateLists(familyId: string, lists: ShoppingList[]): Promise<void> {
  return updateFamilyData(familyId, { lists });
}

export async function updateCurrentList(familyId: string, listId: string): Promise<void> {
  return updateFamilyData(familyId, { currentListId: listId } as Partial<Family>);
}

export async function updateCurrentStore(familyId: string, store: string): Promise<void> {
  return updateFamilyData(familyId, { currentStore: store } as Partial<Family>);
}

export async function updateProductDatabase(familyId: string, productDatabase: Record<string, Product>): Promise<void> {
  return updateFamilyData(familyId, { productDatabase });
}

export async function updateLocationPhotos(familyId: string, locationPhotos: Record<string, string>): Promise<void> {
  return updateFamilyData(familyId, { locationPhotos });
}

// --- Common Products ---

async function loadCommonProducts(familyId: string): Promise<void> {
  const familyRef = doc(db, 'families', familyId);
  const familySnap = await getDoc(familyRef);
  const familyData = familySnap.data() as Family;
  const productDatabase = familyData.productDatabase || {};

  let loadedCount = 0;
  (commonProducts as { products: { name: string; category: string }[] }).products.forEach((product) => {
    const key = normalizeProductName(product.name);
    if (!productDatabase[key]) {
      productDatabase[key] = {
        name: product.name,
        category: product.category,
        photo: '',
      };
      loadedCount++;
    }
  });

  if (loadedCount > 0) {
    await updateDoc(familyRef, {
      productDatabase,
      updatedAt: serverTimestamp(),
    });
  }
}
