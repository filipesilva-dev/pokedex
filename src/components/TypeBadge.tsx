import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getTypeColor } from '../constants/typeColors';

export function TypeBadge({ type }: { type: string }) {
  const colors = getTypeColor(type);
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
