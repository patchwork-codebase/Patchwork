import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:cached_network_image/cached_network_image.dart';
import 'room_detail_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final List<String> _categories = ['All', 'Product', 'Engineering', 'Design', 'Growth', 'Research'];
  String _selectedCategory = 'All';
  String _searchQuery = '';
  late Future<List<Map<String, dynamic>>> _roomsFuture;
  late Future<List<Map<String, dynamic>>> _buildersFuture;
  late Future<List<Map<String, dynamic>>> _leaderboardFuture;
  late Future<List<String>> _trendingTopicsFuture;

  @override
  void initState() {
    super.initState();
    _roomsFuture = _fetchRooms();
    _buildersFuture = _fetchBuilders();
    _leaderboardFuture = _fetchLeaderboard();
    _trendingTopicsFuture = _fetchTrendingTopics();
  }

  Future<List<String>> _fetchTrendingTopics() async {
    try {
      final response = await Supabase.instance.client
          .from('rooms')
          .select('tags')
          .limit(100);
      final tagCounts = <String, int>{};
      for (var row in response as List) {
        final tags = row['tags'] as List<dynamic>? ?? [];
        for (var t in tags) {
          final tag = t.toString().trim();
          if (tag.isNotEmpty) {
            // Capitalize first letter
            final displayTag = tag[0].toUpperCase() + tag.substring(1).toLowerCase();
            tagCounts[displayTag] = (tagCounts[displayTag] ?? 0) + 1;
          }
        }
      }
      final sortedTags = tagCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      final topTags = sortedTags.take(5).map((e) => e.key).toList();
      if (topTags.isEmpty) return ['Product', 'Engineering', 'Design'];
      return topTags;
    } catch (_) {
      return ['Product', 'Engineering', 'Design'];
    }
  }

  Future<List<Map<String, dynamic>>> _fetchLeaderboard() async {
    try {
      final response = await Supabase.instance.client
          .from('users')
          .select('id, name, avatar, reputation, is_verified_expert')
          .order('reputation', ascending: false)
          .limit(3);
      return List<Map<String, dynamic>>.from(response);
    } catch (_) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> _fetchBuilders() async {
    try {
      final response = await Supabase.instance.client
          .from('users')
          .select('id, name, avatar, is_verified_expert')
          .limit(5);
      return List<Map<String, dynamic>>.from(response);
    } catch (_) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> _fetchRooms() async {
    dynamic query = Supabase.instance.client
        .from('rooms')
        .select('id, title, description, tags, created_at, builder_name, update_count, builder_id, users!builder_id(avatar), cover_image')
        .eq('status', 'active')
        .eq('visibility', 'public');

    if (_searchQuery.isNotEmpty) {
      query = query.ilike('title', '%$_searchQuery%');
    }

    if (_selectedCategory != 'All') {
      query = query.contains('tags', [_selectedCategory.toLowerCase()]);
    }

    final response = await query.order('updated_at', ascending: false).limit(20);
    return List<Map<String, dynamic>>.from(response);
  }

  void _onFilterChanged() {
    setState(() {
      _roomsFuture = _fetchRooms();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
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
          
          SafeArea(
            bottom: false,
            child: RefreshIndicator(
              onRefresh: () async {
                setState(() {
                  _roomsFuture = _fetchRooms();
                });
                await _roomsFuture;
              },
              color: context.themeColors.primary500,
              backgroundColor: context.themeColors.surfaceHighlight,
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      child: Column(
                        children: [

                          
                          RichText(
                            textAlign: TextAlign.center,
                            text: TextSpan(
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: context.themeColors.textPrimary,
                                height: 1.1,
                                letterSpacing: -1,
                              ),
                              children: [
                                TextSpan(text: 'Explore '),
                                TextSpan(text: 'Builders', style: TextStyle(color: context.themeColors.primary500)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Discover builders working in the open across Patchwork. Find inspiration and follow their progress.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: context.themeColors.textSecondary,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 20),
                          
                          // Search Bar
                          Container(
                            decoration: BoxDecoration(
                              color: context.themeColors.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: context.themeColors.borderSubtle),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: TextField(
                              onSubmitted: (val) {
                                _searchQuery = val;
                                _onFilterChanged();
                              },
                              style: TextStyle(color: context.themeColors.textPrimary),
                              decoration: InputDecoration(
                                hintText: 'Search rooms, domains, or builders...',
                                hintStyle: TextStyle(color: context.themeColors.textTertiary, fontSize: 15),
                                prefixIcon: Icon(LucideIcons.search, color: context.themeColors.textTertiary, size: 18),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              ),
                            ),
                          ),
                          const SizedBox(height: 32),
                          
                          // Trending Topics
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text('Trending Topics', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                          ),
                          const SizedBox(height: 12),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: FutureBuilder<List<String>>(
                              future: _trendingTopicsFuture,
                              builder: (context, snapshot) {
                                final topics = snapshot.data ?? ['Product', 'Engineering', 'Design'];
                                return Row(
                                  children: topics.map((topic) => 
                                    Container(
                                      margin: const EdgeInsets.only(right: 8),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: context.themeColors.primary500.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: context.themeColors.primary500.withOpacity(0.2)),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(LucideIcons.trendingUp, size: 12, color: context.themeColors.primary500),
                                          const SizedBox(width: 4),
                                          Text(topic, style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                  ).toList(),
                                );
                              }
                            ),
                          ),
                          const SizedBox(height: 32),
                          
                          // Suggested Builders
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text('Suggested Builders', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 100,
                            child: FutureBuilder<List<Map<String, dynamic>>>(
                              future: _buildersFuture,
                              builder: (context, snapshot) {
                                if (snapshot.connectionState == ConnectionState.waiting) {
                                  return const Center(child: CircularProgressIndicator());
                                }
                                final builders = snapshot.data ?? [];
                                if (builders.isEmpty) return const Text('No builders found.');
                                return ListView.builder(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: builders.length,
                                  itemBuilder: (context, index) {
                                    final builder = builders[index];
                                    final avatar = builder['avatar']?.toString();
                                    return Container(
                                      width: 80,
                                      margin: const EdgeInsets.only(right: 12),
                                      child: Column(
                                        children: [
                                          _buildAvatar(avatar, builder['name'] ?? 'U', builder['id']?.toString() ?? '', 56),
                                          const SizedBox(height: 8),
                                          Text(
                                            builder['name'],
                                            style: TextStyle(color: context.themeColors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            textAlign: TextAlign.center,
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                          ),
                          
                          const SizedBox(height: 32),
                          
                          // Leaderboard
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Row(
                              children: [
                                Text('Top Builders (This Week)', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                                const SizedBox(width: 8),
                                Icon(LucideIcons.flame, color: Colors.orange, size: 18),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          FutureBuilder<List<Map<String, dynamic>>>(
                            future: _leaderboardFuture,
                            builder: (context, snapshot) {
                              if (snapshot.connectionState == ConnectionState.waiting) {
                                return const Center(child: CircularProgressIndicator());
                              }
                              final users = snapshot.data ?? [];
                              if (users.isEmpty) return const Text('No leaderboard data.');
                              
                              return Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.02),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                                ),
                                child: Column(
                                  children: users.asMap().entries.map((entry) {
                                    final idx = entry.key;
                                    final user = entry.value;
                                    final rank = (idx + 1).toString();
                                    final name = user['name'] ?? 'Anonymous';
                                    final avatarUrl = user['avatar']?.toString();
                                    final reputation = user['reputation']?.toString() ?? '0';
                                    final isExpert = user['is_verified_expert'] == true;
                                    
                                    final userId = user['id']?.toString() ?? '';
                                    
                                    Color medalColor = Colors.brown.shade400;
                                    if (idx == 0) medalColor = Colors.amber;
                                    else if (idx == 1) medalColor = Colors.grey.shade400;
                                    
                                    return Column(
                                      children: [
                                        _buildLeaderboardRow(rank, name, avatarUrl, '${reputation} pts', medalColor, isExpert, userId),
                                        if (idx < users.length - 1)
                                          const Divider(height: 24, color: Colors.white10),
                                      ],
                                    );
                                  }).toList(),
                                ),
                              );
                            },
                          ),
                          
                          const SizedBox(height: 32),
                          
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text('Active Rooms', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                          ),
                          
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  ),
                  
                  // Categories
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 40,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _categories.length,
                        itemBuilder: (context, index) {
                          final category = _categories[index];
                          final isSelected = category == _selectedCategory;
                          return GestureDetector(
                            onTap: () {
                              _selectedCategory = category;
                              _onFilterChanged();
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? context.themeColors.primary500 : Colors.transparent,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: isSelected ? context.themeColors.primary500 : context.themeColors.borderSubtle),
                                ),
                                child: Text(
                                  category,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected ? Colors.white : context.themeColors.textSecondary,
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  
                  SliverToBoxAdapter(
                    child: FutureBuilder<List<Map<String, dynamic>>>(
                      future: _roomsFuture,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return Padding(
                            padding: EdgeInsets.all(48.0),
                            child: Center(child: CircularProgressIndicator(color: context.themeColors.primary500)),
                          );
                        }
                        if (snapshot.hasError) {
                          return Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Center(child: Text('Error loading rooms: ${snapshot.error}', style: const TextStyle(color: Colors.redAccent))),
                          );
                        }
                        
                        final rooms = snapshot.data ?? [];
                        
                        if (rooms.isEmpty) {
                          return Padding(
                            padding: const EdgeInsets.all(20),
                            child: Container(
                              margin: const EdgeInsets.only(top: 16),
                              padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.02),
                                border: Border.all(color: Colors.white.withOpacity(0.05)),
                                borderRadius: BorderRadius.circular(24),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 64, height: 64,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.05),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(LucideIcons.search, color: context.themeColors.textTertiary, size: 32),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No active rooms found',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Try adjusting your filters or search query.',
                                    style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary),
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOutQuad),
                          );
                        }
                        
                        return ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                          itemCount: rooms.length,
                          itemBuilder: (context, index) {
                            final room = rooms[index];
                            final tags = List<String>.from(room['tags'] ?? []);
                            final createdAt = DateTime.parse(room['created_at'] ?? DateTime.now().toIso8601String());
                            final updateCount = room['update_count'] ?? 0;
                            final builderAvatar = (room['users'] != null && room['users'] is Map) ? room['users']['avatar'] : null;
                            final builderId = room['builder_id']?.toString() ?? '';
                            final coverImage = room['cover_image'];
                            
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => RoomDetailScreen(
                                      roomId: room['id'].toString(),
                                      title: room['title']?.toString() ?? 'Room',
                                    ),
                                  ),
                                );
                              },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 24),
                              decoration: BoxDecoration(
                                color: context.themeColors.surface,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: context.themeColors.borderSubtle),
                                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Gradient or Image Banner
                                  Container(
                                    height: 100,
                                    width: double.infinity,
                                    decoration: BoxDecoration(
                                      color: context.themeColors.surfaceHighlight,
                                      image: coverImage != null && coverImage.toString().isNotEmpty
                                          ? DecorationImage(
                                              image: CachedNetworkImageProvider(coverImage.toString()),
                                              fit: BoxFit.cover,
                                            )
                                          : null,
                                      gradient: coverImage == null || coverImage.toString().isEmpty
                                          ? const LinearGradient(
                                              colors: [Color(0xFFFFD1D1), Color(0xFFFFE3D1)], // Pink to Peach
                                              begin: Alignment.topLeft,
                                              end: Alignment.bottomRight,
                                            )
                                          : null,
                                    ),
                                    padding: const EdgeInsets.all(16),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: tags.take(3).map((tag) => Container(
                                        margin: const EdgeInsets.only(right: 8),
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                                        child: Text(tag.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.black87, letterSpacing: 1.0)),
                                      )).toList(),
                                    ),
                                  ),
                                  // Body with overlapping avatar
                                  Stack(
                                    clipBehavior: Clip.none,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.fromLTRB(20, 36, 20, 20),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(room['title'] ?? 'Untitled', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: context.themeColors.textPrimary)),
                                            const SizedBox(height: 4),
                                            Text('by ${room['builder_name'] ?? 'Unknown'}', style: TextStyle(fontSize: 12, color: context.themeColors.textSecondary, fontWeight: FontWeight.bold)),
                                            const SizedBox(height: 16),
                                            Text(
                                              room['description'] ?? 'No description',
                                              maxLines: 3,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary, height: 1.5),
                                            ),
                                            const SizedBox(height: 20),
                                            Divider(height: 1, color: context.themeColors.borderSubtle),
                                            const SizedBox(height: 16),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Row(
                                                  children: [
                                                    Icon(LucideIcons.clock, size: 14, color: context.themeColors.textTertiary),
                                                    const SizedBox(width: 4),
                                                    Text(timeago.format(createdAt, locale: 'en_short') + ' ago', style: TextStyle(fontSize: 12, color: context.themeColors.textSecondary)),
                                                  ],
                                                ),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                  decoration: BoxDecoration(
                                                    color: context.themeColors.primary500.withOpacity(0.1),
                                                    borderRadius: BorderRadius.circular(12),
                                                  ),
                                                  child: Text(
                                                    '$updateCount UPDATES',
                                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: context.themeColors.primary500, letterSpacing: 0.5),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      Positioned(
                                        top: -24,
                                        left: 20,
                                        child: Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(color: context.themeColors.surface, shape: BoxShape.circle),
                                          child: _buildAvatar(builderAvatar?.toString(), room['builder_name'] ?? 'U', builderId, 44),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              ),
                            ).animate().fadeIn(duration: 300.ms, delay: (index * 50).ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOutQuad);
                          },
                        );
                      },
                    ),
                  ),
                  
                  // Add bottom padding for the nav bar
                  const SliverToBoxAdapter(child: SizedBox(height: 120)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAvatar(String? avatarUrl, String name, String userId, double size) {
    final initial = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?';
    
    String finalUrl = avatarUrl ?? '';
    if (finalUrl.isEmpty || !finalUrl.startsWith('http')) {
      final seed = userId.isNotEmpty ? userId : (name.isNotEmpty ? name : 'default');
      finalUrl = 'https://api.dicebear.com/9.x/micah/png?seed=${Uri.encodeComponent(seed)}&backgroundColor=transparent';
    }
    
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: context.themeColors.surface,
        border: Border.all(color: context.themeColors.borderSubtle, width: 2),
      ),
      child: ClipOval(
        child: CachedNetworkImage(
          imageUrl: finalUrl,
          fit: BoxFit.cover,
          errorWidget: (context, error, stackTrace) => Center(child: Text(initial, style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary))),
          placeholder: (context, url) => Container(color: context.themeColors.surfaceHighlight),
        ),
      ),
    );
  }

  Widget _buildLeaderboardRow(String rank, String name, String? avatarUrl, String points, Color medalColor, bool isExpert, String userId) {
    return Row(
      children: [
        SizedBox(
          width: 24,
          child: Text(
            rank,
            style: TextStyle(color: context.themeColors.textSecondary, fontWeight: FontWeight.bold, fontSize: 16),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(width: 12),
        Icon(LucideIcons.medal, color: medalColor, size: 20),
        const SizedBox(width: 12),
        _buildAvatar(avatarUrl, name, userId, 32),
        const SizedBox(width: 12),
        Expanded(
          child: Row(
            children: [
              Flexible(
                child: Text(
                  name,
                  style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (isExpert) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: context.themeColors.primary500.withOpacity(0.1),
                    border: Border.all(color: context.themeColors.primary500.withOpacity(0.3)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('Expert', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.themeColors.primary400)),
                )
              ]
            ],
          ),
        ),
        Text(
          points,
          style: TextStyle(color: context.themeColors.primary400, fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ],
    );
  }
}
