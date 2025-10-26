import * as React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Attraction } from './AttractionsListScreen';

type RouteStop = { attraction: Attraction; dwellMin: number };
type TransportMode = 'walk' | 'bus' | 'car' | 'train';

export type RouteDetailParam = {
  id: string;
  title: string;
  city: string;
  stops: RouteStop[];
  legs?: { mode: TransportMode; durationMin: number; distanceKm?: number; note?: string }[];
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

export default function RouteDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params as RouteDetailParam;

  const totalDwellMin = React.useMemo(() => params.stops.reduce((s, st) => s + (st.dwellMin || 0), 0), [params.stops]);
  const totalLegMin = React.useMemo(() => (params.legs || []).reduce((s, l) => s + (l.durationMin || 0), 0), [params.legs]);
  const totalTimeMin = totalDwellMin + totalLegMin;
  const totalCost = React.useMemo(() => params.stops.reduce((s, st) => s + (st.attraction.priceRUB || 0), 0), [params.stops]);
  
  // Рассчитываем расстояния между точками
  const distances = React.useMemo(() => {
    return params.stops.map((stop, idx) => {
      if (idx === params.stops.length - 1) return null;
      const nextStop = params.stops[idx + 1];
      return calculateDistance(
        stop.attraction.latitude,
        stop.attraction.longitude,
        nextStop.attraction.latitude,
        nextStop.attraction.longitude
      );
    });
  }, [params.stops]);
  
  // Общее расстояние маршрута
  const totalDistanceKm = React.useMemo(() => {
    return distances.reduce((sum, d) => sum + (d || 0), 0);
  }, [distances]);

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

  function iconByMode(mode?: TransportMode): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
    switch (mode) {
      case 'walk': return 'walk';
      case 'bus': return 'bus';
      case 'car': return 'car';
      case 'train': return 'train';
      default: return 'map-marker-path';
    }
  }

  function round1(n: number): string { return (Math.round(n * 10) / 10).toString(); }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" onPress={() => navigation.goBack()} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{params.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Итоги</Text>
          <View style={styles.metaRow}>
            <MetaChip icon="clock-outline" label={formatDuration(totalTimeMin)} />
            <MetaChip icon="cash" label={`${totalCost} ₽`} />
            <MetaChip icon="map-marker-path" label={`${params.stops.length} точ${pluralRu(params.stops.length, 'ка', 'ки', 'ек')}`} />
            {totalDistanceKm > 0 && (
              <MetaChip icon="map-marker-distance" label={`${round1(totalDistanceKm)} км`} />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#9FB2D9" />
            <Text style={styles.value}>{params.city}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Точки маршрута</Text>
          {params.stops.map((s, idx) => {
            const leg = (params.legs || [])[idx]; // leg между текущей и следующей точкой
            const distance = distances[idx]; // Рассчитанное расстояние между точками
            const distanceToShow = leg?.distanceKm ?? distance; // Используем leg.distanceKm если есть, иначе рассчитанное
            
            return (
              <React.Fragment key={`${params.id}-stop-${s.attraction.id}`}>
                <View style={styles.stopRow}>
                  <View style={styles.orderBadge}><Text style={styles.orderText}>{idx + 1}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.stopTitle} numberOfLines={1}>{s.attraction.name}</Text>
                    <Text style={styles.stopSubtitle} numberOfLines={1}>{s.attraction.city}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#C7D2E9" />
                    <Text style={styles.metaText}>{s.dwellMin} мин</Text>
                  </View>
                  {typeof s.attraction.priceRUB === 'number' && (
                    <View style={styles.metaChip}>
                      <MaterialCommunityIcons name="cash" size={14} color="#C7D2E9" />
                      <Text style={styles.metaText}>{s.attraction.priceRUB} ₽</Text>
                    </View>
                  )}
                </View>

                {idx < params.stops.length - 1 && (
                  <View style={styles.connectorRow}>
                    <View style={styles.dash} />
                    <View style={styles.legChip}>
                      <MaterialCommunityIcons name={iconByMode(leg?.mode)} size={14} color="#FFFFFF" />
                      <Text style={styles.legText}>{formatDuration(leg?.durationMin || 0)}</Text>
                      {distanceToShow != null && distanceToShow > 0 && (
                        <Text style={styles.legText}>{`${round1(distanceToShow)} км`}</Text>
                      )}
                      {!distanceToShow && leg?.note && (
                        <Text style={styles.legText}>{leg.note}</Text>
                      )}
                    </View>
                    <View style={styles.dash} />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaChip({ icon, label }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string }) {
  return (
    <View style={styles.metaChip}>
      <MaterialCommunityIcons name={icon} size={14} color="#C7D2E9" />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  headerRow: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 6,
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
  title: { color: '#E6EDF7', fontSize: 20, fontWeight: '700', flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  section: { backgroundColor: '#111A2E', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1C2A45', gap: 10 },
  sectionLabel: { color: '#C7D2E9', fontSize: 14, fontWeight: '700' },
  value: { color: '#E6EDF7', fontSize: 15, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0E1730', borderRadius: 12, borderWidth: 1, borderColor: '#223154', padding: 10 },
  stopTitle: { color: '#E6EDF7', fontSize: 15, fontWeight: '700' },
  stopSubtitle: { color: '#9FB2D9', fontSize: 12 },
  orderBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#162041', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#223154' },
  orderText: { color: '#DCE6FF', fontWeight: '800' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#0E1730', borderWidth: 1, borderColor: '#223154' },
  metaText: { color: '#C7D2E9', fontSize: 12, fontWeight: '700' },
  connectorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, justifyContent: 'space-between' },
  dash: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#223154' },
  legChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#162041', borderWidth: 1, borderColor: '#223154', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  legText: { color: '#DCE6FF', fontSize: 12, fontWeight: '700' },
});


