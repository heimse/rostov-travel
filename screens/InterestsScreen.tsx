import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PreferencesContext, type InterestKey as CtxInterestKey } from './preferencesContext';

type InterestKey =
  | 'museums'
  | 'theatres'
  | 'parks'
  | 'monuments'
  | 'churches'
  | 'markets'
  | 'restaurants'
  | 'hotels';

type Interest = {
  key: InterestKey;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const INTERESTS: Interest[] = [
  { key: 'museums', label: 'Музеи', icon: 'bank-outline' },
  { key: 'theatres', label: 'Театры', icon: 'drama-masks' },
  { key: 'parks', label: 'Парки', icon: 'tree-outline' },
  { key: 'monuments', label: 'Памятники', icon: 'pillar' },
  { key: 'churches', label: 'Церкви', icon: 'church-outline' },
  { key: 'markets', label: 'Рынки', icon: 'storefront-outline' },
  { key: 'restaurants', label: 'Рестораны', icon: 'silverware-fork-knife' },
  { key: 'hotels', label: 'Отели', icon: 'bed-queen-outline' },
];

export default function InterestsScreen({ navigation }: { navigation: any }) {
  const { interests, setInterests } = React.useContext(PreferencesContext);
  const [selected, setSelected] = React.useState<Record<InterestKey, boolean>>({
    museums: true,
    theatres: false,
    parks: true,
    monuments: false,
    churches: false,
    markets: false,
    restaurants: false,
    hotels: false,
  });

  const toggle = (key: InterestKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  React.useEffect(() => {
    // инициализация из контекста, если уже есть сохранённые интересы
    const hasAny = Object.values(interests).some(Boolean);
    if (hasAny) setSelected(interests as Record<InterestKey, boolean>);
  }, [interests]);

  const selectedCount = React.useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" />
        </Pressable>
        <Text style={styles.title}>Выбрать интересы</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Отметьте категории, которые вам интересны</Text>
        <View style={styles.grid}>
          {INTERESTS.map((it) => {
            const active = selected[it.key];
            return (
              <Pressable key={it.key} onPress={() => toggle(it.key)} style={[styles.card, active && styles.cardActive]}>
                <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                  <MaterialCommunityIcons name={it.icon} size={22} color={active ? '#FFFFFF' : '#C7D2E9'} />
                </View>
                <Text style={[styles.cardText, active && styles.cardTextActive]}>{it.label}</Text>
                {active && <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.cta, selectedCount === 0 && styles.ctaDisabled]}
        disabled={selectedCount === 0}
        onPress={() => {
          setInterests(selected as Record<CtxInterestKey, boolean>);
          navigation.navigate('AttractionsList');
        }}
      >
        <Text style={styles.ctaText}>{selectedCount === 0 ? 'Выберите хотя бы один интерес' : `Показать места (${selectedCount})`}</Text>
      </Pressable>
    </SafeAreaView>
  );
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
  subtitle: {
    color: '#A6B3C8',
    fontSize: 14,
    marginBottom: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  card: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  cardActive: {},
  iconWrap: {
    height: 90,
    borderRadius: 14,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconWrapActive: {
    backgroundColor: '#2E63E6',
    borderColor: '#2E63E6',
  },
  cardText: {
    color: '#C7D2E9',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#344679',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


