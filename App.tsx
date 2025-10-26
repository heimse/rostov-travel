import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import InterestsScreen from './screens/InterestsScreen';
import AttractionsListScreen from './screens/AttractionsListScreen';
import AttractionDetailScreen from './screens/AttractionDetailScreen';
import MapScreen from './screens/MapScreen';
import AuthScreen from './screens/AuthScreen';
import RoutesScreen from './screens/RoutesScreen';
import RouteBuilderScreen from './screens/RouteBuilderScreen';
import RouteDetailScreen from './screens/RouteDetailScreen';
import { PreferencesProvider, PreferencesContext } from './screens/preferencesContext';

type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Preferences: undefined;
  Interests: undefined;
  AttractionsList: undefined;
  AttractionDetail: { item: any } | undefined;
  Map: undefined;
  Auth: undefined;
  Routes: undefined;
  RouteBuilder: undefined;
  RouteDetail: {
    id: string;
    title: string;
    city: string;
    stops: { attraction: any; dwellMin: number }[];
    legs: { mode: 'walk' | 'bus' | 'car' | 'train'; durationMin: number; distanceKm?: number; note?: string }[];
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const DarkNavTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E63E6',
    background: '#0B1220',
    card: '#0B1220',
    text: '#E6EDF7',
    border: '#1C2A45',
    notification: '#2E63E6',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider children={(
        <NavigationContainer theme={DarkNavTheme} children={(
          <NavigationContent />
        )} />
      )} />
    </SafeAreaProvider>
  );
}

function NavigationContent() {
  const { authToken } = React.useContext(PreferencesContext);
  const isAuthed = !!authToken;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B1220' },
        headerTintColor: '#E6EDF7',
        headerShadowVisible: false,
      }}
      children={(
        isAuthed ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
            <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Interests" component={InterestsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AttractionsList" component={AttractionsListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AttractionDetail" component={AttractionDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Routes" component={RoutesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="RouteBuilder" component={RouteBuilderScreen} options={{ headerShown: false }} />
            <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )
      )}
    />
  );
}
