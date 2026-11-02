import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './HomeScreen';
import { PokemonDetail, PokemonSpecies } from '../types/pokemon';
import {
  fetchPokemonDetail,
  fetchPokemonSpecies,
  getArtworkUrl,
} from '../services/pokeapi';
import { TypeBadge } from '../components/TypeBadge';

type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;

export function DetailScreen() {
  const route = useRoute<DetailRoute>();
  const { id } = route.params;

  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [detail, specie] = await Promise.all([
          fetchPokemonDetail(`https://pokeapi.co/api/v2/pokemon/${id}`),
          fetchPokemonSpecies(id),
        ]);
        if (!cancelled) {
          setPokemon(detail);
          setSpecies(specie);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !pokemon) {
    return (
      <View style={styles.center}>
        {error ? (
          <Text style={styles.errorText}>Erro: {error}</Text>
        ) : (
          <ActivityIndicator size="large" color="#cc0000" />
        )}
      </View>
    );
  }

  const imageUrl =
    pokemon.sprites.other?.['official-artwork']?.front_default ||
    getArtworkUrl(pokemon.id);

  const description =
    species?.flavor_text_entries
      .find((e) => e.language.name === 'en')
      ?.flavor_text.replace(/\s+/g, ' ') ?? 'Descrição não disponível.';

  const genus =
    species?.genera.find((g) => g.language.name === 'en')?.genus ?? '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.image} />

      <Text style={styles.number}>#{String(pokemon.id).padStart(3, '0')}</Text>
      <Text style={styles.name}>{pokemon.name}</Text>
      {genus ? <Text style={styles.genus}>{genus}</Text> : null}

      <View style={styles.types}>
        {pokemon.types.map((t) => (
          <TypeBadge key={`type-${t.type.name}`} type={t.type.name} />
        ))}
      </View>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.measureRow}>
        <View style={styles.measureBox}>
          <Text style={styles.measureValue}>
            {(pokemon.weight / 10).toFixed(1)} kg
          </Text>
          <Text style={styles.measureLabel}>Peso</Text>
        </View>
        <View style={styles.measureBox}>
          <Text style={styles.measureValue}>
            {(pokemon.height / 10).toFixed(1)} m
          </Text>
          <Text style={styles.measureLabel}>Altura</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Estatísticas base</Text>
      {pokemon.stats.map((s) => (
        <View key={`stat-${s.stat.name}`} style={styles.statRow}>
          <Text style={styles.statName}>{s.stat.name}</Text>
          <View style={styles.statBarBg}>
            <View
              style={[
                styles.statBarFill,
                { width: `${Math.min((s.base_stat / 255) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.statValue}>{s.base_stat}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Habilidades</Text>
      <View style={styles.abilities}>
        {pokemon.abilities.map((a) => (
          <View key={`ability-${a.ability.name}`} style={styles.abilityBadge}>
            <Text style={styles.abilityText}>
              {a.ability.name}
              {a.is_hidden ? ' (oculta)' : ''}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 15, color: '#cc0000', textAlign: 'center', padding: 20 },
  image: { width: 180, height: 180, resizeMode: 'contain' },
  number: { fontSize: 14, color: '#999', fontWeight: '600' },
  name: { fontSize: 28, fontWeight: '800', textTransform: 'capitalize' },
  genus: { fontSize: 14, color: '#777', marginTop: 2, fontStyle: 'italic' },
  types: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 20,
  },
  measureRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  measureBox: { alignItems: 'center' },
  measureValue: { fontSize: 18, fontWeight: '700' },
  measureLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 6,
  },
  statName: { width: 90, fontSize: 12, textTransform: 'capitalize', color: '#555' },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: { height: 8, backgroundColor: '#4caf50', borderRadius: 4 },
  statValue: { width: 36, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  abilities: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'flex-start' },
  abilityBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  abilityText: { fontSize: 13, textTransform: 'capitalize' },
});
