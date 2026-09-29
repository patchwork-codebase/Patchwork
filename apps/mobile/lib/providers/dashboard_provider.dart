import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'auth_provider.dart';

// Provider for user's rooms
final myRoomsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final user = ref.watch(authUserProvider).value;
  if (user == null) return [];

  final response = await Supabase.instance.client
      .from('rooms')
      .select('id, title, tags, update_count, created_at')
      .eq('builder_id', user.id)
      .order('created_at', ascending: false);
      
  return List<Map<String, dynamic>>.from(response);
});

// Provider for Unread Notifications Count
final unreadNotificationsProvider = FutureProvider<int>((ref) async {
  final user = ref.watch(authUserProvider).value;
  if (user == null) return 0;

  final response = await Supabase.instance.client
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('read', false);
      
  return (response as List).length;
});

// Provider for Recent Updates (used for activity calculation)
final recentUpdatesActivityProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final user = ref.watch(authUserProvider).value;
  if (user == null) return [];

  final response = await Supabase.instance.client
      .from('updates')
      .select('created_at')
      .eq('author_id', user.id)
      .gte('created_at', DateTime.now().subtract(const Duration(days: 14)).toIso8601String())
      .order('created_at', ascending: false);
      
  return List<Map<String, dynamic>>.from(response);
});

// Provider for Triage Inbox
final triageUpdatesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final user = ref.watch(authUserProvider).value;
  if (user == null) return [];

  final response = await Supabase.instance.client
      .from('updates')
      .select('*, rooms(title, tags), users(name, avatar, is_verified_expert), original_update:repost_id(*, users(name, avatar, is_verified_expert)), polls(*, poll_options(*))')
      .eq('author_id', user.id)
      .eq('needs_feedback', true)
      .order('created_at', ascending: false)
      .limit(5);
      
  return List<Map<String, dynamic>>.from(response);
});

// StateProvider for the currently active workspace ID in the dashboard
final activeWorkspaceIdProvider = StateProvider<String?>((ref) => null);

// Provider for Workspace Metrics based on the active workspace
final workspaceMetricsProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final workspaceId = ref.watch(activeWorkspaceIdProvider);
  if (workspaceId == null) return null;

  try {
    // 1. Fetch all reactions for the room to count them and find top observers
    final reactionsRes = await Supabase.instance.client
        .from('reactions')
        .select('observer_id, type')
        .eq('room_id', workspaceId);
        
    final reactionsList = List<Map<String, dynamic>>.from(reactionsRes);
    
    // Count total reactions
    final totalReactions = reactionsList.length;
    
    // Count interactions per observer
    final Map<String, int> observerCounts = {};
    for (var r in reactionsList) {
      final obsId = r['observer_id'] as String?;
      if (obsId != null) {
        observerCounts[obsId] = (observerCounts[obsId] ?? 0) + 1;
      }
    }
    
    // Sort and get top 3 observers
    final sortedObservers = observerCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final top3 = sortedObservers.take(3).toList();
    
    // Fetch profiles for top 3 observers
    final List<Map<String, dynamic>> topObservers = [];
    if (top3.isNotEmpty) {
      final userIds = top3.map((e) => e.key).toList();
      final usersRes = await Supabase.instance.client
          .from('users')
          .select('id, name, avatar, is_verified_expert')
          .inFilter('id', userIds);
          
      final usersList = List<Map<String, dynamic>>.from(usersRes);
      for (var entry in top3) {
        final user = usersList.firstWhere((u) => u['id'] == entry.key, orElse: () => <String, dynamic>{});
        if (user.isNotEmpty && user['is_verified_expert'] == true) {
          topObservers.add({
            'name': user['name'],
            'avatar': user['avatar'],
            'interaction_count': entry.value,
          });
        }
      }
    }

    return {
      'reactions_count': totalReactions,
      'top_observers': topObservers,
    };
  } catch (e) {
    print('Failed to load workspace metrics: $e');
    return null;
  }
});
