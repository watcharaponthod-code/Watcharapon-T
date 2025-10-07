import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, FlatList, SafeAreaView, StatusBar, Platform, Animated, Easing, Modal } from "react-native";
import axios from "axios";
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Menu from './menu.js';
import Settings from './option/Settings.js';
import ProfileScreen from './profile.js';
import MiniMenu from './option/MiniMenu.js';
import { Keyboard } from 'react-native';
import getRolePrompt from './option/getRolePrompt';
import { CHATBOT_ROLES } from './option/Settings';
import * as Speech from 'expo-speech';  // For fallback
import QuickMessageOptions from '../components/QuickMessageOptions';


const ChatBubbleLoader = () => {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
            easing: Easing.ease
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.ease
          })
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);

    return () => {
      // Cleanup animation when component unmounts
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    };
  }, []);

  return (
    <View style={styles.chatBubbleLoaderContainer}>
      <Animated.View 
        style={[
          styles.chatBubbleDot,
          {
            opacity: dot1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1]
            }),
            transform: [{
              scale: dot1.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }]
          }
        ]}
      />
      <Animated.View 
        style={[
          styles.chatBubbleDot,
          {
            opacity: dot2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1]
            }),
            transform: [{
              scale: dot2.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }]
          }
        ]}
      />
      <Animated.View 
        style={[
          styles.chatBubbleDot,
          {
            opacity: dot3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1]
            }),
            transform: [{
              scale: dot3.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }]
          }
        ]}
      />
    </View>
  );
};

// Add a new component for typing indicator in AI chat bubbles
const ChatTypingIndicator = () => {
  // Use the same animation logic as ChatBubbleLoader but adjust styling for chat messages
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
            easing: Easing.ease
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.ease
          })
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);

    return () => {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    };
  }, []);

  return (
    <View style={styles.typingIndicatorContainer}>
      <Animated.View 
        style={[
          styles.typingDot,
          {
            opacity: dot1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1]
            }),
            transform: [{
              translateY: dot1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5]
              })
            }]
          }
        ]}
      />
      <Animated.View 
        style={[
          styles.typingDot,
          {
            opacity: dot2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1]
            }),
            transform: [{
              translateY: dot2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5]
              })
            }]
          }
        ]}
      />
      <Animated.View 
        style={[
          styles.typingDot,
          {
            opacity: dot3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1]
            }),
            transform: [{
              translateY: dot3.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5]
              })
            }]
          }
        ]}
      />
    </View>
  );
};

const VocabularyTable = ({ words }) => {
  // Render a beautified table-like display for vocabulary words
  try {
    if (!Array.isArray(words)) {
      return <Text style={styles.errorText}>Invalid vocabulary format</Text>;
    }
    
    return (
      <View style={styles.vocabularyContainer}>
        <View style={styles.vocabularyTitleContainer}>
          <FontAwesome5 name="book" size={16} color="#8D493A" />
          <Text style={styles.vocabularyTitle}>Vocabulary</Text>
        </View>
        
        <View style={styles.vocabularyHeader}>
          <Text style={[styles.vocabularyHeaderText, styles.englishColumn]}>English</Text>
          <Text style={[styles.vocabularyHeaderText, styles.thaiColumn]}>Thai</Text>
          <Text style={[styles.vocabularyHeaderText, styles.exampleColumn]}>Example</Text>
        </View>
        
        {words.map((item, index) => (
          <View key={index} style={[
            styles.vocabularyRow, 
            index % 2 === 0 ? styles.evenRow : styles.oddRow,
            index === words.length - 1 && styles.lastRow
          ]}>
            <View style={styles.englishColumn}>
              <Text style={styles.vocabularyWord}>{item.english}</Text>
            </View>
            <View style={styles.thaiColumn}>
              <Text style={styles.vocabularyTranslation}>{item.thai}</Text>
            </View>
            <View style={styles.exampleColumn}>
              <Text style={styles.vocabularyExample}>"{item.example}"</Text>
            </View>
          </View>
        ))}
      </View>
    );
  } catch (error) {
    console.error("Error rendering vocabulary:", error);
    return <Text style={styles.errorText}>Error displaying vocabulary</Text>;
  }
};

