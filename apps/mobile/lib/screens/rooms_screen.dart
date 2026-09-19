import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';
import 'room_detail_screen.dart';
import 'create_room_screen.dart';
import 'create_room_screen.dart';

class RoomsScreen extends StatefulWidget {
  const RoomsScreen({super.key});

  @override
  State<RoomsScreen> createState() => _RoomsScreenState();
}

class _RoomsScreenState extends State<RoomsScreen> with SingleTickerProviderStateMixin {
  late final Future<List<Map<String, dynamic>>> _myRoomsFuture;
  late final Future<List<Map<String, dynamic>>> _observedRoomsFuture;
  late TabController _tabController;
  Map<String, dynamic>? _currentUserProfile;

  final Map<String, Map<String, Color>> _tagPalette = {
    'product': {'bg': const Color(0xFFE5F1FF), 'color': const Color(0xFF0066FF)},
    'engineering': {'bg': const Color(0xFFF3E8FF), 'color': const Color(0xFF9333EA)},
    'design': {'bg': const Color(0xFFFFE4E6), 'color': const Color(0xFFE11D48)},
    'marketing': {'bg': const Color(0xFFDCFCE7), 'color': const Color(0xFF16A34A)},
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _myRoomsFuture = _fetchMyRooms();
    _observedRoomsFuture = _fetchObservedRooms();
    _fetchCurrentUserProfile();
  }

