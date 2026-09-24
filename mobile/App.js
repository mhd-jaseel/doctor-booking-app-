import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/components/common/AppAlert';
import { RootNavigator } from './src/navigation/RootNavigator';
import { APP_NAME } from './src/constants/app';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{APP_NAME}</Text>
          <Text style={styles.errorSubtitle}>An unexpected error occurred during render:</Text>
          <Text style={styles.errorDetails}>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider style={styles.container}>
        <AuthProvider>
          <AlertProvider>
            <NavigationContainer
              documentTitle={{
                formatter: (options, route) => options?.title || APP_NAME,
              }}
            >
              <View style={styles.container}>
                <RootNavigator />
              </View>
            </NavigationContainer>
          </AlertProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2F65CB',
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#475467',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 12,
    color: '#F04438',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
});
