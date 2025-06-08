import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ScrollView, ActivityIndicator, Animated, PanResponder, Dimensions, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db, realtimeDb } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, update, get } from 'firebase/database';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const { height } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    accountName: '',
    email: ''
  });
  
  const [newName, setNewName] = useState('');
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [showNameSection, setShowNameSection] = useState(false);
  const [showNameConfirmModal, setShowNameConfirmModal] = useState(false);
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);
  
  const [flashMessage, setFlashMessage] = useState({
    visible: false,
    type: '',
    message: '',
  });
  
  const [nameError, setNameError] = useState('');
  const [highScores, setHighScores] = useState({
    wordGame: 0,
    translateGame: 0,
    matchGame: 0
  });
  const [isLoading, setIsLoading] = useState(true);

 
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          closeBottomSheet();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    loadLocalData();
    fetchUserData();
    fetchHighScores();
  }, []);

  useEffect(() => {
    if (flashMessage.visible) {
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setFlashMessage(prev => ({ ...prev, visible: false }));
      });
    }
  }, [flashMessage.visible]);

  useEffect(() => {
    if (showLogoutSheet) {
      openBottomSheet();
    }
  }, [showLogoutSheet]);

  const showFlashMessage = (type, message) => {
    setFlashMessage({
      visible: true,
      type,
      message
    });
  };

  const saveUserDataToStorage = async (data) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user data to storage:', error);
    }
  };

  const loadLocalData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('userData');
      const cachedScores = await AsyncStorage.getItem('highScores');
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setUserData(parsed);
        setNewName(parsed.accountName || '');
      }
      
      if (cachedScores) {
        setHighScores(JSON.parse(cachedScores));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading local data:', error);
      setIsLoading(false);
    }
  };

  const saveHighScores = async (scores) => {
    try {
      await AsyncStorage.setItem('highScores', JSON.stringify(scores));
    } catch (error) {
      console.error('Error saving high scores:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) {
        throw new Error('No stored user data');
      }

      const { uid } = JSON.parse(storedUser);
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userData = {
          accountName: data.accountName || '',
          email: data.email || ''
        };
        
        setUserData(userData);
        setNewName(data.accountName || '');
        saveUserDataToStorage(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }]
      });
    }
  };

  const fetchHighScores = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const wordGameRef = ref(realtimeDb, `wordgame/userScores/${user.uid}`);
      const translateGameRef = ref(realtimeDb, `translategame/userScores/${user.uid}`);
      const matchGameRef = ref(realtimeDb, `matchgame/userScores/${user.uid}`);
      const translateHistoryRef = ref(realtimeDb, `translategame/history/${user.uid}`);

      const [wordSnap, translateSnap, matchSnap, translateHistorySnap] = await Promise.all([
        get(wordGameRef),
        get(translateGameRef),
        get(matchGameRef),
        get(translateHistoryRef)
      ]);

      // For translate game, we need to calculate the best score from history like in scoreboard
      let translateHighScore = translateSnap.val()?.highScore || 0;
      
      // If history exists, calculate weighted score
      if (translateHistorySnap.exists()) {
        const historyData = translateHistorySnap.val() || {};
        
        // Convert history to array and add weighted score calculation
        const historyArray = Object.entries(historyData).map(([key, value]) => ({
          id: key,
          ...value,
          date: new Date(value.timestamp),
          // Weight formula: score + (roundsPlayed * 10) - same as in Scoreboard.js
          weightedScore: (value.score || 0) + ((value.roundsPlayed || 0) * 10)
        }));
        
        // Find entry with highest weighted score
        if (historyArray.length > 0) {
          const bestEntry = historyArray.reduce((best, current) => {
            return current.weightedScore > best.weightedScore ? current : best;
          }, historyArray[0]);
          
          translateHighScore = bestEntry.score || 0;
        }
      }

      const newScores = {
        wordGame: wordSnap.val()?.highScore || 0,
        translateGame: translateHighScore,
        matchGame: matchSnap.val()?.highScore || 0
      };

      setHighScores(newScores);
      saveHighScores(newScores);
    } catch (error) {
      console.error('Error fetching high scores:', error);
    }
  };

  const handleEditProfile = async () => {
    setShowNameConfirmModal(false);
    
    if (!newName.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    
    // Additional check in case modal was somehow bypassed
    if (newName.trim() === userData.accountName) {
      setNameError('New name is the same as current name');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        accountName: newName
      });

      const wordGameRef = ref(realtimeDb, `wordgame/userScores/${auth.currentUser.uid}`);
      const wordGameSnapshot = await get(wordGameRef);
      if (wordGameSnapshot.exists()) {
        await update(wordGameRef, { accountName: newName });
      }

      const matchGameRef = ref(realtimeDb, `matchgame/userScores/${auth.currentUser.uid}`);
      const matchGameSnapshot = await get(matchGameRef);
      if (matchGameSnapshot.exists()) {
        await update(matchGameRef, { accountName: newName });
      }

      const updatedData = {
        ...userData,
        accountName: newName
      };
      setUserData(updatedData);
      saveUserDataToStorage(updatedData);
      setShowNameSection(false);
      showFlashMessage('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showFlashMessage('error', 'Cannot update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    setShowPasswordConfirmModal(false);
    setPasswordError('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      showFlashMessage('success', 'Password updated successfully');
      setShowPasswordSection(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      showFlashMessage('error', 'Current password is incorrect');
    }
  };

  const handlePasswordSaveButtonPress = () => {
    if (!passwordData.currentPassword.trim()) {
      setPasswordError('Please enter current password');
      return;
    }
    if (!passwordData.newPassword.trim()) {
      setPasswordError('Please enter new password');
      return;
    }
    if (!passwordData.confirmPassword.trim()) {
      setPasswordError('Please confirm new password');
      return;
    }
    setPasswordError('');
    setShowPasswordConfirmModal(true);
  };

  const handleLogout = () => {
    setShowLogoutSheet(true);
  };

  const confirmLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem('user');
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }]
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Cannot logout.');
    }
    closeBottomSheet();
  };

  const handleNameSectionToggle = () => {
    if (!showNameSection) {
      setNewName('');
    }
    setShowNameSection(!showNameSection);
  };

  const handleSaveButtonPress = () => {
    if (!newName.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    
    // Check if the new name is the same as the current name
    if (newName.trim() === userData.accountName) {
      setNameError('New name is the same as current name');
      return;
    }
    
    setNameError('');
    setShowNameConfirmModal(true);
  };

  const openBottomSheet = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeBottomSheet = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowLogoutSheet(false);
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A3E2B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.flashMessage, 
          flashMessage.type === 'success' ? styles.successFlash : styles.errorFlash,
          { opacity: flashAnim, transform: [{ translateY: flashAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0]
          })}] 
          }
        ]}
        pointerEvents="none"
      >
        <View style={styles.flashContent}>
          <Ionicons 
            name={flashMessage.type === 'success' ? "checkmark-circle" : "alert-circle"} 
            size={24} 
            color={flashMessage.type === 'success' ? "#FFFFFF" : "#FFFFFF"} 
          />
          <Text style={styles.flashText}>{flashMessage.message}</Text>
        </View>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.header}>
          <Text style={styles.name}>{userData.accountName}</Text>
          <Text style={styles.email}>{userData.email}</Text>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.highScoresContainer}>
            <View style={styles.scoresGrid}>
              <View style={[styles.scoreCard, { backgroundColor: '#FF6B6B' }]}>
                <MaterialCommunityIcons name="book-alphabet" size={32} color="#FFFFFF" />
                <Text style={styles.gameTitle}>Word</Text>
                <Text style={styles.scoreText}>{highScores.wordGame}</Text>
              </View>
              <View style={[styles.scoreCard, { backgroundColor: '#4ECDC4' }]}>
                <MaterialCommunityIcons name="translate" size={32} color="#FFFFFF" />
                <Text style={styles.gameTitle}>Translate</Text>
                <Text style={styles.scoreText}>{highScores.translateGame}%</Text>
              </View>
              <View style={[styles.scoreCard, { backgroundColor: '#FFD700' }]}>
                <MaterialCommunityIcons name="cards" size={32} color="#FFFFFF" />
                <Text style={styles.gameTitle}>Match</Text>
                <Text style={styles.scoreText}>{highScores.matchGame}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <TouchableOpacity 
              style={styles.infoItem} 
              onPress={handleNameSectionToggle}
            >
              <Ionicons name="person-outline" size={24} color="#5A3E2B" />
              <Text style={[styles.infoText, styles.lText]}>Change Name</Text>
            </TouchableOpacity>

            {showNameSection && (
              <View style={styles.inputSection}>
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : null}
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={(text) => {
                    setNewName(text);
                    setNameError('');
                  }}
                  placeholder="Enter new name"
                  placeholderTextColor="#666"
                />
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveButtonPress}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={styles.infoItem} 
              onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
              <Ionicons name="key-outline" size={24} color="#5A3E2B" />
              <Text style={[styles.infoText, styles.lText]}>Change Password</Text>
            </TouchableOpacity>

            {showPasswordSection && (
              <View style={styles.inputSection}>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
                <TextInput
                  style={styles.input}
                  placeholder="Current Password"
                  secureTextEntry
                  value={passwordData.currentPassword}
                  onChangeText={(text) => {
                    setPasswordData({...passwordData, currentPassword: text});
                    setPasswordError('');
                  }}
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  secureTextEntry
                  value={passwordData.newPassword}
                  onChangeText={(text) => {
                    setPasswordData({...passwordData, newPassword: text});
                    setPasswordError('');
                  }}
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  secureTextEntry
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => {
                    setPasswordData({...passwordData, confirmPassword: text});
                    setPasswordError('');
                  }}
                  placeholderTextColor="#666"
                />
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handlePasswordSaveButtonPress}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[styles.infoItem, styles.logoutItem]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF6B6B"  />
              <Text style={[styles.infoText, styles.lText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showLogoutSheet && (
        <View style={styles.bottomSheetContainer}>
          <Animated.View 
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              }
            ]}
            onTouchStart={closeBottomSheet}
          />
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.logoutContentContainer}>
              <View style={styles.bottomSheetHandle} {...panResponder.panHandlers}>
                <View style={styles.handleBar} />
              </View>
              <LinearGradient
                colors={['#FFFFFF', '#FFF8F8']}
                style={styles.gradientBackground}
              >
                <View style={styles.bottomSheetContent}>
                  <View style={styles.logoutIconContainer}>
                    <Ionicons name="log-out-outline" size={45} color="white" />
                  </View>
                  <Text style={styles.sheetTitle}>Log Out</Text>
                  <View style={styles.accountNameContainer}>
                    <FontAwesome5 name="user-circle" size={14} color="#FF6B6B" style={styles.userIcon} />
                    <Text style={styles.accountNameDisplay}>{userData.accountName}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.logoutSheetButton} 
                    onPress={confirmLogout}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FF6B6B', '#FF4949']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.logoutSheetButtonText}>Logout</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={styles.swipeIndicatorContainer}>
                    <Ionicons name="chevron-down" size={18} color="#999" />
                    <Text style={styles.swipeText}>Swipe down to cancel</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={showNameConfirmModal}
        onRequestClose={() => setShowNameConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="person" size={90} color="#5A3E2B" style={styles.modalIcon} />
            <Text style={styles.modalText}>Are you sure you want to change your name?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowNameConfirmModal(false)}
              >
                <Ionicons name="close-outline" size={20} color="#5A3E2B" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleEditProfile}
              >
                <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showPasswordConfirmModal}
        onRequestClose={() => setShowPasswordConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="key" size={90} color="#5A3E2B" style={styles.modalIcon} />
            <Text style={styles.modalText}>Are you sure you want to change your password?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowPasswordConfirmModal(false)}
              >
                <Ionicons name="close-outline" size={20} color="#5A3E2B" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleChangePassword}
              >
                <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// แก้ไขการคำนวณ bottomSheetHeight
