import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class CacheService {
  static final CacheService _instance = CacheService._internal();
  factory CacheService() => _instance;
  CacheService._internal();

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Generic method to save JSON data
  Future<void> saveJson(String key, dynamic data) async {
    if (_prefs == null) await init();
    try {
      final jsonString = jsonEncode(data);
      await _prefs!.setString(key, jsonString);
    } catch (e) {
      print('Error saving cache for $key: $e');
    }
  }

  // Generic method to read JSON data
  Future<dynamic> getJson(String key) async {
    if (_prefs == null) await init();
    try {
      final jsonString = _prefs!.getString(key);
      if (jsonString != null) {
        return jsonDecode(jsonString);
      }
    } catch (e) {
      print('Error reading cache for $key: $e');
    }
    return null;
  }

  // Specific Cache Keys
  static const String keyFeedUpdates = 'cache_feed_updates';
  static const String keyUserNotifications = 'cache_user_notifications';
  static const String keyChatInbox = 'cache_chat_inbox';
  static const String keyRooms = 'cache_rooms';
  static const String keyDiscoveryTrending = 'cache_discovery_trending';
  static const String keyDiscoveryBuilders = 'cache_discovery_builders';
}