const SpellingCorrection = ({ correction }) => {
  console.log("Rendering spelling correction:", JSON.stringify(correction));
  
  if (!correction) {
    console.log("No correction data provided");
    return null;
  }
  
  // Check if we have errors array or direct original/corrected properties
  const hasErrorsArray = correction.errors && Array.isArray(correction.errors) && correction.errors.length > 0;
  const hasDirectProperties = correction.original && correction.corrected && 
                             correction.original !== correction.corrected;
  
  // Check if we have actual spelling/grammar errors
  const hasActualErrors = hasErrorsArray || hasDirectProperties;
  
  // Check if we have a better phrase suggestion
  const hasBetterPhrase = correction.betterPhrase && correction.betterPhrase.trim() !== "";
  
  // If no errors but has better phrase, show only the better phrase section
  const showOnlyBetterPhrase = !hasActualErrors && hasBetterPhrase;
  
  return (
    <View style={styles.spellingCorrectionContainer}>
      {!showOnlyBetterPhrase && (
        <>
          <View style={styles.spellingHeaderRow}>
            <FontAwesome5 name="spell-check" size={14} color="#8D493A" />
            <Text style={styles.spellingHeaderText}>English Correction</Text>
          </View>
          
          {/* Show individual word corrections if available */}
          {hasErrorsArray && (
            <View style={styles.correctionsSection}>
              {correction.errors.map((error, index) => (
                <View key={index} style={styles.spellingItem}>
                  <View style={styles.spellingContentRow}>
                    <Text style={styles.spellingLabel}>Original:</Text>
                    <Text style={styles.spellingIncorrect}>{error.original}</Text>
                  </View>
                  
                  <View style={styles.spellingContentRow}>
                    <Text style={styles.spellingLabel}>Correct:</Text>
                    <Text style={styles.spellingCorrect}>{error.corrected}</Text>
                  </View>
                  
                  {error.explanation && (
                    <Text style={styles.errorExplanation}>{error.explanation}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
          
          {/* For backward compatibility with the old format */}
          {hasDirectProperties && !hasErrorsArray && (
            <View style={styles.spellingItem}>
              <View style={styles.spellingContentRow}>
                <Text style={styles.spellingLabel}>Original:</Text>
                <Text style={styles.spellingIncorrect}>{correction.original}</Text>
              </View>
              
              <View style={styles.spellingContentRow}>
                <Text style={styles.spellingLabel}>Correct:</Text>
                <Text style={styles.spellingCorrect}>{correction.corrected}</Text>
              </View>
              
              {correction.explanation && (
                <Text style={styles.errorExplanation}>{correction.explanation}</Text>
              )}
            </View>
          )}
        </>
      )}
      
      {/* Better phrase suggestion section */}
      {hasBetterPhrase && (
        <View style={[
          styles.betterPhraseSection,
          showOnlyBetterPhrase && styles.betterPhraseOnly
        ]}>
          <View style={styles.betterPhraseHeaderRow}>
            <FontAwesome5 name="lightbulb" size={14} color="#8D493A" />
            <Text style={styles.betterPhraseHeaderText}>Better Expression</Text>
          </View>
          <Text style={styles.betterPhraseText}>{correction.betterPhrase}</Text>
        </View>
      )}
    </View>
  );
};

const ChatScreen = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('chat');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [chatbotRole, setChatbotRole] = useState('new_friend');
  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState(null);
  const scrollViewRef = useRef(null);

  const games = [
    { id: 'chat', title: 'Chat', component: null },
    { id: 'game', title: 'Game', component: Menu },  // changed from menu to game
    { id: 'profile', title: 'Profile', component: ProfileScreen },
  ];

  useEffect(() => {
    sendInitialGreeting();
  }, []);

  useEffect(() => {
    resetChat();
  }, [chatbotRole]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory]);
  // Simplified chat history formatting - keep only recent relevant messages
  const formatChatHistory = (history, maxMessages = 10) => {
    // Take only the most recent messages to avoid confusion
    const recentHistory = history.slice(-maxMessages);
    
    return recentHistory
      .filter(msg => msg.text)
      .map(msg => {
        const role = msg.isUser ? 'User' : 'Elic';
        return `${role}: ${msg.text}`;
      })
      .join('\n');
  };

  // Remove the complex summarization function - it was causing context confusion
  // Extract key topics from conversation history to maintain context awareness
  const extractConversationTopics = (history) => {
    if (!history || history.length < 3) return ""; // Not enough history to extract topics
    
    // Only consider user messages for topic extraction
    const userMessages = history
      .filter(msg => msg.isUser && msg.text)
      .map(msg => msg.text)
      .slice(-10); // Consider only the last 10 user messages
    
    if (userMessages.length === 0) return "";
    
    // Common English filler words to filter out when identifying topics
    const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'is', 'are', 'was', 'were', 'have', 'has', 'had'];
    
    // Simple keyword extraction - collect non-filler words and find most common ones
    const keywords = {};
    userMessages.forEach(message => {
      const words = message.toLowerCase().split(/\s+/);
      words.forEach(word => {
        // Keep only words with 3+ chars and not in filler list
        if (word.length >= 3 && !fillerWords.includes(word)) {
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    });
    
    // Get top keywords (sorted by frequency)
    const topKeywords = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    return topKeywords.length > 0 ? topKeywords.join(', ') : "";
  };

  // Simplified keyword extraction
  const extractKeywords = (message) => {
    if (!message || typeof message !== 'string') return [];
    
    const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'is', 'are', 'was', 'were'];
    
    return message.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !fillerWords.includes(word))
      .slice(0, 3);
  };
  // We use summarizeConversation for context building and manageConversationHistory for storage efficiency

  const sendInitialGreeting = async () => {
    setGeneratingAnswer(true);
    try {
      const trainerPrompts = [
        { text: getRolePrompt(chatbotRole) },
        { text: "If there is an unclear or only one word, repeat what it means. and If the user writes incorrectly, please explain - Correct spelling - Wrong point - Suggestions for improvement - Please write a concise and easy -to-understand description." },
        { text: "Keep your introduction brief and friendly, maximum 2 sentences." },
        { text: "List 2-3 main areas you can help with." },
        
        { text: "Maximum response length: 3-4 sentences." }
      ];

      const parts = !chatbotRole ? getDefaultPrompt() : trainerPrompts;

      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBaCvvDKrhwkAfDL3YoO4yfsz4ZhVf7oCU`,
        method: "post",
        data: {
          contents: [{
            parts: parts
          }],
        },
      });

      const aiMessageText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || randomHi();
      const messageChunks = splitLongMessage(aiMessageText);
      
      // ส่งแต่ละข้อความเป็นกล่องแยกกัน
      for (let i = 0; i < messageChunks.length; i++) {
        const aiMessage = {
          text: messageChunks[i],
          isUser: false,
          timestamp: new Date()
        };
        setTimeout(() => {
          setChatHistory(prev => i === 0 ? [aiMessage] : [...prev, aiMessage]);
        }, i * 500);
      }
    } catch (error) {
      console.error("Error generating initial greeting:", error);
      setChatHistory([{ text: "Hello! I'm Elic, your English language trainer. How can I help you improve your English today?", isUser: false }]);
    } finally {
      setGeneratingAnswer(false);
    }
  };

  const resetChat = () => {
    setChatHistory([]);
    sendInitialGreeting();
  };

  const handleSettingsChange = (newDifficulty, newChatbotRole) => {
    if (newChatbotRole !== chatbotRole) {
      setChatbotRole(newChatbotRole);
    }
    if (newDifficulty !== difficulty) {
      setDifficulty(newDifficulty);
    }
  };
  const generateResponse = async (userMessage) => {
    try {
      // Simplified context - only use recent messages to avoid confusion
      const recentHistory = chatHistory.slice(-8); // Only last 8 messages
      const conversationHistory = formatChatHistory(recentHistory);
      
      // Check for vocabulary request
      const thaiVocabPhrases = ["คำศัพท์", "วงศัพท์"];
      const englishVocabPhrases = ["vocabulary", "vocab"];
      
      const isVocabularyRequest = 
        thaiVocabPhrases.some(phrase => userMessage.toLowerCase().includes(phrase)) ||
        englishVocabPhrases.some(phrase => userMessage.toLowerCase().includes(phrase));
      
      // Simplified prompt structure
      const parts = [
        { text: getRolePrompt(chatbotRole) },
        { text: 'You are Elic, an English language trainer. Help users improve their English through conversation.' },
        { text: `Difficulty level: ${difficulty}` },
        
        // Only include recent conversation history to avoid confusion
        { text: `Recent conversation:\n${conversationHistory}` },
        
        // Current user message - make this very clear
        { text: `CURRENT USER MESSAGE (respond to this): "${userMessage}"` },
        
        { text: "IMPORTANT: Respond only to the CURRENT USER MESSAGE above. Keep responses brief (max 4 sentences)." }
      ];
      
      // Add vocabulary-specific instructions if needed
      if (isVocabularyRequest) {
        parts.push({ 
          text: `The user wants vocabulary. Respond with JSON format:
          {
            "type": "vocabulary",
            "words": [
              {
                "english": "word",
                "thai": "คำแปล",
                "example": "example sentence"
              }
            ]
          }
          Include 3-5 vocabulary words related to: "${userMessage}"`
        });
      } else {
        // Simplified grammar checking
        parts.push({
          text: `Check only significant English grammar/spelling errors in: "${userMessage}"
          
          If errors found, respond with:
          {
            "type": "correction",
            "message": "Your conversation response",
            "corrections": {
              "errors": [
                {
                  "original": "wrong word",
                  "corrected": "correct word",
                  "explanation": "brief explanation in Thai and English"
                }
              ]
            }
          }
          
          If no errors, respond with:
          {
            "type": "message",
            "content": "Your conversation response"
          }`
        });
      }

      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCZ4iP7-DhYHNuobEXCC4BluiDnC0_PJLI`,
        method: "post",
        data: {
          contents: [{
            parts: parts
          }],
        },
      });

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble right now. Let's try a different topic!";
      
      // Simplified JSON parsing
      try {
        let cleanedText = responseText;
        if (cleanedText.includes("```json")) {
          cleanedText = cleanedText.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        
        const startIndex = cleanedText.indexOf('{');
        const endIndex = cleanedText.lastIndexOf('}') + 1;
        if (startIndex !== -1 && endIndex > startIndex) {
          cleanedText = cleanedText.substring(startIndex, endIndex);
        }
        
        const parsedResponse = JSON.parse(cleanedText);
        return parsedResponse;
      } catch (e) {
        return { type: "message", content: responseText };
      }
    } catch (error) {
      console.error("Error generating response:", error);
      return { type: "message", content: "I'm having trouble right now. Let's try a different topic!" };
    }
  };

  const splitLongMessage = (message) => {
    // แยกข้อความเป็นกล่องใหม่ทุก 8 บรรทัด
    const lines = message.split('\n');
    const messages = [];
    let currentMessage = '';
    let lineCount = 0;
  
    for (let line of lines) {
      if (lineCount >= 10) {
        // เมื่อครบ 8 บรรทัด บันทึกข้อความเก่าและเริ่มข้อความใหม่
        messages.push(currentMessage.trim());
        currentMessage = line;
        lineCount = 1;
      } else {
        // ถ้ายังไม่ครบ 8 บรรทัด เพิ่มบรรทัดใหม่
        currentMessage += (currentMessage ? '\n' : '') + line;
        lineCount++;
      }
    }
  
    // เพิ่มข้อความที่เหลือ
    if (currentMessage) {
      messages.push(currentMessage.trim());
    }
  
    // ถ้าไม่มีการแบ่ง ส่งคืนข้อความเดิม
    return messages.length ? messages : [message];
  };  // Helper function to determine if conversation is getting too long and needs management
  const isConversationTooLong = (history) => {
    // Check if we have more than 20 message exchanges (40 messages total including user and AI)
    if (history.length > 40) return true;
    
    // Or check if the total text content exceeds approximately 6000 characters
    const totalLength = history.reduce((total, msg) => {
      return total + (msg.text ? msg.text.length : 0);
    }, 0);
    
    return totalLength > 6000;
  };
  
  // Comprehensive conversation management to prevent context loss over long conversations
  const manageConversationHistory = (history, maxMessages = 40) => {
    // If conversation isn't too long, return it as is
    if (history.length <= maxMessages) {
      return history;
    }
    
    console.log("Managing conversation history - pruning older messages while preserving context");
    
    // For longer conversations, we need selective pruning while preserving key context
    
    // 1. Keep most recent messages intact
    const recentMessages = history.slice(-Math.floor(maxMessages * 0.75)); // Keep 75% most recent messages
    
    // 2. From older history, identify and keep important messages
    const olderMessages = history.slice(0, -Math.floor(maxMessages * 0.75));
    
    // 3. Score messages by importance (simple heuristic: length, keywords, and questions tend to be important)
    const scoredOlderMessages = olderMessages.map(msg => {
      let importanceScore = 0;
      
      // Longer messages are probably more important
      importanceScore += Math.min(msg.text ? msg.text.length / 20 : 0, 5);
      
      // Messages with question marks likely need context
      importanceScore += msg.text && msg.text.includes('?') ? 3 : 0;
      
      // Messages with keywords are likely important topic starters
      if (msg.topics && msg.topics.length > 0) {
        importanceScore += msg.topics.length;
      }
      
      return { message: msg, score: importanceScore };
    });
    
    // 4. Sort by importance and select top messages to keep
    const importantOlderMessages = scoredOlderMessages
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.floor(maxMessages * 0.25)) // Keep up to 25% of max as important older messages
      .map(item => item.message);
    
    // 5. Create special marker to indicate history compression happened
    const compressionMarker = {
      text: `[${olderMessages.length - importantOlderMessages.length} older messages were summarized]`,
      isUser: false,
      isSystemMessage: true,
      timestamp: new Date()
    };
    
    // 6. Combine important older messages + marker + recent messages
    return [...importantOlderMessages, compressionMarker, ...recentMessages];
  };
    const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;
  
    const userMessage = { 
      text: inputMessage, 
      isUser: true,
      timestamp: new Date(),
      // Track conversation topics for better context retention
      topics: extractKeywords(inputMessage)
    };
  
    setChatHistory(prev => [...prev, userMessage]);
    setInputMessage("");
    setGeneratingAnswer(true);
  
    // Scroll to bottom after the user's message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
  
    try {
      // Simplified - no complex conversation management
      const aiResponse = await generateResponse(inputMessage);
      
      // Handle vocabulary response
      if (aiResponse.type === 'vocabulary' && Array.isArray(aiResponse.words)) {
        const aiMessage = {
          type: 'vocabulary',
          words: aiResponse.words,
          isUser: false,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      } 
      // Handle correction response
      else if (aiResponse.type === 'correction') {
        // Add the main message
        const messageChunks = splitLongMessage(aiResponse.message);
        for (let i = 0; i < messageChunks.length; i++) {
          const aiMessage = {
            text: messageChunks[i],
            isUser: false,
            timestamp: new Date()
          };
          setTimeout(() => {
            setChatHistory(prev => [...prev, aiMessage]);
          }, i * 500);
        }
        
        // Add correction if available
        if (aiResponse.corrections) {
          setTimeout(() => {
            const spellingCorrectionMessage = {
              type: 'spelling_correction',
              correction: aiResponse.corrections,
              isUser: false,
              timestamp: new Date()
            };
            setChatHistory(prev => [...prev, spellingCorrectionMessage]);
          }, messageChunks.length * 500 + 300);
        }
      }
      // Handle regular message
      else {
        const messageChunks = splitLongMessage(aiResponse.content || aiResponse.message || JSON.stringify(aiResponse));
        for (let i = 0; i < messageChunks.length; i++) {
          const aiMessage = {
            text: messageChunks[i],
            isUser: false,
            timestamp: new Date()
          };
          setTimeout(() => {
            setChatHistory(prev => [...prev, aiMessage]);
          }, i * 500);
        }
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      setChatHistory(prev => [...prev, {
        text: "Sorry, I encountered an error processing your request.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setGeneratingAnswer(false);
      // Scroll again when answer finishes generating
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [inputMessage, chatHistory, difficulty, chatbotRole]);
  // Enhanced function to filter and prioritize English grammatical errors
  const filterEnglishErrors = (errors) => {
    if (!Array.isArray(errors) || errors.length === 0) return [];
    
    // Simple regex to detect if text contains Thai characters
    const containsThai = (text) => /[\u0E00-\u0E7F]/.test(text);
    
    // Assign priority scores to different types of errors
    const getErrorPriority = (error) => {
      // Look for key grammar terms in the explanation
      const explanation = error.explanation?.toLowerCase() || '';
      
      if (explanation.includes('subject-verb agreement')) return 10;
      if (explanation.includes('tense')) return 9;
      if (explanation.includes('article')) return 8;
      if (explanation.includes('pronoun')) return 7;
      if (explanation.includes('preposition')) return 6;
      if (explanation.includes('adjective') || explanation.includes('adverb')) return 5;
      if (explanation.includes('punctuation')) return 4;
      if (explanation.includes('spelling')) return 3;
      
      // Default priority for other errors
      return 1;
    };
    
    // Filter valid errors first
    const validErrors = errors.filter(error => {
      // Skip if original or corrected is empty
      if (!error.original || !error.corrected) return false;
      
      // Skip if original and corrected are the same (no real error)
      if (error.original.toLowerCase().trim() === error.corrected.toLowerCase().trim()) return false;
      
      // Skip if original contains Thai characters
      if (containsThai(error.original)) return false;
      
      // Skip minor punctuation-only differences
      if (error.original.replace(/[.,!?;:]/g, '').trim().toLowerCase() === 
          error.corrected.replace(/[.,!?;:]/g, '').trim().toLowerCase()) {
        // Only keep punctuation errors if specifically mentioned as such
        return error.explanation?.toLowerCase().includes('punctuation');
      }
      
      return true;
    });
    
    // Sort by priority and limit to top 3 most important errors if there are many
    return validErrors
      .sort((a, b) => getErrorPriority(b) - getErrorPriority(a))
      .slice(0, 3);
  };

  const translateWithGemini = async (text) => {
    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAv69JuZQ1KPR2Gr_VGhIg-vSkYNdbFJ0Y`,
        method: "post",
        data: {
          contents: [{
            parts: [
              { text: `Translate this English text to Thai: "${text}"` },
              { text: `หางเสียงใช้ครับอย่างเดียว` },
              { text: "Translate this English text to Thai, keeping the meaning and context intact." },
              { text: "Use natural, fluent Thai language." },
              { text: "Do not include any additional explanations or comments." },
              { text: "Return only the translated text without any extra formatting." },
              { text: "Return the translation only." },
            ]
          }],
        },
      });
      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const handleTranslate = async (text) => {
    setIsTranslating(true);
    try {
      const translated = await translateWithGemini(text);
      setTranslatedText(translated);
      setTranslationModalVisible(true);
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeak = async (text, messageId) => {
    try {
      if (isSpeaking && currentSpeakingId === messageId) {
        // Stop speaking if it's the same message
        Speech.stop();
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
        return;
      }
      
      // Stop any previous speech
      Speech.stop();
      
      // Start new speech
      setIsSpeaking(true);
      setCurrentSpeakingId(messageId);
      
      // Check if the text is too long
      const maxLength = 4000;
      const trimmedText = text.length > maxLength ? 
        text.substring(0, maxLength) + "..." : 
        text;
      
      // Try to use the Python script for TTS
      try {
        // First approach - try running the Python script directly via fetch
        const response = await fetch('http://127.0.0.1:5000/speak', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: trimmedText })
        });
        
        if (!response.ok) {
          throw new Error('Server response not ok');
        }
        
        // Speech will be handled by the Python script
        
      } catch (pythonError) {
        console.log("Error with Python TTS, falling back to Expo Speech:", pythonError);
        
        // Set options for Expo Speech (fallback)
        const options = {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
          onDone: () => {
            setIsSpeaking(false);
            setCurrentSpeakingId(null);
          },
          onError: (error) => {
            console.error('Speech error:', error);
            setIsSpeaking(false);
            setCurrentSpeakingId(null);
          }
        };
        
        // Use Expo Speech as fallback
        await Speech.speak(trimmedText, options);
      }
      
    } catch (error) {
      console.error("Speech error:", error);
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const renderMiniMenu = () => (
    <FlatList
      data={games}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.miniMenuContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.miniMenuItem, currentScreen === item.id && styles.miniMenuItemActive]}
          onPress={() => setCurrentScreen(item.id)}
        >
          <Ionicons name={getIconName(item.id)} size={24} color={currentScreen === item.id ? "#8D493A" : "white"} />
          <Text style={[styles.miniMenuText, currentScreen === item.id && styles.miniMenuTextActive]}>{item.title}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id}
    />
  );

  const renderCurrentScreen = () => {
    const renderHeader = () => {
      const currentRoleLabel = CHATBOT_ROLES?.find(role => role.value === chatbotRole)?.label || 'Select Role';
      
      return (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerText}>
              {currentScreen === 'chat' ? 'Chat' : currentScreen === 'profile' ? 'Profile' : currentScreen}
            </Text>
            {currentScreen === 'chat' && (
              <Text style={styles.roleStatus}>{currentRoleLabel}</Text>
            )}
          </View>
          {currentScreen === 'chat' && (
            <View style={styles.headerButtons}>
              {/* Reset Chat Button */}
              <TouchableOpacity 
                onPress={resetChat} 
                style={styles.resetButton}
              >
                <View style={styles.resetIconContainer}>
                  <MaterialIcons name="refresh" size={20} color="white" />
                </View>
              </TouchableOpacity>
              
              {/* Settings Button */}
              <TouchableOpacity 
                onPress={() => setCurrentScreen('settings')} 
                style={styles.settingsButton}
              >
                <View style={styles.settingsIconContainer}>
                  <Ionicons name="settings-outline" size={22} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    };

    switch (currentScreen) {
      case 'chat':
        return (
          <>
            {renderHeader()}
            {renderChatScreen()}
          </>
        );
      case 'game':
        return (
          <>
            {Menu ? <Menu /> : <Text>Menu component is loading...</Text>}
          </>
        );
      case 'profile':
        return (
          <>
            {renderHeader()}
            <ProfileScreen />
          </>
        );
      case 'settings':
        return (
          <Settings 
            difficulty={difficulty}
            setDifficulty={(newDifficulty) => handleSettingsChange(newDifficulty, chatbotRole)}
            chatbotRole={chatbotRole}
            setChatbotRole={(newChatbotRole) => handleSettingsChange(difficulty, newChatbotRole)}
          />
        );
      default:
        return renderChatScreen();
    }
  };

  const renderChatScreen = () => (
    <>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {chatHistory.map((message, index) => (
          <View key={index}>
            <View style={[
              styles.statusBar,
              message.isUser ? styles.userStatusBar : styles.aiStatusBar
            ]}>
              <FontAwesome5 
                name={message.isUser ? "user-circle" : "robot"} 
                size={16} 
                color={message.isUser ? "#8D493A" : "#6C4E31"} 
              />
              <Text style={[
                styles.statusText,
                message.isUser ? styles.userStatusText : styles.aiStatusText
              ]}>
                {message.isUser ? "You" : "AI Elic"}
              </Text>
              {!message.isUser && message.type === 'vocabulary' && (
                <Text style={styles.vocabularyBadge}>
                  <FontAwesome5 name="book" size={10} color="#F8EDE3" /> Vocabulary
                </Text>
              )}
              {!message.isUser && message.type === 'spelling_correction' && (
                <Text style={styles.spellingBadge}>
                  <FontAwesome5 name="spell-check" size={10} color="#6C4E31" /> Spelling
                </Text>
              )}
            </View>
            
            {message.type === 'vocabulary' && message.words ? (
              // Render vocabulary table outside of message bubble
              <View style={styles.vocabularyTableContainer}>
                <VocabularyTable words={message.words} />
                <Text style={[styles.timestamp, styles.aiTimestamp, styles.vocabularyTimestamp]}>
                  {message.timestamp?.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            ) : message.type === 'spelling_correction' && message.correction ? (
              // Render spelling correction
              <View style={styles.spellingCorrectionWrapper}>
                <SpellingCorrection correction={message.correction} />
                <Text style={[styles.timestamp, styles.aiTimestamp]}>
                  {message.timestamp?.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            ) : (
              // Render regular message in bubble
              <View
                style={[
                  styles.message,
                  message.isUser ? styles.userMessage : styles.aiMessage
                ]}
              >
                {message.isUser ? (
                  <Text>{message.text}</Text>
                ) : (
                  <Text>{message.content || message.text}</Text>
                )}
                
                <Text style={[
                  styles.timestamp,
                  message.isUser ? styles.userTimestamp : styles.aiTimestamp
                ]}>
                  {message.timestamp?.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </Text>
                
                {!message.isUser && (
                  <View style={styles.messageButtonsContainer}>
                    {/* Sound button for AI messages */}
                    <TouchableOpacity 
                      onPress={() => handleSpeak(message.content || message.text, index)}
                      style={[
                        styles.soundButton, 
                        isSpeaking && currentSpeakingId === index && styles.soundButtonActive
                      ]}
                      disabled={isTranslating}
                    >
                      <FontAwesome5 
                        name={isSpeaking && currentSpeakingId === index ? "volume-up" : "volume-up"} 
                        size={14}
                        solid={true}
                        color="white" 
                      />
                      {isSpeaking && currentSpeakingId === index && (
                        <View style={styles.speakingIndicator}>
                          <View style={{width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff'}} />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Translation button */}
                    <TouchableOpacity 
                      onPress={() => handleTranslate(message.content || message.text)}
                      style={[styles.translateButton, isTranslating && styles.translateButtonDisabled]}
                      disabled={isTranslating}
                    >
                      {isTranslating ? (
                        <View style={styles.translateLoadingContainer}>
                          <MaterialIcons name="translate" size={16} color="white" style={styles.translateIcon} />
                          <ChatBubbleLoader />
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialIcons name="translate" size={16} color="white" />
                          <Text style={[styles.translateButtonText, { marginLeft: 4 }]}>Translate</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
        
        {/* Add the AI typing indicator when answer is being generated */}
        {generatingAnswer && (
          <View>
            <View style={styles.statusBar}>
              <FontAwesome5 name="robot" size={16} color="#6C4E31" />
              <Text style={[styles.statusText, styles.aiStatusText]}>AI Elic</Text>
            </View>
            <View style={[styles.message, styles.aiMessage, styles.typingMessage]}>
              <ChatTypingIndicator />
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Add QuickMessageOptions component here, before the input area */}
      {chatHistory.length < 2 && (
        <QuickMessageOptions 
          role={chatbotRole} 
          onSelectMessage={(message) => {
            setInputMessage(message);
            // Optional: auto-send the message
            // setTimeout(() => sendMessage(), 100);
          }} 
        />
      )}
      
      <View style={styles.inputArea}>
        <TextInput
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message"
          style={styles.input}
          editable={!generatingAnswer}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={styles.button}
          disabled={generatingAnswer}
        >
          <Ionicons name="paper-plane" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={translationModalVisible}
        onRequestClose={() => setTranslationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '90%' }]}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="translate" size={24} color="#8D493A" />
              <Text style={styles.modalHeaderText}>Thai</Text>
            </View>
            <Text style={styles.modalText}>{translatedText}</Text>
            <TouchableOpacity 
              onPress={() => setTranslationModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );

  const getIconName = (id) => {
    switch (id) {
      case 'chat': return 'chatbubble-outline';
      case 'profile': return 'person-outline';
      case 'settings': return 'settings-outline';
      case 'game': return 'game-controller-outline';  // changed icon for game
      default: return 'game-controller-outline';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#AF8F6F" />
      <MiniMenu 
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        isKeyboardVisible={isKeyboardVisible}
        renderChatScreen={renderChatScreen}
        difficulty={difficulty}
        chatbotRole={chatbotRole}
        handleSettingsChange={handleSettingsChange}
        resetChat={resetChat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8D493A',
    paddingTop: Platform.OS === 'android' ? 0 : StatusBar.currentHeight,
  },
  miniMenuContent: {
    flexGrow: 1,
    backgroundColor: '#AF8F6F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  miniMenuItem: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMenuItemActive: {
    backgroundColor: '#DFD3C3',
  },
  miniMenuText: {
    color: 'white',
    fontSize: 13,
    marginTop: 5,
  },
  miniMenuTextActive: {
    color: '#8D493A',
    fontSize: 13,
  },
  chatArea: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    marginBottom: 10,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    marginBottom: 16, // เพิ่มระยะห่างระหว่างข้อความ
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DFD3C3',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    marginEnd: 10,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#8D493A',
    padding: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  gridContainer: {
    width: 60,
    height: 60,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    size: 'small',
  },
  gridItem: {
    width: 16,
    height: 16,
    backgroundColor: '#6C4E31',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#AF8F6F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#8D493A',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    padding: 8,
    alignSelf: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resetIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsButton: {
    padding: 8,
    alignSelf: 'center',
    alignItems: 'center',
  },
  settingsIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  translateButton: {
    marginTop: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#8D493A',
    borderRadius: 15,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  translateButtonText: {
    color: 'white',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    width: '100%',
    justifyContent: 'center',
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8D493A',
    marginLeft: 8,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#8D493A',
    padding: 10,
    borderRadius: 100,
    minWidth: 100,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  translateButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#A67B5B',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#8D493A80',
  },
  aiTimestamp: {
    color: '#00000050',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  userStatusBar: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  aiStatusBar: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  userStatusText: {
    color: '#8D493A',
  },
  aiStatusText: {
    color: '#6C4E31',
  },
  roleStatus: {
    color: '#F8EDE3',
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  vocabularyContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0D5C1',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  vocabularyTableContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  
  vocabularyBadge: {
    backgroundColor: '#8D493A',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    overflow: 'hidden',
  },
  
  vocabularyContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0D5C1',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  
  vocabularyTimestamp: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 8,
  },
  
  vocabularyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F4EA',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C1',
  },
  vocabularyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8D493A',
    marginLeft: 8,
  },
  vocabularyHeader: {
    flexDirection: 'row',
    backgroundColor: '#AF8F6F',
    padding: 10,
  },
  vocabularyHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  vocabularyRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0D5C1',
  },
  evenRow: {
    backgroundColor: '#F8F4EA',
  },
  oddRow: {
    backgroundColor: '#FFFFFF',
  },
  lastRow: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  englishColumn: {
    flex: 1,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: '#E0D5C1',
  },
  thaiColumn: {
    flex: 1,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: '#E0D5C1',
  },
  exampleColumn: {
    flex: 1.5,
    paddingHorizontal: 5,
  },
  vocabularyWord: {
    fontWeight: 'bold',
    color: '#8D493A',
    fontSize: 14,
  },
  vocabularyTranslation: {
    color: '#333',
    fontSize: 14,
  },
  vocabularyExample: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  vocabularyMessage: {
    maxWidth: '95%', // Make vocabulary messages wider
  },
  spellingCorrectionWrapper: {
    width: '100%',
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingRight: 40,
  },
  
  spellingCorrectionContainer: {
    backgroundColor: '#FFF9C4', // Light yellow background
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D', // Deeper yellow accent
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  
  spellingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  spellingHeaderText: {
    fontWeight: 'bold',
    color: '#8D493A',
    fontSize: 14,
    marginLeft: 6,
  },
  
  spellingContentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  
  spellingLabel: {
    fontWeight: '500',
    color: '#666',
    fontSize: 13,
    width: 70,
  },
  
  spellingIncorrect: {
    color: '#D32F2F', // Red for incorrect spelling
    fontSize: 13,
    textDecorationLine: 'line-through',
    flex: 1,
  },
  
  spellingCorrect: {
    color: '#388E3C', // Green for correct spelling
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  
  spellingExplanationRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  
  spellingExplanation: {
    color: '#555',
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  spellingBadge: {
    backgroundColor: '#FDD835', // Yellow badge for spelling
    color: '#6C4E31', // Darker text for contrast
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    overflow: 'hidden',
  },
  spellingItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E68C',
    marginBottom: 8,
  },
  
  errorExplanation: {
    color: '#555',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 70,
  },
  
  correctionsSection: {
    marginBottom: 8,
  },
  
  betterPhraseSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E68C',
  },
  
  betterPhraseOnly: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  
  betterPhraseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  betterPhraseHeaderText: {
    fontWeight: 'bold',
    color: '#8D493A',
    fontSize: 14,
    marginLeft: 6,
  },
  
  betterPhraseText: {
    color: '#388E3C',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  chatBubbleLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    paddingHorizontal: 2,
  },
  chatBubbleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    margin: 2,
  },
  translateLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  translateIcon: {
    marginRight: 4,
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8D493A',
    margin: 3,
  },
  typingMessage: {
    minWidth: 70,
    paddingVertical: 0,
    marginBottom: 16,
  },
  soundButton: {
    backgroundColor: '#6C4E31',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: 35,
    height: 28,
    position: 'relative',
  },
  soundButtonActive: {
    backgroundColor: '#8D493A',
  },
  speakingIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#8D493A',
    borderRadius: 10,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonsContainer: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
});

export default ChatScreen;





