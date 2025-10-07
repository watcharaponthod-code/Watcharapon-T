import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { getRandomSentence } from '../option/random1'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, push, set, get } from 'firebase/database';
import { realtimeDb } from '../../config/firebase';

const conversationCategories = [
  'การสนทนาทั่วไป',
  'การจองโรงแรม',
  'การสั่งอาหาร',
  'การสัมภาษณ์งาน',
  'การปรึกษาแพทย์',
  'การแนะนำตัว',
  'การเรียกแท็กซี่'
];

const difficultyLevels = ['ง่าย', 'ปานกลาง'];

const TranslationGame = () => {
  const [sentence, setSentence] = useState('');
  const [translation, setTranslation] = useState('');
  const [category, setCategory] = useState('การสนทนาทั่วไป');
  const [difficulty, setDifficulty] = useState('ง่าย');
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [generatedSentence, setGeneratedSentence] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [round, setRound] = useState(1);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalAction, setModalAction] = useState(null);
  const [sound, setSound] = useState();
  const [feedback, setFeedback] = useState('');
  const [isGameInProgress, setIsGameInProgress] = useState(false);
  const [isPickersDisabled, setIsPickersDisabled] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [howToPlayVisible, setHowToPlayVisible] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));
  const [categorySlide] = useState(new Animated.Value(0));
  const [levelSlide] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  useEffect(() => {
    const initGame = async () => {
      await fetchSentence();
      fadeInNewSentence();
    };
    initGame();
  }, [category, difficulty]);

  useEffect(() => {
    // Load sound when component mounts
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/ding.mp3')
      );
      setSound(sound);
    };

    loadSound();

    // Cleanup when component unmounts
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Animate components on mount
    Animated.parallel([
      Animated.spring(categorySlide, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true
      }),
      Animated.spring(levelSlide, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const fetchSentence = async () => {
    setIsLoading(true);
    try {
      const newSentence = getRandomSentence(category, difficulty);
      if (newSentence) {
        fadeAnim.setValue(0);
        setGeneratedSentence(newSentence);
        setSentence(newSentence);
        fadeInNewSentence();
      } else {
        throw new Error('No sentence generated');
      }
    } catch (error) {
      console.error('Error fetching sentence:', error);
      showModal('ข้อผิดพลาด', 'ไม่สามารถดึงประโยคได้ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (title, message, action = null) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(action);
    setModalVisible(true);
  };

  const playSuccessSound = async () => {
    if (sound) {
      await sound.replayAsync();
    }
  };

  // ฟังก์ชันตรวจสอบภาษาอังกฤษ
  const isEnglishOnly = (text) => {
    // อนุญาตเฉพาะ a-z, A-Z, space, punctuation, ตัวเลข
    // ถ้ามีตัวอักษรที่ไม่ใช่ภาษาอังกฤษ return false
    return /^[\x00-\x7F]+$/.test(text.trim());
  };

  const checkTranslation = async () => {
    if (!translation.trim()) {
      showModal('ลองใหม่', 'กรุณากรอกคำแปลภาษาอังกฤษ');
      return;
    }

    // ตรวจสอบภาษาอังกฤษ
    if (!isEnglishOnly(translation)) {
      showModal('คำเตือน', 'กรุณากรอกคำแปลเป็นภาษาอังกฤษเท่านั้น');
      return;
    }

    // Set game in progress and disable pickers when submitting
    setIsGameInProgress(true);
    setIsPickersDisabled(true);
    setIsLoading(true);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCzNuPgAqnZaWykSkxRAdQuyaP5cVVeUx8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `สำหรับประโยคภาษาไทย: "${generatedSentence}"
                      คำแปลภาษาอังกฤษของผู้ใช้: "${translation}"

                    กรุณาตอบเป็น JSON format ตามรูปแบบนี้:
                    {
                      "score": (คะแนนความถูกต้องเป็นตัวเลข 0-100),
                      "correctTranslation": "คำแปลที่ถูกต้อง (ภาษาอังกฤษ)",
                      "mistakes": "จุดที่แปลผิด (อธิบายไทย)",
                      "suggestions": "คำแนะนำในการปรับปรุง (ภาษาไทย)"
                    }
                    
                    โปรดตอบเป็น JSON format เท่านั้น ไม่มีข้อความอื่น`
                        
            }]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check translation');
      }

      const data = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      try {
        // Extract JSON from the response text
        const jsonStartIndex = responseText.indexOf('{');
        const jsonEndIndex = responseText.lastIndexOf('}') + 1;
        const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex);
        const feedbackData = JSON.parse(jsonString);
        
        // Extract data from JSON
        const accuracyValue = feedbackData.score;
        const correctTranslation = feedbackData.correctTranslation;
        const mistakes = feedbackData.mistakes;
        const suggestions = feedbackData.suggestions;
        
        // Update state with feedback data
        setAccuracy(accuracyValue);
        setScore(prevScore => prevScore + accuracyValue);
        setTotalQuestions(prevTotal => prevTotal + 1);
        setRound(prevRound => prevRound + 1);
        setHasSubmittedAnswer(true);

        if (accuracyValue === 100) {
          await playSuccessSound();
          showModal(
            '    ยอดเยี่ยม!🎉',
            'คำแปลของคุณถูกต้อง 100%', 
            () => {
              resetFields();
              fetchSentence();
              fadeInNewSentence();
            }
          );
        } else {
          // Show enhanced modal for feedback
          showEnhancedFeedbackModal(
            accuracyValue,
            correctTranslation,
            mistakes,
            suggestions,
            () => {
              resetFields();
              fetchSentence();
              fadeInNewSentence();
            }
          );
        }

        // Animate score display
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          })
        ]).start();
        
      } catch (jsonError) {
        console.error('Error parsing JSON feedback:', jsonError);
        // Fallback to old method if JSON parsing fails
        const [accuracyLine, ...feedbackLines] = responseText.split('\n').filter(line => line.trim());
        const accuracyValue = parseInt(accuracyLine?.replace(/\D/g, ''), 10);
        const feedbackText = feedbackLines.join('\n').trim();

        if (isNaN(accuracyValue)) {
          throw new Error('Invalid accuracy value');
        }

        setAccuracy(accuracyValue);
        setScore(prevScore => prevScore + accuracyValue);
        setTotalQuestions(prevTotal => prevTotal + 1);
        setRound(prevRound => prevRound + 1);
        setHasSubmittedAnswer(true);

        showModal(
          'ผลการแปล',
          `ความแม่นยำ: ${accuracyValue}%\n\nคำแนะนำ:\n${feedbackText}`,
          () => {
            resetFields();
            fetchSentence();
            fadeInNewSentence();
          }
        );
      }

    } catch (error) {
      // If there's an error, re-enable the pickers
      setIsPickersDisabled(false);
      console.error('Error checking translation:', error);
      showModal('ข้อผิดพลาด', 'ไม่สามารถตรวจสอบคำแปลได้ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const showEnhancedFeedbackModal = (accuracy, correctTranslation, mistakes, suggestions, onClose) => {
    const modalContent = (
      <View style={styles.enhancedFeedbackContainer}>
        {/* Score display */}
        <View style={styles.feedbackScoreContainer}>
          <View style={[
            styles.feedbackScoreCircle, 
            { 
              backgroundColor: accuracy >= 80 ? '#8BC34A' : 
                               accuracy >= 60 ? '#FFC107' : '#FF5722' 
            }
          ]}>
            <Text style={styles.feedbackScoreText}>{accuracy}%</Text>
          </View>
          <Text style={styles.feedbackScoreLabel}>คะแนน</Text>
        </View>
        
        {/* Correct translation section */}
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackSectionHeader}>
            <FontAwesome5 name="check-circle" size={18} color="#4CAF50" />
            <Text style={styles.feedbackSectionTitle}>คำแปลที่ถูกต้อง</Text>
          </View>
          <Text style={styles.feedbackCorrectTranslation}>{correctTranslation}</Text>
        </View>
        
        {/* Mistakes section */}
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackSectionHeader}>
            <FontAwesome5 name="exclamation-circle" size={18} color="#FF5722" />
            <Text style={styles.feedbackSectionTitle}>จุดที่แปลผิด</Text>
          </View>
          <Text style={styles.feedbackText}>{mistakes}</Text>
        </View>
        
        {/* Suggestions section */}
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackSectionHeader}>
            <FontAwesome5 name="lightbulb" size={18} color="#FFC107" />
            <Text style={styles.feedbackSectionTitle}>คำแนะนำ</Text>
          </View>
          <Text style={styles.feedbackText}>{suggestions}</Text>
        </View>
      </View>
    );

    setModalTitle('ผลการแปล');
    setModalMessage(modalContent);
    setModalAction(onClose);
    setModalVisible(true);
  };

  const fadeInNewSentence = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

  const resetFields = () => {
    setTranslation('');
    setSentence('');
    setGeneratedSentence('');
    setFeedback('');
  };

  const calculateAverageScore = () => {
    if (totalQuestions === 0) return 0;
    return Math.round((score / totalQuestions) * 100) / 100;
  };

  const handleTranslationInput = (text) => {
    setTranslation(text);
    // Remove the picker disable logic from here
    if (text.length > 0) {
      setIsGameInProgress(true);
    }
  };

  const saveGameScore = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const averageScore = calculateAverageScore();
      
      // Create a new history entry
      const historyRef = ref(realtimeDb, `translategame/history/${user.uid}`);
      const newHistoryRef = push(historyRef);
      
      await set(newHistoryRef, {
        score: averageScore,
        timestamp: Date.now(),
        roundsPlayed: totalQuestions,
        difficulty: difficulty,
        category: category  // Add category to the saved data
      });

      // Update user's stats
      const statsRef = ref(realtimeDb, `translategame/userScores/${user.uid}`);
      const statsSnap = await get(statsRef);
      const currentStats = statsSnap.val() || { totalGames: 0, highScore: 0 };

      await set(statsRef, {
        totalGames: currentStats.totalGames + 1,
        highScore: Math.max(currentStats.highScore, averageScore)
      });

    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const handleEndGame = async () => {
    await saveGameScore(); // Save the score before showing summary
    setSummaryModalVisible(true);
  };

  const handleSummaryClose = () => {
    setSummaryModalVisible(false);
    // Reset game state
    setIsGameInProgress(false);
    setIsPickersDisabled(false);
    setScore(0);
    setTotalQuestions(0);
    setRound(1);
    setAccuracy(null);
    setTranslation('');
    setHasSubmittedAnswer(false);
    resetFields();
    setShowSummary(false);
    fetchSentence();
    fadeInNewSentence();
  };

  // Add a function to handle resetting the sentence
  const handleResetSentence = () => {
    if (!isGameInProgress) {
      fetchSentence();
      fadeInNewSentence();
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const renderHowToPlay = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={howToPlayVisible}
      onRequestClose={() => setHowToPlayVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.howToPlayModal}>
         
          <ScrollView style={styles.howToPlayContent}>
            {['เลือกหมวดหมู่และระดับความยาก',
              'แปลประโยคจาก Mission',
              'กดปุ่ม Submit ตรวจสอบคำตอบ',
              'รับคะแนนและคำแนะนำ',
              'เล่นต่อเพื่อพัฒนาทักษะการแปล'
            ].map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{index + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={styles.closeHowToPlay}
            onPress={() => setHowToPlayVisible(false)}
          >
            <FontAwesome5 name="check-circle" size={20} color="#FFF" />
            <Text style={styles.closeButtonText}>เข้าใจแล้ว</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSelectionSection = () => (
    <View style={styles.selectionContainer}>
      <Animated.View style={[
        styles.selectionBox,
        {
          transform: [
            {
              translateX: categorySlide.interpolate({
                inputRange: [0, 1],
                outputRange: [-300, 0]
              })
            }
          ]
        }
      ]}>
        <View style={styles.selectionHeader}>
          <FontAwesome5 name="bookmark" size={20} color="#85603F" />
          <Text style={styles.selectionTitle}>Category</Text>
        </View>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={category}
            style={[styles.enhancedPicker, isPickersDisabled && styles.disabledPicker]}
            onValueChange={handleCategoryChange}
            enabled={!isPickersDisabled}
            itemStyle={styles.pickerItem}
          >
            {conversationCategories.map(cat => (
              <Picker.Item 
                key={cat} 
                label={cat} 
                value={cat} 
                color={isPickersDisabled ? "#999" : "#85603F"} 
              />
            ))}
          </Picker>
        </View>
      </Animated.View>

      <Animated.View style={[
        styles.selectionBox,
        {
          transform: [
            {
              translateX: levelSlide.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0]
              })
            }
          ]
        }
      ]}>
        <View style={styles.selectionHeader}>
          <FontAwesome5 name="signal" size={20} color="#85603F" />
          <Text style={styles.selectionTitle}>Level</Text>
        </View>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={difficulty}
            style={[styles.enhancedPicker, isPickersDisabled && styles.disabledPicker]}
            onValueChange={setDifficulty}
            enabled={!isPickersDisabled}
            itemStyle={styles.pickerItem}
          >
            {difficultyLevels.map(level => (
              <Picker.Item 
                key={level} 
                label={level} 
                value={level} 
                color={isPickersDisabled ? "#999" : "#85603F"} 
              />
            ))}
          </Picker>
        </View>
      </Animated.View>
    </View>
  );

  const renderSubmitButton = () => (
    <TouchableOpacity 
      style={[
        styles.button,
        isLoading && styles.disabledButton,
      ]}
      onPress={() => {
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          })
        ]).start();
        checkTranslation();
      }}
      disabled={isLoading}
    >
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : 'Submit'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <FontAwesome5 name="layer-group" size={20} color="#FFD700" />
              <Text style={styles.statText}>Round: {round}</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="trophy" size={20} color="#FFD700" />
              <Text style={styles.statText}>Average: {calculateAverageScore()}%</Text>
            </View>
          </View>

          {renderSelectionSection()}

          <Animated.View style={[styles.sentenceContainer, { opacity: fadeAnim }]}>
            <View style={styles.sentenceHeaderContainer}>
              <Text style={styles.label}>Mission:</Text>
              {!isGameInProgress && (
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={handleResetSentence}
                >
                  <FontAwesome5 name="sync" size={16} color="#FFFFFF" />
                  <Text style={styles.resetButtonText}>Reset Sentence</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.sentence}>{sentence}</Text>
          </Animated.View>

          <View style={styles.translationContainer}>
            <View style={styles.translationHeader}>
              <FontAwesome5 name="keyboard" size={20} color="#85603F" />
              <Text style={styles.translationTitle}>Your Translation</Text>
            </View>
            <TextInput
              style={styles.input}
              value={translation}
              onChangeText={handleTranslationInput}
              placeholder="Enter English translation here..."
              placeholderTextColor="#666"
              multiline
            />
          </View>
          
          {renderSubmitButton()}

          {hasSubmittedAnswer && (
            <TouchableOpacity 
              style={styles.endGameButton} 
              onPress={handleEndGame}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          )}

          <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scaleAnim }] }]}>
            {accuracy !== null && (
              <>
                <FontAwesome5 name="map-pin" size={24} color="#FFD700" />
                <Text style={styles.score}>Last Score: {accuracy}%</Text>
              </>
            )}
          </Animated.View>
          
        </ScrollView>
        
      </View>

      {/* Add Custom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTextContainer}>
              {modalTitle && (
                <Text style={styles.modalTitleBrown}>{modalTitle}</Text>
              )}
              <ScrollView style={styles.feedbackScroll}>
                {typeof modalMessage === 'string' ? (
                  <Text style={styles.modalMessage}>{modalMessage}</Text>
                ) : (
                  modalMessage
                )}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={styles.summaryButton}
              onPress={() => {
                setModalVisible(false);
                modalAction && modalAction();
              }}
            >
              <Text style={styles.summaryButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Updated Summary Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={summaryModalVisible}
        onRequestClose={handleSummaryClose}
      >
        <View style={styles.summaryModalOverlay}>
          <View style={styles.summaryModalContent}>
            <View style={styles.summaryTop}>
              <FontAwesome5 name="crown" size={50} color="#FFD700" />
              <Text style={styles.summaryTopText}>สรุปผลการเล่น</Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryScoreCircle}>
                <Text style={styles.summaryScoreNumber}> {calculateAverageScore()}%</Text>
                <Text style={styles.summaryScoreLabel}>คะแนนเฉลี่ย</Text>
              </View>
              
              <View style={styles.summaryRoundBox}>
                <FontAwesome5 name="flag-checkered" size={28} color="#85603F" />
                <View style={styles.summaryRoundTextContainer}>
                  <Text style={styles.summaryRoundNumber}>{totalQuestions}</Text>
                  <Text style={styles.summaryRoundLabel}>จำนวนรอบ</Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryButtons}>
              <TouchableOpacity 
                style={styles.summaryRetryButton}
                onPress={handleSummaryClose}
              >
                <FontAwesome5 name="redo" size={20} color="#FFF" style={styles.buttonIcon} />
                <Text style={styles.summaryButtonText}>เริ่มใหม่</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderHowToPlay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8EDE3',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // เพิ่ม padding ด้านล่างให้เนื้อหา
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#85603F',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#DBC8AC',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#85603F',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    color: '#85603F',
    marginRight: 10,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  sentenceContainer: {
    marginBottom: 20,
  },
  sentence: {
    fontSize: 20,
    color: '#594433',
    backgroundColor: '#E9DCC9',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    padding: 20,
    borderRadius: 15,
    fontSize: 18,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    backgroundColor: '#85603F',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    minWidth: '100%', // Add this to ensure button width
  },
  disabledButton: {
    backgroundColor: '#B69B7D',
  },
  mainContainer: {
    flex: 1,
    marginTop: 45,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10, // Adjusted padding since we removed the back button
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center', // Add this to ensure text centering
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  score: {
    fontSize: 20,
    color: '#85603F',
    textAlign: 'center',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  averageScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mainContainer: {
    flex: 1,
    marginTop: 45,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F8EDE3',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    maxHeight: '80%', // Add maximum height constraint
  },
  modalScrollView: {
    width: '100%',
    maxHeight: 300, // กำหนดความสูงสูงสุดของส่วนที่เลื่อนได้
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  modalButton: {
    backgroundColor: '#85603F',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 15,
    elevation: 2,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalTitleBrown: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#85603F',
    marginBottom: 15,
    textAlign: 'center',
  },
  disabledPicker: {
    opacity: 0.5,
  },
  endGameButton: {
    backgroundColor: '#D35D6E',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  newSummaryContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F8EDE3',
  },
  newSummaryHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  newSummaryHeaderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#85603F',
    marginTop: 15,
  },
  scoreCircleContainer: {
    marginBottom: 30,
  },
  scoreCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 10,
    borderColor: '#DBC8AC',
  },
  scoreCircleValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#85603F',
    marginBottom: 5,
  },
  scoreCircleLabel: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  roundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBC8AC',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 3,
  },
  roundText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#85603F',
    marginLeft: 15,
  },
  modalButton: {
    backgroundColor: '#85603F',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 30,
    elevation: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  summaryTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#85603F',
    marginTop: 10,
  },
  mainScoreContainer: {
    backgroundColor: '#FFF',
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 8,
    borderColor: '#DBC8AC',
    elevation: 5,
    position: 'relative',
  },
  mainScoreValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#85603F',
    textAlign: 'center',
  },
  mainScorePercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#85603F',
    marginTop: -5,
  },
  labelContainer: {
    position: 'absolute',
    bottom: 25,
    width: '100%',
    alignItems: 'center',
  },
  mainScoreLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roundTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  roundValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#85603F',
  },
  summaryButton: {
    backgroundColor: '#85603F',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    elevation: 3,
  },
  summaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTextContainer: {
    width: '100%',
    alignItems: 'center'
  },
  summaryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryModalContent: {
    backgroundColor: '#F8EDE3',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    width: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  summaryCloseButton: {
    backgroundColor: '#85603F',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  summaryTop: {
    alignItems: 'center',
    marginBottom: 30,
  },
  summaryTopText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#85603F',
    marginTop: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  summaryStats: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
  },
  summaryScoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 10,
    borderColor: '#DBC8AC',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  summaryScoreNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#85603F',
    marginBottom: 10,
  },
  summaryScorePercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#85603F',
  },
  summaryScoreLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 25,
  },
  summaryRoundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBC8AC',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    elevation: 4,
  },
  summaryRoundTextContainer: {
    marginLeft: 15,
    alignItems: 'center',
  },
  summaryRoundNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#85603F',
  },
  summaryRoundLabel: {
    fontSize: 16,
    color: '#85603F',
    fontWeight: '500',
  },
  summaryButtons: {
    marginTop: 10,
    width: '100%',
  },
  summaryRetryButton: {
    backgroundColor: '#85603F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 10,
  },
  feedbackScroll: {
    maxHeight: 300,
    width: '100%',
  },
  sentenceHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#85603F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    elevation: 2,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  howToPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#DBC8AC',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
  },
  howToPlayButtonText: {
    color: '#85603F',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  howToPlayModal: {
    backgroundColor: '#F8EDE3',
    borderRadius: 25,
    padding: 25,
    width: '85%',
    maxHeight: '80%',
    elevation: 5,
  },
  howToPlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#85603F',
    textAlign: 'center',
    marginBottom: 20,
  },
  howToPlayContent: {
    maxHeight: 300,
  },
  instructionText: {
    fontSize: 16,
    color: '#594433',
    marginBottom: 15,
    lineHeight: 24,
  },
  closeHowToPlay: {
    backgroundColor: '#85603F',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  howToPlayHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
  },
  translationContainer: {
    marginBottom: 20,
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  translationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#85603F',
    marginLeft: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    padding: 20,
    borderRadius: 15,
    fontSize: 18,
    minHeight: 120,
    textAlignVertical: 'top',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#DBC8AC',
  },
  closeHowToPlay: {
    flexDirection: 'row',
    backgroundColor: '#85603F',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  instructionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#85603F',
    backgroundColor: '#DBC8AC',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    marginRight: 15,
  },
  selectionContainer: {
    marginBottom: 20,
  },
  selectionBox: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#DBC8AC',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#DBC8AC',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#85603F',
    marginLeft: 10,
  },
  pickerWrapper: {
    backgroundColor: 'rgba(219, 200, 172, 0.1)',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  enhancedPicker: {
    height: 50,
    color: '#85603F',
  },
  pickerItem: {
    fontSize: 16,
    height: 50,
  },
  disabledPicker: {
    opacity: 0.5,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  enhancedFeedbackContainer: {
    width: '100%',
    alignItems: 'center',
  },
  feedbackScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  feedbackScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  feedbackScoreLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  feedbackSection: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  feedbackSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#594433',
    marginLeft: 8,
  },
  feedbackCorrectTranslation: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  feedbackText: {
    fontSize: 15,
    color: '#594433',
    lineHeight: 22,
  },
});

export default TranslationGame;