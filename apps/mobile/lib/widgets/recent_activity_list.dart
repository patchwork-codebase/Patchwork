import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import 'package:timeago/timeago.dart' as timeago;

class RecentActivityList extends StatefulWidget {
  final String userId;
  final String? activeRoomId;
  final String? activeRoomTitle;

  const RecentActivityList({
    super.key,
    required this.userId,
    this.activeRoomId,
    this.activeRoomTitle,
  });

  @override
  State<RecentActivityList> createState() => _RecentActivityListState();
}

class _RecentActivityListState extends State<RecentActivityList> {
  List<Map<String, dynamic>> _recentEvents = [];
  List<Map<String, dynamic>> _roomObservers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchActivity();
  }

  @override
  void didUpdateWidget(covariant RecentActivityList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userId != widget.userId || oldWidget.activeRoomId != widget.activeRoomId) {
      _fetchActivity();
    }
  }

  Future<void> _fetchActivity() async {
    setState(() => _isLoading = true);

    try {
      // 1. Fetch recent reactions to user's rooms
      final reactionsRes = await Supabase.instance.client
          .from('reactions')
          .select('created_at, type, observer_name, rooms!inner(builder_id)')
          .eq('rooms.builder_id', widget.userId)
          .order('created_at', ascending: false)
          .limit(5);

      // 2. Fetch recent room observers to user's rooms
      final observersRes = await Supabase.instance.client
          .from('room_observers')
          .select('joined_at, users!inner(name), rooms!inner(title, builder_id)')
          .eq('rooms.builder_id', widget.userId)
          .order('joined_at', ascending: false)
          .limit(5);

      // 3. Fetch current room's specific observers
      if (widget.activeRoomId != null) {
        final activeRoomObserversRes = await Supabase.instance.client
            .from('room_observers')
            .select('joined_at, users!inner(name)')
            .eq('room_id', widget.activeRoomId!)
            .order('joined_at', ascending: false)
            .limit(10);
        
        if (mounted) {
          setState(() {
            _roomObservers = List<Map<String, dynamic>>.from(activeRoomObserversRes);
          });
        }
      }

      // Merge and sort
      List<Map<String, dynamic>> merged = [];
      
      for (var r in reactionsRes) {
        merged.add({
          'name': r['observer_name'] ?? 'Someone',
          'text': r['type'] == 'like' ? 'reacted "Like" to your update' : 'replied to your update',
          'time': DateTime.parse(r['created_at']),
          'color': context.themeColors.primary500,
        });
      }

      for (var o in observersRes) {
        final userName = o['users'] != null && (o['users'] as Map).containsKey('name') 
          ? (o['users'] as Map)['name'] 
          : 'Someone';
        final roomTitle = o['rooms'] != null && (o['rooms'] as Map).containsKey('title') 
          ? (o['rooms'] as Map)['title'] 
          : 'your room';
        
        merged.add({
          'name': userName,
          'text': 'started following your "$roomTitle" room',
          'time': DateTime.parse(o['joined_at']),
          'color': Colors.teal,
        });
      }

      merged.sort((a, b) => (b['time'] as DateTime).compareTo(a['time'] as DateTime));
      
      if (mounted) {
        setState(() {
          _recentEvents = merged.take(5).toList();
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Recent Activity Card
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
              Text('RECENT ACTIVITY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary, letterSpacing: 1.5)),
              const SizedBox(height: 16),
              if (_recentEvents.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Column(
                      children: [
                        Icon(LucideIcons.sparkles, color: context.themeColors.textTertiary),
                        const SizedBox(height: 8),
                        Text('All quiet for now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: context.themeColors.textSecondary)),
                        const SizedBox(height: 4),
                        Text('Activity from observers will stream in here.', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary)),
                      ],
                    ),
                  ),
                )
              else
                ..._recentEvents.asMap().entries.map((entry) {
                  final index = entry.key;
                  final event = entry.value;
                  final isLast = index == _recentEvents.length - 1;
                  
                  return IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Column(
                          children: [
                            Container(
                              margin: const EdgeInsets.only(top: 6),
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: event['color'] as Color,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(color: (event['color'] as Color).withOpacity(0.4), blurRadius: 6),
                                ],
                              ),
                            ),
                            if (!isLast)
                              Expanded(
                                child: Container(
                                  width: 2,
                                  margin: const EdgeInsets.only(top: 4, bottom: 4),
                                  color: Colors.white.withOpacity(0.1),
                                ),
                              )
                            else
                              const SizedBox(height: 16),
                          ],
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                RichText(
                                  text: TextSpan(
                                    style: TextStyle(fontSize: 12, color: context.themeColors.textSecondary, height: 1.4),
                                    children: [
                                      TextSpan(text: event['name'], style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                                      TextSpan(text: ' ${event['text']}'),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(timeago.format(event['time'] as DateTime), style: TextStyle(fontSize: 10, color: context.themeColors.textTertiary, fontFamily: 'monospace')),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Observers Card
        if (widget.activeRoomTitle != null)
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
                Text('OBSERVERS ON ${(widget.activeRoomTitle!).toUpperCase()}', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary, letterSpacing: 1.5)),
                const SizedBox(height: 16),
                if (_roomObservers.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Column(
                        children: [
                          Icon(LucideIcons.users, color: context.themeColors.textTertiary),
                          const SizedBox(height: 8),
                          Text('No Observers Yet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: context.themeColors.textSecondary)),
                          const SizedBox(height: 4),
                          Text('When observers follow this room, they appear here.', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary)),
                        ],
                      ),
                    ),
                  )
                else
                  ..._roomObservers.map((obs) {
                    final userName = obs['users'] != null && (obs['users'] as Map).containsKey('name') 
                      ? (obs['users'] as Map)['name'] 
                      : 'Observer';
                    final initial = userName.toString().substring(0, 1).toUpperCase();
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: context.themeColors.primary500.withOpacity(0.1),
                              shape: BoxShape.circle,
                              border: Border.all(color: context.themeColors.primary500.withOpacity(0.2)),
                            ),
                            child: Center(
                              child: Text(initial, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: context.themeColors.primary400)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(userName, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: context.themeColors.textPrimary)),
                          ),
                          Text('Active', style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary)),
                        ],
                      ),
                    );
                  }).toList(),
              ],
            ),
          ),
      ],
    );
  }
}
