import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const QuickMessageOptions = ({ role, onSelectMessage }) => {
  // Define quick message options for each role
  const messageOptions = {
    'hotel': [
      { id: 'h1', text: 'ฉันต้องการเรียนการสนทนาตามขั้นตอนของการจองโรงแรม' },
      { id: 'h2', text: 'ฉันอยากฝึกพูดแบบสมจริงกับพนักงานโรงแรม' },
      { id: 'h3', text: 'ช่วยสอนวิธีสอบถามข้อมูลเกี่ยวกับสิ่งอำนวยความสะดวกในโรงแรม' },
      { id: 'h4', text: 'ฉันอยากเรียนรู้การพูดเพื่อขอเช็คอินล่าช้า' },
      { id: 'h5', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามราคาห้องพัก' },
      { id: 'h6', text: 'ฉันอยากฝึกพูดเพื่อแจ้งปัญหาเกี่ยวกับห้องพักให้พนักงานทราบ' },
    ],
    'restaurant': [
      { id: 'r1', text: 'ฉันอยากเรียนรู้การสั่งอาหารในร้านอาหาร' },
      { id: 'r2', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามเมนูพิเศษของวันนี้' },
      { id: 'r3', text: 'ฉันอยากฝึกพูดแบบสมจริงกับพนักงานเสิร์ฟ' },
      { id: 'r4', text: 'ช่วยสอนวิธีพูดเพื่อแจ้งข้อจำกัดด้านอาหารของฉัน' },
      { id: 'r5', text: 'ฉันอยากเรียนรู้การพูดเพื่อขอคำแนะนำเกี่ยวกับอาหารที่เหมาะกับฉัน' },
      { id: 'r6', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามเกี่ยวกับเครื่องดื่มที่เหมาะกับอาหาร' },
    ],
    'interview': [
      { id: 'i1', text: 'ฉันอยากเรียนรู้การตอบคำถามสัมภาษณ์งาน' },
      { id: 'i2', text: 'ช่วยสอนวิธีพูดเพื่อแนะนำตัวเองในสัมภาษณ์งาน' },
      { id: 'i3', text: 'ฉันอยากฝึกพูดแบบสมจริงกับผู้สัมภาษณ์งาน' },
      { id: 'i4', text: 'ช่วยสอนวิธีพูดเพื่ออธิบายจุดแข็งของฉัน' },
      { id: 'i5', text: 'ฉันอยากเรียนรู้การพูดเพื่ออธิบายประสบการณ์การทำงานของฉัน' },
      { id: 'i6', text: 'ช่วยสอนวิธีพูดเพื่อถามเกี่ยวกับรายละเอียดของตำแหน่งงาน' },
    ],
    'doctor': [
      { id: 'd1', text: 'ฉันอยากเรียนรู้การอธิบายอาการป่วยให้แพทย์ฟัง' },
      { id: 'd2', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามเกี่ยวกับผลข้างเคียงของยา' },
      { id: 'd3', text: 'ฉันอยากฝึกพูดแบบสมจริงกับแพทย์' },
      { id: 'd4', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามเกี่ยวกับการฟื้นตัว' },
      { id: 'd5', text: 'ฉันอยากเรียนรู้การพูดเพื่อแจ้งประวัติการรักษาให้แพทย์ทราบ' },
      { id: 'd6', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามเกี่ยวกับการป้องกันโรค' },
    ],
    'new_friend': [
      { id: 'f1', text: 'ฉันอยากเรียนรู้การแนะนำตัวเองให้เพื่อนใหม่' },
      { id: 'f2', text: 'ช่วยสอนวิธีพูดเพื่อถามเกี่ยวกับความสนใจของเพื่อนใหม่' },
      { id: 'f3', text: 'ฉันอยากฝึกพูดแบบสมจริงกับเพื่อนใหม่' },
      { id: 'f4', text: 'ช่วยสอนวิธีพูดเพื่อแลกเปลี่ยนประสบการณ์ส่วนตัว' },
      { id: 'f5', text: 'ฉันอยากเรียนรู้การพูดเพื่อถามเกี่ยวกับงานอดิเรกของเพื่อนใหม่' },
      { id: 'f6', text: 'ช่วยสอนวิธีพูดเพื่อถามเกี่ยวกับสถานที่ที่เพื่อนใหม่ชอบไป' },
    ],
    'taxi': [
      { id: 't1', text: 'ฉันอยากเรียนรู้การบอกทางให้คนขับแท็กซี่' },
      { id: 't2', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามค่าโดยสาร' },
      { id: 't3', text: 'ฉันอยากฝึกพูดแบบสมจริงกับคนขับแท็กซี่' },
      { id: 't4', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามเกี่ยวกับสถานที่ท้องถิ่น' },
      { id: 't5', text: 'ฉันอยากเรียนรู้การพูดเพื่อแจ้งเวลาที่ต้องการถึงจุดหมาย' },
      { id: 't6', text: 'ช่วยสอนวิธีพูดเพื่อสอบถามเกี่ยวกับเส้นทางที่เร็วที่สุด' },
    ],
  };

  // Get options for the current role or default to new_friend if role not found
  const options = messageOptions[role] || messageOptions['new_friend'];

  const AnimatedOption = ({ option }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          // Add a satisfying feedback animation
          Animated.sequence([
            Animated.spring(scaleAnim, {
              toValue: 1.05,
              useNativeDriver: true,
              tension: 400,
              friction: 10,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 400,
              friction: 10,
            }),
          ]).start();
          onSelectMessage(option.text);
        }}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.option,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.optionGlow} />
          <Text style={styles.optionText} numberOfLines={2}>
            {option.text}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="bolt" size={16} color="#8D493A" />
        </View>
        <Text style={styles.headerText}>ประโยคตัวอย่างเริ่มต้น</Text>
        <View style={styles.headerAccent} />
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => (
          <AnimatedOption key={option.id} option={option} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F4EA',
    borderRadius: 24,
    marginHorizontal: 12,
    marginVertical: 12,
    paddingVertical: 20,
    shadowColor: "#8D493A",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(141, 73, 58, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    position: 'relative',
  },
  iconContainer: {
    backgroundColor: 'rgba(141, 73, 58, 0.1)',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
    shadowColor: "#8D493A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8D493A',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.8,
    flex: 1,
  },
  headerAccent: {
    width: 4,
    height: 20,
    backgroundColor: '#AF8F6F',
    borderRadius: 2,
    shadowColor: "#AF8F6F",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: 'rgba(175, 143, 111, 0.4)',
    minWidth: 220,
    maxWidth: 260,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#AF8F6F",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  optionGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: 'rgba(141, 73, 58, 0.05)',
    borderRadius: 22,
    opacity: 0,
  },
  optionText: {
    fontSize: 16,
    color: '#5a3d35',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
    zIndex: 1,
  }
});

export default QuickMessageOptions;
