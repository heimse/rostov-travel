import * as React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PreferencesContext } from './preferencesContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fetchPlaces, normalizeCategory, cityFromAddress, parsePriceToRub, parseLatLon, type PlaceApi } from './api';

type Category = 'all' | 'interests' | 'favorites' | 'museum' | 'theatre' | 'restaurant' | 'hotel' | 'park' | 'monument' | 'church' | 'market';

export type Attraction = {
  id: string;
  name: string;
  city: string;
  category: Category;
  rating: number;
  priceRUB?: number;
  time?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  yandexMapsLink?: string;
  twoGisLink?: string;
  bookLink?: string;
  buyTicketsLink?: string;
  reviews?: Array<{ name?: string; review?: string; rating?: number }>;
};

const CATEGORIES: { key: Category; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'all', label: 'Все', icon: 'shape-outline' },
  
  { key: 'interests', label: 'По интересам', icon: 'tune' },
  { key: 'favorites', label: 'Избранное', icon: 'heart-outline' },
  { key: 'museum', label: 'Музей', icon: 'bank-outline' },
  { key: 'theatre', label: 'Театр', icon: 'drama-masks' },
  { key: 'restaurant', label: 'Ресторан', icon: 'silverware-fork-knife' },
  { key: 'hotel', label: 'Отель', icon: 'bed-queen-outline' },
  { key: 'park', label: 'Парк', icon: 'tree-outline' },
  { key: 'monument', label: 'Памятник', icon: 'pillar' },
  { key: 'church', label: 'Церковь', icon: 'church-outline' },
  { key: 'market', label: 'Рынок', icon: 'storefront-outline' },
];

function mapPlaceToAttraction(p: PlaceApi): Attraction | null {
  const name = p.data?.name?.trim();
  if (!name) return null;
  const category = normalizeCategory(p.meta?.type) as Category;
  const city = cityFromAddress(p.data?.address) || '';
  const rating = typeof p.data?.avgRating === 'number' ? p.data!.avgRating! : 0;
  const priceRUB = parsePriceToRub(p.data?.price);
  const { latitude, longitude } = parseLatLon(p.data?.location);
  return {
    id: p.id,
    name,
    city,
    category,
    rating: rating || 0,
    priceRUB,
    time: p.data?.time,
    description: p.data?.description,
    address: p.data?.address,
    latitude,
    longitude,
    yandexMapsLink: p.data?.yandexMapsLink,
    twoGisLink: p.data?.twoGisLink,
    bookLink: p.data?.bookLink,
    buyTicketsLink: p.data?.buyTicketsLink,
    reviews: p.data?.reviews,
  };
}

export default function AttractionsListScreen() {
  const navigation = useNavigation<any>();
  const { interests, authToken, logout, favoriteAttractionIds } = React.useContext(PreferencesContext);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<Category>('all');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Attraction[]>([]);

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchPlaces(authToken || undefined);
        if (aborted) return;
        const mapped = raw.map(mapPlaceToAttraction).filter(Boolean) as Attraction[];
        setItems(mapped);
        setError(null);
      } catch (e) {
        // @ts-ignore
        if (e && (e as any).code === 'UNAUTHORIZED') {
          logout();
        } else {
          setError('Не удалось загрузить данные');
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  const onRetry = () => {
    setError(null);
    // повторный вызов эффекта
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchPlaces(authToken || undefined);
        const mapped = raw.map(mapPlaceToAttraction).filter(Boolean) as Attraction[];
        setItems(mapped);
      } catch (e) {
        // @ts-ignore
        if (e && (e as any).code === 'UNAUTHORIZED') {
          logout();
        } else {
          setError('Не удалось загрузить данные');
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (it: Attraction) => (q ? it.name.toLowerCase().includes(q) || it.city.toLowerCase().includes(q) : true);
    if (category === 'all') {
      return items.filter(matchesQuery);
    }
    if (category === 'interests') {
      const map: Record<string, Category> = {
        museums: 'museum',
        theatres: 'theatre',
        parks: 'park',
        monuments: 'monument',
        churches: 'church',
        markets: 'market',
        restaurants: 'restaurant',
        hotels: 'hotel',
      };
      const activeCats = new Set<Category>(
        Object.entries(interests)
          .filter(([, v]) => v)
          .map(([k]) => map[k as keyof typeof map])
          .filter(Boolean) as Category[]
      );
      if (activeCats.size === 0) return items.filter(matchesQuery);
      return items.filter((it) => activeCats.has(it.category)).filter(matchesQuery);
    }
    if (category === 'favorites') {
      return items.filter((it) => favoriteAttractionIds.has(it.id)).filter(matchesQuery);
    }
    return items.filter((it) => it.category === category).filter(matchesQuery);
  }, [query, category, interests, items, favoriteAttractionIds]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" />
          </Pressable>
          <Text style={styles.pageTitle}>Достопримечательности</Text>
        </View>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={22} color="#7C889E" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск достопримечательности…"
            placeholderTextColor="#7C889E"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9FB2D9" />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <MaterialCommunityIcons name={c.icon} size={16} color={active ? '#FFFFFF' : '#C7D2E9'} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.list}>
          {Array.from({ length: 6 }).map((_, idx) => (
            // @ts-expect-error - key is valid in JSX
            <View key={idx} style={styles.skeletonCard}>
              <View style={styles.skeletonIcon} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={styles.skeletonLineLg} />
                <View style={styles.skeletonLineSm} />
              </View>
              <View style={styles.skeletonPrice} />
            </View>
          ))}
        </View>
      ) : !!error ? (
        <View style={styles.centerError}>
          <MaterialCommunityIcons name="wifi-off" size={36} color="#A6B3C8" />
          <Text style={styles.centerErrorTitle}>Не удалось загрузить данные</Text>
          <Text style={styles.centerErrorText}>Проверьте подключение к интернету и попробуйте снова.</Text>
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Повторить</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="emoticon-sad-outline" size={32} color="#A6B3C8" />
          <Text style={styles.emptyText}>Нет результатов</Text>
          <Pressable onPress={() => { setQuery(''); setCategory('all'); }} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Сбросить фильтры</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const price = item.priceRUB && item.priceRUB > 0 ? `${item.priceRUB} ₽` : '0 ₽';
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('AttractionDetail', { item })}
              >
                <View style={styles.cardIconWrap}>
                  <MaterialCommunityIcons name={iconByCategory(item.category)} size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.rowCenter}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#9FB2D9" />
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{item.city}</Text>
                  </View>
                  <View style={styles.rowCenter}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{labelByCategory(item.category)}</Text>
                    </View>
                  </View>
                  <View style={styles.rowCenter}>
                    {renderStars(item.rating)}
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.priceText}>{price}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9FB2D9" />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function iconByCategory(cat: Category): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  switch (cat) {
    case 'museum': return 'bank-outline';
    case 'theatre': return 'drama-masks';
    case 'restaurant': return 'silverware-fork-knife';
    case 'hotel': return 'bed-queen-outline';
    case 'park': return 'tree-outline';
    case 'monument': return 'pillar';
    case 'church': return 'church-outline';
    case 'market': return 'storefront-outline';
    default: return 'shape-outline';
  }
}

