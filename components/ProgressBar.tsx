import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  total: number;
  completed: number;
}

export default function ProgressBar({ total, completed }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.text}>
        {completed}/{total} ({percentage}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    color: '#666',
    minWidth: 80,
    textAlign: 'left',
  },
});
