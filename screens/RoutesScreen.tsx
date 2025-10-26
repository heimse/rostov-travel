import * as React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Attraction } from './AttractionsListScreen';
import { PreferencesContext } from './preferencesContext';

type TransportMode = 'walk' | 'bus' | 'car' | 'train';

type RouteLeg = {
  mode: TransportMode;
  durationMin: number;
  distanceKm?: number;
  note?: string;
};

type RouteStop = {
  attraction: Attraction;
  dwellMin: number;
};

type RoutePlan = {
  id: string;
  title: string;
  city: string;
  stops: RouteStop[]; // количество точек маршрута
  legs: RouteLeg[];   // должно быть на 1 меньше, чем количество точек
  budgetRUB?: number;
};

// Функция расчета расстояния между двумя точками (формула Haversine)
function calculateDistance(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ROUTES: RoutePlan[] = [
  {
    id: 'r1',
    title: 'Классика Ростова за день',
    city: 'Ростов-на-Дону',
    stops: [
      { attraction: { id: 'a1', name: 'Набережная', city: 'Ростов-на-Дону', category: 'park', rating: 4.8 }, dwellMin: 40 },
      { attraction: { id: 'a2', name: 'Театр им. Горького', city: 'Ростов-на-Дону', category: 'theatre', rating: 4.6 }, dwellMin: 50 },
      { attraction: { id: 'a3', name: 'Музей ИЗО', city: 'Ростов-на-Дону', category: 'museum', rating: 4.7, priceRUB: 300 }, dwellMin: 60 },
    ],
    legs: [
      { mode: 'walk', durationMin: 12, distanceKm: 0.9 },
      { mode: 'bus', durationMin: 18, distanceKm: 5.4, note: 'Автобус №7' },
    ],
    budgetRUB: 600,
  },
  {
    id: 'r2',
    title: 'Азов и крепость',
    city: 'Азов',
    stops: [
      { attraction: { id: 'b1', name: 'Азовская крепость', city: 'Азов', category: 'monument', rating: 4.4, priceRUB: 150 }, dwellMin: 70 },
      { attraction: { id: 'b2', name: 'Азовский музей-заповедник', city: 'Азов', category: 'museum', rating: 4.5, priceRUB: 200 }, dwellMin: 60 },
    ],
    legs: [
      { mode: 'walk', durationMin: 10, distanceKm: 0.7 },
    ],
    budgetRUB: 500,
  },
  {
    id: 'r3',
    title: 'Таганрог: набережная и бульвар',
    city: 'Таганрог',
    stops: [
      { attraction: { id: 'c1', name: 'Петровская набережная', city: 'Таганрог', category: 'park', rating: 4.3 }, dwellMin: 45 },
      { attraction: { id: 'c2', name: 'Петровский бульвар', city: 'Таганрог', category: 'park', rating: 4.6 }, dwellMin: 50 },
    ],
    legs: [
      { mode: 'car', durationMin: 8, distanceKm: 3.2 },
    ],
  },
];

export default function RoutesScreen() {
  const navigation = useNavigation<any>();
  const { favoriteRouteIds, toggleFavoriteRoute, userRoutes } = React.useContext(PreferencesContext);

  const data = React.useMemo(() => {
    const userAsPlans: RoutePlan[] = userRoutes.map((ur) => {
      const stops = ur.stops.map((a) => ({ attraction: a, dwellMin: 30 }));
      
      // Генерируем legs с рассчитанными расстояниями
      const legs: RouteLeg[] = [];
      for (let i = 0; i < stops.length - 1; i++) {
        const current = stops[i].attraction;
        const next = stops[i + 1].attraction;
        const distance = calculateDistance(
          current.latitude,
          current.longitude,
          next.latitude,
          next.longitude
        );
        
        // Примерное время в пути: 5 км/ч для ходьбы, 30 км/ч для транспорта
        const distanceKm = distance || 0;
        const isWalking = distanceKm < 1.5; // Если меньше 1.5 км - пешком
        const speed = isWalking ? 5 : 30; // км/ч
        const durationMin = distanceKm > 0 ? Math.ceil((distanceKm / speed) * 60) : 5;
        
        legs.push({
          mode: isWalking ? 'walk' : 'bus',
          durationMin,
          distanceKm: distance || undefined,
        });
      }
      
      return {
        id: ur.id,
        title: ur.title,
        city: ur.city,
        stops,
        legs,
      };
    });
    return [...userAsPlans, ...ROUTES];
  }, [userRoutes]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" />
          </Pressable>
          <Text style={styles.pageTitle}>Маршруты</Text>
        </View>
        <Text style={styles.subtitle}>Готовые подборки с оптимальными переходами между точками</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('RouteDetail', {
              id: item.id,
              title: item.title,
              city: item.city,
              stops: item.stops,
              legs: item.legs,
            })}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <MaterialCommunityIcons name="routes" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.rowCenter}>
                  <MaterialCommunityIcons name="map-marker" size={14} color="#9FB2D9" />
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{item.city}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => toggleFavoriteRoute(item.id)}
                style={styles.likeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={favoriteRouteIds.has(item.id) ? 'heart' : 'heart-outline'}
                  size={18}
                  color={favoriteRouteIds.has(item.id) ? '#FF6B8A' : '#DCE6FF'}
                />
              </Pressable>
            </View>

            <View style={styles.metaRow}>
              <MetaChip icon="map-marker-path" label={`${item.stops.length} точ${pluralRu(item.stops.length, 'ка', 'ки', 'ек')}`} />
              <MetaChip icon="clock-outline" label={formatDuration(totalDuration(item))} />
              {!!totalDistance(item) && <MetaChip icon="map" label={`${totalDistance(item)} км`} />}
              {typeof item.budgetRUB === 'number' && <MetaChip icon="cash" label={`${item.budgetRUB} ₽`} />}
            </View>

            {item.legs.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legsRow}>
                {React.Children.toArray(item.legs.map((leg) => (
                  <LegItem leg={leg} />
                )))}
              </ScrollView>
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function iconByMode(mode: TransportMode): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  switch (mode) {
    case 'walk': return 'walk';
    case 'bus': return 'bus';
    case 'car': return 'car';
    case 'train': return 'train';
    default: return 'map-marker-path';
  }
}

