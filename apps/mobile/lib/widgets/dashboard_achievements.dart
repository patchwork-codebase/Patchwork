import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import '../screens/achievements_screen.dart';
import '../services/gamification_service.dart';

class DashboardAchievements extends StatefulWidget {
  final String userId;
  
  const DashboardAchievements({super.key, required this.userId});

  @override
  State<DashboardAchievements> createState() => _DashboardAchievementsState();
}

class _DashboardAchievementsState extends State<DashboardAchievements> {
  int _currentReputation = 0;
  List<Map<String, dynamic>> _levelBadges = [];
  int _awardsCount = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAchievements();
  }

  Future<void> _fetchAchievements() async {
    try {
      final profileRes = await Supabase.instance.client
          .from('users')
          .select('reputation')
          .eq('id', widget.userId)
          .maybeSingle();

      final badgesRes = await Supabase.instance.client
          .from('badges')
          .select('*')
          .eq('badge_type', 'level')
          .order('points_required', ascending: true);
          
      final userBadgesRes = await Supabase.instance.client
          .from('user_badges')
          .select('id, badges!inner(badge_type)')
          .eq('user_id', widget.userId)
          .neq('badges.badge_type', 'level');

      if (mounted) {
        setState(() {
          _currentReputation = (profileRes?['reputation'] as int?) ?? 0;
          _levelBadges = List<Map<String, dynamic>>.from(badgesRes);
          _awardsCount = (userBadgesRes as List).length;
          _isLoading = false;
        });

        // Check if we should pop up the "Keep Building" reminder (it has a built-in cooldown)
        GamificationService().checkKeepBuildingReminder(context, widget.userId);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: CircularProgressIndicator(color: context.themeColors.primary500),
      ));
    }

    // Determine current level and next level
    Map<String, dynamic>? currentLevel;
    Map<String, dynamic>? nextLevel;
    
    for (var b in _levelBadges) {
      final points = b['points_required'] as int;
      if (_currentReputation >= points) {
        currentLevel = b;
      } else if (nextLevel == null) {
        nextLevel = b;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.02),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('PROOF OF WORK', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
              const SizedBox(height: 16),
              
              // 1. Hero Section: Current Level and Awards
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => AchievementsScreen(userId: widget.userId),
                    ));
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          context.themeColors.primary500.withOpacity(0.15),
                          Colors.purpleAccent.withOpacity(0.15),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: context.themeColors.primary500.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        _buildCurrentLevelBadge(currentLevel),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'CURRENT LEVEL', 
                                    style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: context.themeColors.primary400, letterSpacing: 1.5)
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(LucideIcons.sparkles, size: 10, color: Colors.amber),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                currentLevel?['title'] ?? 'Beginner', 
                                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: context.themeColors.textPrimary)
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(LucideIcons.award, size: 11, color: Colors.amber),
                                  const SizedBox(width: 6),
                                  Text(
                                    _awardsCount > 0 ? '$_awardsCount Verified Awards' : 'No awards yet', 
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary)
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.1),
                          ),
                          child: Icon(LucideIcons.arrowRight, size: 17, color: context.themeColors.textPrimary),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // 2. Next Milestone Section
              if (nextLevel != null) ...[
                Row(
                  children: [
                    Icon(LucideIcons.trendingUp, size: 11, color: context.themeColors.textTertiary),
                    const SizedBox(width: 6),
                    Text('NEXT MILESTONE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary, letterSpacing: 1.0)),
                  ],
                ),
                const SizedBox(height: 12),
                
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      // Takes them to the gallery to see what's needed
                      Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => AchievementsScreen(userId: widget.userId),
                      ));
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(nextLevel['title'], style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: context.themeColors.textPrimary)),
                                        const SizedBox(width: 6),
                                        Icon(LucideIcons.info, size: 11, color: context.themeColors.textTertiary),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      nextLevel['description'] ?? 'Earn more XP to unlock', 
                                      style: TextStyle(fontSize: 10, color: context.themeColors.textSecondary),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              RichText(
                                text: TextSpan(
                                  children: [
                                    TextSpan(text: '$_currentReputation', style: TextStyle(fontWeight: FontWeight.w900, color: context.themeColors.textPrimary, fontSize: 11)),
                                    TextSpan(text: ' / ${nextLevel['points_required']} XP', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textTertiary, fontSize: 10)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Container(
                            height: 8,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: FractionallySizedBox(
                              alignment: Alignment.centerLeft,
                              widthFactor: (_currentReputation / (nextLevel['points_required'] as int)).clamp(0.0, 1.0),
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(colors: [context.themeColors.primary400, context.themeColors.primary600]),
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: [
                                    BoxShadow(color: context.themeColors.primary500.withOpacity(0.5), blurRadius: 8, spreadRadius: 0),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
              
              if (nextLevel == null && currentLevel != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.teal.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.teal.withOpacity(0.3)),
                  ),
                  child: const Center(
                    child: Text(
                      '🎉 You have reached the highest current milestone!',
                      style: TextStyle(color: Colors.tealAccent, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCurrentLevelBadge(Map<String, dynamic>? currentLevel) {
    if (currentLevel == null) {
      return Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: const Center(child: Icon(LucideIcons.award, color: Colors.white54, size: 27)),
      );
    }
    
    final points = currentLevel['points_required'] as int;
    
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [context.themeColors.primary400, context.themeColors.primary600],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.themeColors.primary400, width: 2),
        boxShadow: [
          BoxShadow(color: context.themeColors.primary500.withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -10,
            bottom: -10,
            child: Icon(LucideIcons.sparkles, size: 34, color: Colors.white.withOpacity(0.2)),
          ),
          Center(
            child: Text(
              '$points',
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 15,
                color: Colors.white,
                shadows: [Shadow(color: Colors.black26, offset: Offset(0, 2), blurRadius: 4)],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
