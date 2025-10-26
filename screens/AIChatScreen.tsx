import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

export default function AIChatScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const flatListRef = React.useRef<FlatList>(null);

  const handleSend = async () => {
    if (inputText.trim() === '' || isLoading) return;

    const userMessageText = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Прокрутка к последнему сообщению
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Отправка запроса к API
      const response = await fetch('https://ai.heimseweb.ru/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: userMessageText }),
      });

      if (!response.ok) {
        throw new Error('Ошибка сети');
      }

      const contentType = response.headers.get('content-type');
      let aiResponseText = '';

      if (contentType && contentType.includes('application/json')) {
        // Если ответ в формате JSON
        const jsonData = await response.json();
        aiResponseText = jsonData.result || jsonData.response || jsonData.text || jsonData.message || JSON.stringify(jsonData);
      } else {
        // Если ответ в виде обычного текста
        aiResponseText = await response.text();
      }
      
      // Добавление ответа от ИИ
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText || 'Извините, не удалось получить ответ',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Прокрутка к ответу ИИ
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      
      // Показываем сообщение об ошибке
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Извините, произошла ошибка при обращении к ИИ. Попробуйте позже.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        <View style={[styles.messageBubble, styles.aiBubble]}>
          <View style={styles.typingIndicator}>
            <TypingDot delay={0} />
            <TypingDot delay={150} />
            <TypingDot delay={300} />
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.aiIconCircle}>
        <MaterialCommunityIcons name="robot-outline" size={48} color="#2E63E6" />
      </View>
      <Text style={styles.emptyTitle}>ИИ-помощник по Ростовской области</Text>
      <Text style={styles.emptyText}>
        Задавайте вопросы о достопримечательностях, маршрутах и интересных местах
      </Text>
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Примеры вопросов:</Text>
        <SuggestionChip
          text="Что посмотреть в Ростове-на-Дону?"
          onPress={() => setInputText('Что посмотреть в Ростове-на-Дону?')}
        />
        <SuggestionChip
          text="Построй маршрут на 3 дня"
          onPress={() => setInputText('Построй маршрут на 3 дня')}
        />
        <SuggestionChip
          text="Расскажи про музеи области"
          onPress={() => setInputText('Расскажи про музеи области')}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBarLight />
      
      {/* Шапка */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#E6EDF7" />
        </Pressable>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons name="robot-outline" size={24} color="#2E63E6" />
          <Text style={styles.headerText}>ИИ-помощник</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Список сообщений */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderTypingIndicator}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Поле ввода */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isLoading ? "ИИ печатает..." : "Напишите сообщение..."}
              placeholderTextColor="#6B7A92"
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isLoading}
            />
            <Pressable
              onPress={handleSend}
              style={[
                styles.sendButton,
                (inputText.trim() === '' || isLoading) && styles.sendButtonDisabled,
              ]}
              disabled={inputText.trim() === '' || isLoading}
            >
              {isLoading ? (
                <MaterialCommunityIcons
                  name="loading"
                  size={24}
                  color="#A6B3C8"
                  style={{ opacity: 0.6 }}
                />
              ) : (
                <MaterialCommunityIcons
                  name="send"
                  size={24}
                  color={inputText.trim() === '' ? '#4A5568' : '#FFFFFF'}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TypingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={[
        styles.typingDot,
        { opacity },
      ]}
    />
  );
};

const SuggestionChip: React.FC<{ text: string; onPress: () => void }> = ({
  text,
  onPress,
}) => {
  const [pressed, setPressed] = React.useState(false);
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: pressed ? 0.96 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  }, [pressed, scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.suggestionChip}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={styles.suggestionText}>{text}</Text>
      </Animated.View>
    </Pressable>
  );
};

const StatusBarLight: React.FC = () => {
  const ExpoStatusBar = require('expo-status-bar').StatusBar;
  return <ExpoStatusBar style="light" />;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2A45',
    backgroundColor: '#0B1220',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    color: '#E6EDF7',
    fontSize: 18,
    fontWeight: '600',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#2E63E6',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: '#1C2A45',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#E6EDF7',
  },
  timestamp: {
    fontSize: 11,
    color: '#A6B3C8',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0B1220',
    borderTopWidth: 1,
    borderTopColor: '#1C2A45',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#111A2E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1C2A45',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#E6EDF7',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E63E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1C2A45',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  aiIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#111A2E',
    borderWidth: 2,
    borderColor: '#1C2A45',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#E6EDF7',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    color: '#A6B3C8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 32,
  },
  suggestionsContainer: {
    width: '100%',
    gap: 8,
  },
  suggestionsTitle: {
    color: '#A6B3C8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionChip: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: '#1C2A45',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionText: {
    color: '#E6EDF7',
    fontSize: 14,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A6B3C8',
  },
});