function totalDuration(plan: RoutePlan): number {
  const legs = plan.legs.reduce((s, l) => s + l.durationMin, 0);
  const dwell = plan.stops.reduce((s, st) => s + st.dwellMin, 0);
  return legs + dwell;
}

function totalDistance(plan: RoutePlan): string | null {
  const dist = plan.legs.reduce((s, l) => s + (l.distanceKm || 0), 0);
  if (!dist) return null;
  return (Math.round(dist * 10) / 10).toString();
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}м`;
  if (m === 0) return `${h}ч`;
  return `${h}ч ${m}м`;
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

function MetaChip({ icon, label }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string }) {
  return (
    <View style={styles.metaChip}>
      <MaterialCommunityIcons name={icon} size={14} color="#C7D2E9" />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const LegItem = React.memo(({ leg }: { leg: RouteLeg }) => (
  <View style={styles.legItem}>
    <MaterialCommunityIcons name={iconByMode(leg.mode)} size={16} color="#FFFFFF" />
    <Text style={styles.legText}>{formatDuration(leg.durationMin)}</Text>
  </View>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  topBar: {
    padding: 16,
    gap: 8,
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
  pageTitle: {
    color: '#E6EDF7',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#A6B3C8',
    fontSize: 13,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#111A2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C2A45',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  cardPressed: {
    backgroundColor: '#0E1730',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
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
    fontWeight: '800',
  },
  cardSubtitle: {
    color: '#9FB2D9',
    fontSize: 13,
    marginLeft: 4,
  },
  likeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
  },
  metaText: {
    color: '#C7D2E9',
    fontSize: 12,
    fontWeight: '700',
  },
  legsRow: {
    gap: 10,
    paddingRight: 6,
  },
  legItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  legText: {
    color: '#DCE6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});


