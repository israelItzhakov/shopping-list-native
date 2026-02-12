import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Category } from '../types/models';

interface CategoryFilterProps {
  categories: Record<string, Category>;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  itemCounts?: Record<string, number>;
}

export default function CategoryFilter({
  categories,
  activeFilter,
  onFilterChange,
  itemCounts,
}: CategoryFilterProps) {
  const sortedCategories = Object.entries(categories).sort(
    ([, a], [, b]) => a.order - b.order
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      <TouchableOpacity
        style={[styles.pill, activeFilter === 'all' && styles.activePill]}
        onPress={() => onFilterChange('all')}
      >
        <Text style={[styles.pillText, activeFilter === 'all' && styles.activePillText]}>
          הכל
        </Text>
      </TouchableOpacity>

      {sortedCategories.map(([key, cat]) => {
        const count = itemCounts?.[key] ?? 0;
        if (count === 0 && activeFilter !== key) return null;

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.pill,
              activeFilter === key && styles.activePill,
              { backgroundColor: activeFilter === key ? cat.color : '#f5f5f5' },
            ]}
            onPress={() => onFilterChange(key)}
          >
            <Text
              style={[styles.pillText, activeFilter === key && styles.activePillText]}
            >
              {cat.icon} {cat.name}
              {count > 0 ? ` (${count})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 50,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row-reverse',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activePill: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  pillText: {
    fontSize: 13,
    color: '#666',
  },
  activePillText: {
    color: '#333',
    fontWeight: '600',
  },
});
