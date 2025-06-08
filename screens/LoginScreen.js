import React, { useEffect, useRef } from 'react';
import { 
  SafeAreaView, 
  View, 
  Image, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  StatusBar,
  Animated,
  Easing
} from "react-native";
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();
  
  // Animation values
  const imageAnimation = useRef(new Animated.Value(0)).current;
  const bottomContainerAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimationSignIn = useRef(new Animated.Value(1)).current;
  const buttonAnimationSignUp = useRef(new Animated.Value(1)).current;
  
  // Add new animation values
  const welcomeTextAnimation = useRef(new Animated.Value(0)).current;
  const decorationAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(imageAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(imageAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Staggered animations for UI elements
    Animated.stagger(200, [
      Animated.timing(decorationAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(bottomContainerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeTextAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Start pulse animations for buttons
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    // Pulse animation for SignIn button
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonAnimationSignIn, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnimationSignIn, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for SignUp button (with slight delay)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonAnimationSignUp, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(buttonAnimationSignUp, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 500);
  };

  // Animation styles
  const imageTranslateY = imageAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />
      <View style={styles.container}>
        <Animated.View style={[
          styles.decorationCircle,
          {
            opacity: decorationAnimation,
            transform: [
              { scale: decorationAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1]
              }) }
            ]
          }
        ]} />
        <Animated.View style={[
          styles.decorationCircle2,
          {
            opacity: decorationAnimation,
            transform: [
              { scale: decorationAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1]
              }) }
            ]
          }
        ]} />
        
        <View style={styles.imageContainer}>
          <Animated.Image
            source={require('../assets/elic.png')}
            resizeMode="stretch"
            style={[
              styles.mainImage,
              { transform: [{ translateY: imageTranslateY }] }
            ]}
          />
          
          <Animated.View style={[
            styles.shimmerEffect,
            {
              opacity: imageAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.5, 0.2]
              })
            }
          ]} />
        </View>
        
        <Animated.View style={[
          styles.bottomContainer,
          { opacity: bottomContainerAnimation }
        ]}>
          <Animated.View style={{
            opacity: welcomeTextAnimation,
            transform: [{ translateY: welcomeTextAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })}]
          }}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>Begin your learning journey</Text>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: buttonAnimationSignIn }] }}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('LoginApp')}
              activeOpacity={0.8}
            >
              <View style={styles.iconPlaceholder}>
                <Text style={styles.iconText}>→</Text>
              </View>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: buttonAnimationSignUp }] }}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('SignUpApp')}
              activeOpacity={0.8}
            >
              <View style={styles.iconPlaceholder}>
                <Text style={styles.iconText}>+</Text>
              </View>
              <Text style={styles.signInButtonText}>Signup</Text>
            </TouchableOpacity>
          </Animated.View>
          
         
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FEF8E2",
    position: 'relative',
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(175, 152, 128, 0.2)',
    top: -50,
    left: -50,
  },
  decorationCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(224, 219, 194, 0.3)',
    top: 100,
    right: -50,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 33,
    position: 'relative',
  },
  mainImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  shimmerEffect: {
    position: 'absolute',
    width: 250,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ rotateZ: '-30deg' }],
    borderRadius: 15,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'FCQuantum',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E0DBC2',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'FCQuantum',
  },
  bottomContainer: {
    backgroundColor: "#452A0D",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    paddingHorizontal: 40,
    paddingVertical: 30,
    paddingTop: 25,
    height: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    position: 'relative',
  },
  loginButton: {
    height: 55,
    backgroundColor: "#E0DBC2",
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#060606",
    marginVertical: 6,
    shadowColor: "#0B0B0B",
    shadowOpacity: 0.8,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 5,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    marginTop: -5,
  },
  signInButton: {
    height: 55,
    backgroundColor: "#AF9880",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOpacity: 0.8,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 5,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    marginTop: 5,
  },
  loginButtonText: {
    color: "#303233",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: 'FCQuantum',
  },
  signInButtonText: {
    color: "#303233",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: 'FCQuantum',
  },
  iconPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#452A0D',
  },
  decorativeDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0DBC2',
    marginHorizontal: 4,
    opacity: 0.6,
  },
});

export default LoginScreen;