function labelByCategory(cat: Category): string {
  switch (cat) {
    case 'museum': return 'Музей';
    case 'theatre': return 'Театр';
    case 'restaurant': return 'Ресторан';
    case 'hotel': return 'Отель';
    case 'park': return 'Парк';
    case 'monument': return 'Памятник';
    case 'church': return 'Церковь';
    case 'market': return 'Рынок';
    default: return 'Все';
  }
}

function renderStars(rating: number) {
  const stars = [];
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  for (let i = 0; i < full && i < 5; i++) {
    // @ts-expect-error - key is valid in JSX
    stars.push(<MaterialCommunityIcons key={`full-${i}`} name="star" size={14} color="#F5C043" />);
  }
  if (half && stars.length < 5) {
    // @ts-expect-error - key is valid in JSX
    stars.push(<MaterialCommunityIcons key="half" name="star-half-full" size={14} color="#F5C043" />);
  }
  while (stars.length < 5) {
    // @ts-expect-error - key is valid in JSX
    stars.push(<MaterialCommunityIcons key={`empty-${stars.length}`} name="star-outline" size={14} color="#8C6F24" />);
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>{stars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  topBar: {
    padding: 16,
    gap: 12,
  },
  pageTitle: {
    color: '#E6EDF7',
    fontSize: 20,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0E1730',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#223154',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  searchInput: {
    flex: 1,
    color: '#F4F7FF',
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2E63E6',
    borderColor: '#2E63E6',
  },
  chipText: {
    color: '#C7D2E9',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C2A45',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardPressed: {
    backgroundColor: '#0E1730',
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#E6EDF7',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#9FB2D9',
    fontSize: 13,
    marginLeft: 4,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#C7D2E9',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingText: {
    color: '#C7D2E9',
    fontSize: 12,
    marginLeft: 6,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    flexShrink: 0,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#A6B3C8',
    fontSize: 15,
  },
  resetBtn: {
    marginTop: 6,
    backgroundColor: '#2E63E6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#162041',
    borderWidth: 1,
    borderColor: '#2A3D71',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastText: {
    color: '#DCE6FF',
    fontSize: 13,
  },
  toastAction: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#2E63E6',
    borderRadius: 8,
  },
  toastActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  centerErrorTitle: {
    color: '#E6EDF7',
    fontSize: 16,
    fontWeight: '800',
  },
  centerErrorText: {
    color: '#A6B3C8',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 6,
    backgroundColor: '#2E63E6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C2A45',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  skeletonIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
  },
  skeletonLineLg: {
    height: 12,
    backgroundColor: '#0E1730',
    borderRadius: 6,
    width: '60%',
  },
  skeletonLineSm: {
    height: 10,
    backgroundColor: '#0E1730',
    borderRadius: 6,
    width: '40%',
  },
  skeletonPrice: {
    width: 52,
    height: 14,
    backgroundColor: '#0E1730',
    borderRadius: 6,
  },
});


