import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../screens/achievements_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class GamificationModals {
  static void showAchievementUnlockedModal(BuildContext context, Map<String, dynamic> badgeData) {
    final title = badgeData['title'] ?? 'Achievement Unlocked!';
    final description = badgeData['description'] ?? 'You earned a new badge.';
    final points = badgeData['points_required'] ?? 0;

    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(20),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [context.themeColors.surface, const Color(0xFF1A1A1A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: context.themeColors.primary500.withOpacity(0.3), width: 2),
              boxShadow: [
                BoxShadow(color: context.themeColors.primary500.withOpacity(0.2), blurRadius: 40, spreadRadius: 10),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Confetti/Stars visual
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.sparkles, color: Colors.amber, size: 20),
                    const SizedBox(width: 8),
                    Text('NEW ACHIEVEMENT', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.amber, fontSize: 10, letterSpacing: 2.0)),
                    const SizedBox(width: 8),
                    Icon(LucideIcons.sparkles, color: Colors.amber, size: 20),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Badge Icon
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.purpleAccent.shade100, context.themeColors.primary500],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(color: context.themeColors.primary500.withOpacity(0.5), blurRadius: 20, spreadRadius: 2),
                    ],
                  ),
                  child: const Center(
                    child: Icon(LucideIcons.award, size: 40, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 24),
                
                Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary), textAlign: TextAlign.center),
                const SizedBox(height: 8),
                Text(description, style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary), textAlign: TextAlign.center),
                
                const SizedBox(height: 32),
                
                // Buttons
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      final userId = Supabase.instance.client.auth.currentUser?.id;
                      if (userId != null) {
                        Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => AchievementsScreen(userId: userId),
                        ));
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: context.themeColors.primary500,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: const Text('View in Gallery', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Continue Building', style: TextStyle(color: context.themeColors.textSecondary, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      }
    );
  }

  static void showKeepBuildingReminder(BuildContext context, Map<String, dynamic> nextLevel, int currentReputation) {
    showDialog(
      context: context,
      builder: (context) {
        final pointsRequired = nextLevel['points_required'] as int;
        final xpNeeded = pointsRequired - currentReputation;
        
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(20),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 40, spreadRadius: 10),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(LucideIcons.rocket, size: 34, color: context.themeColors.primary500),
                ),
                const SizedBox(height: 24),
                
                Text('Almost There!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary)),
                const SizedBox(height: 8),
                Text(
                  'You only need $xpNeeded more XP to unlock the ${nextLevel['title']} certificate.', 
                  style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 24),
                
                // Progress
                Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('$currentReputation XP', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.primary400, fontSize: 10)),
                        Text('$pointsRequired XP', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textTertiary, fontSize: 10)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 12,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: (currentReputation / pointsRequired).clamp(0.0, 1.0),
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(colors: [context.themeColors.primary400, context.themeColors.primary600]),
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(color: context.themeColors.primary500.withOpacity(0.5), blurRadius: 8),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      // Let them continue what they were doing
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.1),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: const Text('Post an Update (+10 XP)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Close', style: TextStyle(color: context.themeColors.textSecondary, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      }
    );
  }
}
