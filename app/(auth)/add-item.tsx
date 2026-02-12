import { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../../hooks/AuthContext';
import { useFamilyData } from '../../hooks/useFamilyData';
import { addItem, updateProductDatabase } from '../../services/firebase';
import { normalizeProductName } from '../../services/productMatcher';
import { Product } from '../../types/models';
import AutocompleteInput from '../../components/AutocompleteInput';

export default function AddItemScreen() {
  const { user, familyId } = useContext(AuthContext);
  const router = useRouter();
  const { categories, productDatabase, currentListId } = useFamilyData(familyId);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [quantity, setQuantity] = useState('');
  const [photo, setPhoto] = useState('');

  const handleSelectProduct = useCallback((product: Product) => {
    setName(product.name);
    setCategory(product.category);
    if (product.photo) setPhoto(product.photo);
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhoto(base64);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('שגיאה', 'יש להזין שם מוצר');
      return;
    }
    if (!familyId) return;

    const itemId = String(Date.now());

    await addItem(familyId, {
      id: itemId,
      listId: currentListId,
      name: name.trim(),
      category,
      quantity: quantity.trim(),
      photo,
      inCart: false,
      addedByShopper: false,
      addedBy: user?.displayName || '',
      order: 0,
    });

    // Update product database
    const key = normalizeProductName(name.trim());
    if (!productDatabase[key]) {
      const updatedDb = {
        ...productDatabase,
        [key]: { name: name.trim(), category, photo },
      };
      await updateProductDatabase(familyId, updatedDb);
    }

    router.back();
  };

  const sortedCategories = Object.entries(categories).sort(
    ([, a], [, b]) => a.order - b.order
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>הוספת מוצר</Text>
          <TouchableOpacity onPress={handleAdd}>
            <Text style={styles.addButton}>הוסף</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Product Name with Autocomplete */}
          <Text style={styles.label}>שם המוצר</Text>
          <AutocompleteInput
            value={name}
            onChangeText={setName}
            onSelectProduct={handleSelectProduct}
            productDatabase={productDatabase}
          />

          {/* Quantity */}
          <Text style={styles.label}>כמות</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="לדוגמה: 2 ליטר"
            placeholderTextColor="#999"
            textAlign="right"
          />

          {/* Category */}
          <Text style={styles.label}>קטגוריה</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {sortedCategories.map(([key, cat]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryChip,
                  category === key && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => setCategory(key)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === key && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.icon} {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Photo */}
          <Text style={styles.label}>תמונה</Text>
          <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#999" />
                <Text style={styles.photoPlaceholderText}>הוסף תמונה</Text>
              </View>
            )}
          </TouchableOpacity>
          {photo ? (
            <TouchableOpacity onPress={() => setPhoto('')}>
              <Text style={styles.removePhoto}>הסר תמונה</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    writingDirection: 'rtl',
  },
  categoriesRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
  },
  categoryChipTextActive: {
    fontWeight: '600',
    color: '#333',
  },
  photoButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
  },
  photoPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  removePhoto: {
    textAlign: 'center',
    color: '#e57373',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 20,
  },
});
