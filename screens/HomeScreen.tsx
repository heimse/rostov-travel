import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable, Animated, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';


type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];


type Feature = {
  key: string;
  label: string;
  icon: IconName;
};

function useAnimatedScale(pressed: boolean) {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: pressed ? 0.98 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  }, [pressed, scale]);

  return scale;
}

const FeatureButton: React.FC<{
  feature: Feature;
  onPress?: () => void;
}> = ({ feature, onPress }: { feature: Feature; onPress?: () => void }) => {
  const [pressed, setPressed] = React.useState(false);
  const scale = useAnimatedScale(pressed);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={({ pressed: isPressed }) => [styles.card, isPressed && styles.cardPressed]}
    >
      <Animated.View style={[styles.cardInner, { transform: [{ scale }] }] }>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={feature.icon} size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.cardText}>{feature.label}</Text>
        <MaterialCommunityIcons name="chevron-right" size={26} color="#FFFFFF" />
      </Animated.View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();

  const horizontalPadding = width < 360 ? 16 : width < 420 ? 20 : 24;
  const contentGap = width < 360 ? 12 : 16;

  const features: Feature[] = React.useMemo(
    () => [
      { key: 'profile', label: 'Профиль', icon: 'account-circle-outline' },
      { key: 'plan', label: 'Начать планирование', icon: 'playlist-edit' },
      { key: 'interests', label: 'Выбрать интересы', icon: 'tune' },
      { key: 'sights', label: 'Достопримечательности', icon: 'map-marker-outline' },
      { key: 'ai', label: 'ИИ-помощник', icon: 'robot-outline' },
      { key: 'routes', label: 'Маршруты', icon: 'routes' },
      { key: 'map', label: 'Интерактивная карта', icon: 'map-outline' },
    ],
    []
  );

  return (
    <View style={[styles.flex, styles.container]}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <StatusBarLight />
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingBottom: 28,
            gap: contentGap,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { marginTop: 8 }]}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="compass-outline" size={28} color="#2E63E6" />
            </View>
            <Text style={styles.title}>Путеводитель по Ростовской области</Text>
          </View>

          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>Добро пожаловать в Ростовскую область</Text>
            <Text style={styles.welcomeText}>
              Исследуйте культурное наследие, достопримечательности и планируйте маршруты с помощью
              нашего удобного гида.
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <FlatList
              data={features}
              keyExtractor={(item) => item.key}
              renderItem={({ item: feature }) => (
                <FeatureButton
                  feature={feature}
                  onPress={() => {
                    if (feature.key === 'plan') {
                      navigation.navigate('Preferences');
                    } else if (feature.key === 'sights') {
                      navigation.navigate('AttractionsList');
                    } else if (feature.key === 'map') {
                      navigation.navigate('Map');
                    } else if (feature.key === 'routes') {
                      navigation.navigate('Routes');
                    } else if (feature.key === 'interests') {
                      navigation.navigate('Interests');
                    } else if (feature.key === 'profile') {
                      navigation.navigate('Profile');
                    } else if (feature.key === 'ai') {
                      navigation.navigate('AIChat');
                    }
                  }}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Планируй • Открывай • Исследуй</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const StatusBarLight: React.FC = () => {
  // Expo SDK 54: use native status bar style per platform
  const ExpoStatusBar = require('expo-status-bar').StatusBar;
  return <ExpoStatusBar style="light" />;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    backgroundColor: '#0B1220',
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: '#1C2A45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#E6EDF7',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  welcome: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: '#1C2A45',
  },
  welcomeTitle: {
    color: '#E6EDF7',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  welcomeText: {
    color: '#A6B3C8',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: '#1C2A45',
  },
  cardPressed: {
    backgroundColor: '#0E1730',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0E1730',
    borderWidth: 1,
    borderColor: '#223154',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    color: '#E6EDF7',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 22,
    alignItems: 'center',
  },
  footerText: {
    color: '#A6B3C8',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});


