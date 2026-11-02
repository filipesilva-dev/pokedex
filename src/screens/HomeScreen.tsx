import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PokemonDetail } from '../types/pokemon';
import {
  buildListUrl,
  fetchPokemonDetail,
  fetchPokemonList,
  PAGE_SIZE,
} from '../services/pokeapi';
import { PokemonCard } from '../components/PokemonCard';
import { ErrorView } from '../components/ErrorView';

export type RootStackParamList = {
  Home: undefined;
  Detail: { id: number; name: string };
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

/** Remove duplicatas por id, mantendo a primeira ocorrência */
function dedupeById(list: PokemonDetail[]): PokemonDetail[] {
  const seen = new Set<number>();
  const out: PokemonDetail[] = [];
  for (const p of list) {
    if (p && typeof p.id === 'number' && Number.isFinite(p.id) && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();

  const [pokemons, setPokemons] = useState<PokemonDetail[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(buildListUrl(0));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Guarda de concorrência: impede que duas requisições rodem em paralelo
  const inFlightRef = useRef(false);
  // Guarda do StrictMode: só deixa o "initial" rodar uma vez
  const initialLoadedRef = useRef(false);
  // Flag para o caso de o componente desmontar no meio da requisição
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (url: string, mode: 'initial' | 'more' | 'refresh' = 'initial') => {
      // Bloqueia chamadas concorrentes (StrictMode, pull-to-refresh duplo, etc.)
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        setError(null);

        if (mode === 'initial') setLoading(true);
        if (mode === 'more') setLoadingMore(true);
        if (mode === 'refresh') setRefreshing(true);

        const listData = await fetchPokemonList(url);
        const details = await Promise.all(
          listData.results.map((item) => fetchPokemonDetail(item.url))
        );

        if (!mountedRef.current) return;

        setPokemons((prev) => {
          const merged = mode === 'more' ? [...prev, ...details] : details;
          return dedupeById(merged);
        });
        setNextUrl(listData.next);
      } catch (e) {
        if (mountedRef.current) setError(String(e));
      } finally {
        inFlightRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  // Carrega primeira página só uma vez (StrictMode roda o effect 2x)
  useEffect(() => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    loadPage(buildListUrl(0), 'initial');
  }, [loadPage]);

  const handleLoadMore = () => {
    if (!nextUrl || loading || loadingMore || inFlightRef.current) return;
    loadPage(nextUrl, 'more');
  };

  const handleRefresh = () => {
    if (inFlightRef.current) return;
    loadPage(buildListUrl(0), 'refresh');
  };

  const filtered = search.trim()
    ? pokemons.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : pokemons;

  if (loading && pokemons.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#cc0000" />
        <Text style={styles.loadingText}>Carregando Pokédex…</Text>
      </View>
    );
  }

  if (error && pokemons.length === 0) {
    return (
      <ErrorView
        message={error}
        onRetry={() => loadPage(buildListUrl(0), 'initial')}
      />
    );
  }

  const renderFooter = () =>
    loadingMore ? (
      <ActivityIndicator size="small" color="#cc0000" style={styles.footer} />
    ) : undefined;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar Pokémon por nome…"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item, index) =>
          item?.id != null ? `pokemon-${item.id}` : `fallback-${index}`
        }
        renderItem={({ item }) => (
          <PokemonCard
            pokemon={item}
            onPress={() =>
              navigation.navigate('Detail', { id: item.id, name: item.name })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#cc0000']}
          />
        }
        ListFooterComponent={renderFooter()}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search ? 'Nenhum Pokémon encontrado.' : 'Nenhum dado carregado.'}
          </Text>
        }
        removeClippedSubviews
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', paddingHorizontal: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
  search: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  listContent: { paddingBottom: 24 },
  footer: { marginVertical: 16 },
  empty: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 15 },
});
