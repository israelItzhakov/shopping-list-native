import { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Product } from '../types/models';
import { findBestMatch, normalizeProductName } from '../services/productMatcher';

interface AutocompleteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectProduct: (product: Product) => void;
  productDatabase: Record<string, Product>;
  placeholder?: string;
}

export default function AutocompleteInput({
  value,
  onChangeText,
  onSelectProduct,
  productDatabase,
  placeholder = 'שם המוצר',
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const updateSuggestions = useCallback(
    (text: string) => {
      onChangeText(text);

      if (text.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const normalized = normalizeProductName(text);
      const allProducts = Object.values(productDatabase);

      // Filter products that start with or contain the search text
      const matches = allProducts
        .filter((p) => {
          const pName = normalizeProductName(p.name);
          return pName.includes(normalized) || normalized.includes(pName);
        })
        .slice(0, 8);

      // If no substring matches, try fuzzy
      if (matches.length === 0) {
        const bestMatch = findBestMatch(text, productDatabase);
        if (bestMatch) {
          matches.push(bestMatch);
        }
      }

      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    },
    [productDatabase, onChangeText]
  );

  const handleSelect = (product: Product) => {
    onChangeText(product.name);
    onSelectProduct(product);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={updateSuggestions}
        placeholder={placeholder}
        placeholderTextColor="#999"
        textAlign="right"
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
      />
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.suggestionText}>{item.name}</Text>
                <Text style={styles.suggestionCategory}>{item.category}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    maxHeight: 200,
    marginTop: 4,
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#999',
  },
});
