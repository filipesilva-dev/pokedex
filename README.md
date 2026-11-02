# 🔴 Pokédex

Aplicativo móvel de Pokédex desenvolvido em **React Native** com **Expo** e **TypeScript**, consumindo a [PokéAPI](https://pokeapi.co/). Lista Pokémon com scroll infinito, busca por nome e uma tela de detalhes com estatísticas, habilidades e descrição.

---

## 📱 Preview

| Lista | Detalhes |
|-------|----------|
| Cards com imagem, número, nome e tipos coloridos | Stats em barras, habilidades, peso, altura e descrição |

---

## ✨ Funcionalidades

- **Listagem paginada** — carrega os 20 primeiros Pokémon ao iniciar
- **Scroll infinito** — busca os próximos 20 automaticamente ao rolar até o fim
- **Busca por nome** — filtragem client-side instantânea
- **Pull-to-refresh** — recarrega a primeira página com gesto nativo
- **Tela de detalhes** — imagem em alta resolução, tipos, descrição, peso, altura, estatísticas base e habilidades
- **Cores por tipo** — cada tipo (Fire, Water, Grass…) tem sua paleta oficial
- **Tratamento de erro** — tela de retry quando o fetch falha
- **Fallback de imagem** — se o artwork oficial não existir, usa a URL direta do GitHub
- **Performance** — `removeClippedSubviews`, `initialNumToRender` e `maxToRenderPerBatch` configurados

---

## 🧰 Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | [React Native](https://reactnative.dev/) |
| Plataforma | [Expo](https://expo.dev/) (SDK 58) |
| Linguagem | [TypeScript](https://www.typescriptlang.org/) |
| Navegação | [React Navigation](https://reactnavigation.org/) (native-stack) |
| HTTP | `fetch` nativo |
| API | [PokéAPI v2](https://pokeapi.co/docs/v2) |

---

## 📂 Estrutura

```
Pokedex/
├── App.tsx                          # Entrada + navegação (Stack)
└── src/
    ├── types/
    │   └── pokemon.ts               # Contratos de dados da API
    ├── constants/
    │   └── typeColors.ts            # Paleta de cores por tipo
    ├── services/
    │   └── pokeapi.ts               # Camada de acesso à PokéAPI
    ├── screens/
    │   ├── HomeScreen.tsx           # Lista + scroll infinito + busca
    │   └── DetailScreen.tsx         # Detalhes do Pokémon
    └── components/
        ├── PokemonCard.tsx          # Card da lista
        ├── TypeBadge.tsx            # Badge colorida de tipo
        └── ErrorView.tsx            # Tela de erro com retry
```

A arquitetura segue o princípio da **separação de responsabilidades**:

- `types/` — apenas contratos, sem lógica
- `constants/` — dados fixos
- `services/` — toda a comunicação HTTP, sem JSX
- `screens/` — orquestração de estado, efeitos e navegação
- `components/` — apresentação pura, recebem props

---

## 🚀 Como executar

### Pré-requisitos

- Node.js 18+ (recomendado 20 LTS)
- `npx` disponível
- App **Expo Go** no celular (Android/iOS) **ou** emulador configurado
- Git (opcional)

### Passos

```bash
# 1. Clonar o repositório
git clone <URL_DO_REPOSITORIO>
cd Pokedex

# 2. Instalar dependências
npm install

# 3. Iniciar o servidor de desenvolvimento
npx expo start
```

Em seguida:

- Pressione `a` para abrir no Android
- Pressione `i` para abrir no iOS (macOS)
- Pressione `w` para abrir no navegador
- Ou escaneie o QR Code com o **Expo Go**

Para limpar o cache do Metro (útil ao trocar dependências):

```bash
npx expo start -c
```

---

## 🔌 Integração com a PokéAPI

Base URL: `https://pokeapi.co/api/v2`

| Endpoint | Uso |
|----------|-----|
| `GET /pokemon?limit=20&offset=0` | Listagem paginada |
| `GET /pokemon/{id}` | Detalhes (imagem, tipos, stats, habilidades) |
| `GET /pokemon-species/{id}` | Descrição e gênero |

### Fluxo de uma página

1. `fetchPokemonList(url)` retorna 20 itens com `{ name, url }` — **sem imagem nem tipo**.
2. Para cada item, `fetchPokemonDetail(item.url)` é chamado em paralelo com `Promise.all`.
3. O array consolidado é enviado ao estado com deduplicação por `id`.

### Detalhes de implementação

**Extração de ID:** a listagem retorna URLs como `.../pokemon/25/`. A função `extractIdFromUrl` faz o parse do último segmento e garante que o `id` seja sempre um número válido — injetando na resposta do detalhe caso o JSON venha incompleto.

**Fallback de imagem:** se `sprites.other['official-artwork'].front_default` não existir, o app monta a URL direta do GitHub:

```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png
```

**Descrição:** a PokéAPI retorna `flavor_text` com quebras de linha e caracteres de controle (`\n`, `\f`). O app normaliza com `replace(/\s+/g, ' ')` e seleciona a entrada em inglês.

---

## 🧠 Decisões técnicas

### Concorrência controlada

Três refs previnem condições de corrida comuns em React Native:

| Ref | Propósito |
|-----|-----------|
| `inFlightRef` | Impede múltiplas requisições simultâneas disparadas pelo `onEndReached` ou pull-to-refresh |
| `initialLoadedRef` | Garante que a primeira carga rode uma vez, mesmo com o double-invoke do `useEffect` em StrictMode |
| `mountedRef` | Evita `setState` após o componente desmontar |

### Deduplicação por ID

Antes de atualizar o estado, `dedupeById` filtra itens com `id` repetido usando um `Set`. Isso protege contra duplicatas geradas por requisições concorrentes ou comportamento inesperado da API.

### `keyExtractor` estável

```tsx
keyExtractor={(item, index) =>
  item?.id != null ? `pokemon-${item.id}` : `fallback-${index}`
}
```

O prefixo `pokemon-` evita colisão com outras keys do app, e o fallback por índice garante que nenhum item fique com `key` `undefined` — o que causaria avisos de "duplicate key" no React.

### `Promise.all` com propagação de erro

Diferente de `Promise.allSettled`, o `Promise.all` **falha rápido**: se uma das 20 requisições de detalhe falhar, o `loadPage` lança erro e o usuário vê a `ErrorView` com opção de retry. Isso é preferível a exibir itens parcialmente carregados sem aviso.

### `ListFooterComponent` tipado

A função `renderFooter()` retorna `undefined` (não `null`) quando não há loader, respeitando a assinatura de tipos do `FlatList` no React Native SDK 58.

---

## 🎨 Design

- **Tema:** vermelho Pokédex (`#cc0000`) como cor de destaque
- **Cards:** fundo branco, bordas arredondadas, elevação sutil
- **Badges de tipo:** cores oficiais da franquia, texto em maiúsculas, contraste garantido
- **Barras de estatística:** proporção `base_stat / 255`, com largura limitada a 100%
- **Layout responsivo:** `FlatList` com `contentContainerStyle` e `paddingBottom`

---

## 🧪 Qualidade de código

- **TypeScript estrito** — todos os contratos da API tipados em `types/pokemon.ts`
- **Validação de tipos** — `npx tsc --noEmit` passa sem erros
- **Sem dependências supérfluas** — apenas React Navigation para navegação
- **Camadas isoladas** — o service pode ser testado sem UI, os componentes sem rede

### Comandos úteis

```bash
# Verificar tipos
npx tsc --noEmit

# Iniciar com cache limpo
npx expo start -c

# Rodar no navegador
npx expo start --web
```

---

## 🛠️ Solução de problemas

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `Encountered two children with the same key` | Itens duplicados no array | Verificar `dedupeById` e as refs de concorrência |
| Imagens não carregam | Rate limit da CDN ou URL inválida | O fallback `getArtworkUrl(id)` cobre automaticamente |
| Tela em branco no Expo Go | Metro com cache antigo | `npx expo start -c` |
| `Type 'null' is not assignable` | Componente de lista recebendo `null` | Usar `undefined` ou retornar função |

---

## 📚 Referências

- [PokéAPI v2 — Documentação](https://pokeapi.co/docs/v2)
- [React Native — Documentação](https://reactnative.dev/docs/getting-started)
- [Expo — Documentação](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [MDN — Fetch API](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API)

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

---

## 👤 Autor

**Filipe Silva**