const bottomSheetHeight = Platform.select({
  android: height * 0.30 // ปรับให้สูงขึ้นบน Android
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF8E2',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    padding: 25,
    paddingTop: 40,
    backgroundColor: '#5A3E2B',
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    margin: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    backgroundColor: 'rgba(223, 211, 195, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 15,
  },
  email: {
    fontSize: 16,
    color: '#DFD3C3',
  },
  infoContainer: {
    padding: 20,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAD6',
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginTop: -10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DFD3C3',
  },
  saveButton: {
    backgroundColor: '#5A3E2B',
    padding: 12,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5A3E2B',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#5A3E2B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 30,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#DFD3C3',
  },
  confirmButton: {
    backgroundColor: '#5A3E2B',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#5A3E2B',
    textAlign: 'center',
    fontWeight: '500',
    marginLeft: 5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    marginLeft: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    marginLeft: 5,
  },
  modalIcon: {
    marginBottom: 15,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 10,
    textAlign: 'center',
  },
  lText: {
    fontSize: 15,
    marginLeft: 10,
    
  },
  highScoresContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5A3E2B',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  scoreCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  gameTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: bottomSheetHeight,
    backgroundColor: 'transparent',
  },
  logoutContentContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 35 : 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
    overflow: 'hidden',
  },
  gradientBackground: {
    width: '100%',
  },
  bottomSheetHandle: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#DFD3C3',
    marginTop: 8,
  },
  bottomSheetContent: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  logoutIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5A3E2B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  accountNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  userIcon: {
    marginRight: 6,
  },
  accountNameDisplay: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
  },
  sheetText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 18,
  },
  logoutSheetButton: {
    width: '100%',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  logoutSheetButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  swipeIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    paddingBottom: 5,
  },
  swipeText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 5,
  },
  flashMessage: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    borderRadius: 10,
    zIndex: 1001,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  successFlash: {
    backgroundColor: '#4CAF50',
  },
  errorFlash: {
    backgroundColor: '#FF6B6B',
  },
  flashContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  flashText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
});

export default ProfileScreen;
