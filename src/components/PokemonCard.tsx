import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PokemonDetail } from '../types/pokemon';
import { getArtworkUrl } from '../services/pokeapi';
import { TypeBadge } from './TypeBadge';

type Props = {
  pokemon: PokemonDetail;
  onPress: () => void;
};

export function PokemonCard({ pokemon, onPress }: Props) {
  const imageUrl =
    pokemon.sprites.other?.['official-artwork']?.front_default ||
    getArtworkUrl(pokemon.id);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.number}>#{String(pokemon.id).padStart(3, '0')}</Text>
        <Text style={styles.name}>{pokemon.name}</Text>
        <View style={styles.types}>
          {pokemon.types.map((t) => (
            <TypeBadge key={`type-${t.type.name}`} type={t.type.name} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  image: { width: 72, height: 72, resizeMode: 'contain' },
  info: { flex: 1, marginLeft: 14 },
  number: { fontSize: 12, color: '#999', fontWeight: '600' },
  name: {
    fontSize: 17,
    fontWeight: '700',
    marginVertical: 2,
    textTransform: 'capitalize',
  },
  types: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
});
