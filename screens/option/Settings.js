import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText, Animated, Easing } from 'react-native';
import { Icon } from '@rneui/themed';
import { Card } from '@rneui/themed';
import { Overlay } from '@rneui/themed';

const ROLE_DESCRIPTIONS = {
  'hotel': 'ฝึกภาษาอังกฤษในสถานการณ์การจองห้องพักโรงแรม เรียนรู้คำศัพท์และประโยคที่ใช้ในการจองห้องพัก การเช็คอิน และการสอบถามข้อมูลบริการต่างๆ ของโรงแรม',
  'restaurant': 'ฝึกสนทนาภาษาอังกฤษในร้านอาหาร เรียนรู้การสั่งอาหาร บอกความต้องการพิเศษ และศัพท์เกี่ยวกับอาหารและการบริการ',
  'interview': 'เตรียมความพร้อมสำหรับการสัมภาษณ์งานเป็นภาษาอังกฤษ ฝึกตอบคำถามสัมภาษณ์ และเรียนรู้คำศัพท์ในการนำเสนอตัวเอง',
  'doctor': 'ฝึกสื่อสารกับแพทย์เป็นภาษาอังกฤษ เรียนรู้การอธิบายอาการ การถาม-ตอบเกี่ยวกับการรักษา และคำศัพท์ทางการแพทย์',
  'new_friend': 'ฝึกการแนะนำตัวและพูดคุยกับเพื่อนใหม่เป็นภาษาอังกฤษ เรียนรู้การสนทนาทั่วไป การแลกเปลี่ยนความสนใจ และการสร้างความสัมพันธ์',
  'taxi': 'ฝึกสนทนากับคนขับแท็กซี่เป็นภาษาอังกฤษ เรียนรู้การบอกทาง การต่อรองราคา และคำศัพท์เกี่ยวกับการเดินทาง'
};

export const CHATBOT_ROLES = [
  { label: 'การจองโรงแรม ', value: 'hotel' },
  { label: 'การสั่งอาหารในร้าน', value: 'restaurant' },
  { label: 'การสัมภาษณ์งาน', value: 'interview' },
  { label: 'เมื่อพบแพทย์', value: 'doctor' },
  { label: 'เมื่อพบเพื่อนใหม่', value: 'new_friend' },
  { label: 'สนทนาบนแท็กซี่', value: 'taxi' },
];

const ROLE_ICONS = {
  'hotel': 'home',
  'restaurant': 'coffee',
  'interview': 'briefcase',
  'doctor': 'activity',
  'new_friend': 'users',
  'taxi': 'map-pin',
};

