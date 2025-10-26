import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

type TravelStyle = 'nature' | 'culture' | 'leisure';
type Transport = 'car' | 'public' | 'walk';

export default function PreferencesScreen({ navigation }: { navigation: any }) {
  const [budget, setBudget] = React.useState('');
  const [travelStyle, setTravelStyle] = React.useState<TravelStyle>('nature');
  const [transport, setTransport] = React.useState<Transport>('car');
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [showStart, setShowStart] = React.useState(false);
  const [showEnd, setShowEnd] = React.useState(false);

  const onStartChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowStart(Platform.OS === 'ios');
    if (date) setStartDate(date);
  };

  const onEndChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowEnd(Platform.OS === 'ios');
    if (date) setEndDate(date);
  };

  const formatted = (d?: Date) => (d ? d.toLocaleDateString() : 'Выбрать дату');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" />
        </Pressable>
        <Text style={styles.title}>Предпочтения путешествия</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Бюджет</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="wallet-outline" size={22} color="#A6B3C8" />
            <TextInput
              style={styles.input}
              placeholder="Например, 1000"
              placeholderTextColor="#7C889E"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Стиль путешествия</Text>
          <RadioRow
            selected={travelStyle === 'nature'}
            title="Природа"
            subtitle="Парки, памятники, активный отдых"
            onPress={() => setTravelStyle('nature')}
          />
          <RadioRow
            selected={travelStyle === 'culture'}
            title="Культура"
            subtitle="Музеи, театры, исторические места"
            onPress={() => setTravelStyle('culture')}
          />
          <RadioRow
            selected={travelStyle === 'leisure'}
            title="Развлечения"
            subtitle="Прогулки, рестораны, неспешный темп"
            onPress={() => setTravelStyle('leisure')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Продолжительность поездки</Text>
          <View style={styles.rowGap}>
            <Pressable style={styles.dateBtn} onPress={() => setShowStart(true)}>
              <MaterialCommunityIcons name="calendar-start" size={20} color="#D6DEEB" />
              <Text style={styles.dateBtnText}>Дата начала: {formatted(startDate)}</Text>
            </Pressable>
            {showStart && (
              <DateTimePicker value={startDate ?? new Date()} mode="date" onChange={onStartChange} />
            )}

            <Pressable style={styles.dateBtn} onPress={() => setShowEnd(true)}>
              <MaterialCommunityIcons name="calendar-end" size={20} color="#D6DEEB" />
              <Text style={styles.dateBtnText}>Дата окончания: {formatted(endDate)}</Text>
            </Pressable>
            {showEnd && (
              <DateTimePicker value={endDate ?? new Date()} mode="date" onChange={onEndChange} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Транспорт</Text>
          <RadioRow
            selected={transport === 'car'}
            title="Машина"
            subtitle="Гибкий, удобен для дальних расстояний"
            onPress={() => setTransport('car')}
          />
          <RadioRow
            selected={transport === 'public'}
            title="Общественный транспорт"
            subtitle="Экологичный, бюджетный вариант"
            onPress={() => setTransport('public')}
          />
          <RadioRow
            selected={transport === 'walk'}
            title="Пешком"
            subtitle="Идеален для изучения центра города"
            onPress={() => setTransport('walk')}
          />
        </View>
      </ScrollView>

      <Pressable style={styles.cta} onPress={() => navigation.navigate('RouteBuilder')}>
        <Text style={styles.ctaText}>Создать мой маршрут</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function RadioRow({ selected, title, subtitle, onPress }: { selected: boolean; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.radioRow, pressed && { opacity: 0.9 }]}>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}> 
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.radioTitle}>{title}</Text>
        <Text style={styles.radioSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0E1730',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#223154',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: '#F4F7FF',
    fontSize: 16,
  },
  rowGap: {
    gap: 10,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0E1730',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#223154',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateBtnText: {
    color: '#DCE6FF',
    fontSize: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4A67A1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterActive: {
    borderColor: '#77A1FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#77A1FF',
  },
  radioTitle: {
    color: '#E6EDF7',
    fontSize: 15,
    fontWeight: '700',
  },
  radioSubtitle: {
    color: '#A6B3C8',
    fontSize: 13,
    marginTop: 2,
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
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


