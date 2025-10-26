import * as React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Attraction } from './AttractionsListScreen';
import { PreferencesContext } from './preferencesContext';
import { fetchPlaces, normalizeCategory, cityFromAddress } from './api';

export default function RouteBuilderScreen({ navigation }: { navigation: any }) {
  const { routeStops, addRouteStop, removeRouteStop, moveRouteStop, clearRouteStops, addUserRoute, authToken, logout } = React.useContext(PreferencesContext);
  const [query, setQuery] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<Attraction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const places = await fetchPlaces(authToken || undefined);
        if (aborted) return;
        const mapped: Attraction[] = places
          .map((p) => {
            const name = p.data?.name?.trim();
            if (!name) return null;
            return {
              id: p.id,
              name,
              city: cityFromAddress(p.data?.address) || '',
              category: normalizeCategory(p.meta?.type) as Attraction['category'],
              rating: typeof p.data?.avgRating === 'number' ? p.data!.avgRating! : 0,
            } as Attraction;
          })
          .filter(Boolean) as Attraction[];
        setSuggestions(mapped);
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
    if (!q) return suggestions;
    return suggestions.filter((a) => a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q));
  }, [query, suggestions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" />
        </Pressable>
        <Text style={styles.title}>Мой маршрут</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Название маршрута</Text>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color="#7C889E" />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Например, Выходные в Ростове"
              placeholderTextColor="#7C889E"
              style={styles.searchInput}
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Добавить точки</Text>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={22} color="#7C889E" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Поиск по названию или городу"
              placeholderTextColor="#7C889E"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
          {loading ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="progress-clock" size={28} color="#A6B3C8" />
              <Text style={styles.emptyText}>Загрузка…</Text>
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="wifi-off" size={28} color="#A6B3C8" />
              <Text style={styles.emptyText}>Не удалось загрузить данные</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const already = routeStops.some((s) => s.id === item.id);
                return (
                  <View style={styles.addRow}>
                    <View style={styles.iconWrap}>
                      <MaterialCommunityIcons name={iconByCategory(item.category)} size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="map-marker" size={14} color="#9FB2D9" />
                        <Text style={styles.itemSubtitle} numberOfLines={1}>{item.city}</Text>
                      </View>
                    </View>
                    <Pressable
                      disabled={already}
                      onPress={() => addRouteStop(item)}
                      style={[styles.addBtn, already && styles.addBtnDisabled]}
                    >
                      <MaterialCommunityIcons name={already ? 'check' : 'plus'} size={18} color={already ? '#B5C6EE' : '#FFFFFF'} />
                    </Pressable>
                  </View>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.selectedHeader}>
            <Text style={styles.sectionLabel}>Выбранные точки ({routeStops.length})</Text>
            {routeStops.length > 0 && (
              <Pressable onPress={clearRouteStops} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Очистить</Text>
              </Pressable>
            )}
          </View>
          {routeStops.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="playlist-plus" size={28} color="#A6B3C8" />
              <Text style={styles.emptyText}>Добавьте точки из списка выше</Text>
            </View>
          ) : (
            <FlatList
              data={routeStops}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <View style={styles.selRow}>
                  <View style={styles.orderBadge}><Text style={styles.orderText}>{index + 1}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>{item.city}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable
                      onPress={() => moveRouteStop(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      style={[styles.ctrlBtn, index === 0 && styles.ctrlBtnDisabled]}
                    >
                      <MaterialCommunityIcons name="arrow-up" size={16} color="#DCE6FF" />
                    </Pressable>
                    <Pressable
                      onPress={() => moveRouteStop(index, Math.min(routeStops.length - 1, index + 1))}
                      disabled={index === routeStops.length - 1}
                      style={[styles.ctrlBtn, index === routeStops.length - 1 && styles.ctrlBtnDisabled]}
                    >
                      <MaterialCommunityIcons name="arrow-down" size={16} color="#DCE6FF" />
                    </Pressable>
                    <Pressable onPress={() => removeRouteStop(item.id)} style={styles.ctrlBtn}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF8BA3" />
                    </Pressable>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.cta, routeStops.length === 0 && styles.ctaDisabled]}
        disabled={routeStops.length === 0}
        onPress={() => {
          if (routeStops.length === 0) return;
          const routeTitle = (title && title.trim().length > 0) ? title.trim() : `Мой маршрут (${routeStops.length})`;
          const firstCity = routeStops[0]?.city;
          const sameCity = routeStops.every((s) => s.city === firstCity);
          const city = sameCity && firstCity ? firstCity : 'Несколько городов';
          const id = `u_${Date.now()}`;
          addUserRoute({ id, title: routeTitle, city, stops: routeStops, createdAt: Date.now() });
          clearRouteStops();
          navigation.navigate('Routes');
        }}
      >
        <Text style={styles.ctaText}>{routeStops.length === 0 ? 'Добавьте точки' : 'Готово'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function iconByCategory(cat: Attraction['category']): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
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
  title: {
    color: '#E6EDF7',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  section: {
    backgroundColor: '#111A2E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1C2A45',
    gap: 10,
  },
  sectionLabel: {
    color: '#C7D2E9',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0E1730',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#223154',
    padding: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#162041',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2E63E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#132352',
  },
  itemTitle: {
    color: '#E6EDF7',
    fontSize: 15,
    fontWeight: '700',
  },
  itemSubtitle: {
    color: '#9FB2D9',
    fontSize: 12,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0E1730',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#223154',
  },
  clearBtnText: {
    color: '#DCE6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  emptyText: {
    color: '#A6B3C8',
    fontSize: 13,
  },
  selRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0E1730',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#223154',
    padding: 10,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#162041',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#223154',
  },
  orderText: {
    color: '#DCE6FF',
    fontWeight: '800',
  },
  ctrlBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#162041',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#223154',
  },
  ctrlBtnDisabled: {
    opacity: 0.5,
  },
  cta: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 22,
    backgroundColor: '#2E63E6',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaDisabled: {
    backgroundColor: '#1F2F5B',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