const Settings = ({ chatbotRole, setChatbotRole }) => {
  const [isRolePickerVisible, setRolePickerVisible] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;
  const descriptionTranslateY = useRef(new Animated.Value(20)).current;

  const [roleOptionsAnim, setRoleOptionsAnim] = useState([]);

  useEffect(() => {
    const animArray = CHATBOT_ROLES.map(() => new Animated.Value(0));
    setRoleOptionsAnim(animArray);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (chatbotRole) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(descriptionOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(descriptionTranslateY, {
            toValue: 20, 
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(descriptionOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(descriptionTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(iconScaleAnim, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(iconScaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(iconRotateAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [chatbotRole]);

  const generatePrompt = (role) => {
    return ROLE_DESCRIPTIONS[role] || 'กรุณาเลือกบทบาทที่ต้องการ';
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();

    Animated.timing(rotateAnim, {
      toValue: isRolePickerVisible ? 0 : 1,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    
    setRolePickerVisible(!isRolePickerVisible);
  };

  useEffect(() => {
    if (isRolePickerVisible && roleOptionsAnim.length > 0) {
      const animations = roleOptionsAnim.map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: index * 70,
          useNativeDriver: true,
        });
      });
      
      Animated.stagger(50, animations).start();
    } else if (roleOptionsAnim.length > 0) {
      roleOptionsAnim.forEach((anim) => {
        anim.setValue(0);
      });
    }
  }, [isRolePickerVisible, roleOptionsAnim]);

  const renderSelectionBar = (label, value, description, onPress) => {
    const rotateInterpolate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View style={styles.settingItem}>
        <RNText style={styles.label}>{label}:</RNText>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.selectionBar}
            onPress={() => {
              animatePress();
              onPress();
            }}
            activeOpacity={0.9}
          >
            <View style={styles.selectionBarContent}>
              <Icon
                name="tag"
                type="feather"
                size={18}
                color="#8D493A"
                style={styles.selectionIcon}
              />
              <RNText style={styles.selectionBarText}>
                {value || `เลือก ${label}`}
              </RNText>
            </View>
            <Animated.View style={[
              styles.chevronContainer,
              { transform: [{ rotate: rotateInterpolate }] }
            ]}>
              <Icon 
                name="chevron-down" 
                type="feather" 
                size={20} 
                color="#8D493A"
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const iconRotate = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={{ 
        opacity: cardOpacity, 
        transform: [{ translateY: cardTranslateY }],
        width: '100%'
      }}>
        <Card containerStyle={styles.card}>
          <RNText style={styles.cardTitle}>การตั้งค่าแชท</RNText>

          {renderSelectionBar('บทบาทของแชทบอท', CHATBOT_ROLES.find(role => role.value === chatbotRole)?.label, '', () => setRolePickerVisible(true))}

          {chatbotRole && (
            <View style={styles.roleContentContainer}>
              <Animated.View style={[
                styles.roleIconContainer,
                {
                  transform: [
                    { scale: iconScaleAnim },
                    { rotate: iconRotate }
                  ]
                }
              ]}>
                <Icon
                  name={ROLE_ICONS[chatbotRole] || "help-circle"}
                  type="feather"
                  size={30}
                  color="#8D493A"
                />
              </Animated.View>

              <Animated.View style={[
                styles.promptContainer,
                { 
                  opacity: descriptionOpacity,
                  transform: [{ translateY: descriptionTranslateY }]
                }
              ]}>
                <RNText style={styles.promptLabel}>คำอธิบาย:</RNText>
                <RNText style={styles.promptText}>{generatePrompt(chatbotRole)}</RNText>
              </Animated.View>
            </View>
          )}
        </Card>
      </Animated.View>

      {!chatbotRole && (
        <Animated.View style={[styles.emptyStateContainer, { opacity: cardOpacity }]}>
          <Icon
            name="message-circle"
            type="feather"
            size={80}
            color="#e8dad5"
          />
          <RNText style={styles.emptyStateText}>กรุณาเลือกบทบาทของแชทบอทเพื่อเริ่มการสนทนา</RNText>
        </Animated.View>
      )}

      <Overlay
        isVisible={isRolePickerVisible}
        onBackdropPress={() => setRolePickerVisible(false)}
        overlayStyle={styles.overlay}
        animationType="fade"
      >
        <ScrollView>
          <RNText style={styles.overlayTitle}>เลือกบทบาทของแชทบอท</RNText>
          {CHATBOT_ROLES.map((role, index) => (
            <Animated.View key={role.value} style={{
              opacity: roleOptionsAnim[index] ? roleOptionsAnim[index] : 0,
              transform: roleOptionsAnim[index] ? [{ 
                translateY: roleOptionsAnim[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                }) 
              }] : [{ translateY: 0 }]
            }}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  chatbotRole === role.value && styles.selectedRoleOption
                ]}
                onPress={() => {
                  setChatbotRole(role.value);
                  setRolePickerVisible(false);
                }}
              >
                <View style={styles.roleOptionContent}>
                  <View style={styles.roleIconWrapper}>
                    <Icon
                      name={ROLE_ICONS[role.value] || "help-circle"}
                      type="feather"
                      size={22}
                      color={chatbotRole === role.value ? "#8D493A" : "#666"}
                    />
                  </View>
                  <RNText style={[
                    styles.roleOptionText,
                    chatbotRole === role.value && styles.selectedRoleOptionText
                  ]}>{role.label}</RNText>
                </View>
                {chatbotRole === role.value && (
                  <View style={styles.checkmarkContainer}>
                    <Icon name="check" type="feather" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </Overlay>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FAFAFA',
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    margin: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFF',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  settingItem: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f4f2',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8dad5',
    shadowColor: '#8D493A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectionBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIcon: {
    marginRight: 10,
  },
  selectionBarText: {
    fontSize: 16,
    color: '#5a3d35',
    fontWeight: '500',
  },
  promptContainer: {
    marginTop: 16,
    flex: 1,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  overlay: {
    width: '85%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFF',
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: '#f8f4f2',
  },
  selectedRoleOption: {
    backgroundColor: '#8D493A20',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedRoleOptionText: {
    fontWeight: 'bold',
    color: '#8D493A',
  },
  chevronContainer: {
    backgroundColor: 'rgba(141, 73, 58, 0.1)',
    borderRadius: 20,
    padding: 6,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  roleContentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0e6e2',
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
    borderRadius: 30,
    backgroundColor: '#f8f4f2',
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
  },
  roleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(141, 73, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkmarkContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#8D493A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Settings;
