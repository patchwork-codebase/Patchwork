import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;

  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  NotificationService._internal();

  Future<void> init() async {
    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/launcher_icon');
    
    // Darwin is the platform for iOS and macOS
    const DarwinInitializationSettings initializationSettingsDarwin = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsDarwin,
    );

    await _flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse notificationResponse) {
        // Handle notification tapped logic here if needed
      },
    );

    // Initialize Firebase
    try {
      await Firebase.initializeApp();
      
      // Do not await permission request to prevent blocking app startup on a blank screen
      _setupMessaging();
    } catch (e) {
      // Firebase not configured for this platform or missing google-services.json
      print('Firebase initialization failed: $e');
    }
  }

  Future<void> _setupMessaging() async {
    try {
      FirebaseMessaging messaging = FirebaseMessaging.instance;
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        // Get token and sync to Supabase
        String? token = await messaging.getToken();
        if (token != null) {
          _syncTokenToSupabase(token);
        }

        // Listen for token refresh
        messaging.onTokenRefresh.listen(_syncTokenToSupabase);

        // Listen for foreground messages
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          if (message.notification != null) {
            showNotification(
              title: message.notification!.title ?? 'New Notification',
              body: message.notification!.body ?? '',
            );
          }
        });
      }
    } catch (e) {
      // Firebase not configured for this platform or missing google-services.json
      print('Firebase initialization failed: $e');
    }
  }

  Future<void> _syncTokenToSupabase(String token) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user != null) {
      try {
        await Supabase.instance.client.from('users').update({
          'fcm_token': token,
        }).eq('id', user.id);
      } catch (e) {
        print('Failed to sync FCM token: $e');
      }
    }
  }

  Future<void> showNotification({required String title, required String body}) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'patchwork_updates_channel', // id
      'Patchwork Updates', // title
      channelDescription: 'Notifications for new updates',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
    );

    const DarwinNotificationDetails darwinPlatformChannelSpecifics = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: darwinPlatformChannelSpecifics,
    );

    await _flutterLocalNotificationsPlugin.show(
      DateTime.now().millisecond, // unique id
      title,
      body,
      platformChannelSpecifics,
    );
  }
}
