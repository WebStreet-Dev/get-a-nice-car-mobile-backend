# Enhance Broadcast Notifications with Real-Time WebSocket Support

## Current State

The broadcast notification feature already exists:
- ✅ Admin panel UI at `/notifications` page
- ✅ Backend API endpoint: `POST /api/v1/admin/notifications/broadcast`
- ✅ Sends push notifications via FCM to all users
- ✅ Creates notifications in database
- ✅ WebSocket exists but only for admin notifications (admin panel)

## What Needs to Be Added

1. **Add NEWS/ANNOUNCEMENT notification type** for broadcasts
2. **Extend WebSocket service** to support user connections (not just admins)
3. **Emit WebSocket events** when broadcast notifications are sent
4. **Mobile app WebSocket client** to receive real-time notifications
5. **Enhanced admin panel UI** with better UX for broadcasts

## Implementation Plan

### Phase 1: Add NEWS Notification Type

**File: `backend/prisma/schema.prisma`**
- Add `NEWS` to `NotificationType` enum
- Create migration: `npx prisma migrate dev --name add_news_notification_type`

**Files to update:**
- `backend/src/services/notification.service.ts` - Handle NEWS type
- `backend/admin/src/pages/Notifications.tsx` - Add NEWS option

### Phase 2: Extend WebSocket Service for Users

**File: `backend/src/services/websocket.service.ts`**
- Add `connectedUsers` Map to track regular user connections
- Modify authentication to allow all authenticated users (not just admins)
- Add `handleUserConnection()` method
- Add `emitUserNotification()` method to send notifications to specific users
- Add `emitBroadcastNotification()` method to send to all connected users

**File: `backend/src/services/notification.service.ts`**
- Emit WebSocket event when broadcast notification is sent
- Call `webSocketService.emitBroadcastNotification()` in `sendToAllUsers()`

### Phase 3: Mobile App WebSocket Client

**File: `lib/data/services/websocket_service.dart`** (NEW)
- Create WebSocket service for Flutter using `socket_io_client` package
- Connect to Socket.io server with JWT authentication
- Listen for `user:notification` and `user:broadcast` events
- Handle reconnection logic
- Integrate with notification provider

**File: `lib/presentation/providers/notification_provider.dart`**
- Add WebSocket connection on user login
- Handle incoming WebSocket notifications
- Update notification list in real-time
- Show in-app notification when received

**File: `lib/presentation/providers/auth_provider.dart`**
- Connect WebSocket when user logs in
- Disconnect WebSocket when user logs out

### Phase 4: Enhanced Admin Panel UI

**File: `backend/admin/src/pages/Notifications.tsx`**
- Add NEWS/ANNOUNCEMENT type option
- Improve UI with better styling and icons
- Add preview of notification before sending
- Show connected users count (optional)
- Better success/error messages with details

**File: `backend/admin/src/services/api.ts`**
- Ensure broadcast API call includes all necessary fields

### Phase 5: Backend Integration

**File: `backend/src/controllers/admin.controller.ts`**
- Enhance `sendBroadcastNotification()` to emit WebSocket event
- Add logging for broadcast notifications

**File: `backend/src/services/notification.service.ts`**
- Emit WebSocket event in `sendToAllUsers()`
- Add comprehensive logging

## Technical Details

### WebSocket Events

**User Connection:**
- `user:connected` - Sent when user connects
- `user:notification` - Sent when user receives a notification
- `user:broadcast` - Sent when broadcast notification is sent to all users

**Admin Connection (existing):**
- `admin:notification` - For admin-specific notifications (unchanged)

### Notification Flow

1. Admin sends broadcast from admin panel
2. Backend creates notifications in database for all users
3. Backend sends FCM push notifications to all users
4. Backend emits WebSocket event to all connected users
5. Mobile app receives WebSocket event (if app is open)
6. Mobile app shows in-app notification instantly
7. Mobile app also receives FCM push notification (if app is closed)

### Database Schema Change

```prisma
enum NotificationType {
  APPOINTMENT
  OFFER
  PAYMENT
  SERVICE
  GENERAL
  ACCOUNT_APPROVED
  ACCOUNT_REJECTED
  APPOINTMENT_APPROVED
  APPOINTMENT_REJECTED
  NEWS        // NEW - for announcements and broadcasts
}
```

## Files to Create/Modify

### Backend
- `backend/prisma/schema.prisma` - Add NEWS type
- `backend/src/services/websocket.service.ts` - Extend for users
- `backend/src/services/notification.service.ts` - Emit WebSocket events
- `backend/src/controllers/admin.controller.ts` - Enhance broadcast endpoint

### Admin Panel
- `backend/admin/src/pages/Notifications.tsx` - Enhance UI, add NEWS type

### Mobile App
- `lib/data/services/websocket_service.dart` - NEW - WebSocket client
- `lib/presentation/providers/notification_provider.dart` - Integrate WebSocket
- `lib/presentation/providers/auth_provider.dart` - Connect WebSocket on login
- `pubspec.yaml` - Add `socket_io_client` dependency

## Benefits

1. ✅ Real-time notifications when app is open (WebSocket)
2. ✅ Push notifications when app is closed (FCM)
3. ✅ Better user experience with instant updates
4. ✅ NEWS/ANNOUNCEMENT type for broadcasts
5. ✅ Enhanced admin panel UI
6. ✅ Works for all users, not just admins

## Testing Checklist

- [ ] Add NEWS type to database schema and migrate
- [ ] Test WebSocket connection for regular users
- [ ] Test broadcast notification sends WebSocket event
- [ ] Test mobile app receives WebSocket notification
- [ ] Test push notification still works
- [ ] Test admin panel can send NEWS broadcasts
- [ ] Test multiple users receive notifications simultaneously
