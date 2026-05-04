import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';

type Screen = 'login' | 'register' | 'home';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [userName, setUserName] = useState('');

  const handleLogin = (email: string) => {
    // Extract name from email (before @) or use email
    const name = email.includes('@') ? email.split('@')[0] : email;
    setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    setScreen('home');
  };

  const handleRegister = (name: string, _email: string) => {
    setUserName(name);
    setScreen('home');
  };

  const handleLogout = () => {
    setUserName('');
    setScreen('login');
  };

  return (
    <SafeAreaProvider>
      {screen === 'login' && (
        <LoginScreen onLogin={handleLogin} onGoRegister={() => setScreen('register')} />
      )}
      {screen === 'register' && (
        <RegisterScreen onRegister={handleRegister} onGoLogin={() => setScreen('login')} />
      )}
      {screen === 'home' && (
        <HomeScreen userName={userName} onLogout={handleLogout} />
      )}
    </SafeAreaProvider>
  );
}
