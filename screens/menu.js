import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated, Platform, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import WordGame from './game/WordGame';
import TranslationGame from './game/Translation';
import MatchGame from './game/Match';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Rank from './game/Rank';
import Scoreboard from './game/Scoreboard';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

// Create an enhanced spring animation for cards with a more pronounced bounce
const BouncyCard = ({ children, index }) => {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 150),
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 40,    // Lower tension for more bounce
          friction: 25,    // Lower friction for more oscillation
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,    // Lower tension 
          friction: 2,    // Lower friction for more bouncy effect
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateY },
          { scale }
        ]
      }}
    >
      {children}
    </Animated.View>
  );
};

// Pop-up button with more dramatic effect
const PopButton = ({ children, delay = 0 }) => {
  const translateY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 120,
          friction: 4,     // Lower friction for more bounce
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 5,     // Reduced friction for bouncy effect
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateY },
          { scale }
        ]
      }}
    >
      {children}
    </Animated.View>
  );
};

// Pulse animation for an element
const PulseView = ({ children, pulseDuration = 2000 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: pulseDuration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: pulseDuration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ]);
    
    Animated.loop(pulse).start();
  }, []);
  
  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }]
      }}
    >
      {children}
    </Animated.View>
  );
};

function GameCard({ icon, title, description, onPress, colors, iconType }) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  
  const [isPressed, setIsPressed] = useState(false);
  
  const onPressIn = () => {
    setIsPressed(true);
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.92,
        tension: 80,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(rotateValue, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 0.85,
        tension: 100,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();
  };

  const onPressOut = () => {
    setIsPressed(false);
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 40,
        friction: 2.5,    // Lower friction for more bounce - removed bounciness
        useNativeDriver: true,
      }),
      Animated.spring(rotateValue, {
        toValue: 0,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 60,
        friction: 2.5,    // Lower friction for more bounce - removed bounciness
        useNativeDriver: true,
      })
    ]).start();
  };

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-1deg']
  });

  const pressedStyle = isPressed ? {
    elevation: Platform.OS === 'android' ? 6 : 0,
    shadowOpacity: 0.2,
    shadowRadius: 5,
  } : {
    elevation: Platform.OS === 'android' ? 16 : 0,
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onPressIn={onPressIn} 
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.cardContainer,
        pressedStyle,
        {
          transform: [
            { scale: scaleValue },
            { rotateZ: rotate }
          ]
        }
      ]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gameCard}
        >
          {isPressed && (
            <View style={[StyleSheet.absoluteFill, {
              backgroundColor: 'black',
              opacity: 0.15,
              borderRadius: 25,
            }]} />
          )}
          <Animated.View style={[
            styles.iconContainer,
            {
              transform: [{ scale: iconScale }]
            }
          ]}>
            {iconType === 'material' ? (
              <MaterialCommunityIcons name={icon} size={48} color="#FFFFFF" />
            ) : (
              <Ionicons name={icon} size={48} color="#FFFFFF" />
            )}
          </Animated.View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>{title}</Text>
            <Text style={styles.gameDescription}>{description}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

function GameMenuScreen({ navigation }) {
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, []);

  const games = [
    {
      icon: "book-alphabet",
      iconType: 'material',
      title: "Word",
      description: "A word game where players fill in the blanks with the correct words based on randomly selected prefixes to earn points.",
      navigate: "WordGame",
      colors: ['#FF6B6B', '#FF8E8E'],
    },
    {
      icon: "language-outline",
      iconType: 'ionicon',
      title: "Translate",
      description: "The randomly generated sentences can be adjusted for difficulty and topic.",
      navigate: "TranslationGame",
      colors: ['#4ECDC4', '#45B7AF'],
    },
    {
      icon: "cards",
      iconType: 'material',
      title: "Match",
      description: "Match words to test memory. Match vocabulary words within 1 minute.",
      navigate: "MatchGame",
      colors: ['#FFD700', '#FFA500'],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={[styles.header, { opacity: headerFadeAnim }]}>
        <View style={styles.headerButtons}>
          <PopButton delay={200}>
            <TouchableOpacity
              style={[styles.headerButton, styles.yellowButton]}
              onPress={() => navigation.navigate('Rank')}
            >
              <PulseView pulseDuration={3000}>
                <MaterialCommunityIcons 
                  name="trophy" 
                  size={24} 
                  color="#8D493A" 
                />
              </PulseView>
              <Text style={styles.buttonText}>Rank</Text>
            </TouchableOpacity>
          </PopButton>
          <PopButton delay={350}>
            <TouchableOpacity
              style={[styles.headerButton, styles.whiteButton]}
              onPress={() => navigation.navigate('Scoreboard')}
            >
              <MaterialCommunityIcons 
                name="history" 
                size={24} 
                color="#8D493A" 
              />
              <Text style={styles.buttonText}>Scoreboard</Text>
            </TouchableOpacity>
          </PopButton>
        </View>
      </Animated.View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {games.map((game, index) => (
          <BouncyCard key={index} index={index}>
            <GameCard {...game} onPress={() => navigation.navigate(game.navigate)} />
          </BouncyCard>
        ))}
      </ScrollView>
    </View>
  );
}

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        headerStyle: { 
          backgroundColor: '#AF8F6F',
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
        headerTitle: getHeaderTitle(route),
        headerLeft: () => (
          route.name !== 'GameMenu' && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeftButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )
        ),
        headerRight: null,
      })}
    >
      <Stack.Screen name="GameMenu" component={GameMenuScreen} />
      <Stack.Screen name="WordGame" component={WordGame} />
      <Stack.Screen name="TranslationGame" component={TranslationGame} />
      <Stack.Screen name="MatchGame" component={MatchGame} />
      <Stack.Screen 
        name="Rank" 
        component={Rank}
        options={{
          title: 'Ranking',
          headerStyle: {
            backgroundColor: '#8D493A',
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen 
        name="Scoreboard" 
        component={Scoreboard}
        options={{
          title: 'Scoreboard',
          headerStyle: {
            backgroundColor: '#8D493A',
          },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
}

function getHeaderTitle(route) {
  const routeName = route.name;

  switch (routeName) {
    case 'GameMenu':
      return 'Game';
    case 'WordGame':
      return 'WordGame';
    case 'WordCategory':
      return 'Word Category';
    case 'TranslationGame':
      return 'TranslateGame';
    case 'MatchGame':
      return 'MatchGame';
    case 'Scoreboard':
      return 'Scoreboard';
    default:
      return 'Rank';
  }
}

export default function App({ route }) {
  const isNestedNavigation = route?.params?.nested;

  if (isNestedNavigation) {
    return (
      <NavigationContainer independent={true}>
        <AppNavigator />
      </NavigationContainer>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8EDE3',
    paddingTop: 20,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  welcomeText: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
    fontWeight: '300',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 10,
    borderRadius: 15,
    marginHorizontal: 15,
    marginTop: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D493A',
  },
  cardContainer: {
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    borderRadius: 25,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  gameCard: {
    borderRadius: 25,
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    width: cardWidth,
    alignSelf: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 15,
    backfaceVisibility: 'hidden',
  },
  gameInfo: {
    marginLeft: 20,
    flex: 1,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 22,
  },
  headerLeftButton: {
    marginLeft: 15,
  },
  rankButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8EDE3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 5,
  },
  yellowButton: {
    backgroundColor: '#FFD700',
  },
  whiteButton: {
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    color: '#8D493A',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 10,
  },
});
