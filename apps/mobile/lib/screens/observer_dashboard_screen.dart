import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';
import '../widgets/observer_progression_panel.dart';
import '../widgets/skeleton_loaders.dart';
import 'explore_screen.dart';
import 'room_detail_screen.dart';

class ObserverDashboardScreen extends StatefulWidget {
  final Map<String, dynamic>? userProfile;
  const ObserverDashboardScreen({super.key, this.userProfile});
  @override
  State<ObserverDashboardScreen> createState() => _ObserverDashboardScreenState();
}

class _ObserverDashboardScreenState extends State<ObserverDashboardScreen> {
  Map<String, dynamic>? _observerStats;
  List<Map<String, dynamic>> _feedUpdates = [];
  bool _isFeedLoading = true;
  String _activeFilter = 'all';
  List<String> _availableTags = ['All'];
  final Map<String, String?> _optimisticReactions = {};
  final Set<String> _followedRoomIds = {};
  Set<String> _observedRoomIds = {};
  List<Map<String, dynamic>> _watchingNow = [];
  bool _isWatchingLoading = true;
  List<Map<String, dynamic>> _suggestedRooms = [];
  
  // Inspiration Vault
  List<Map<String, dynamic>> _bookmarkedUpdates = [];
  bool _isBookmarksLoading = true;

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchStats();
    _fetchFeed();
    _fetchWatchingNow();
    _fetchBookmarks();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchStats() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final reactionsRes = await Supabase.instance.client
          .from('reactions').select('id, type').eq('observer_id', userId);
      final followedRes = await Supabase.instance.client
          .from('room_observers').select('room_id').eq('observer_id', userId);
      final ids = Set<String>.from(followedRes.map((r) => r['room_id']?.toString() ?? ''));
      if (mounted) {
        setState(() {
          _observedRoomIds = ids;
          _observerStats = {
            'totalReactions': reactionsRes.length,
            'sharpInsights': reactionsRes.where((r) => r['type'] == 'sharp').length,
            'roomsFollowed': followedRes.length,
            'shippedProducts': 0,
          };
        });
      }
    } catch (e) {
      if (mounted) setState(() {});
    }
  }

  Future<void> _fetchFeed() async {
    if (mounted) setState(() => _isFeedLoading = true);
    try {
      final response = await Supabase.instance.client
          .from('updates')
          .select('*, rooms(id, title, tags), users(name, avatar, is_verified_expert), reactions(type, text, observer_name)')
          .order('created_at', ascending: false)
          .limit(30);
      if (mounted) {
        setState(() {
          _feedUpdates = List<Map<String, dynamic>>.from(response);
          
          // Extract unique tags from feed
          final Set<String> uniqueTags = {'All'};
          for (var update in _feedUpdates) {
            final tags = update['rooms']?['tags'] as List<dynamic>? ?? [];
            for (var tag in tags) {
              if (tag != null && tag.toString().isNotEmpty) {
                uniqueTags.add(tag.toString().trim());
              }
            }
          }
          _availableTags = uniqueTags.toList();
          
          _isFeedLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isFeedLoading = false);
    }
  }

  Future<void> _fetchWatchingNow() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final res = await Supabase.instance.client
          .from('room_observers')
          .select('room_id, rooms(id, title, tags, update_count)')
          .eq('observer_id', userId)
          .limit(10);
      final rooms = (res as List)
          .map((r) => Map<String, dynamic>.from(r['rooms'] ?? {}))
          .where((r) => r['id'] != null)
          .toList();
      final publicRes = await Supabase.instance.client
          .from('rooms')
          .select('id, title, tags, update_count, observer_count')
          .limit(10);
      final followedIds = Set<String>.from(rooms.map((r) => r['id']?.toString() ?? ''));
      final suggested = (publicRes as List)
          .map((r) => Map<String, dynamic>.from(r))
          .where((r) => !followedIds.contains(r['id']?.toString()))
          .take(3)
          .toList();
      if (mounted) {
        setState(() {
          _watchingNow = rooms;
          _suggestedRooms = suggested;
          _isWatchingLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isWatchingLoading = false);
    }
  }

  Future<void> _fetchBookmarks() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final res = await Supabase.instance.client
          .from('update_bookmarks')
          .select('update_id, updates(*, rooms(id, title, tags), users(name, avatar, is_verified_expert))')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(10);
      if (mounted) {
        setState(() {
          _bookmarkedUpdates = List<Map<String, dynamic>>.from(res.map((b) => b['updates']));
          _isBookmarksLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isBookmarksLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredFeed {
    if (_activeFilter == 'all') return _feedUpdates;
    return _feedUpdates.where((u) {
      final tags = u['rooms']?['tags'] as List? ?? [];
      return tags.any((t) => t.toString().toLowerCase() == _activeFilter.toLowerCase());
    }).toList();
  }

  Map<String, dynamic> _classifyUpdate(String content) {
    final txt = content.toLowerCase();
    if (txt.contains('shipped') || txt.contains('launched') || txt.contains('live')) return {'tag': 'Shipped', 'color': 'green'};
    if (txt.contains('scrapped') || txt.contains('deleted') || txt.contains('cut')) return {'tag': 'Scrapped', 'color': 'red'};
    if (txt.contains('?') || txt.contains('question') || txt.contains('issue')) return {'tag': 'Open question', 'color': 'amber'};
    return {'tag': 'Decision', 'color': 'primary'};
  }

  Future<void> _toggleReaction(String updateId, String roomId, String type, List reactions, String? insightText) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    final existing = reactions.firstWhere((r) => r['type'] == type && r['observer_id'] == userId, orElse: () => null);
    final key = '$updateId-$type';
    HapticFeedback.mediumImpact();
    setState(() { _optimisticReactions[key] = existing != null ? null : type; });
    try {
      if (existing != null) {
        await Supabase.instance.client.from('reactions').delete().eq('id', existing['id']);
      } else {
        final others = reactions.where((r) => r['observer_id'] == userId && r['type'] != type).toList();
        for (final o in others) await Supabase.instance.client.from('reactions').delete().eq('id', o['id']);
        await Supabase.instance.client.from('reactions').insert({
          'room_id': roomId, 'update_id': updateId, 'observer_id': userId,
          'observer_name': widget.userProfile?['name'] ?? 'Observer',
          'type': type, 'text': insightText ?? type, 'created_at': DateTime.now().toIso8601String(),
        });
      }
      await _fetchFeed();
    } catch (e) {
      if (mounted) {
        setState(() { _optimisticReactions[key] = existing != null ? type : null; });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  void _showInsightModal(String updateId, String roomId, String type, List reactions) {
    final TextEditingController textController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: context.themeColors.background,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border(top: BorderSide(color: context.themeColors.borderSubtle)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Add an insight (optional)", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
              const SizedBox(height: 8),
              Text("Why did you choose this reaction?", style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary)),
              const SizedBox(height: 16),
              TextField(
                controller: textController,
                style: TextStyle(color: context.themeColors.textPrimary),
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: "What's missing? Or what stood out?",
                  hintStyle: TextStyle(color: context.themeColors.textTertiary),
                  filled: true,
                  fillColor: context.themeColors.surfaceHighlight,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    final text = textController.text.trim();
                    _toggleReaction(updateId, roomId, type, reactions, text.isNotEmpty ? text : null);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.themeColors.primary500,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text("Submit Reaction", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _followRoom(String roomId) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    HapticFeedback.lightImpact();
    setState(() => _followedRoomIds.add(roomId));
    try {
      await Supabase.instance.client.from('room_observers').upsert({'room_id': roomId, 'observer_id': userId});
      _fetchWatchingNow(); _fetchStats();
    } catch (e) { setState(() => _followedRoomIds.remove(roomId)); }
  }

  Future<void> _unfollowRoom(String roomId) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    HapticFeedback.lightImpact();
    setState(() { _followedRoomIds.remove(roomId); _observedRoomIds.remove(roomId); });
    try {
      await Supabase.instance.client.from('room_observers').delete().eq('room_id', roomId).eq('observer_id', userId);
      _fetchWatchingNow(); _fetchStats();
    } catch (e) { setState(() => _observedRoomIds.add(roomId)); }
  }

  Widget _buildStatCard({required String label, required String value, required IconData icon, required Color color, required Color bgColor, required String delta}) {
    return Container(
      width: 140, margin: const EdgeInsets.only(right: 12), padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: context.themeColors.borderSubtle)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: color, size: 16)),
        const Spacer(),
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color, height: 1.0)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary)),
        const SizedBox(height: 4),
        Text(delta, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
      ]),
    );
  }

  Widget _buildFilterChip(String label) {
    final isActive = _activeFilter == label.toLowerCase();
    return GestureDetector(
      onTap: () => setState(() => _activeFilter = label.toLowerCase()),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? context.themeColors.primary500 : context.themeColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isActive ? context.themeColors.primary500 : context.themeColors.borderSubtle),
          boxShadow: isActive ? [BoxShadow(color: context.themeColors.primary500.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 2))] : null,
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isActive ? Colors.white : context.themeColors.textSecondary)),
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Row(children: [
        Text(label.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: context.themeColors.textTertiary)),
        const SizedBox(width: 12),
        Expanded(child: Divider(color: context.themeColors.borderSubtle, height: 1)),
      ]),
    );
  }

  Widget _buildFeedCard(Map<String, dynamic> update) {
    final updateId = update['id']?.toString() ?? '';
    final roomId = update['room_id']?.toString() ?? '';
    final content = update['content'] ?? '';
    final rooms = update['rooms'] as Map<String, dynamic>?;
    final users = update['users'] as Map<String, dynamic>?;
    final authorName = users?['name'] ?? update['author_name'] ?? 'Builder';
    final authorAvatar = users?['avatar']?.toString() ?? '';
    final roomTitle = rooms?['title'] ?? 'Build Room';
    final createdAt = update['created_at'] != null ? DateTime.tryParse(update['created_at'].toString()) : null;
    final classify = _classifyUpdate(content.toString());
    final tag = classify['tag'] as String;
    final tagColorKey = classify['color'] as String;
    Color tagColor; Color tagBg;
    switch (tagColorKey) {
      case 'green': tagColor = Colors.green.shade600; tagBg = Colors.green.withOpacity(0.1); break;
      case 'red': tagColor = Colors.red.shade400; tagBg = Colors.red.withOpacity(0.1); break;
      case 'amber': tagColor = Colors.amber.shade600; tagBg = Colors.amber.withOpacity(0.1); break;
      default: tagColor = context.themeColors.primary500; tagBg = context.themeColors.primary500.withOpacity(0.1);
    }
    String avatarUrl = authorAvatar;
    if (avatarUrl.isEmpty || !avatarUrl.startsWith('http')) {
      final seed = users?['id']?.toString() ?? authorName;
      avatarUrl = 'https://api.dicebear.com/9.x/micah/png?seed=${Uri.encodeComponent(seed)}&backgroundColor=transparent';
    }
    final isFollowing = _observedRoomIds.contains(roomId) || _followedRoomIds.contains(roomId);
    final reactionDefs = [
      {'type': 'sharp', 'label': '\u2726 Sharp'},
      {'type': 'pushback', 'label': '\u21a9 Push back'},
      {'type': 'tellmemore', 'label': '? Tell me more'},
    ];
    final reactionColors = {'sharp': context.themeColors.primary500, 'pushback': const Color(0xFFFF4D6D), 'tellmemore': Colors.blue.shade400};

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.themeColors.surface, borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.themeColors.borderSubtle),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), color: context.themeColors.surfaceHighlight, border: Border.all(color: context.themeColors.borderSubtle)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(imageUrl: avatarUrl, fit: BoxFit.cover,
                placeholder: (c, u) => Container(color: context.themeColors.surfaceHighlight),
                errorWidget: (c, e, s) => Center(child: Text(authorName.isNotEmpty ? authorName[0].toUpperCase() : '?', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary))),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(authorName, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.themeColors.textPrimary)),
            Text('in $roomTitle', style: TextStyle(fontSize: 12, color: context.themeColors.textSecondary)),
            if (createdAt != null) Text(timeago.format(createdAt), style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: context.themeColors.textTertiary)),
          ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: tagBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: tagColor.withOpacity(0.3))),
              child: Text(tag, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: tagColor)),
            ),
          ]),
          
          if (update['needs_feedback'] == true) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.withOpacity(0.4)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.lightbulb, size: 14, color: Colors.amber),
                  const SizedBox(width: 6),
                  const Text("Builder requested feedback", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber)),
                ],
              ),
            ),
          ],
          
          const SizedBox(height: 12),
        Text(content.toString(), style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary, height: 1.5), maxLines: 4, overflow: TextOverflow.ellipsis),
        
        if (update['reactions'] != null) ...[
          Builder(
            builder: (context) {
              final insights = (update['reactions'] as List).where((r) => r['text'] != r['type']).toList();
              if (insights.isEmpty) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: insights.map((insight) {
                    final isSharp = insight['type'] == 'sharp';
                    final color = isSharp ? context.themeColors.primary500 : const Color(0xFFFF4D6D);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: color.withOpacity(0.2)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(isSharp ? LucideIcons.sparkles : LucideIcons.messageSquare, size: 16, color: color),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${insight['observer_name']} said:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
                                const SizedBox(height: 2),
                                Text(insight['text'], style: TextStyle(fontSize: 13, color: context.themeColors.textPrimary)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              );
            }
          ),
        ],

        const SizedBox(height: 12),
        Divider(color: context.themeColors.borderSubtle, height: 1),
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 8, children: [
          ...reactionDefs.map((rxn) {
            final key = '$updateId-${rxn['type']}';
            final isActive = _optimisticReactions.containsKey(key) ? _optimisticReactions[key] == rxn['type'] : false;
            final activeColor = reactionColors[rxn['type']] ?? context.themeColors.primary500;
            return GestureDetector(
              onTap: () {
                if (isActive) {
                  _toggleReaction(updateId, roomId, rxn['type']!, [], null);
                } else {
                  _showInsightModal(updateId, roomId, rxn['type']!, []);
                }
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isActive ? activeColor.withOpacity(0.1) : context.themeColors.surfaceHighlight,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isActive ? activeColor.withOpacity(0.3) : context.themeColors.borderSubtle),
                ),
                child: Text(rxn['label']!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isActive ? activeColor : context.themeColors.textSecondary)),
              ),
            );
          }),
          GestureDetector(
            onTap: () => isFollowing ? _unfollowRoom(roomId) : _followRoom(roomId),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isFollowing ? Colors.green.withOpacity(0.1) : context.themeColors.surfaceHighlight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isFollowing ? Colors.green.withOpacity(0.3) : context.themeColors.borderSubtle),
              ),
              child: Text(isFollowing ? '\u2713 Following' : '+ Follow', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isFollowing ? Colors.green.shade600 : context.themeColors.textSecondary)),
            ),
          ),
          GestureDetector(
            onTap: () { if (rooms?['id'] != null) Navigator.push(context, MaterialPageRoute(builder: (_) => RoomDetailScreen(roomId: rooms!['id'].toString(), title: rooms['title']?.toString() ?? 'Room'))); },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: context.themeColors.primary500.withOpacity(0.05), borderRadius: BorderRadius.circular(20), border: Border.all(color: context.themeColors.primary500.withOpacity(0.2))),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text('View room', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.primary500)),
                const SizedBox(width: 4),
                Icon(LucideIcons.arrowUpRight, size: 12, color: context.themeColors.primary500),
              ]),
            ),
          ),
        ]),
      ]),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildInspirationVault() {
    if (_isBookmarksLoading) return const SizedBox();
    if (_bookmarkedUpdates.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
          child: Row(
            children: [
              Icon(LucideIcons.bookmark, color: context.themeColors.primary500, size: 20),
              const SizedBox(width: 8),
              Text(
                'Inspiration Vault',
                style: TextStyle(
                  color: context.themeColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 140, // Height for mini cards
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _bookmarkedUpdates.length,
            itemBuilder: (context, index) {
              final update = _bookmarkedUpdates[index];
              final roomTitle = update['rooms']?['title'] ?? 'Room';
              final content = update['content'] ?? '';
              final type = update['update_type'] ?? 'text';
              
              return Container(
                width: 220,
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.themeColors.surfaceHighlight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.themeColors.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          type == 'video' ? LucideIcons.video : 
                          type == 'image' ? LucideIcons.image : LucideIcons.alignLeft,
                          size: 14,
                          color: context.themeColors.textTertiary,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            roomTitle,
                            style: TextStyle(
                              color: context.themeColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Expanded(
                      child: Text(
                        content,
                        style: TextStyle(
                          color: context.themeColors.textPrimary,
                          fontSize: 13,
                          height: 1.4,
                        ),
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildWatchingNow() {
    final colorList = [Colors.amber, Colors.blue, Colors.green, Colors.purple, Colors.red, Colors.cyan];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _buildSectionLabel('Watching Now'),
      _isWatchingLoading
          ? const Padding(padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8), child: LinearProgressIndicator())
          : _watchingNow.isEmpty
              ? Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Text('No rooms followed yet.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13)))
              : SizedBox(
                  height: 80,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: _watchingNow.length,
                    itemBuilder: (context, i) {
                      final room = _watchingNow[i];
                      final title = room['title']?.toString() ?? 'Room';
                      final initials = title.length >= 2 ? title.substring(0, 2).toUpperCase() : title.toUpperCase();
                      final color = colorList[title.codeUnitAt(0) % colorList.length];
                      return GestureDetector(
                        onTap: () { if (room['id'] != null) Navigator.push(context, MaterialPageRoute(builder: (_) => RoomDetailScreen(roomId: room['id'].toString(), title: title))); },
                        child: Container(
                          width: 72, margin: const EdgeInsets.only(right: 12),
                          child: Column(children: [
                            Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(14), border: Border.all(color: color.withOpacity(0.3))),
                              child: Center(child: Text(initials, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color.shade700))),
                            ),
                            const SizedBox(height: 6),
                            Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: context.themeColors.textSecondary)),
                          ]),
                        ),
                      );
                    },
                  ),
                ),
    ]);
  }

  Widget _buildSuggestedRooms() {
    if (_suggestedRooms.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _buildSectionLabel('Suggested For You'),
      ..._suggestedRooms.map((room) {
        final roomId = room['id']?.toString() ?? '';
        final title = room['title']?.toString() ?? 'Room';
        final tags = room['tags'] as List? ?? [];
        final tag = tags.isNotEmpty ? tags[0].toString() : 'Product';
        final updateCount = room['update_count'] ?? 0;
        final observerCount = room['observer_count'] ?? 0;
        final isFollowed = _followedRoomIds.contains(roomId);
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6), padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: context.themeColors.borderSubtle)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(tag.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: Colors.amber.shade600)),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
            const SizedBox(height: 4),
            Text('$updateCount updates \u00b7 $observerCount observers', style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: context.themeColors.textTertiary)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isFollowed ? null : () => _followRoom(roomId),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isFollowed ? Colors.green.withOpacity(0.1) : context.themeColors.primary500,
                  foregroundColor: isFollowed ? Colors.green.shade600 : Colors.white,
                  elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: Text(isFollowed ? 'Following \u2713' : '+ Follow room', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
          ]),
        );
      }),
    ]);
  }

  Widget _buildActivitySummary() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _buildSectionLabel('Your Activity'),
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: context.themeColors.borderSubtle)),
        child: Column(children: [
          _buildActivityRow('Reactions given', '${_observerStats?['totalReactions'] ?? 0}', context.themeColors.textPrimary, true),
          _buildActivityRow('Rooms followed', '${_observerStats?['roomsFollowed'] ?? 0}', context.themeColors.textPrimary, true),
          _buildActivityRow('Sharp critiques', '${_observerStats?['sharpInsights'] ?? 0}', context.themeColors.primary500, true),
          _buildActivityRow('Domain reputation', '${widget.userProfile?['reputation'] ?? 0} \u2605', Colors.amber.shade600, false),
        ]),
      ),
    ]);
  }

  Widget _buildActivityRow(String label, String value, Color valueColor, bool divider) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary)),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: valueColor)),
        ]),
      ),
      if (divider) Divider(height: 1, color: context.themeColors.borderSubtle, indent: 16, endIndent: 16),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.userProfile;
    final name = profile?['name'] ?? 'Observer';
    final firstName = name.split(' ')[0];
    final avatar = profile?['avatar'];
    final domain = profile?['domain'];
    final rep = profile?['reputation'] ?? 0;
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    String finalAvatarUrl = avatar?.toString() ?? '';
    if (finalAvatarUrl.isEmpty || !finalAvatarUrl.startsWith('http')) {
      final seed = profile?['id'] ?? name;
      finalAvatarUrl = 'https://api.dicebear.com/9.x/micah/png?seed=${Uri.encodeComponent(seed)}&backgroundColor=transparent';
    }

    return Scaffold(
      backgroundColor: context.themeColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async { await _fetchStats(); await _fetchFeed(); await _fetchWatchingNow(); },
          color: context.themeColors.primary500,
          backgroundColor: context.themeColors.surfaceHighlight,
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                  child: Row(children: [
                    Container(
                      width: 56, height: 56,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: context.themeColors.surfaceHighlight, border: Border.all(color: context.themeColors.borderSubtle)),
                      child: ClipOval(child: CachedNetworkImage(imageUrl: finalAvatarUrl, fit: BoxFit.cover)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      RichText(text: TextSpan(children: [
                        TextSpan(text: '$greeting, ', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary)),
                        TextSpan(text: '$firstName \ud83d\udc4b', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.themeColors.primary500)),
                      ])),
                      const SizedBox(height: 6),
                      Wrap(spacing: 8, runSpacing: 4, children: [
                        _Badge(icon: LucideIcons.eye, text: 'OBSERVER', color: Colors.purple),
                        if (domain != null) _Badge(text: domain.toString().toUpperCase(), color: Colors.grey),
                        _Badge(text: 'REP $rep', color: context.themeColors.primary500),
                      ]),
                    ])),
                  ]),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 140,
                  child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 20), children: [
                    _buildStatCard(label: 'Followed rooms', value: '${_observerStats?['roomsFollowed'] ?? 0}', icon: LucideIcons.eye, color: context.themeColors.primary500, bgColor: context.themeColors.primary500.withOpacity(0.1), delta: 'tracking progress'),
                    _buildStatCard(label: 'Reactions given', value: '${_observerStats?['totalReactions'] ?? 0}', icon: LucideIcons.messageSquare, color: Colors.amber, bgColor: Colors.amber.withOpacity(0.1), delta: 'insights shared'),
                    _buildStatCard(label: 'Sharp critiques', value: '${_observerStats?['sharpInsights'] ?? 0}', icon: LucideIcons.flame, color: Colors.purple, bgColor: Colors.purple.withOpacity(0.1), delta: '\u26a1 high signal'),
                    _buildStatCard(label: 'Shipped products', value: '${_observerStats?['shippedProducts'] ?? 0}', icon: LucideIcons.checkCircle2, color: Colors.green, bgColor: Colors.green.withOpacity(0.1), delta: 'witnessed'),
                  ]),
                ),
              ),
              SliverToBoxAdapter(child: _buildWatchingNow()),
              SliverToBoxAdapter(child: _buildInspirationVault()),
              SliverToBoxAdapter(child: _buildSectionLabel('Live Feed')),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: context.themeColors.borderSubtle)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(width: 7, height: 7, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 0.3, end: 1.0),
                      const SizedBox(width: 8),
                      Text('${_observerStats?['roomsFollowed'] ?? 0} rooms followed', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary)),
                    ]),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                  child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: _availableTags.map(_buildFilterChip).toList())),
                ),
              ),
              if (_isFeedLoading)
                SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(40), child: Center(child: CircularProgressIndicator(color: context.themeColors.primary500))))
              else if (_filteredFeed.isEmpty)
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16), padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: context.themeColors.borderSubtle)),
                    child: Column(children: [
                      const Text('\u2615', style: TextStyle(fontSize: 32)),
                      const SizedBox(height: 12),
                      Text('No builds in your feed yet', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                      const SizedBox(height: 8),
                      Text('Follow some builders or rooms to see their updates here.', style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary), textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ExploreScreen())),
                        icon: const Icon(LucideIcons.compass, size: 16), label: const Text('Explore builders'),
                        style: ElevatedButton.styleFrom(backgroundColor: context.themeColors.primary500, foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                      ),
                    ]),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(delegate: SliverChildBuilderDelegate((context, index) => _buildFeedCard(_filteredFeed[index]), childCount: _filteredFeed.length)),
                ),
              SliverToBoxAdapter(child: _buildSuggestedRooms()),
              SliverToBoxAdapter(child: _buildActivitySummary()),
              SliverToBoxAdapter(
                child: ObserverProgressionPanel(
                  userProfile: widget.userProfile,
                  onRoleUpgraded: () {
                    // Optionally trigger a parent refresh if needed
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final IconData? icon;
  final String text;
  final Color color;
  const _Badge({this.icon, required this.text, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.1), border: Border.all(color: color.withOpacity(0.2)), borderRadius: BorderRadius.circular(12)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 10, color: color), const SizedBox(width: 4)],
        Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: color)),
      ]),
    );
  }
}
