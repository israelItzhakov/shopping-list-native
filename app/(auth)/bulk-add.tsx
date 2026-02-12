import { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../../hooks/AuthContext';
import { useFamilyData } from '../../hooks/useFamilyData';
import { batchAddItems, updateProductDatabase } from '../../services/firebase';
import { parseBulkText } from '../../services/bulkParser';
import { normalizeProductName } from '../../services/productMatcher';
import { BulkParsedItem } from '../../types/models';

export default function BulkAddScreen() {
  const { user, familyId } = useContext(AuthContext);
  const router = useRouter();
  const { productDatabase, currentListId, categories } = useFamilyData(familyId);

  const [text, setText] = useState('');
  const [parsedItems, setParsedItems] = useState<BulkParsedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleParse = () => {
    if (!text.trim()) return;
    const items = parseBulkText(text, productDatabase);
    setParsedItems(items);
    setShowPreview(true);
  };

  const toggleItem = (index: number) => {
    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectedCount = useMemo(
    () => parsedItems.filter((i) => i.selected).length,
    [parsedItems]
  );

  const handleAddAll = async () => {
    if (!familyId) return;
    const selected = parsedItems.filter((i) => i.selected);
    if (selected.length === 0) return;

    const newItems = selected.map((item) => ({
      id: String(Date.now() + Math.random() * 1000),
      listId: currentListId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      photo: '',
      inCart: false,
      addedByShopper: false,
      addedBy: user?.displayName || '',
      order: 0,
    }));

    await batchAddItems(familyId, newItems);

    // Update product database with new products
    const updatedDb = { ...productDatabase };
    let changed = false;
    selected.forEach((item) => {
      const key = normalizeProductName(item.name);
      if (!updatedDb[key]) {
        updatedDb[key] = {
          name: item.name,
          category: item.category,
          photo: '',
        };
        changed = true;
      }
    });
    if (changed) {
      await updateProductDatabase(familyId, updatedDb);
    }

    Alert.alert('נוספו', `${selected.length} פריטים נוספו לרשימה`);
    router.back();
  };

  const renderParsedItem = ({ item, index }: { item: BulkParsedItem; index: number }) => {
    const cat = categories[item.category];

    return (
      <TouchableOpacity
        style={[styles.parsedItem, !item.selected && styles.parsedItemDeselected]}
        onPress={() => toggleItem(index)}
      >
        <Ionicons
          name={item.selected ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.selected ? '#667eea' : '#ccc'}
        />
        <View style={styles.parsedItemContent}>
          <Text style={styles.parsedItemName}>
            {cat?.icon ?? '📦'} {item.name}
          </Text>
          {item.quantity ? (
            <Text style={styles.parsedItemQuantity}>{item.quantity}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.matchBadge,
            item.matched ? styles.matchBadgeGreen : styles.matchBadgeOrange,
          ]}
        >
          <Text style={styles.matchBadgeText}>
            {item.matched ? 'זוהה' : 'חדש'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.headerTitle}>הוספה מרשימה</Text>
          <View style={{ width: 28 }} />
        </View>

        {!showPreview ? (
          /* Text Input View */
          <View style={styles.content}>
            <Text style={styles.hint}>
              הדבק רשימת קניות מ-WhatsApp, הודעות טקסט, או כל מקור אחר
            </Text>
            <TextInput
              style={styles.textArea}
              value={text}
              onChangeText={setText}
              placeholder={'חלב 3%\nלחם\nעגבניות - 2 ק"ג\nביצים x12'}
              placeholderTextColor="#bbb"
              multiline
              textAlignVertical="top"
              textAlign="right"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.parseButton, !text.trim() && styles.parseButtonDisabled]}
              onPress={handleParse}
              disabled={!text.trim()}
            >
              <Text style={styles.parseButtonText}>נתח רשימה</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Preview View */
          <View style={styles.content}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {parsedItems.length} פריטים זוהו
              </Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Text style={styles.editLink}>ערוך טקסט</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={parsedItems}
              renderItem={renderParsedItem}
              keyExtractor={(_, index) => String(index)}
              contentContainerStyle={styles.parsedList}
            />

            <TouchableOpacity
              style={[styles.addAllButton, selectedCount === 0 && styles.addAllButtonDisabled]}
              onPress={handleAddAll}
              disabled={selectedCount === 0}
            >
              <Text style={styles.addAllButtonText}>
                הוסף {selectedCount} פריטים
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  hint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
    marginBottom: 12,
  },
  textArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 26,
    backgroundColor: '#fafafa',
    textAlign: 'right',
    minHeight: 200,
  },
  parseButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  parseButtonDisabled: {
    backgroundColor: '#ccc',
  },
  parseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editLink: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  parsedList: {
    gap: 6,
  },
  parsedItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    gap: 10,
  },
  parsedItemDeselected: {
    opacity: 0.5,
  },
  parsedItemContent: {
    flex: 1,
  },
  parsedItemName: {
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
  },
  parsedItemQuantity: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 2,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  matchBadgeGreen: {
    backgroundColor: '#e8f5e9',
  },
  matchBadgeOrange: {
    backgroundColor: '#fff3e0',
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  addAllButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addAllButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
