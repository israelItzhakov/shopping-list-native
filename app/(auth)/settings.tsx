import { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../../hooks/AuthContext';
import { useFamilyData } from '../../hooks/useFamilyData';
import {
  joinFamily,
  updateStores,
  updateLists,
  updateCategories,
} from '../../services/firebase';
import { defaultCategories } from '../../utils/constants';
import { Store, ShoppingList, Category } from '../../types/models';

export default function SettingsScreen() {
  const { user, familyId, signOut } = useContext(AuthContext);
  const router = useRouter();
  const { stores, lists, categories, members } = useFamilyData(familyId);

  const [joinCode, setJoinCode] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  // Family Code
  const handleCopyCode = async () => {
    if (familyId) {
      await Clipboard.setStringAsync(familyId);
      Alert.alert('הועתק', 'קוד המשפחה הועתק ללוח');
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim() || !user) return;
    const success = await joinFamily(
      user.uid,
      user.email || '',
      user.displayName || '',
      joinCode.trim()
    );
    if (success) {
      Alert.alert('הצטרפת', 'הצטרפת למשפחה בהצלחה. הפעל מחדש את האפליקציה.');
    } else {
      Alert.alert('שגיאה', 'קוד משפחה לא נמצא');
    }
    setJoinCode('');
  };

  // Stores
  const handleAddStore = async () => {
    if (!newStoreName.trim() || !familyId) return;
    const id = newStoreName.trim().toLowerCase().replace(/\s+/g, '_');
    const updated: Store[] = [...stores, { id, name: newStoreName.trim() }];
    await updateStores(familyId, updated);
    setNewStoreName('');
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!familyId) return;
    Alert.alert('מחיקה', 'למחוק חנות זו?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          const updated = stores.filter((s) => s.id !== storeId);
          await updateStores(familyId, updated);
        },
      },
    ]);
  };

  // Lists
  const handleAddList = async () => {
    if (!newListName.trim() || !familyId) return;
    const id = 'list_' + Date.now();
    const updated: ShoppingList[] = [...lists, { id, name: newListName.trim() }];
    await updateLists(familyId, updated);
    setNewListName('');
  };

  const handleDeleteList = async (listId: string) => {
    if (!familyId || listId === 'default') return;
    Alert.alert('מחיקה', 'למחוק רשימה זו?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          const updated = lists.filter((l) => l.id !== listId);
          await updateLists(familyId, updated);
        },
      },
    ]);
  };

  // Categories
  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !familyId) return;
    const id = 'custom_' + Date.now();
    const maxOrder = Math.max(
      ...Object.values(categories).map((c) => c.order),
      0
    );
    const updated: Record<string, Category> = {
      ...categories,
      [id]: {
        name: newCategoryName.trim(),
        icon: newCategoryIcon.trim() || '📦',
        color: '#ECEFF1',
        order: maxOrder + 1,
      },
    };
    await updateCategories(familyId, updated);
    setNewCategoryName('');
    setNewCategoryIcon('');
  };

  const handleDeleteCategory = async (catKey: string) => {
    if (!familyId || defaultCategories[catKey]) return;
    Alert.alert('מחיקה', 'למחוק קטגוריה זו?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          const updated = { ...categories };
          delete updated[catKey];
          await updateCategories(familyId, updated);
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('התנתקות', 'האם אתה בטוח?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הגדרות</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>חשבון</Text>
          <Text style={styles.userInfo}>{user?.displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Family Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>קוד משפחה</Text>
          <View style={styles.codeRow}>
            <Text style={styles.familyCode}>{familyId}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Ionicons name="copy-outline" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>שתף קוד זה עם בני המשפחה</Text>

          {/* Members */}
          {members.length > 0 && (
            <View style={styles.membersList}>
              {members.map((email) => (
                <Text key={email} style={styles.memberEmail}>
                  {email}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Join Family */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הצטרף למשפחה</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="הזן קוד משפחה"
              placeholderTextColor="#999"
              textAlign="right"
            />
            <TouchableOpacity style={styles.smallButton} onPress={handleJoinFamily}>
              <Text style={styles.smallButtonText}>הצטרף</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>חנויות</Text>
          {stores.map((store) => (
            <View key={store.id} style={styles.listItem}>
              <Text style={styles.listItemText}>{store.name}</Text>
              <TouchableOpacity onPress={() => handleDeleteStore(store.id)}>
                <Ionicons name="trash-outline" size={18} color="#e57373" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={newStoreName}
              onChangeText={setNewStoreName}
              placeholder="שם חנות חדשה"
              placeholderTextColor="#999"
              textAlign="right"
            />
            <TouchableOpacity style={styles.smallButton} onPress={handleAddStore}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Lists */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>רשימות</Text>
          {lists.map((list) => (
            <View key={list.id} style={styles.listItem}>
              <Text style={styles.listItemText}>{list.name}</Text>
              {list.id !== 'default' && (
                <TouchableOpacity onPress={() => handleDeleteList(list.id)}>
                  <Ionicons name="trash-outline" size={18} color="#e57373" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="שם רשימה חדשה"
              placeholderTextColor="#999"
              textAlign="right"
            />
            <TouchableOpacity style={styles.smallButton} onPress={handleAddList}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>קטגוריות</Text>
          {Object.entries(categories)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key, cat]) => (
              <View key={key} style={styles.listItem}>
                <Text style={styles.listItemText}>
                  {cat.icon} {cat.name}
                </Text>
                {!defaultCategories[key] && (
                  <TouchableOpacity onPress={() => handleDeleteCategory(key)}>
                    <Ionicons name="trash-outline" size={18} color="#e57373" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { width: 50 }]}
              value={newCategoryIcon}
              onChangeText={setNewCategoryIcon}
              placeholder="📦"
              textAlign="center"
            />
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="שם קטגוריה"
              placeholderTextColor="#999"
              textAlign="right"
            />
            <TouchableOpacity style={styles.smallButton} onPress={handleAddCategory}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#e57373" />
          <Text style={styles.signOutText}>התנתק</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>גרסה 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  userInfo: {
    fontSize: 16,
    color: '#444',
    textAlign: 'right',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
  },
  codeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 10,
  },
  familyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    flex: 1,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    padding: 6,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  membersList: {
    marginTop: 10,
  },
  memberEmail: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
    paddingVertical: 3,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    writingDirection: 'rtl',
  },
  inputFlex: {
    flex: 1,
  },
  smallButton: {
    backgroundColor: '#667eea',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  listItemText: {
    fontSize: 15,
    color: '#444',
    textAlign: 'right',
  },
  signOutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 10,
  },
  signOutText: {
    fontSize: 16,
    color: '#e57373',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#ccc',
    paddingBottom: 30,
    paddingTop: 10,
  },
});
