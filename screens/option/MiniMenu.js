import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Menu from '../menu.js';
import Settings from './Settings.js';
import ProfileScreen from '../profile.js';
import { CHATBOT_ROLES } from './Settings';

const MiniMenu = ({ 
    currentScreen, 
    setCurrentScreen, 
    isKeyboardVisible,
    renderChatScreen,
    difficulty,
    chatbotRole,
    handleSettingsChange,
    resetChat
}) => {
    const games = [
        { id: 'chat', title: 'Chat', component: null },
        { id: 'game', title: 'Game', component: Menu },
        { id: 'profile', title: 'Profile', component: ProfileScreen },
    ];

    const getIconName = (id) => {
        switch (id) {
            case 'chat': return 'chatbubble-outline';
            case 'profile': return 'person-outline';
            case 'settings': return 'settings-outline';
            case 'game': return 'game-controller-outline';
            default: return 'game-controller-outline';
        }
    };

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

    const renderCurrentScreen = () => {
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
                return (
                    <>
                        {renderHeader()}
                        {renderChatScreen()}
                    </>
                );
        }
    };

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
                    <Ionicons name={getIconName(item.id)} size={25} color={currentScreen === item.id ? "#8D493A" : "white"} />
                    <Text style={[styles.miniMenuText, currentScreen === item.id && styles.miniMenuTextActive]}>{item.title}</Text>
                </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
        />
    );

    return (
        <>
            <View style={styles.footer}>
                {renderCurrentScreen()}
            </View>
            {!isKeyboardVisible && (
                <View style={styles.chatContainer}>
                    {renderMiniMenu()}
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    footer: {
        flex: 1,
        backgroundColor: '#F8EDE3',
    },
    chatContainer: {
        flex: 0.1,
        backgroundColor: '#F8EDE3',
    },
    miniMenuContent: {
        flexGrow: 1,
        backgroundColor: '#AF8F6F',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 7,
    },
    miniMenuItem: {
        paddingHorizontal: 23,
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
    headerText: {
        color: 'white',
        fontSize: 25,
        fontWeight: 'bold',
        textShadowColor: 'black',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    roleStatus: {
        color: '#F8EDE3',
        fontSize: 14,
        marginTop: 2,
        opacity: 0.8,
    },
});

export default MiniMenu;
