import * as React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fetchPlaces, cityFromAddress, normalizeCategory, parseLatLon } from './api';
import { PreferencesContext } from './preferencesContext';

type Category = 'all' | 'interests' | 'favorites' | 'museum' | 'theatre' | 'restaurant' | 'hotel' | 'park' | 'monument' | 'church' | 'market';

type MapPoint = {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  category: Category;
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

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const { authToken, logout, interests, favoriteAttractionIds } = React.useContext(PreferencesContext);
  const [points, setPoints] = React.useState<MapPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<Category>('all');

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const places = await fetchPlaces(authToken || undefined);
        if (aborted) return;
        const mapped: MapPoint[] = places
          .map((p) => {
            const coords = parseLatLon(p.data?.location);
            if (!coords.latitude || !coords.longitude) return null;
            const city = cityFromAddress(p.data?.address);
            const cat = normalizeCategory(p.meta?.type) as Category;
            return {
              id: p.id,
              title: p.data?.name || 'Место',
              description: [city, cat].filter(Boolean).join(' • '),
              latitude: coords.latitude,
              longitude: coords.longitude,
              category: cat,
            } as MapPoint;
          })
          .filter(Boolean) as MapPoint[];
        setPoints(mapped);
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

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (it: MapPoint) => (q ? it.title.toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q) : true);
    
    if (category === 'all') {
      return points.filter(matchesQuery);
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
      if (activeCats.size === 0) return points.filter(matchesQuery);
      return points.filter((it) => activeCats.has(it.category)).filter(matchesQuery);
    }
    if (category === 'favorites') {
      return points.filter((it) => favoriteAttractionIds.has(it.id)).filter(matchesQuery);
    }
    return points.filter((it) => it.category === category).filter(matchesQuery);
  }, [query, category, interests, points, favoriteAttractionIds]);

  const initialRegion = React.useMemo<Region>(
    () => ({
      latitude: 47.2357,
      longitude: 39.7015,
      latitudeDelta: 0.45,
      longitudeDelta: 0.45,
    }),
    []
  );

  const [mapReady, setMapReady] = React.useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" />
          </Pressable>
          <Text style={styles.pageTitle}>Карта</Text>
        </View>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={22} color="#7C889E" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск на карте…"
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

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.centerError}>
            <MaterialCommunityIcons name="map-clock" size={36} color="#A6B3C8" />
            <Text style={styles.centerErrorTitle}>Загрузка карты…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerError}>
            <MaterialCommunityIcons name="wifi-off" size={36} color="#A6B3C8" />
            <Text style={styles.centerErrorTitle}>Не удалось загрузить данные</Text>
            <Text style={styles.centerErrorText}>Проверьте подключение к интернету и попробуйте снова.</Text>
          </View>
        ) : (
          <MapView 
            style={StyleSheet.absoluteFill} 
            initialRegion={initialRegion}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            onMapReady={() => setMapReady(true)}
            loadingEnabled={true}
            loadingIndicatorColor="#2E63E6"
            loadingBackgroundColor="#0B1220"
            moveOnMarkerPress={false}
          >
            {mapReady && filtered.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                title={p.title}
                description={p.description}
              />
            ))}
          </MapView>
        )}
      </View>
    </SafeAreaView>
  );
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageTitle: {
    color: '#E6EDF7',
    fontSize: 20,
    fontWeight: '700',
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
  mapWrap: {
    flex: 1,
    marginHorizontal: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
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
});


