import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item, Category, AppMode } from '../types/models';

interface ShoppingListItemProps {
  item: Item;
  category: Category | undefined;
  mode: AppMode;
  currentStore: string;
  locationPhoto?: string;
  onToggleCart: (item: Item) => void;
  onDelete: (item: Item) => void;
  onLocationPhoto: (item: Item) => void;
}

export default function ShoppingListItem({
  item,
  category,
  mode,
  currentStore,
  locationPhoto,
  onToggleCart,
  onDelete,
  onLocationPhoto,
}: ShoppingListItemProps) {
  const handleDelete = () => {
    Alert.alert('מחיקה', `למחוק את "${item.name}"?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => onDelete(item),
      },
    ]);
  };

  return (
    <View style={[styles.container, item.inCart && styles.completedContainer]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggleCart(item)}
      >
        <Ionicons
          name={item.inCart ? 'checkbox' : 'square-outline'}
          size={26}
          color={item.inCart ? '#4caf50' : '#999'}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, item.inCart && styles.completedName]}>
            {category?.icon} {item.name}
          </Text>
          {item.quantity ? (
            <Text style={styles.quantity}>{item.quantity}</Text>
          ) : null}
        </View>
        {item.addedByShopper && (
          <Text style={styles.shopperBadge}>נוסף בזמן קניה</Text>
        )}
      </View>

      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.photo} />
      ) : null}

      {mode === 'shopper' && currentStore && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => onLocationPhoto(item)}
        >
          {locationPhoto ? (
            <Image source={{ uri: locationPhoto }} style={styles.locationThumb} />
          ) : (
            <Ionicons name="camera-outline" size={22} color="#999" />
          )}
        </TouchableOpacity>
      )}

      {mode === 'creator' && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#e57373" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  completedContainer: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  checkbox: {
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    flexShrink: 1,
  },
  completedName: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  quantity: {
    fontSize: 13,
    color: '#888',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  shopperBadge: {
    fontSize: 11,
    color: '#ff9800',
    marginTop: 2,
    textAlign: 'right',
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  locationButton: {
    padding: 6,
    marginHorizontal: 4,
  },
  locationThumb: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  deleteButton: {
    padding: 6,
    marginHorizontal: 4,
  },
});
