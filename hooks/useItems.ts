import { useState, useEffect } from 'react';
import { Item } from '../types/models';
import { subscribeToItems } from '../services/firebase';

export function useItems(familyId: string | null, listId: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToItems(familyId, listId, (newItems) => {
      setItems(newItems);
      setLoading(false);
    });

    return unsubscribe;
  }, [familyId, listId]);

  return { items, loading };
}
