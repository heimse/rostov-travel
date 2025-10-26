import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PreferencesContext } from './preferencesContext';

type Mode = 'login' | 'register';

export default function AuthScreen({ navigation }: { navigation: any }) {
  const [mode, setMode] = React.useState<Mode>('login');

  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { setAuth, updateProfile } = React.useContext(PreferencesContext);

  const onSubmit = async () => {
    if (loading) return;
    if (mode === 'login') {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        Alert.alert('Ошибка', 'Укажите имя пользователя.');
        return;
      }
      if (!password) {
        Alert.alert('Ошибка', 'Введите пароль.');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('https://api.heimseweb.ru/api/v1/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: trimmedUsername,
            password,
          }),
        });

        const isOk = response.ok;
        let token: string | undefined;
        let role: string | undefined;
        let message = '';
        try {
          const data = await response.json();
          token = data?.token;
          role = data?.role;
          if (!token && (typeof data === 'string' || data?.message)) {
            message = typeof data === 'string' ? data : data.message;
          }
        } catch (_) {}

        if (!isOk || !token) {
          const text = message || `Неверные данные для входа (код ${response.status}).`;
          Alert.alert('Не удалось войти', text);
          return;
        }

        setAuth(token, role || 'user');
        updateProfile({ username: trimmedUsername });
        Alert.alert('Успешно', 'Вы вошли в аккаунт.');
        setPassword('');
        // Не вызываем goBack: после авторизации навигатор перестраивается и покажет Home
        return;
      } catch (error: any) {
        const text = error?.message ? String(error.message) : 'Неизвестная ошибка сети.';
        Alert.alert('Сеть недоступна', text);
        return;
      } finally {
        setLoading(false);
      }
    }

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const minPasswordLength = 8;

    if (!trimmedName) {
      Alert.alert('Ошибка', 'Укажите имя.');
      return;
    }
    if (!trimmedUsername) {
      Alert.alert('Ошибка', 'Укажите имя пользователя.');
      return;
    }
    if (!password || password.length < minPasswordLength) {
      Alert.alert('Ошибка', `Пароль должен быть не короче ${minPasswordLength} символов.`);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://api.heimseweb.ru/api/v1/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          username: trimmedUsername,
          password,
          favorites: [],
          role: 'user',
        }),
      });

      const isOk = response.ok; // 2xx
      let message = '';
      try {
        const data = await response.json();
        message = typeof data === 'string' ? data : (data?.message || '');
      } catch (_) {
        // ответ не JSON — игнорируем
      }

      if (!isOk) {
        const text = message || `Ошибка регистрации (код ${response.status}).`;
        Alert.alert('Не удалось зарегистрироваться', text);
        return;
      }

      Alert.alert('Успешно', 'Аккаунт создан. Теперь войдите.');
      updateProfile({ username: trimmedUsername, name: trimmedName });
      setPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (error: any) {
      const text = error?.message ? String(error.message) : 'Неизвестная ошибка сети.';
      Alert.alert('Сеть недоступна', text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#DCE6FF" />
        </Pressable>
        <Text style={styles.title}>Вход и регистрация</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.segment}>
          <Pressable
            onPress={() => setMode('login')}
            style={[styles.segmentBtn, mode === 'login' && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Вход</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('register')}
            style={[styles.segmentBtn, mode === 'register' && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>Регистрация</Text>
          </Pressable>
        </View>

        {mode === 'register' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Имя</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="account-outline" size={22} color="#A6B3C8" />
              <TextInput
                style={styles.input}
                placeholder="Как к вам обращаться"
                placeholderTextColor="#7C889E"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Имя пользователя</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="account-circle-outline" size={22} color="#A6B3C8" />
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#7C889E"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Пароль</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#A6B3C8" />
            <TextInput
              style={styles.input}
              placeholder="Минимум 8 символов"
              placeholderTextColor="#7C889E"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              returnKeyType={mode === 'login' ? 'done' : 'next'}
            />
            <Pressable onPress={() => setShowPassword(v => !v)}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#A6B3C8" />
            </Pressable>
          </View>
        </View>

        {mode === 'register' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Подтверждение пароля</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="lock-check-outline" size={22} color="#A6B3C8" />
              <TextInput
                style={styles.input}
                placeholder="Повторите пароль"
                placeholderTextColor="#7C889E"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                returnKeyType="done"
              />
              <Pressable onPress={() => setShowConfirm(v => !v)}>
                <MaterialCommunityIcons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color="#A6B3C8" />
              </Pressable>
            </View>
          </View>
        )}

        <Pressable style={[styles.cta, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.ctaText}>{loading ? 'Загрузка…' : (mode === 'login' ? 'Войти' : 'Зарегистрироваться')}</Text>
        </Pressable>

        <View style={styles.switchRow}>
          {mode === 'login' ? (
            <Text style={styles.switchText}>Нет аккаунта? </Text>
          ) : (
            <Text style={styles.switchText}>Уже есть аккаунт? </Text>
          )}
          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchLink}>{mode === 'login' ? 'Зарегистрироваться' : 'Войти'}</Text>
          </Pressable>
        </View>
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
  segment: {
    flexDirection: 'row',
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: '#1C2A45',
  },
  segmentText: {
    color: '#A6B3C8',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#DCE6FF',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  switchText: {
    color: '#A6B3C8',
    fontSize: 14,
  },
  switchLink: {
    color: '#77A1FF',
    fontSize: 14,
    fontWeight: '700',
  },
});


