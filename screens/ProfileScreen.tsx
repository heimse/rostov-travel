import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PreferencesContext } from './preferencesContext';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { profile, updateProfile, logout, userId, authToken } = React.useContext(PreferencesContext);
  const [name, setName] = React.useState(profile.name);
  const [phone, setPhone] = React.useState(profile.phone);
  const [email, setEmail] = React.useState(profile.email);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const res = await fetch(`https://api.heimseweb.ru/api/v1/users/${userId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        });
        if (res.ok) {
          const data = await res.json();
          const nextName = typeof data?.name === 'string' ? data.name : name;
          const nextUsername = typeof data?.username === 'string' ? data.username : profile.username;
          const nextEmail = typeof data?.email === 'string' ? data.email : email;
          const nextPhone = typeof data?.phone === 'string' ? data.phone : phone;
          updateProfile({ username: nextUsername, name: nextName, email: nextEmail, phone: nextPhone });
          setName(nextName);
          setEmail(nextEmail);
          setPhone(nextPhone);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onSave = async () => {
    if (saving) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      Alert.alert('Ошибка', 'Укажите имя.');
      return;
    }
    // Простая проверка email
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Ошибка', 'Некорректный email.');
      return;
    }
    // Простая проверка телефона (минимум 7 цифр)
    if (trimmedPhone && (trimmedPhone.replace(/\D/g, '').length < 7)) {
      Alert.alert('Ошибка', 'Некорректный телефон.');
      return;
    }

    try {
      setSaving(true);
      if (userId) {
        await fetch(`https://api.heimseweb.ru/api/v1/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ name: trimmedName, phone: trimmedPhone, email: trimmedEmail }),
        });
      }
      updateProfile({ name: trimmedName, email: trimmedEmail, phone: trimmedPhone });
      Alert.alert('Сохранено', 'Профиль обновлён.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" />
        </Pressable>
        <Text style={styles.title}>Профиль</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Имя пользователя</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="account-circle-outline" size={22} color="#A6B3C8" />
            <Text style={styles.readonly}>{profile.username || '—'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Имя</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="account-outline" size={22} color="#A6B3C8" />
            <TextInput
              style={styles.input}
              placeholder="Ваше имя"
              placeholderTextColor="#7C889E"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Телефон</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="phone-outline" size={22} color="#A6B3C8" />
            <TextInput
              style={styles.input}
              placeholder="Например, +7 900 000-00-00"
              placeholderTextColor="#7C889E"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Email</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="email-outline" size={22} color="#A6B3C8" />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#7C889E"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="done"
            />
          </View>
        </View>

        <Pressable style={[styles.cta, (saving || loading) && { opacity: 0.6 }]} onPress={onSave} disabled={saving || loading}>
          <Text style={styles.ctaText}>{saving ? 'Сохранение…' : (loading ? 'Загрузка…' : 'Сохранить')}</Text>
        </Pressable>

        <Pressable style={styles.secondaryCta} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={18} color="#DCE6FF" />
          <Text style={styles.secondaryCtaText}>Выйти</Text>
        </Pressable>
      </ScrollView>
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
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
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
  readonly: {
    flex: 1,
    color: '#A6B3C8',
    fontSize: 16,
  },
  cta: {
    backgroundColor: '#2E63E6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryCta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  secondaryCtaText: {
    color: '#DCE6FF',
    fontSize: 14,
    fontWeight: '700',
  },
});



