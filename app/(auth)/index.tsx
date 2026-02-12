import { useState, useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../../hooks/AuthContext';
import { useItems } from '../../hooks/useItems';
import { useFamilyData } from '../../hooks/useFamilyData';
import {
  updateItem,
  deleteItem,
  clearCompletedItems,
  clearAllItems,
  updateCurrentList,
  updateCurrentStore,
} from '../../services/firebase';
import { Item, AppMode, Category } from '../../types/models';

import ShoppingListItem from '../../components/ShoppingListItem';
import CategoryFilter from '../../components/CategoryFilter';
import ProgressBar from '../../components/ProgressBar';
import ModeToggle from '../../components/ModeToggle';

export default function MainScreen() {
  const { user, familyId } = useContext(AuthContext);
  const router = useRouter();
  const [mode, setMode] = useState<AppMode>('creator');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showListPicker, setShowListPicker] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);

  const {
    categories,
    stores,
    lists,
    currentListId,
    currentStore,
    productDatabase,
    locationPhotos,
  } = useFamilyData(familyId);

  const { items, loading: itemsLoading } = useItems(familyId, currentListId);

  // Group items by category
  const sortedCategories = useMemo(
    () =>
      Object.entries(categories).sort(([, a], [, b]) => a.order - b.order),
    [categories]
  );

  // Count items per category
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === activeFilter);
    }

    // Sort: uncompleted first, then by category order, then by creation
    return [...filtered].sort((a, b) => {
      if (a.inCart !== b.inCart) return a.inCart ? 1 : -1;
      const catOrderA = categories[a.category]?.order ?? 100;
      const catOrderB = categories[b.category]?.order ?? 100;
      if (catOrderA !== catOrderB) return catOrderA - catOrderB;
      return 0;
    });
  }, [items, activeFilter, categories]);

  const completedCount = items.filter((i) => i.inCart).length;
  const currentList = lists.find((l) => l.id === currentListId);
  const currentStoreObj = stores.find((s) => s.id === currentStore);

  // Handlers
  const handleToggleCart = useCallback(
    async (item: Item) => {
      if (!familyId) return;
      await updateItem(familyId, item.id, { inCart: !item.inCart });
    },
    [familyId]
  );

  const handleDeleteItem = useCallback(
    async (item: Item) => {
      if (!familyId) return;
      await deleteItem(familyId, item.id);
    },
    [familyId]
  );

  const handleLocationPhoto = useCallback(
    (item: Item) => {
      router.push({
        pathname: '/(auth)/location-photo',
        params: { itemId: item.id, itemName: item.name },
      });
    },
    [router]
  );

  const handleClearCompleted = () => {
    const completedItems = items.filter((i) => i.inCart);
    if (completedItems.length === 0) return;
    Alert.alert(
      'ניקוי פריטים',
      `למחוק ${completedItems.length} פריטים שהושלמו?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => familyId && clearCompletedItems(familyId, currentListId, items),
        },
      ]
    );
  };

  const handleClearAll = () => {
    const listItems = items.filter((i) => i.listId === currentListId);
    if (listItems.length === 0) return;
    Alert.alert('ניקוי רשימה', `למחוק את כל ${listItems.length} הפריטים?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק הכל',
        style: 'destructive',
        onPress: () => familyId && clearAllItems(familyId, currentListId, items),
      },
    ]);
  };

  const handleSelectList = (listId: string) => {
    if (familyId) {
      updateCurrentList(familyId, listId);
    }
    setShowListPicker(false);
  };

  const handleSelectStore = (storeId: string) => {
    if (familyId) {
      updateCurrentStore(familyId, storeId);
    }
    setShowStorePicker(false);
  };

  // Render section header for category groups
  const renderCategoryHeader = (categoryKey: string, cat: Category, count: number) => (
    <View
      key={`header-${categoryKey}`}
      style={[styles.categoryHeader, { backgroundColor: cat.color }]}
    >
      <Text style={styles.categoryHeaderText}>
        {cat.icon} {cat.name} ({count})
      </Text>
    </View>
  );

  // Build sections data
  const sections = useMemo(() => {
    if (activeFilter !== 'all') {
      return filteredItems;
    }

    const result: (Item | { type: 'header'; key: string; cat: Category; count: number })[] = [];
    let lastCategory = '';

    filteredItems.forEach((item) => {
      if (item.category !== lastCategory) {
        const cat = categories[item.category];
        if (cat) {
          const count = itemCounts[item.category] || 0;
          result.push({
            type: 'header',
            key: item.category,
            cat,
            count,
          });
        }
        lastCategory = item.category;
      }
      result.push(item);
    });

    return result;
  }, [filteredItems, activeFilter, categories, itemCounts]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return renderCategoryHeader(item.key, item.cat, item.count);
    }

    const typedItem = item as Item;
    const locationKey = `${typedItem.id}_${currentStore}`;

    return (
      <ShoppingListItem
        item={typedItem}
        category={categories[typedItem.category]}
        mode={mode}
        currentStore={currentStore}
        locationPhoto={locationPhotos[locationKey]}
        onToggleCart={handleToggleCart}
        onDelete={handleDeleteItem}
        onLocationPhoto={handleLocationPhoto}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRight}>
            {user?.photoURL && (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatar}
              />
            )}
            <Text style={styles.headerTitle}>
              {currentList?.name ?? 'רשימת קניות'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(auth)/settings')}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* List & Store Selectors */}
        <View style={styles.selectors}>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowListPicker(!showListPicker)}
          >
            <Text style={styles.selectorText}>
              {currentList?.name ?? 'בחר רשימה'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowStorePicker(!showStorePicker)}
          >
            <Text style={styles.selectorText}>
              {currentStoreObj?.name ?? 'בחר חנות'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* List Picker Dropdown */}
        {showListPicker && (
          <View style={styles.dropdown}>
            {lists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={[
                  styles.dropdownItem,
                  list.id === currentListId && styles.dropdownItemActive,
                ]}
                onPress={() => handleSelectList(list.id)}
              >
                <Text style={styles.dropdownText}>{list.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Store Picker Dropdown */}
        {showStorePicker && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                !currentStore && styles.dropdownItemActive,
              ]}
              onPress={() => handleSelectStore('')}
            >
              <Text style={styles.dropdownText}>ללא חנות</Text>
            </TouchableOpacity>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[
                  styles.dropdownItem,
                  store.id === currentStore && styles.dropdownItemActive,
                ]}
                onPress={() => handleSelectStore(store.id)}
              >
                <Text style={styles.dropdownText}>{store.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mode Toggle */}
        <ModeToggle mode={mode} onToggle={setMode} />

        {/* Progress Bar */}
        <ProgressBar total={items.length} completed={completedCount} />

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          itemCounts={itemCounts}
        />

        {/* Items List */}
        <FlatList
          data={sections}
          renderItem={renderItem}
          keyExtractor={(item: any) =>
            item.type === 'header' ? `header-${item.key}` : String(item.id)
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>
                {itemsLoading ? 'טוען...' : 'הרשימה ריקה'}
              </Text>
              {!itemsLoading && (
                <Text style={styles.emptySubtext}>
                  לחץ על + כדי להוסיף פריטים
                </Text>
              )}
            </View>
          }
        />

        {/* Clear Buttons */}
        {items.length > 0 && mode === 'creator' && (
          <View style={styles.clearButtons}>
            {completedCount > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCompleted}
              >
                <Text style={styles.clearButtonText}>
                  נקה הושלמו ({completedCount})
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.clearButton, styles.clearAllButton]}
              onPress={handleClearAll}
            >
              <Text style={[styles.clearButtonText, styles.clearAllText]}>
                נקה הכל
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* FAB */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            onPress={() => router.push('/(auth)/bulk-add')}
          >
            <Ionicons name="list" size={24} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/(auth)/add-item')}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#667eea',
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectors: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#fff',
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#eee',
    gap: 6,
  },
  selectorText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemActive: {
    backgroundColor: '#f0f4ff',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 100,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  categoryHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  clearButtons: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearAllButton: {
    borderColor: '#e57373',
  },
  clearButtonText: {
    fontSize: 13,
    color: '#666',
  },
  clearAllText: {
    color: '#e57373',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
  },
});
