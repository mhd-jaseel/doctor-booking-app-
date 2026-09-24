import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserBottomNav } from '../components/common/UserBottomNav';
import { HomeScreen } from '../screens/user/HomeScreen';
import { HistoryScreen } from '../screens/user/HistoryScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import { FacilityCategoryScreen } from '../screens/user/FacilityCategoryScreen';
import { FacilityDetailScreen } from '../screens/user/FacilityDetailScreen';
import { AvailableDoctorsScreen } from '../screens/user/AvailableDoctorsScreen';
import { DoctorDetailScreen } from '../screens/user/DoctorDetailScreen';
import { BookSlotScreen } from '../screens/user/BookSlotScreen';
import { PatientDetailsScreen } from '../screens/user/PatientDetailsScreen';
import { AppointmentConfirmScreen } from '../screens/user/AppointmentConfirmScreen';
import { BookingSuccessScreen } from '../screens/user/BookingSuccessScreen';
import { NotificationsScreen } from '../screens/user/NotificationsScreen';
import { OthersScreen } from '../screens/user/OthersScreen';

const Tab = createBottomTabNavigator();

export const UserTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <UserBottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      {/* 4 Primary Navigation Tabs */}
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />

      {/* Child & Detail User Screens (Bottom Navigation Remains Persistent) */}
      <Tab.Screen name="FacilityCategory" component={FacilityCategoryScreen} />
      <Tab.Screen name="OthersServices" component={OthersScreen} />
      <Tab.Screen name="FacilityDetail" component={FacilityDetailScreen} />
      <Tab.Screen name="AvailableDoctors" component={AvailableDoctorsScreen} />
      <Tab.Screen name="DoctorDetail" component={DoctorDetailScreen} />
      <Tab.Screen name="BookSlot" component={BookSlotScreen} />
      <Tab.Screen name="PatientDetails" component={PatientDetailsScreen} />
      <Tab.Screen name="AppointmentConfirm" component={AppointmentConfirmScreen} />
      <Tab.Screen name="BookingSuccess" component={BookingSuccessScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
};
