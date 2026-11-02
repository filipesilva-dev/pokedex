import { PokemonDetail, PokemonListResponse, PokemonSpecies } from '../types/pokemon';

const BASE_URL = 'https://pokeapi.co/api/v2';
export const PAGE_SIZE = 20;

/** Extrai o ID numérico da URL de um Pokémon (…/pokemon/25/) */
export function extractIdFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  const id = Number(last);
  if (!Number.isFinite(id)) {
    throw new Error(`Não foi possível extrair id da URL: ${url}`);
  }
  return id;
}

export async function fetchPokemonList(url: string): Promise<PokemonListResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar lista: ${res.status}`);
  return res.json();
}

export async function fetchPokemonDetail(url: string): Promise<PokemonDetail> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar Pokémon: ${res.status}`);
  const data = (await res.json()) as PokemonDetail;

  // Garantia: se o JSON não trouxer id válido, extrai da URL
  if (typeof data.id !== 'number' || !Number.isFinite(data.id)) {
    data.id = extractIdFromUrl(url);
  }
  return data;
}

export async function fetchPokemonSpecies(id: number): Promise<PokemonSpecies> {
  const res = await fetch(`${BASE_URL}/pokemon-species/${id}`);
  if (!res.ok) throw new Error(`Erro ao buscar espécie: ${res.status}`);
  return res.json();
}

export function buildListUrl(offset: number, limit = PAGE_SIZE): string {
  return `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
}

export function getArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
