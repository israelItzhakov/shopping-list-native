import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppMode } from '../types/models';

interface ModeToggleProps {
  mode: AppMode;
  onToggle: (mode: AppMode) => void;
}

export default function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, mode === 'shopper' && styles.activeButton]}
        onPress={() => onToggle('shopper')}
      >
        <Text style={[styles.text, mode === 'shopper' && styles.activeText]}>
          🛒 קניות
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, mode === 'creator' && styles.activeButton]}
        onPress={() => onToggle('creator')}
      >
        <Text style={[styles.text, mode === 'creator' && styles.activeText]}>
          ✏️ עריכה
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 22,
  },
  activeButton: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  text: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  activeText: {
    color: '#333',
    fontWeight: '600',
  },
});
