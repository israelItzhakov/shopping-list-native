import { Timestamp } from 'firebase/firestore';

export interface Item {
  id: string;
  listId: string;
  name: string;
  category: string;
  quantity: string;
  photo: string;
  inCart: boolean;
  addedByShopper: boolean;
  addedBy: string;
  order: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Category {
  name: string;
  icon: string;
  color: string;
  order: number;
}

export interface Store {
  id: string;
  name: string;
}

export interface ShoppingList {
  id: string;
  name: string;
}

export interface Product {
  name: string;
  category: string;
  photo?: string;
}

export interface Family {
  categories: Record<string, Category>;
  stores: Store[];
  lists: ShoppingList[];
  currentListId: string;
  currentStore: string;
  productDatabase: Record<string, Product>;
  locationPhotos: Record<string, string>;
  members: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface UserDoc {
  familyId: string;
  email: string;
  displayName: string;
  joinedAt: Timestamp | null;
}

export interface BulkParsedItem {
  originalText: string;
  name: string;
  category: string;
  quantity: string;
  matched: boolean;
  selected: boolean;
}

export interface ParsedLineItem {
  name: string;
  quantity: string;
}

export interface SplitResult {
  text: string;
  match: Product | null;
}

export type AppMode = 'creator' | 'shopper';
export type SyncStatus = 'synced' | 'syncing' | 'offline';
