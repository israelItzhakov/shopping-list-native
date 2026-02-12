import { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../../hooks/AuthContext';
import { useFamilyData } from '../../hooks/useFamilyData';
import { updateLocationPhotos } from '../../services/firebase';

export default function LocationPhotoScreen() {
  const { familyId } = useContext(AuthContext);
  const router = useRouter();
  const { itemId, itemName } = useLocalSearchParams<{
    itemId: string;
    itemName: string;
  }>();

  const { currentStore, locationPhotos } = useFamilyData(familyId);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const locationKey = `${itemId}_${currentStore}`;
  const existingPhoto = locationPhotos[locationKey];

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.5,
    });

    if (photo?.base64) {
      setCapturedPhoto(`data:image/jpeg;base64,${photo.base64}`);
    }
  };

  const handleSave = async () => {
    if (!familyId || !capturedPhoto) return;

    const updated = { ...locationPhotos, [locationKey]: capturedPhoto };
    await updateLocationPhotos(familyId, updated);
    router.back();
  };

  const handleDelete = () => {
    if (!familyId || !existingPhoto) return;
    Alert.alert('מחיקה', 'למחוק תמונת מיקום זו?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          const updated = { ...locationPhotos };
          delete updated[locationKey];
          await updateLocationPhotos(familyId, updated);
          router.back();
        },
      },
    ]);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            יש לאשר גישה למצלמה כדי לצלם תמונות מיקום
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>אשר גישה</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>חזור</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show existing photo or captured photo
  if (existingPhoto && !capturedPhoto) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{itemName}</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.previewContainer}>
          <Image source={{ uri: existingPhoto }} style={styles.fullImage} />
          <View style={styles.previewButtons}>
            <TouchableOpacity
              style={[styles.previewButton, styles.retakeButton]}
              onPress={() => setCapturedPhoto(null)}
            >
              <Ionicons name="camera" size={20} color="#667eea" />
              <Text style={styles.retakeText}>צלם חדש</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#e57373" />
              <Text style={styles.deleteText}>מחק</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (capturedPhoto) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{itemName}</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.fullImage} />
          <View style={styles.previewButtons}>
            <TouchableOpacity
              style={[styles.previewButton, styles.retakeButton]}
              onPress={() => setCapturedPhoto(null)}
            >
              <Ionicons name="camera" size={20} color="#667eea" />
              <Text style={styles.retakeText}>צלם שוב</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveText}>שמור</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>{itemName}</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.cameraBottom}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelText: {
    color: '#999',
    fontSize: 14,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewButtons: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },
  previewButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retakeButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  retakeText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '600',
  },
  saveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 15,
    color: '#e57373',
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cameraBottom: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