  Future<void> _fetchCurrentUserProfile() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final profile = await Supabase.instance.client
          .from('users')
          .select('name, avatar')
          .eq('id', userId)
          .maybeSingle();
      if (mounted) {
        setState(() {
          _currentUserProfile = profile;
        });
      }
    } catch (_) {}
  }

  Future<List<Map<String, dynamic>>> _fetchMyRooms() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return [];
    
    final response = await Supabase.instance.client
        .from('rooms')
        .select('id, title, description, created_at, tags, update_count, room_observers(users(avatar, name))')
        .eq('builder_id', userId)
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> _fetchObservedRooms() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return [];
    
    final response = await Supabase.instance.client
        .from('room_observers')
        .select('rooms(id, title, description, created_at, tags, update_count, room_observers(users(avatar, name)))')
        .eq('observer_id', userId);
        
    final mapped = (response as List).map((row) {
      final room = row['rooms'];
      // Handle array or object just in case
      if (room is List) return room.isNotEmpty ? room.first as Map<String, dynamic> : null;
      return room as Map<String, dynamic>?;
    }).where((r) => r != null).cast<Map<String, dynamic>>().toList();
    
    return mapped;
  }

  Map<String, dynamic> _getTagStyle(String tag) {
    return _tagPalette[tag.toLowerCase()] ?? {'bg': AppTheme.slate500, 'color': AppTheme.slate400};
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Rooms', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: context.themeColors.primary500.withOpacity(0.3)),
                  boxShadow: [
                    BoxShadow(color: context.themeColors.primary500.withOpacity(0.2), blurRadius: 8)
                  ],
                ),
                labelColor: context.themeColors.textPrimary,
                unselectedLabelColor: context.themeColors.textSecondary,
                labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'My Rooms'),
                  Tab(text: 'Observed Rooms'),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          // Studio Lighting Gradient
          Positioned(
            top: -150,
            left: 0,
            right: 0,
            child: Container(
              height: 400,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    context.themeColors.primary500.withOpacity(0.12),
                    Colors.purple.withOpacity(0.05),
                    Colors.transparent,
                  ],
                  radius: 0.8,
                ),
              ),
            ),
          ),
          TabBarView(
            controller: _tabController,
            children: [
              _buildFutureTab(_myRoomsFuture, () async {
                setState(() => _myRoomsFuture = _fetchMyRooms());
                await _myRoomsFuture;
              }),
              _buildFutureTab(_observedRoomsFuture, () async {
                setState(() => _observedRoomsFuture = _fetchObservedRooms());
                await _observedRoomsFuture;
              }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFutureTab(Future<List<Map<String, dynamic>>> future, Future<void> Function() onRefresh) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.redAccent)));
        }

        final rooms = snapshot.data ?? [];
        return RefreshIndicator(
          onRefresh: onRefresh,
          color: context.themeColors.primary500,
          backgroundColor: context.themeColors.surfaceHighlight,
          child: _buildRoomList(rooms),
        );
      },
    );
  }

  Widget _buildRoomList(List<Map<String, dynamic>> rooms) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      children: [
        // Header Texts
        Text('My Rooms', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary, letterSpacing: -1)),
        const SizedBox(height: 8),
        Text('Manage your active build rooms and feature rollouts', style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary)),
        const SizedBox(height: 24),
        
        // Create Room Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const CreateRoomScreen()),
              ).then((_) {
                setState(() {
                  _myRoomsFuture = _fetchMyRooms();
                  _observedRoomsFuture = _fetchObservedRooms();
                });
              });
            },
            icon: const Icon(LucideIcons.plus, size: 16),
            label: const Text('Create Room'),
            style: ElevatedButton.styleFrom(
              backgroundColor: context.themeColors.primary500,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 32),

        if (rooms.isEmpty)
          Center(child: Text('No rooms available.', style: TextStyle(color: context.themeColors.textTertiary))),

        ...rooms.asMap().entries.map((entry) {
          final index = entry.key;
          final room = entry.value;
          
          final title = room['title'] ?? 'Untitled Room';
          final description = room['description'] ?? 'No description';
          final tags = List<String>.from(room['tags'] ?? []);
          final tag = tags.isNotEmpty ? tags.first : 'product';

          final createdAt = DateTime.tryParse(room['created_at'] ?? '') ?? DateTime.now();
          final daysActive = DateTime.now().difference(createdAt).inDays;
          final updateCount = room['update_count'] ?? 0;
          
          final observers = room['room_observers'] as List<dynamic>? ?? [];
          final displayObservers = observers.take(3).map((o) => o['users'] as Map<String, dynamic>? ?? {}).toList();
          final totalObservers = observers.length;

          return GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => RoomDetailScreen(roomId: room['id'], title: title),
                ),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.themeColors.surface, // Solid clean surface color
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.themeColors.borderSubtle),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Tags
                  Text(title, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.themeColors.textPrimary)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _buildPill(tag.toUpperCase(), context.themeColors.primary500, context.themeColors.primary500.withOpacity(0.15)),
                      const SizedBox(width: 8),
                      _buildPill('Live', context.themeColors.textPrimary, Colors.white.withOpacity(0.05)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Description
                  Text(
                    description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary, height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  
                  // Meta Info
                  Row(
                    children: [
                      Text('Day $daysActive', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(' • ', style: TextStyle(color: context.themeColors.textTertiary)),
                      Text('$updateCount updates', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(' • ', style: TextStyle(color: context.themeColors.textTertiary)),
                      // Avatar pile
                      if (displayObservers.isNotEmpty)
                        SizedBox(
                          width: (displayObservers.length * 16.0) + 8.0,
                          height: 24,
                          child: Stack(
                            children: List.generate(displayObservers.length, (i) {
                              final obsUser = displayObservers[i];
                              final obsName = obsUser['name'] as String? ?? 'U';
                              final initial = obsName.isNotEmpty ? obsName[0].toUpperCase() : 'U';
                              return Positioned(
                                left: i * 14.0,
                                child: _buildAvatarStackItem(
                                  Colors.primaries[i % Colors.primaries.length],
                                  obsUser['avatar'] as String?,
                                  initial,
                                ),
                              );
                            }),
                          ),
                        ),
                      if (totalObservers > displayObservers.length) ...[
                        Text(' +${totalObservers - displayObservers.length}', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                      if (totalObservers > 0)
                        Text(' • ', style: TextStyle(color: context.themeColors.textTertiary)),
                      Text(timeago.format(createdAt, locale: 'en_short') + ' ago', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Footer Row (Icons + View Room)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.02),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.05)),
                        ),
                        child: Row(
                          children: [
                            Icon(LucideIcons.figma, size: 14, color: context.themeColors.textSecondary),
                            SizedBox(width: 12),
                            Icon(LucideIcons.trello, size: 14, color: context.themeColors.textSecondary), // Notion substitute
                            SizedBox(width: 12),
                            Icon(LucideIcons.github, size: 14, color: context.themeColors.textSecondary),
                          ],
                        ),
                      ),
                      
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: context.themeColors.primary500.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.themeColors.primary500.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            Text('View Room', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold, fontSize: 13)),
                            SizedBox(width: 6),
                            Icon(LucideIcons.arrowRight, size: 14, color: context.themeColors.primary500),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(duration: 300.ms, delay: (index * 50).ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOutQuad);
      }).toList(),
      ],
    );
  }

  Widget _buildPill(String text, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: textColor.withOpacity(0.3)),
      ),
      child: Text(text, style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 0.5)),
    );
  }

  Widget _buildAvatarStackItem(Color fallbackColor, String? avatarUrl, String label) {
    return Container(
      width: 24, height: 24,
      decoration: BoxDecoration(
        color: fallbackColor.withOpacity(0.2),
        shape: BoxShape.circle,
        border: Border.all(color: context.themeColors.background, width: 2),
        image: avatarUrl != null && avatarUrl.isNotEmpty
            ? DecorationImage(
                image: NetworkImage(avatarUrl),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: avatarUrl == null || avatarUrl.isEmpty
          ? Center(child: Text(label, style: TextStyle(color: fallbackColor, fontSize: 10, fontWeight: FontWeight.bold)))
          : null,
    );
  }
}
