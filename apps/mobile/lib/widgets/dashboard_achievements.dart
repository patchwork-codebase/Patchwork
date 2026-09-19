import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';

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
          .select('id')
          .eq('user_id', widget.userId);

      if (mounted) {
        setState(() {
          _currentReputation = (profileRes?['reputation'] as int?) ?? 0;
          _levelBadges = List<Map<String, dynamic>>.from(badgesRes);
          _awardsCount = (userBadgesRes as List).length;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(child: Padding(
        padding: EdgeInsets.all(24.0),
        child: CircularProgressIndicator(color: context.themeColors.primary500),
      ));
    }

    // Determine next milestones
    List<Map<String, dynamic>> nextLevels = _levelBadges.where((b) => (b['points_required'] as int) > _currentReputation).take(2).toList();
    if (nextLevels.isEmpty && _levelBadges.isNotEmpty) {
      nextLevels = _levelBadges.length >= 2 ? _levelBadges.sublist(_levelBadges.length - 2) : _levelBadges;
    } else if (nextLevels.length == 1 && _levelBadges.length >= 2) {
      final idx = _levelBadges.indexWhere((b) => b['id'] == nextLevels[0]['id']);
      if (idx > 0) {
        nextLevels = [_levelBadges[idx - 1], nextLevels[0]];
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.02),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('ACHIEVEMENTS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary, letterSpacing: 1.5)),
                  Row(
                    children: const [
                      Text('View all', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.teal)),
                      SizedBox(width: 4),
                      Icon(LucideIcons.arrowRight, size: 14, color: Colors.teal),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text('MILESTONES IN PROGRESS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary, letterSpacing: 1.0)),
              const SizedBox(height: 12),
              
              if (nextLevels.isEmpty)
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text('You have completed all current milestones!', style: TextStyle(fontStyle: FontStyle.italic, color: context.themeColors.textTertiary, fontSize: 13)),
                )
              else
                ...nextLevels.map((lvl) {
                  final pointsRequired = lvl['points_required'] as int;
                  final isCompleted = _currentReputation >= pointsRequired;
                  final progress = (_currentReputation / pointsRequired).clamp(0.0, 1.0);
                  
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.01),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.05)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                _buildBadgeIcon(pointsRequired, isCompleted),
                                const SizedBox(width: 12),
                                Text(lvl['title'], style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: context.themeColors.textPrimary)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: context.themeColors.primary500.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: context.themeColors.primary500.withOpacity(0.2)),
                              ),
                              child: RichText(
                                text: TextSpan(
                                  children: [
                                    TextSpan(text: '${_currentReputation.clamp(0, pointsRequired)}', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.primary400, fontSize: 11)),
                                    TextSpan(text: ' / $pointsRequired', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.primary500, fontSize: 11)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Progress bar
                        Container(
                          height: 10,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: progress,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: isCompleted 
                                  ? const LinearGradient(colors: [Colors.teal, Colors.teal])
                                  : LinearGradient(colors: [Colors.pinkAccent, context.themeColors.primary500, Colors.indigo]),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: isCompleted ? null : [
                                  BoxShadow(color: context.themeColors.primary500.withOpacity(0.5), blurRadius: 10, spreadRadius: 0),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
                
              const SizedBox(height: 8),
              
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.themeColors.borderSubtle),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: context.themeColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: context.themeColors.borderSubtle),
                      ),
                      child: Icon(LucideIcons.award, color: _awardsCount > 0 ? Colors.amber : context.themeColors.textTertiary, size: 20),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_awardsCount > 0 ? 'You achieved $_awardsCount awards' : 'No awards yet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: context.themeColors.textPrimary)),
                          const SizedBox(height: 2),
                          Text('Keep building to unlock more', style: TextStyle(fontSize: 12, color: context.themeColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBadgeIcon(int points, bool completed) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: completed ? [Colors.blue.shade200, Colors.blue.shade700] : [Colors.blue.shade900.withOpacity(0.5), Colors.blue.shade900.withOpacity(0.2)],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: completed ? Colors.blue.shade300 : Colors.blue.shade900, width: 2),
      ),
      child: Center(
        child: Text(
          '$points',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 12,
            color: completed ? Colors.white : Colors.white54,
          ),
        ),
      ),
    );
  }
}
