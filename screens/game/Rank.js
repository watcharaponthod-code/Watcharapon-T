import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Animated, StatusBar, Vibration, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Separate component for rank items with animations - matching Scoreboard's HistoryListItem
const RankListItem = ({ item, index, currentUser }) => {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;
  const itemSlideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Using identical animation timing as Scoreboard
    Animated.parallel([
      Animated.timing(itemFadeAnim, {
        toValue: 1,
        duration: 300, // Match Scoreboard's 300ms duration
        delay: index * 50, // Same staggered delay as Scoreboard
        useNativeDriver: true,
      }),
      Animated.timing(itemSlideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      })
    ]).start();
  }, [index]);

  const isCurrentUser = currentUser && item.userId === currentUser.uid;
  
  const renderRankBadge = (rank) => {
    let badgeColors = ['#f0f0f0', '#e0e0e0'];
    let icon = null;

    if (rank === 1) {
      badgeColors = ['#FFD700', '#FFC400'];
      icon = <MaterialCommunityIcons name="crown" size={20} color="#FFF" />;
    } else if (rank === 2) {
      badgeColors = ['#C0C0C0', '#A0A0A0'];
      icon = <MaterialCommunityIcons name="crown" size={18} color="#FFF" />;
    } else if (rank === 3) {
      badgeColors = ['#CD7F32', '#B06500'];
      icon = <MaterialCommunityIcons name="crown" size={16} color="#FFF" />;
    }

    return (
      <LinearGradient 
        colors={badgeColors} 
        style={[styles.rankBadge, rank <= 3 && styles[`place${rank}Badge`]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {icon}
        <Text style={[styles.rankText, rank <= 3 && styles.topRankText]}>{`#${rank}`}</Text>
      </LinearGradient>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.scoreItemWrapper,
        {
          opacity: itemFadeAnim,
          transform: [{ translateY: itemSlideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={isCurrentUser ? ['#FFF9C4', '#FFECB3'] : ['#ffffff', '#f8f8f8']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.scoreContent, isCurrentUser && styles.currentUserItem]}>
          {renderRankBadge(item.rank)}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.accountName || 'Anonymous Player'}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.highScore}>{item.highScore}</Text>
            <Text style={styles.gamesPlayed}>Games: {item.totalGames || 0}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const Rank = () => {
  const [selectedGame, setSelectedGame] = useState('word'); // 'word' or 'match'
  const [scores, setScores] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Animation values - exactly like Scoreboard
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const fetchScores = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      
      const gamePath = selectedGame === 'word' ? 'wordgame/userScores' : 'matchgame/userScores';
      const scoresRef = ref(realtimeDb, gamePath);
      const snapshot = await get(scoresRef);
      const data = snapshot.val() || {};

      const sortedScores = Object.values(data)
        .filter(score => score.totalGames > 0) // Only include players who have played
        .sort((a, b) => b.highScore - a.highScore)
        .map((score, index) => ({
          ...score,
          rank: index + 1
        }));

      setScores(sortedScores);

      // Find current user's rank
      if (currentUser) {
        const userRank = sortedScores.findIndex(score => score.userId === currentUser.uid) + 1;
        setCurrentUserRank(userRank > 0 ? userRank : null); // Set to null if user hasn't played
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setCurrentUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Mirror the same pattern as Scoreboard - resetAnimation + fetchScores when game type changes
  useEffect(() => {
    // Reset animations on game change (like Scoreboard)
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);
    
    fetchScores();
    
    // Start animations - identical to Scoreboard
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, [selectedGame, currentUser]);

  const handleGameChange = (game) => {
    if (game !== selectedGame) {
      Vibration.vibrate(20); // Short vibration like Scoreboard
      setSelectedGame(game);
    }
  };

  // Simplified renderItem function that uses the RankListItem component
  const renderScoreItem = (props) => (
    <RankListItem {...props} currentUser={currentUser} />
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient colors={['#F8EDE3', '#DFD3C3']} style={styles.gradient}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <View style={styles.gameToggle}>
              <TouchableOpacity
                style={[styles.gameButton, selectedGame === 'word' && styles.selectedGame]}
                onPress={() => handleGameChange('word')}
              >
                <MaterialCommunityIcons 
                  name="book-alphabet" 
                  size={24} 
                  color={selectedGame === 'word' ? '#8D493A' : '#666'} 
                />
                <Text style={[
                  styles.gameButtonText, 
                  selectedGame === 'word' && styles.selectedGameText
                ]}>
                  Word
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.gameButton, selectedGame === 'match' && styles.selectedGame]}
                onPress={() => handleGameChange('match')}
              >
                <MaterialCommunityIcons 
                  name="cards" 
                  size={24} 
                  color={selectedGame === 'match' ? '#8D493A' : '#666'} 
                />
                <Text style={[
                  styles.gameButtonText, 
                  selectedGame === 'match' && styles.selectedGameText
                ]}>
                  Match
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View 
            style={[
              styles.statsCardContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <LinearGradient
              colors={['#FFF8E1', '#FFE8C2']}
              style={styles.statsCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <MaterialCommunityIcons name="medal" size={22} color="#8D493A" />
                </View>
                <Text style={styles.statLabel}>Your Rank</Text>
                <Text style={styles.statValue}>
                  {currentUserRank ? `#${currentUserRank}` : '-'}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <MaterialCommunityIcons name="trophy" size={22} color="#FFB700" />
                </View>
                <Text style={styles.statLabel}>High Score</Text>
                <Text style={styles.statValue2}>
                  {scores.find(s => s.userId === currentUser?.uid)?.highScore || 0}
                </Text>
              </View>
              {!currentUserRank && (
                <View style={styles.noGamesContainer}>
                  <MaterialCommunityIcons name="controller-classic" size={18} color="#8D493A" />
                  <Text style={styles.noGamesText}>Play your first game to get ranked!</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {loading && scores.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8D493A" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : (
            <FlatList
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
              data={scores}
              renderItem={renderScoreItem}
              keyExtractor={(item) => `${selectedGame}-${item.userId}`}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={fetchScores} 
                  colors={['#8D493A']}
                  tintColor="#8D493A"
                />
              }
              ListEmptyComponent={
                <Animated.View 
                  style={[
                    styles.emptyContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }]
                    }
                  ]}
                >
                  <View style={styles.emptyIconContainer}>
                    <MaterialCommunityIcons name="trophy-outline" size={48} color="#8D493A" />
                  </View>
                  <Text style={styles.emptyText}>No scores yet</Text>
                  <Text style={styles.emptySubtext}>Be the first to set a high score!</Text>
                </Animated.View>
              }
            />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  gameToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 16,
  },
  selectedGame: {
    backgroundColor: '#F8EDE3',
  },
  gameButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  selectedGameText: {
    color: '#8D493A',
    fontWeight: 'bold',
  },
  statsCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(141,73,58,0.2)',
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8D493A',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D493A',
  },
  statValue2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB700',
  },
  noGamesContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 16,
  },
  noGamesText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8D493A',
    fontStyle: 'italic',
  },
  scoreItemWrapper: {
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gradientContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  currentUserItem: {
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  place1Badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  place2Badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  place3Badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  topRankText: {
    color: '#FFF',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  highScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D493A',
  },
  gamesPlayed: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(141,73,58,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#8D493A',
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#8D493A',
    opacity: 0.7,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8D493A',
  },
});

export default Rank;
