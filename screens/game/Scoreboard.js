import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions, StatusBar, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Create a separate component for list items to use hooks properly
const HistoryListItem = ({ item, index, selectedGame }) => {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;
  const itemSlideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(itemFadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
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

  return (
    <Animated.View 
      style={[
        styles.historyItem,
        {
          opacity: itemFadeAnim,
          transform: [{ translateY: itemSlideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f8f8']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.historyContent}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {item.date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.timeText}>
              {item.date.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
            <View style={styles.detailsRow}>
              {item.roundsPlayed && (
                <View style={styles.detailBadge}>
                  <MaterialCommunityIcons name="controller-classic" size={12} color="#8D493A" />
                  <Text style={styles.roundText}>{item.roundsPlayed}</Text>
                </View>
              )}
              {item.difficulty && (
                <View style={[styles.detailBadge, styles.difficultyBadge]}>
                  <MaterialCommunityIcons name="signal" size={12} color="#8D493A" />
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              {item.score}{selectedGame === 'translate' ? '%' : ''}
            </Text>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const Scoreboard = () => {
  const [selectedGame, setSelectedGame] = useState('word');
  const [gameHistory, setGameHistory] = useState([]);
  const [userStats, setUserStats] = useState({
    totalGames: 0,
    highScore: 0,
    highRounds: 0
  });
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    fetchUserHistory();
    
    // Reset and start animations when game type changes
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);
    
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
  }, [selectedGame]);

  const fetchUserHistory = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      let gamePath;
      if (selectedGame === 'word') {
        gamePath = 'wordgame/history';
      } else if (selectedGame === 'match') {
        gamePath = 'matchgame/history';
      } else {
        gamePath = 'translategame/history';
      }
      
      const historyRef = ref(realtimeDb, `${gamePath}/${user.uid}`);
      const statsRef = ref(realtimeDb, `${selectedGame === 'word' ? 'wordgame' : selectedGame === 'match' ? 'matchgame' : 'translategame'}/userScores/${user.uid}`);

      const [historySnap, statsSnap] = await Promise.all([
        get(historyRef),
        get(statsRef)
      ]);

      const historyData = historySnap.val() || {};
      const statsData = statsSnap.val() || {};

      // Convert history object to array and sort by date
      const historyArray = Object.entries(historyData).map(([key, value]) => ({
        id: key,
        ...value,
        date: new Date(value.timestamp)
      })).sort((a, b) => b.date - a.date);

      // Find high score based on game type
      let highScore = 0;
      let highRounds = 0;
      if (selectedGame === 'translate') {
        // Calculate weighted score for each entry
        // Weight formula: score + (roundsPlayed * 10)
        // This means 20% difference in score can overcome 2 rounds difference
        const weightedScores = historyArray.map(item => ({
          ...item,
          weightedScore: (item.score || 0) + ((item.roundsPlayed || 0) * 10)
        }));

        // Find entry with highest weighted score
        const bestEntry = weightedScores.reduce((best, current) => {
          return current.weightedScore > best.weightedScore ? current : best;
        }, weightedScores[0] || { score: 0 });

        highScore = bestEntry.score || 0;
        // Fix: Check if historyArray is not empty before calculating highRounds
        highRounds = historyArray.length > 0 
          ? Math.max(...historyArray.map(item => item.roundsPlayed || 0))
          : 0;
      } else {
        highScore = statsData.highScore || 0;
      }

      setGameHistory(historyArray);
      setUserStats({
        totalGames: statsData.totalGames || 0,
        highScore: highScore,
        highRounds: highRounds
      });
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleGameChange = (game) => {
    if (game !== selectedGame) {
      Vibration.vibrate(20); // Short vibration instead of haptic feedback
      setSelectedGame(game);
    }
  };

  // Simplified renderItem function that uses the HistoryListItem component
  const renderHistoryItem = (props) => (
    <HistoryListItem {...props} selectedGame={selectedGame} />
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient colors={['#F8EDE3', '#DFD3C3']} style={styles.gradient}>
        

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
              <Text style={[styles.gameButtonText, selectedGame === 'word' && styles.selectedGameText]}>
                Word
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gameButton, selectedGame === 'translate' && styles.selectedGame]}
              onPress={() => handleGameChange('translate')}
            >
              <MaterialCommunityIcons 
                name="translate" 
                size={24} 
                color={selectedGame === 'translate' ? '#8D493A' : '#666'} 
              />
              <Text style={[styles.gameButtonText, selectedGame === 'translate' && styles.selectedGameText]}>
                Translate
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
              <Text style={[styles.gameButtonText, selectedGame === 'match' && styles.selectedGameText]}>
                Match
              </Text>
            </TouchableOpacity>
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
              {selectedGame === 'translate' ? (
                <>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <MaterialCommunityIcons name="gamepad-variant" size={22} color="#8D493A" />
                    </View>
                    <Text style={styles.statLabel}>Total Games</Text>
                    <Text style={styles.statValue}>{userStats.totalGames}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <MaterialCommunityIcons name="trophy" size={22} color="#FFB700" />
                    </View>
                    <Text style={styles.statLabel}>High Score</Text>
                    <Text style={styles.statValue2}>{userStats.highScore}%</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <MaterialCommunityIcons name="fire" size={22} color="#8D493A" />
                    </View>
                    <Text style={styles.statLabel}>High Rounds</Text>
                    <Text style={styles.statValue}>{userStats.highRounds}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <MaterialCommunityIcons name="gamepad-variant" size={22} color="#8D493A" />
                    </View>
                    <Text style={styles.statLabel}>Total Games</Text>
                    <Text style={styles.statValue}>{userStats.totalGames}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <MaterialCommunityIcons name="trophy" size={22} color="#FFB700" />
                    </View>
                    <Text style={styles.statLabel}>High Score</Text>
                    <Text style={styles.statValue2}>
                      {userStats.highScore}{selectedGame === 'translate' ? '%' : ''}
                    </Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        </View>

        
        <FlatList
          data={gameHistory}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
                <MaterialCommunityIcons name="history" size={48} color="#8D493A" />
              </View>
              <Text style={styles.emptyText}>No game history</Text>
              <Text style={styles.emptySubtext}>Play a game to see your results here</Text>
            </Animated.View>
          }
        />
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
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D493A',
    letterSpacing: 0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#8D493A',
    opacity: 0.8,
    marginTop: 4,
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
  historyHeaderContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8D493A',
  },
  historySubtitle: {
    fontSize: 12,
    color: '#8D493A',
    opacity: 0.8,
  },
  historyItem: {
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
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: 'rgba(141,73,58,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#8D493A',
    fontWeight: '500',
  },
  detailBadge: {
    backgroundColor: 'rgba(141,73,58,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255,183,0,0.1)',
  },
  roundText: {
    fontSize: 12,
    color: '#8D493A',
    marginLeft: 4,
  },
  difficultyText: {
    fontSize: 12,
    color: '#8D493A',
    marginLeft: 4,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D493A',
    marginBottom: 4,
  },
  scoreBadge: {
    backgroundColor: 'rgba(141,73,58,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#8D493A',
    fontWeight: '500',
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
});

export default Scoreboard;
