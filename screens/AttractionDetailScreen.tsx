import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Attraction } from './AttractionsListScreen';
import { PreferencesContext } from './preferencesContext';

export default function AttractionDetailScreen() {
  const route = useRoute<any>();
  const item = route.params?.item as Attraction;
  const navigation = useNavigation<any>();
  const { favoriteAttractionIds, toggleFavoriteAttraction } = React.useContext(PreferencesContext);

  const isFavorite = favoriteAttractionIds.has(item.id);

  const onShare = React.useCallback(async () => {
    try {
      const messageParts = [item.name];
      if (item.city) messageParts.push(item.city);
      if (item.yandexMapsLink) messageParts.push(item.yandexMapsLink);
      else if (item.twoGisLink) messageParts.push(item.twoGisLink);
      await Share.share({ message: messageParts.join(' — ') });
    } catch {}
  }, [item]);

  const tags = React.useMemo(() => {
    const t: string[] = [];
    if (item.category) t.push(item.category);
    if (item.city) t.push(item.city);
    return t;
  }, [item]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={['#1744E0', '#2E63E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name={iconByCategory(item.category)} size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>{item.name}</Text>
          <View style={{ position: 'absolute', left: 14, top: 14, flexDirection: 'row', gap: 10, zIndex: 2 }}>
            <IconBtn name="arrow-left" onPress={() => navigation.goBack()} />
          </View>
          <View style={{ position: 'absolute', right: 14, top: 14, flexDirection: 'row', gap: 10, zIndex: 2 }}>
            <IconBtn name={isFavorite ? 'heart' : 'heart-outline'} onPress={() => toggleFavoriteAttraction(item.id)} />
            <IconBtn name="share-variant" onPress={onShare} />
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <RowChip icon="label" text={labelByCategory(item.category)} />
          <Row icon="map-marker" label="Локация" text={item.city || '—'} />
          <Row icon="clock-outline" label="Время" text={item.time || '—'} />
          <Row icon="cash" label="Стоимость" text={typeof item.priceRUB === 'number' ? `${item.priceRUB} ₽` : '—'} />
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {renderStars(item.rating)}
              <Text style={styles.rowValue}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <ExpandableText
            text={item.description || 'Описание скоро будет добавлено.'}
          />
          <View style={styles.tagsRow}>
            {tags.map((t, idx) => (
              // @ts-expect-error - key is valid in JSX
              <View key={idx} style={styles.tag}><Text style={styles.tagText}>#{t}</Text></View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Детали</Text>
          <DetailRow label="Тип" value={labelByCategory(item.category)} />
          <DetailRow label="Местоположение" value={item.city || '—'} />
          <DetailRow label="Время" value={item.time || '—'} />
          <DetailRow label="Стоимость" value={typeof item.priceRUB === 'number' ? `${item.priceRUB} ₽` : '—'} />
          <DetailRow label="Рейтинг" value={`${(item.rating || 0).toFixed(1)}/5`} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Отзывы</Text>
          {(item.reviews || []).map((r, idx) => (
            // @ts-expect-error - key is valid in JSX
            <View key={idx} style={styles.reviewRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(r.name || '?')[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.reviewAuthor}>{r.name || 'Гость'}</Text>
                  {renderStars(r.rating || 0)}
                </View>
                <Text style={styles.reviewText}>{r.review || ''}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Похожие места</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {/* В дальнейшем можно подгружать похожие места с сервера */}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={[styles.actionBtn, styles.actionOutline]}><Text style={styles.actionOutlineText}>Забронировать</Text></Pressable>
        <Pressable style={[styles.actionBtn, styles.actionPrimary]}><Text style={styles.actionPrimaryText}>Купить билет</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

function IconBtn({ name, onPress }: { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; onPress?: () => void }) {
  return (
    <Pressable style={styles.iconBtn} onPress={onPress}><MaterialCommunityIcons name={name} size={20} color="#FFFFFF" /></Pressable>
  );
}

function Row({ icon, label, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; text: string }) {
  return (
    <View style={styles.rowBetween}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name={icon} size={18} color="#9FB2D9" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{text}</Text>
    </View>
  );
}

function RowChip({ icon, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; text: string }) {
  return (
    <View style={styles.tag}>
      <MaterialCommunityIcons name={icon} size={14} color="#C7D2E9" />
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const shown = expanded ? text : text.slice(0, 160) + (text.length > 160 ? '…' : '');
  return (
    <Text style={styles.description}>
      {shown} {text.length > 160 && (
        <Text onPress={() => setExpanded((v) => !v)} style={styles.moreLink}>{expanded ? 'Скрыть' : 'Ещё'}</Text>
      )}
    </Text>
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

function labelByCategory(cat: Attraction['category']): string {
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
  for (let i = 0; i < full; i++) {
    // @ts-expect-error - key is valid in JSX
    stars.push(<MaterialCommunityIcons key={`full-${i}`} name="star" size={14} color="#F5C043" />);
  }
  if (half) {
    // @ts-expect-error - key is valid in JSX
    stars.push(<MaterialCommunityIcons key="half" name="star-half-full" size={14} color="#F5C043" />);
  }
  while (stars.length < 5) {
    // @ts-expect-error - key is valid in JSX
    stars.push(<MaterialCommunityIcons key={`empty-${stars.length}`} name="star-outline" size={14} color="#8C6F24" />);
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>{stars}</View>;
}

const REVIEWS = [
  { id: 'r1', author: 'Анна', rating: 4.0, text: 'Очень атмосферное место, рекомендую пешую прогулку.' },
  { id: 'r2', author: 'Илья', rating: 4.5, text: 'Интересная история, красивый вид на город.' },
  { id: 'r3', author: 'Мария', rating: 4.2, text: 'Удобно добираться, приятно провести время.' },
];

const SIMILAR: Attraction[] = [
  { id: 's1', name: 'Крепостной вал', city: 'Азов', category: 'monument', rating: 4.1 },
  { id: 's2', name: 'Петровская набережная', city: 'Таганрог', category: 'park', rating: 4.3 },
  { id: 's3', name: 'Музей градостроительства', city: 'Ростов-на-Дону', category: 'museum', rating: 4.2 },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  hero: {
    height: 170,
    padding: 16,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  heroIconWrap: {
    position: 'absolute',
    left: 14,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#111A2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1C2A45',
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: '#E6EDF7',
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: '#C7D2E9',
    fontSize: 14,
    lineHeight: 20,
  },
  moreLink: {
    color: '#77A1FF',
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    color: '#C7D2E9',
    fontSize: 12,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    color: '#9FB2D9',
    fontSize: 13,
  },
  detailValue: {
    color: '#E6EDF7',
    fontSize: 13,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#C7D2E9',
    fontSize: 13,
    fontWeight: '700',
  },
  rowValue: {
    color: '#E6EDF7',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#162041',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#DCE6FF',
    fontWeight: '800',
  },
  reviewAuthor: {
    color: '#E6EDF7',
    fontSize: 14,
    fontWeight: '800',
  },
  reviewText: {
    color: '#C7D2E9',
    fontSize: 13,
  },
  similarCard: {
    width: 180,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  similarIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#162041',
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarTitle: {
    color: '#E6EDF7',
    fontSize: 14,
    fontWeight: '700',
  },
  similarRating: {
    color: '#C7D2E9',
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionOutline: {
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
  },
  actionOutlineText: {
    color: '#DCE6FF',
    fontSize: 14,
    fontWeight: '800',
  },
  actionPrimary: {
    backgroundColor: '#2E63E6',
  },
  actionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});


