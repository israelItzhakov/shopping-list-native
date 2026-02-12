import { useState, useEffect } from 'react';
import { Family } from '../types/models';
import { subscribeToFamily } from '../services/firebase';
import { defaultCategories, defaultStores, defaultLists } from '../utils/constants';

export function useFamilyData(familyId: string | null) {
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setFamily(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToFamily(familyId, (data) => {
      setFamily(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [familyId]);

  const categories = family?.categories ?? defaultCategories;
  const stores = family?.stores ?? defaultStores;
  const lists = family?.lists ?? defaultLists;
  const currentListId = family?.currentListId ?? 'default';
  const currentStore = family?.currentStore ?? '';
  const productDatabase = family?.productDatabase ?? {};
  const locationPhotos = family?.locationPhotos ?? {};
  const members = family?.members ?? [];

  return {
    family,
    loading,
    categories,
    stores,
    lists,
    currentListId,
    currentStore,
    productDatabase,
    locationPhotos,
    members,
  };
}
