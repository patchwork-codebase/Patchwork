import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:async';
import 'dart:convert' as java_convert; // using java_convert to avoid conflict
import '../firebase_options.dart';

// ── Firebase Web Push (VAPID) public key ──────────────────────────────────────
// Generated in Firebase Console → Project Settings → Cloud Messaging → Web Push certificates.
// Passed to getToken() on web; harmlessly ignored on Android / iOS.
const _kVapidKey =
    'BIZnXE5JtAx-PcAHe3ZzCbVSL7OVrvMsRxZxXqnZyDpDuzSIFEnc_JkjImtzxdaiTIYhs530ZNI4LGC5PXN2TrI';

// ─────────────────────────────────────────────────────────────────────────────
// TOP-LEVEL background handler — MUST be outside any class.
// Called by the OS when a data/notification message arrives while the app is
// in the background or fully terminated. Must be annotated so the Dart VM
// keeps it alive in its own isolate.
// ─────────────────────────────────────────────────────────────────────────────
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase must be re-initialised inside background isolates.
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // The OS will automatically show the notification from the FCM payload's
  // "notification" block. If you're sending data-only messages you can
  // manually show a local notification here instead.
  debugPrint('[FCM Background] ${message.messageId}: ${message.notification?.title}');
}

// ─────────────────────────────────────────────────────────────────────────────
// Global navigator key — lets the service navigate from outside the widget tree
// (e.g. when the user taps a push notification that opens a terminated app).
// Register this on MaterialApp.navigatorKey in main.dart.
// ─────────────────────────────────────────────────────────────────────────────
final GlobalKey<NavigatorState> pushNavigatorKey = GlobalKey<NavigatorState>();

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotif =
      FlutterLocalNotificationsPlugin();

  // ── Initialisation ──────────────────────────────────────────────────────────

  Future<void> init() async {
    _initLocalNotifications();
    _setupRealtimeNotifications();

    try {
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      // Register the top-level background handler BEFORE anything else.
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      // Don't await — we don't want to block app startup waiting for permissions.
      _setupMessaging();
    } catch (e) {
      debugPrint('[FCM] Firebase init failed: $e');
    }
  }

  void _setupRealtimeNotifications() {
    // Listen for sign-in state to setup the realtime channel
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final user = data.session?.user;
      if (user != null) {
        Supabase.instance.client
            .channel('public:notifications:${user.id}')
            .onPostgresChanges(
              event: PostgresChangeEvent.insert,
              schema: 'public',
              table: 'notifications',
              filter: PostgresChangeFilter(
                type: PostgresChangeFilterType.eq,
                column: 'user_id',
                value: user.id,
              ),
              callback: _handleRealtimeNotification,
            )
            .subscribe();
      }
    });
  }

  void _handleRealtimeNotification(PostgresChangePayload payload) async {
    final notification = payload.newRecord;
    final type = notification['type'] as String?;
    final metadata = notification['metadata'] as Map<String, dynamic>?;
    
    String title = 'New notification';
    String body = 'You have a new notification on Patchwork';
    Map<String, dynamic> data = {'type': type};
    
    // We fetch the actor name to make the notification look nice
    final actorId = notification['actor_id'];
    String actorName = 'Someone';
    if (actorId != null) {
      try {
        final res = await Supabase.instance.client.from('users').select('name').eq('id', actorId).maybeSingle();
        if (res != null) actorName = res['name'] as String;
      } catch (_) {}
    }

    if (type == 'new_message') {
      title = '$actorName sent a message';
      body = metadata?['message_preview'] ?? 'New message in ${metadata?['room_title'] ?? 'a room'}';
      data['room_id'] = metadata?['room_id'];
      data['room_title'] = metadata?['room_title'];
    } else if (type == 'mention') {
      title = '$actorName mentioned you';
      body = metadata?['message_preview'] ?? 'You were mentioned in ${metadata?['room_title'] ?? 'a room'}';
      data['room_id'] = metadata?['room_id'];
      data['room_title'] = metadata?['room_title'];
    } else if (type == 'reaction' || type == 'update_posted') {
      title = 'New update activity';
      body = '$actorName interacted with your update';
      data['update_id'] = metadata?['update_id'];
    }

    // Only show if we aren't currently IN the chat room
    showLocalNotification(
      title: title,
      body: body,
      data: data,
    );
  }

  void _initLocalNotifications() {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/launcher_icon');

    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    _localNotif.initialize(
      settings,
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
    );
  }

  // ── FCM Setup ────────────────────────────────────────────────────────────────

  Future<void> _setupMessaging() async {
    try {
      final messaging = FirebaseMessaging.instance;

      // Request permission (iOS shows a dialog; Android 13+ also requires this).
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        announcement: false,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
      );

      if (settings.authorizationStatus != AuthorizationStatus.authorized &&
          settings.authorizationStatus != AuthorizationStatus.provisional) {
        debugPrint('[FCM] Permission not granted: ${settings.authorizationStatus}');
        return;
      }

      // ── Token management ───────────────────────────────────────────────────
      // vapidKey is required for web push; it is silently ignored on Android/iOS.
      final token = await messaging.getToken(vapidKey: _kVapidKey);
      if (token != null) await _syncTokenToSupabase(token);
      messaging.onTokenRefresh.listen(_syncTokenToSupabase);

      // ── Foreground messages ────────────────────────────────────────────────
      // When the app is open, FCM does NOT show a system notification.
      // We display one manually via flutter_local_notifications.
      FirebaseMessaging.onMessage.listen((message) {
        if (message.notification != null) {
          showLocalNotification(
            title: message.notification!.title ?? 'Patchwork',
            body: message.notification!.body ?? '',
            data: message.data,
          );
        }
      });

      // ── Tap routing: app in background, user taps notification ────────────
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // ── Tap routing: app was terminated, user taps notification ───────────
      // getInitialMessage() returns the message that launched the app (if any).
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        // Delay briefly so the navigator is ready.
        await Future.delayed(const Duration(milliseconds: 500));
        _handleNotificationTap(initialMessage);
      }
    } catch (e) {
      debugPrint('[FCM] Setup failed: $e');
    }
  }

  // ── Token sync ──────────────────────────────────────────────────────────────

  Future<void> _syncTokenToSupabase(String token) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      // User may not be logged in yet — listen for sign-in and retry once.
      StreamSubscription<AuthState>? sub;
      sub = Supabase.instance.client.auth.onAuthStateChange.listen(
        (data) {
          if (data.event == AuthChangeEvent.signedIn) {
            _syncTokenToSupabase(token);
            sub?.cancel();
          }
        },
      );
      return;
    }

    try {
      await Supabase.instance.client
          .from('users')
          .update({'fcm_token': token})
          .eq('id', user.id);
      debugPrint('[FCM] Token synced for user ${user.id}');
    } catch (e) {
      debugPrint('[FCM] Token sync failed: $e');
    }
  }

  // ── Navigation routing ──────────────────────────────────────────────────────

  /// Called when the user taps a push notification (background or terminated).
  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    final type = data['type'] as String?;
    final navigator = pushNavigatorKey.currentState;
    if (navigator == null) {
      debugPrint('[FCM] Navigator not ready for tap routing');
      return;
    }

    switch (type) {
      case 'reaction':
      case 'update_posted':
        final updateId = data['update_id'] as String?;
        if (updateId != null) {
          _navigateToUpdate(navigator, updateId);
        }
        break;

      case 'room_follow':
      case 'decision_updated':
        final roomId = data['room_id'] as String?;
        final roomTitle = data['room_title'] as String? ?? 'Room';
        if (roomId != null) {
          _navigateToRoom(navigator, roomId, roomTitle);
        }
        break;

      case 'mention':
      case 'new_message':
        final chatRoomId = data['room_id'] as String?;
        final chatRoomTitle = data['room_title'] as String? ?? 'Room Chat';
        if (chatRoomId != null) {
          navigator.pushNamed('/chat-thread', arguments: {
            'roomId': chatRoomId,
            'title': chatRoomTitle,
          });
        }
        break;

      default:
        // Fall through to the in-app notifications tab
        navigator.pushNamed('/notifications');
    }
  }

  Future<void> _navigateToUpdate(
      NavigatorState navigator, String updateId) async {
    try {
      final update = await Supabase.instance.client
          .from('updates')
          .select(
              '*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
          .eq('id', updateId)
          .maybeSingle();
      if (update != null) {
        navigator.pushNamed('/update-thread', arguments: update);
      }
    } catch (e) {
      debugPrint('[FCM] Failed to load update for navigation: $e');
    }
  }

  void _navigateToRoom(
      NavigatorState navigator, String roomId, String roomTitle) {
    navigator.pushNamed('/room-detail', arguments: {
      'roomId': roomId,
      'title': roomTitle,
    });
  }

  /// Called when the user taps a local (flutter_local_notifications) notification.
  void _onLocalNotificationTap(NotificationResponse response) {
    debugPrint('[LocalNotif] Tapped: payload=${response.payload}');
    if (response.payload != null && response.payload!.isNotEmpty) {
      try {
        final data = Map<String, dynamic>.from(
          java_convert.jsonDecode(response.payload!) as Map
        );
        _handleNotificationTap(RemoteMessage(data: data));
        return;
      } catch (e) {
        debugPrint('Error parsing payload: $e');
      }
    }
    pushNavigatorKey.currentState?.pushNamed('/notifications');
  }

  // ── Show local notification ─────────────────────────────────────────────────

  /// Displays a system notification while the app is in the foreground.
  Future<void> showLocalNotification({
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'patchwork_updates_channel',
      'Patchwork Updates',
      channelDescription: 'Notifications for reactions, updates, and follows',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotif.show(
      DateTime.now().millisecond, // unique id
      title,
      body,
      details,
      payload: data != null ? java_convert.jsonEncode(data) : null,
    );
  }
}

