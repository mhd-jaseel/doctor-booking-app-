# Doctor Booking Application — Implementation & Audit Plan

## 1. Executive Summary & Audit Matrix

| Screen / Flow | Current Status | Issues Identified | Action Plan |
| :--- | :--- | :--- | :--- |
| **Authentication Flow** | Implicit fallback session in AuthContext, missing Login/Register screens. | No dedicated Login / Register screens in navigation for full auth experience. | Build [`LoginScreen.js`](file:///mobile/src/screens/auth/LoginScreen.js) and [`RegisterScreen.js`](file:///mobile/src/screens/auth/RegisterScreen.js), wire up token persistence, user/admin routing. |
| **Home Screen** | Has Today's booking banner, 4 facility cards, Best Doctors. Header has location "Kuttippuram". | Home header should not have GPS/location logic; 4 categories: Govt, Private, Clinics, Home Consultation. | Enhance with Search Bar (facilities/doctors) and clean search filtering without GPS. |
| **Category Flows (Govt, Private, Clinics, Home)** | Routes directly to generic doctor list with ownership filter. | Missing dedicated Facility Type picker and Facility List flow (Govt -> Facility Types -> Facilities -> Doctors; Private -> Facility Types -> Facilities -> Doctors; Clinics -> Clinic List -> Doctors; Home Consultation -> Available Home-visit Doctors). | Build [`FacilityCategoryScreen.js`](file:///mobile/src/screens/user/FacilityCategoryScreen.js) & [`FacilityDetailScreen.js`](file:///mobile/src/screens/user/FacilityDetailScreen.js). |
| **Doctor Details Screen** | Directly opens Book Slot screen without dedicated Doctor Profile view. | Need Doctor Details screen showing qualification, experience, rating, consultation fee, about, consultation modes, and "Book Appointment" CTA. | Build [`DoctorDetailScreen.js`](file:///mobile/src/screens/user/DoctorDetailScreen.js). |
| **Booking Flow** | Date -> Segment -> Token -> Modal directly calls book. | Requirements: Doctor -> Date -> Token -> Patient Details (Name, Age, Gender, Phone) -> Confirm Appointment -> Success screen. Do not ask patient details at login. | Build dedicated [`PatientDetailsScreen.js`](file:///mobile/src/screens/user/PatientDetailsScreen.js) and [`BookingSuccessScreen.js`](file:///mobile/src/screens/user/BookingSuccessScreen.js). |
| **Token Grid & Slot UI** | Tokens rendered with time label ("Booked" or "10:00 AM"). | Requirements: Tokens are queue numbers ONLY. Do NOT attach exact times to individual tokens. Consultation hours shown on top (e.g. 10:00 AM - 1:00 PM). | Update [`TokenGrid.js`](file:///mobile/src/components/booking/TokenGrid.js) to display pure queue numbers. |
| **Full Date & Waiting List** | Displays 0 slots available without Join Waiting List button. | When all tokens are booked, show "No slots available for this date" + "[ Join Waiting List ]" (max 5 capacity). | Add Waiting List CTA and integrate `waitingListService.joinWaitingList`. |
| **Appointments / History** | Shows list with cancel and 1-5 star modal. | Missing tab filter for `Upcoming`, `Completed`, `Cancelled` tabs. Rating star modal should support rating Doctor & Facility. | Refactor [`HistoryScreen.js`](file:///mobile/src/screens/user/HistoryScreen.js) with 3 tab filters and star ratings. |
| **Admin Area** | Overview KPI & Appointment status updates. | Extend with Facility management, Doctor list, Schedule availability toggle, and cancellation cascades. | Enhance [`AdminDashboardScreen.js`](file:///mobile/src/screens/admin/AdminDashboardScreen.js) with full multi-tab admin controls. |

## 2. Navigation Architecture (`RootNavigator.js` & `UserTabs.js`)

```
RootNavigator (Native Stack)
├── AuthStack
│   ├── LoginScreen
│   └── RegisterScreen
├── MainTabs (Bottom Tabs: Home, Live, History, Profile)
│   ├── Home (HomeScreen)
│   ├── Live (LiveQueueScreen)
│   ├── History (HistoryScreen)
│   └── Profile (ProfileScreen)
├── FacilityCategory (FacilityCategoryScreen: Types & List)
├── FacilityDetail (FacilityDetailScreen)
├── DoctorDetail (DoctorDetailScreen)
├── AvailableDoctors (AvailableDoctorsScreen)
├── BookSlot (BookSlotScreen: 5-Day selector, consultation hours, Token Grid, Waiting List)
├── PatientDetails (PatientDetailsScreen: Name, Age, Gender, Phone)
├── AppointmentConfirm (AppointmentConfirmScreen)
├── BookingSuccess (BookingSuccessScreen)
├── Notifications (NotificationsScreen)
└── AdminDashboard (AdminDashboardScreen)
```

## 3. Execution Plan
1. **Services Layer**: Add `waitingListService` to `mobile/src/services/index.js`.
2. **Auth Screens**: Create `LoginScreen.js` and `RegisterScreen.js`.
3. **Facility & Category Screens**: Create `FacilityCategoryScreen.js` and `FacilityDetailScreen.js`.
4. **Doctor & Patient Flow Screens**: Create `DoctorDetailScreen.js`, update `BookSlotScreen.js`, `TokenGrid.js`, create `PatientDetailsScreen.js` and `BookingSuccessScreen.js`.
5. **Refine History & Live Queue**: Update `HistoryScreen.js` (tabs: Upcoming, Completed, Cancelled) and `LiveQueueScreen.js`.
6. **Admin Dashboard**: Update `AdminDashboardScreen.js` with comprehensive facility/doctor/schedule tabs.
7. **Navigation Wiring**: Update `RootNavigator.js` and test entire flow on web bundle.
