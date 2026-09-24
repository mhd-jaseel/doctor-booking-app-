import React from 'react';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../components/common/SplashScreen';
import { UserTabs } from './UserTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { AdminLoginScreen } from '../screens/auth/AdminLoginScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminFacilitiesScreen } from '../screens/admin/AdminFacilitiesScreen';
import { AdminDoctorsScreen } from '../screens/admin/AdminDoctorsScreen';
import { AdminSchedulesScreen } from '../screens/admin/AdminSchedulesScreen';
import { AdminAppointmentsScreen } from '../screens/admin/AdminAppointmentsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminRatingsScreen } from '../screens/admin/AdminRatingsScreen';
import { AdminHealthcareServicesScreen } from '../screens/admin/AdminHealthcareServicesScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user, loading, isAdmin } = useAuth();

  // 1. App Startup / Session Restoration → Show branded splash
  if (loading) {
    return <SplashScreen />;
  }

  // 2. Authenticated Admin -> Dedicated Admin Portal Navigator
  if (isAdmin) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Stack.Navigator
          initialRouteName="AdminDashboard"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="AdminFacilities" component={AdminFacilitiesScreen} />
          <Stack.Screen name="AdminDoctors" component={AdminDoctorsScreen} />
          <Stack.Screen name="AdminHealthcareServices" component={AdminHealthcareServicesScreen} />
          <Stack.Screen name="AdminSchedules" component={AdminSchedulesScreen} />
          <Stack.Screen name="AdminAppointments" component={AdminAppointmentsScreen} />
          <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
          <Stack.Screen name="AdminRatings" component={AdminRatingsScreen} />
        </Stack.Navigator>
      </>
    );
  }

  // 3. User / Public Shell -> User Navigator with Auth routes available
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Global User Application Shell (Persistent User Bottom Navigation) */}
        <Stack.Screen name="MainTabs" component={UserTabs} />

        {/* Auth Entry Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      </Stack.Navigator>
    </>
  );
};
