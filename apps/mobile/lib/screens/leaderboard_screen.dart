import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../widgets/aura_avatar.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _topUsers = [];

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    try {
      final response = await Supabase.instance.client
          .from('users')
          .select('''
            id,
            name,
            username,
            avatar,
            reputation,
            user_badges(
              id,
              issued_at,
              badges(
                id,
                title,
                icon_name,
                color_theme,
                badge_type
              )
            )
          ''')
          .order('reputation', ascending: false)
          .limit(50);

      final users = List<Map<String, dynamic>>.from(response);

      for (var user in users) {
        final allBadges = List<Map<String, dynamic>>.from(user['user_badges'] ?? []);
        user['level_badges'] = allBadges.where((ub) {
          final b = ub['badges'];
          return b != null && b['badge_type'] == 'level';
        }).toList();
      }

      if (mounted) {
        setState(() {
          _topUsers = users;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching leaderboard: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Top Builders', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: context.themeColors.background,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _topUsers.isEmpty
              ? const Center(child: Text('No ranking data available.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _topUsers.length,
                  itemBuilder: (context, index) {
                    final user = _topUsers[index];
                    final rank = index + 1;
                    return _buildLeaderboardTile(user, rank);
                  },
                ),
    );
  }

  Widget _buildLeaderboardTile(Map<String, dynamic> user, int rank) {
    Color rankColor;
    if (rank == 1) {
      rankColor = Colors.amber;
    } else if (rank == 2) {
      rankColor = Colors.grey.shade300;
    } else if (rank == 3) {
      rankColor = Colors.brown.shade400;
    } else {
      rankColor = context.themeColors.textSecondary;
    }

    final String name = user['name'] ?? 'Unknown Builder';
    final String username = user['username'] ?? '';
    final String avatarUrl = user['avatar'] ?? '';
    final int reputation = user['reputation'] ?? 0;
    
    final levelBadges = user['level_badges'] as List;
    String? topLevelIcon;
    Color topLevelColor = Colors.grey;

    if (levelBadges.isNotEmpty) {
      levelBadges.sort((a, b) {
        final aDate = DateTime.tryParse(a['issued_at'] ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
        final bDate = DateTime.tryParse(b['issued_at'] ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
        return bDate.compareTo(aDate);
      });
      final latest = levelBadges.first['badges'];
      topLevelIcon = latest['icon_name'];
      
      final colorStr = latest['color_theme']?.toString().toLowerCase();
      if (colorStr == 'amber' || colorStr == 'yellow') topLevelColor = Colors.amber;
      else if (colorStr == 'blue') topLevelColor = Colors.blue;
      else if (colorStr == 'purple') topLevelColor = Colors.purple;
      else if (colorStr == 'green') topLevelColor = Colors.green;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: rank <= 3 ? Border.all(color: rankColor.withOpacity(0.5), width: 1.5) : null,
        boxShadow: rank <= 3
            ? [BoxShadow(color: rankColor.withOpacity(0.1), blurRadius: 10, spreadRadius: 1)]
            : null,
      ),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              '#$rank',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: rank <= 3 ? 18 : 14,
                color: rankColor,
              ),
            ),
          ),
          const SizedBox(width: 8),
          AuraAvatar(
            avatarUrl: avatarUrl.isNotEmpty ? avatarUrl : null,
            initials: name.isNotEmpty ? name[0].toUpperCase() : 'B',
            size: 44,
            role: 'builder',
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: context.themeColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (topLevelIcon != null) ...[
                      const SizedBox(width: 4),
                      Icon(LucideIcons.award, size: 14, color: topLevelColor),
                    ]
                  ],
                ),
                if (username.isNotEmpty)
                  Text(
                    '@$username',
                    style: TextStyle(fontSize: 12, color: context.themeColors.textTertiary),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.zap, size: 12, color: context.themeColors.primary500),
                const SizedBox(width: 4),
                Text(
                  '$reputation XP',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: context.themeColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
