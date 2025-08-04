import { configureStore } from '@reduxjs/toolkit';

import notificationReducer from "./slices/notificationSlice"
import NotificationState from "./slices/notificationSlice"
import authReducer, { AuthState } from './slices/authSlice';

export interface RootState {
  notifications: NotificationState;
  auth: AuthState;
}

export const store = configureStore({
  reducer: {
    notifications: notificationReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['notifications/addNotification'],
        ignoredPaths: ['notifications.notifications'],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;