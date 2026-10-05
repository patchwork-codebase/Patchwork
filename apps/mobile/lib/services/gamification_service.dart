import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/gamification_modals.dart';

class GamificationService {
  static final GamificationService _instance = GamificationService._internal();
  factory GamificationService() => _instance;
  GamificationService._internal();

  RealtimeChannel? _badgeChannel;
  bool _isListening = false;

  /// Starts listening to real-time inserts on the user_badges table for the current user.
  void startListening(BuildContext context) {
    if (_isListening) return;

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    _isListening = true;

    _badgeChannel = Supabase.instance.client.channel('public:user_badges')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'user_badges',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: userId,
        ),
        callback: (payload) async {
          final badgeId = payload.newRecord['badge_id'];
          if (badgeId != null) {
            // Fetch the full badge details to show in the modal
            final badgeRes = await Supabase.instance.client
                .from('badges')
                .select('*')
                .eq('id', badgeId)
                .maybeSingle();

            if (badgeRes != null) {
              // Ensure we don't show the modal if the widget tree is no longer active
              if (context.mounted) {
                GamificationModals.showAchievementUnlockedModal(context, badgeRes);
              }
            }
          }
        },
      )
      .subscribe();
  }

  /// Stops listening to the real-time channel.
  void stopListening() {
    if (_badgeChannel != null) {
      Supabase.instance.client.removeChannel(_badgeChannel!);
      _badgeChannel = null;
      _isListening = false;
    }
  }

  /// Checks if the user is close to their next milestone and shows a reminder if so.
  /// Uses SharedPreferences to ensure we only remind them once a week.
  Future<void> checkKeepBuildingReminder(BuildContext context, String userId) async {
    final prefs = await SharedPreferences.getInstance();
    final lastReminder = prefs.getInt('last_gamification_reminder') ?? 0;
    final now = DateTime.now().millisecondsSinceEpoch;
    
    // Only show once every 7 days (7 * 24 * 60 * 60 * 1000 = 604800000 ms)
    if (now - lastReminder < 604800000) {
      return; 
    }

    try {
      // Fetch user reputation
      final profileRes = await Supabase.instance.client
          .from('users')
          .select('reputation')
          .eq('id', userId)
          .maybeSingle();
      
      final currentReputation = (profileRes?['reputation'] as int?) ?? 0;

      // Fetch level badges
      final badgesRes = await Supabase.instance.client
          .from('badges')
          .select('*')
          .eq('badge_type', 'level')
          .order('points_required', ascending: true);

      // Find next level
      Map<String, dynamic>? nextLevel;
      for (var b in badgesRes) {
        final points = b['points_required'] as int;
        if (points > currentReputation) {
          nextLevel = b;
          break;
        }
      }

      if (nextLevel != null && context.mounted) {
        final pointsRequired = nextLevel['points_required'] as int;
        final progress = currentReputation / pointsRequired;

        // If they are more than 80% of the way there, trigger the reminder!
        if (progress >= 0.8) {
          GamificationModals.showKeepBuildingReminder(context, nextLevel, currentReputation);
          
          // Save the timestamp so we don't spam them
          await prefs.setInt('last_gamification_reminder', now);
        }
      }
    } catch (e) {
      // Silently fail if something goes wrong, it's just a gamification popup
      debugPrint('Error checking gamification reminder: $e');
    }
  }
}
