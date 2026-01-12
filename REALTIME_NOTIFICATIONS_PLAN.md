# Real-Time Popup Notifications Plan

## Overview
Implement instant popup notifications in the admin panel when:
- New client registers
- New appointment is booked
- New breakdown request is created

## Architecture

### Backend (Node.js/Express)
1. **Install Socket.io**
   - Add `socket.io` and `@types/socket.io` packages
   - Create WebSocket server alongside Express server

2. **WebSocket Service**
   - Create `src/services/websocket.service.ts`
   - Handle admin connections (authenticate via JWT)
   - Emit events when admin notifications are created
   - Track connected admin users

3. **Integration Points**
   - `auth.service.ts` - Emit on client registration
   - `appointment.service.ts` - Emit on appointment creation
   - `breakdown.service.ts` - Emit on breakdown creation
   - `admin-notification.service.ts` - Emit after creating notification

4. **Authentication**
   - Verify JWT token on WebSocket connection
   - Only allow ADMIN/SUPER_ADMIN roles
   - Store user ID with socket connection

### Frontend (React Admin Panel)
1. **Install Socket.io Client**
   - Add `socket.io-client` package

2. **WebSocket Hook**
   - Create `src/hooks/useWebSocket.ts`
   - Connect on login, disconnect on logout
   - Handle reconnection logic
   - Listen for admin notification events

3. **Notification Toast Component**
   - Create `src/components/NotificationToast.tsx`
   - Show popup notification with:
     - Title and message
     - Type icon (user/appointment/breakdown)
     - Approve/Reject buttons (if applicable)
     - View button to navigate to details
   - Auto-dismiss after 10 seconds
   - Click to navigate to alerts page

4. **Integration**
   - Add notification toast provider in `App.tsx`
   - Show toast when WebSocket event received
   - Update notification badge count
   - Refresh alerts list when notification received

## Implementation Steps

### Phase 1: Backend Setup
1. ✅ Install Socket.io packages
2. ✅ Create WebSocket service
3. ✅ Integrate with Express server
4. ✅ Add JWT authentication middleware
5. ✅ Emit events from notification services

### Phase 2: Frontend Setup
1. ✅ Install Socket.io client
2. ✅ Create WebSocket hook
3. ✅ Create notification toast component
4. ✅ Integrate with App.tsx
5. ✅ Add click handlers for approve/reject

### Phase 3: Testing
1. ✅ Test client registration → popup appears
2. ✅ Test appointment booking → popup appears
3. ✅ Test breakdown request → popup appears
4. ✅ Test approve/reject from popup
5. ✅ Test multiple admin users receiving notifications

## Technical Details

### WebSocket Events
- **Connection**: `admin:connect` (client → server)
- **Disconnection**: `admin:disconnect` (client → server)
- **New Notification**: `admin:notification` (server → client)
- **Notification Read**: `admin:notification:read` (client → server, optional)

### Notification Payload
```typescript
{
  id: string;
  type: 'USER_REGISTERED' | 'APPOINTMENT' | 'BREAKDOWN' | 'GENERAL';
  title: string;
  message: string;
  data: {
    userId?: string;
    appointmentId?: string;
    requestId?: string;
  };
  createdAt: string;
}
```

### Toast Notification UI
- Position: Top-right corner
- Style: Ant Design notification component
- Actions: Approve, Reject, View, Dismiss
- Auto-dismiss: 10 seconds
- Click outside: Navigate to alerts page

## Benefits
- ✅ Instant notifications without page refresh
- ✅ Better UX - admins see new requests immediately
- ✅ Can approve/reject directly from popup
- ✅ Works for multiple admin users simultaneously
- ✅ No polling needed (saves server resources)

## Files to Create/Modify

### Backend
- `src/services/websocket.service.ts` (NEW)
- `src/app.ts` (MODIFY - add Socket.io server)
- `src/services/auth.service.ts` (MODIFY - emit on register)
- `src/services/appointment.service.ts` (MODIFY - emit on create)
- `src/services/breakdown.service.ts` (MODIFY - emit on create)
- `src/services/admin-notification.service.ts` (MODIFY - emit after create)

### Frontend
- `src/hooks/useWebSocket.ts` (NEW)
- `src/components/NotificationToast.tsx` (NEW)
- `src/App.tsx` (MODIFY - add WebSocket hook and toast provider)
- `package.json` (MODIFY - add socket.io-client)

## Estimated Time
- Backend: 1-2 hours
- Frontend: 1-2 hours
- Testing: 30 minutes
- **Total: ~3-4 hours**



