import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'package:supabase_flutter/supabase_flutter.dart';

class StatsStrip extends StatefulWidget {
  const StatsStrip({super.key});

  @override
  State<StatsStrip> createState() => _StatsStripState();
}

class _StatsStripState extends State<StatsStrip> {
  int _activeRooms = 0;
  int _totalReactions = 0;
  int _observers = 0;
  int _buildLogs = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final roomsRes = await Supabase.instance.client.from('rooms').select('id').eq('builder_id', userId);
      final updatesRes = await Supabase.instance.client.from('updates').select('id').eq('author_id', userId);
      
      final observersRes = await Supabase.instance.client
          .from('room_observers')
          .select('id, rooms!inner(builder_id)')
          .eq('rooms.builder_id', userId);

      final reactionsRes = await Supabase.instance.client
          .from('reactions')
          .select('id, rooms!inner(builder_id)')
          .eq('rooms.builder_id', userId);
      
      if (mounted) {
        setState(() {
          _activeRooms = roomsRes.length;
          _buildLogs = updatesRes.length;
          _totalReactions = reactionsRes.length;
          _observers = observersRes.length;
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
      return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
    }

    final stats = [
      {
        'label': 'active rooms',
        'value': '$_activeRooms',
        'delta': '0 new this week',
        'deltaColor': Colors.teal.shade400,
        'deltaBg': Colors.teal.shade500.withOpacity(0.1),
        'deltaBorder': Colors.teal.shade500.withOpacity(0.2),
        'icon': LucideIcons.activity,
        'iconColor': Colors.teal.shade400,
        'iconBg': Colors.teal.shade500.withOpacity(0.1),
      },
      {
        'label': 'total reactions',
        'value': '$_totalReactions',
        'delta': '0 new today',
        'deltaColor': Colors.amber.shade400,
        'deltaBg': Colors.amber.shade500.withOpacity(0.1),
        'deltaBorder': Colors.amber.shade500.withOpacity(0.2),
        'icon': LucideIcons.messageSquare,
        'iconColor': Colors.amber.shade400,
        'iconBg': Colors.amber.shade500.withOpacity(0.1),
      },
      {
        'label': 'observers',
        'value': '$_observers',
        'delta': '0 new',
        'deltaColor': Colors.blue.shade400,
        'deltaBg': Colors.blue.shade500.withOpacity(0.1),
        'deltaBorder': Colors.blue.shade500.withOpacity(0.2),
        'icon': LucideIcons.users,
        'iconColor': Colors.blue.shade400,
        'iconBg': Colors.blue.shade500.withOpacity(0.1),
      },
      {
        'label': 'build logs',
        'value': '$_buildLogs',
        'delta': '0 completed',
        'deltaColor': Colors.purple.shade400,
        'deltaBg': Colors.purple.shade500.withOpacity(0.1),
        'deltaBorder': Colors.purple.shade500.withOpacity(0.2),
        'icon': LucideIcons.fileText,
        'iconColor': Colors.purple.shade400,
        'iconBg': Colors.purple.shade500.withOpacity(0.1),
      },
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: stats.asMap().entries.map<Widget>((entry) {
          final i = entry.key;
          final s = entry.value;
          
          Widget card = Container(
            constraints: const BoxConstraints(minWidth: 150),
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02), // Glassmorphism
              border: Border.all(color: Colors.white.withOpacity(0.05)),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      (s['label'] as String).toUpperCase(),
                      style: TextStyle(
                        fontSize: 9,
                        color: context.themeColors.textSecondary,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: s['iconBg'] as Color,
                        shape: BoxShape.circle,
                        border: Border.all(color: s['deltaBorder'] as Color),
                        boxShadow: [
                          BoxShadow(
                            color: (s['iconColor'] as Color).withOpacity(0.3),
                            blurRadius: 12,
                            spreadRadius: -2,
                          )
                        ],
                      ),
                      child: Icon(
                        s['icon'] as IconData,
                        size: 12,
                        color: s['iconColor'] as Color,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  s['value'] as String,
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(height: 1),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: s['deltaBg'] as Color,
                    border: Border.all(color: s['deltaBorder'] as Color),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    (s['delta'] as String).toUpperCase(),
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: s['deltaColor'] as Color,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: (50 * i).ms).slideY(begin: 0.05, end: 0, duration: 300.ms, curve: Curves.easeOut);

          return IntrinsicWidth(
            child: card,
          );
        }).toList(),
      ),
    );
  }
}
