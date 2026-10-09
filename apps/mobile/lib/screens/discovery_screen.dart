import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'public_profile_screen.dart';
import 'room_detail_screen.dart';
import '../widgets/skeleton_loaders.dart';

class DiscoveryScreen extends StatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  State<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends State<DiscoveryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = false;
  String _searchQuery = '';

  List<Map<String, dynamic>> _trendingRooms = [];
  List<Map<String, dynamic>> _suggestedBuilders = [];

  List<Map<String, dynamic>> _searchRooms = [];
  List<Map<String, dynamic>> _searchBuilders = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchTrending();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchTrending() async {
    setState(() => _isLoading = true);
    try {
      final roomsRes = await Supabase.instance.client
          .from('rooms')
          .select('id, title, description, cover_image, tags, update_count')
          .order('update_count', ascending: false)
          .limit(10);

      final buildersRes = await Supabase.instance.client
          .from('users')
          .select('id, name, avatar, bio, is_verified_expert')
          .neq('id', Supabase.instance.client.auth.currentUser?.id ?? '')
          .order('id', ascending: false) // random proxy for now
          .limit(10);

      if (mounted) {
        setState(() {
          _trendingRooms = List<Map<String, dynamic>>.from(roomsRes);
          _suggestedBuilders = List<Map<String, dynamic>>.from(buildersRes);
          _suggestedBuilders.shuffle();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchQuery = '';
        _searchRooms.clear();
        _searchBuilders.clear();
      });
      return;
    }

    setState(() {
      _searchQuery = query.trim();
      _isLoading = true;
    });

    try {
      final roomsRes = await Supabase.instance.client
          .from('rooms')
          .select('id, title, description, cover_image, tags, update_count')
          .or('title.ilike.%$_searchQuery%,description.ilike.%$_searchQuery%')
          .limit(20);

      final buildersRes = await Supabase.instance.client
          .from('users')
          .select('id, name, avatar, bio, is_verified_expert')
          .or('name.ilike.%$_searchQuery%,username.ilike.%$_searchQuery%,bio.ilike.%$_searchQuery%')
          .limit(20);

      if (mounted) {
        setState(() {
          _searchRooms = List<Map<String, dynamic>>.from(roomsRes);
          _searchBuilders = List<Map<String, dynamic>>.from(buildersRes);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getAvatarUrl(Map<String, dynamic> user) {
    final rawAvatar = user['avatar']?.toString() ?? '';
    final name = user['name'] ?? 'U';
    if (rawAvatar.trim().isNotEmpty && rawAvatar.startsWith('http')) {
      return rawAvatar;
    }
    final seed = user['id']?.toString() ?? name;
    return 'https://api.dicebear.com/9.x/micah/png?seed=${Uri.encodeComponent(seed)}&backgroundColor=transparent';
  }

  @override
  Widget build(BuildContext context) {
    final isSearching = _searchQuery.isNotEmpty;

    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        backgroundColor: context.themeColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        title: Container(
          height: 44,
          decoration: BoxDecoration(
            color: context.themeColors.surfaceHighlight,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: context.themeColors.borderSubtle),
          ),
          child: TextField(
            controller: _searchController,
            style:
                TextStyle(color: context.themeColors.textPrimary, fontSize: 14),
            onSubmitted: _performSearch,
            decoration: InputDecoration(
              hintText: 'Search builders, rooms, tags...',
              hintStyle: TextStyle(
                  color: context.themeColors.textTertiary, fontSize: 14),
              border: InputBorder.none,
              filled: true,
              fillColor: Colors.transparent,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              prefixIcon: Icon(LucideIcons.search,
                  size: 18, color: context.themeColors.textSecondary),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: Icon(LucideIcons.x,
                          size: 16, color: context.themeColors.textSecondary),
                      onPressed: () {
                        _searchController.clear();
                        _performSearch('');
                      },
                    )
                  : null,
            ),
            onChanged: (val) => setState(() {
              if (val.isEmpty) _performSearch('');
            }),
          ),
        ),
        bottom: isSearching
            ? TabBar(
                controller: _tabController,
                indicatorColor: context.themeColors.primary500,
                labelColor: context.themeColors.primary500,
                unselectedLabelColor: context.themeColors.textSecondary,
                labelStyle:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                tabs: const [
                  Tab(text: 'Rooms'),
                  Tab(text: 'Builders'),
                ],
              )
            : null,
      ),
      body: isSearching
          ? TabBarView(
              controller: _tabController,
              children: [
                _buildSearchRoomsTab(),
                _buildSearchBuildersTab(),
              ],
            )
          : _buildExploreView(),
    );
  }

  Widget _buildExploreView() {
    if (_isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 5,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: FeedCardSkeleton(),
        ),
      );
    }

    return CustomScrollView(
      slivers: [
        if (_suggestedBuilders.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
              child: Text(
                'Top Builders',
                style: TextStyle(
                  color: context.themeColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ).animate().fadeIn().slideX(begin: -0.1, end: 0),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 120,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _suggestedBuilders.length,
                itemBuilder: (context, index) {
                  final builder = _suggestedBuilders[index];
                  return _buildHorizontalBuilderCard(builder)
                      .animate()
                      .fadeIn(delay: (index * 50).ms)
                      .scale(
                          begin: const Offset(0.9, 0.9),
                          end: const Offset(1, 1));
                },
              ),
            ),
          ),
        ],
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 32, 16, 12),
            child: Text(
              'Trending Rooms',
              style: TextStyle(
                color: context.themeColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ).animate().fadeIn().slideX(begin: -0.1, end: 0),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final room = _trendingRooms[index];
              return _buildLargeRoomCard(room)
                  .animate()
                  .fadeIn(delay: (index * 50).ms)
                  .slideY(begin: 0.1, end: 0);
            },
            childCount: _trendingRooms.length,
          ),
        ),
        const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
      ],
    );
  }

  Widget _buildHorizontalBuilderCard(Map<String, dynamic> builder) {
    final avatarUrl = _getAvatarUrl(builder);

    return GestureDetector(
      onTap: () {
        Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) =>
                    PublicProfileScreen(userId: builder['id'].toString())));
      },
      child: Container(
        width: 80,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: context.themeColors.primary500.withOpacity(0.5),
                    width: 2),
                image: DecorationImage(
                  image: CachedNetworkImageProvider(avatarUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              builder['name'] ?? 'Builder',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.themeColors.textPrimary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLargeRoomCard(Map<String, dynamic> room) {
    String coverUrl = room['cover_image']?.toString().trim() ?? '';
    if (coverUrl.isEmpty) {
      final seed =
          room['id']?.toString() ?? room['title']?.toString() ?? 'Room';
      // Use DiceBear abstract shapes as a beautiful fallback illustration
      coverUrl =
          'https://api.dicebear.com/9.x/shapes/png?seed=${Uri.encodeComponent(seed)}&backgroundColor=000000';
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => RoomDetailScreen(
                    roomId: room['id'].toString(),
                    title: room['title']?.toString() ?? 'Room')));
      },
      child: Container(
        height: 180,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: context.themeColors.surface,
          image: DecorationImage(
            image: CachedNetworkImageProvider(coverUrl),
            fit: BoxFit.cover,
            colorFilter: ColorFilter.mode(
              Colors.black.withOpacity(0.6),
              BlendMode.darken,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (room['tags'] != null && (room['tags'] as List).isNotEmpty)
                Wrap(
                  spacing: 6,
                  children: (room['tags'] as List)
                      .take(3)
                      .map((tag) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.4),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: Colors.white.withOpacity(0.2)),
                            ),
                            child: Text('#$tag',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold)),
                          ))
                      .toList(),
                ),
              const Spacer(),
              Text(
                room['title'] ?? 'Untitled Room',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  height: 1.2,
                ),
              ),
              if (room['description'] != null &&
                  room['description'].toString().trim().isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  room['description'],
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.85),
                    fontSize: 13,
                    height: 1.3,
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(LucideIcons.activity,
                      size: 14, color: Colors.white.withOpacity(0.8)),
                  const SizedBox(width: 4),
                  Text(
                    '${room['update_count'] ?? 0} updates',
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.8), fontSize: 13),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchRoomsTab() {
    if (_isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 5,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: FeedCardSkeleton(),
        ),
      );
    }

    if (_searchRooms.isEmpty) {
      return Center(
        child: Text(
          'No rooms found for "$_searchQuery"',
          style: TextStyle(color: context.themeColors.textSecondary),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchRooms.length,
      itemBuilder: (context, index) {
        return _buildLargeRoomCard(_searchRooms[index])
            .animate()
            .fadeIn(duration: 300.ms, delay: (index * 50).ms)
            .slideY(begin: 0.1, end: 0, curve: Curves.easeOut);
      },
    );
  }

  Widget _buildSearchBuildersTab() {
    if (_isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 5,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: FeedCardSkeleton(),
        ),
      );
    }

    if (_searchBuilders.isEmpty) {
      return Center(
        child: Text(
          'No builders found for "$_searchQuery"',
          style: TextStyle(color: context.themeColors.textSecondary),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchBuilders.length,
      itemBuilder: (context, index) {
        return _buildSearchBuilderCard(_searchBuilders[index])
            .animate()
            .fadeIn(duration: 300.ms, delay: (index * 50).ms)
            .slideY(begin: 0.1, end: 0, curve: Curves.easeOut);
      },
    );
  }

  Widget _buildSearchBuilderCard(Map<String, dynamic> builder) {
    final avatarUrl = _getAvatarUrl(builder);

    return GestureDetector(
      onTap: () {
        Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) =>
                    PublicProfileScreen(userId: builder['id'].toString())));
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              context.themeColors.surface.withOpacity(0.9),
              context.themeColors.surface,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: context.themeColors.borderSubtle.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                image: DecorationImage(
                  image: CachedNetworkImageProvider(avatarUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        builder['name'] ?? 'Unknown Builder',
                        style: TextStyle(
                            color: context.themeColors.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 15),
                      ),
                      if (builder['is_verified_expert'] == true) ...[
                        const SizedBox(width: 6),
                        const Icon(Icons.verified,
                            size: 15, color: Colors.blue),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    (builder['bio']?.toString().trim().isNotEmpty == true)
                        ? builder['bio']
                        : 'Exploring the Patchwork universe ✨',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: context.themeColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight,
                size: 16, color: context.themeColors.textTertiary),
          ],
        ),
      ),
    );
  }
}
