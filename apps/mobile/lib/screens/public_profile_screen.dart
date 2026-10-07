import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import 'room_detail_screen.dart';
import '../widgets/feed_update_card.dart';
import '../widgets/bento_profile_header.dart';
import '../widgets/proof_of_work_ledger.dart';

class PublicProfileScreen extends StatefulWidget {
  final String userId;

  const PublicProfileScreen({super.key, required this.userId});

  @override
  State<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends State<PublicProfileScreen> with SingleTickerProviderStateMixin {
  late final Future<Map<String, dynamic>?> _profileFuture;
  late final Future<List<Map<String, dynamic>>> _roomsFuture;
  late final Future<List<Map<String, dynamic>>> _postsFuture;
  late TabController _tabController;

  bool _isFollowing = false;
  bool _isTogglingFollow = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _profileFuture = _fetchProfile();
    _roomsFuture = _fetchRooms();
    _postsFuture = _fetchPosts();
    _checkFollowStatus();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>?> _fetchProfile() async {
    final client = Supabase.instance.client;
    Map<String, dynamic>? profile;

    // 1. Try fetching with pinned_update join
    try {
      profile = await client
          .from('users')
          .select(
              '*, pinned_update:updates!pinned_update_id(*, rooms(title, tags), users(name, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*)))')
          .eq('id', widget.userId)
          .maybeSingle();
    } catch (_) {
      // 2. Fallback to clean select without pinned_update join in case of schema/foreign key issues
      try {
        profile = await client
            .from('users')
            .select('*')
            .eq('id', widget.userId)
            .maybeSingle();
      } catch (_) {}
    }

    if (profile != null) {
      // Sanitize avatar if it contains stale cartoon image
      final rawAvatar = profile['avatar']?.toString();
      if (rawAvatar != null && rawAvatar.contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg')) {
        profile['avatar'] = 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg';
      }

      // Record a page view
      try {
        final currentUserId = client.auth.currentUser?.id;
        if (currentUserId != widget.userId) {
          await client.from('page_views').insert({
            'viewer_id': currentUserId,
            'target_type': 'profile',
            'target_id': widget.userId,
          });
        }
      } catch (_) {}

      try {
        final followersRes = await client
            .from('follows')
            .select('follower_id')
            .eq('following_id', widget.userId);
        final followingRes = await client
            .from('follows')
            .select('following_id')
            .eq('follower_id', widget.userId);
        profile['followerCount'] = (followersRes as List).length;
        profile['followingCount'] = (followingRes as List).length;
      } catch (e) {
        profile['followerCount'] = 0;
        profile['followingCount'] = 0;
      }
    }

    return profile;
  }

  Future<List<Map<String, dynamic>>> _fetchRooms() async {
    return await Supabase.instance.client
        .from('rooms')
        .select('*')
        .eq('builder_id', widget.userId)
        .eq('status', 'active')
        .order('created_at', ascending: false);
  }

  Future<List<Map<String, dynamic>>> _fetchPosts() async {
    try {
      final response = await Supabase.instance.client
          .from('updates')
          .select(
              '*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
          .eq('author_id', widget.userId)
          .isFilter('parent_update_id', null)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      return [];
    }
  }

  Future<void> _checkFollowStatus() async {
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    if (currentUserId == null || currentUserId == widget.userId) {
      return;
    }
    try {
      final res = await Supabase.instance.client
          .from('follows')
          .select('follower_id')
          .eq('follower_id', currentUserId)
          .eq('following_id', widget.userId)
          .maybeSingle();
      if (mounted) {
        setState(() {
          _isFollowing = res != null;
        });
      }
    } catch (_) {}
  }

  Future<void> _toggleFollow() async {
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    if (currentUserId == null || _isTogglingFollow) return;

    HapticFeedback.mediumImpact();
    setState(() => _isTogglingFollow = true);

    // Optimistic update
    final wasFollowing = _isFollowing;
    setState(() => _isFollowing = !wasFollowing);

    try {
      if (wasFollowing) {
        await Supabase.instance.client
            .from('follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('following_id', widget.userId);
      } else {
        await Supabase.instance.client.from('follows').upsert({
          'follower_id': currentUserId,
          'following_id': widget.userId,
        });
      }
    } catch (_) {
      // Revert on failure
      if (mounted) setState(() => _isFollowing = wasFollowing);
    } finally {
      if (mounted) setState(() => _isTogglingFollow = false);
    }
  }

  Future<void> _launchSocialUrl(String? url, String prefix) async {
    if (url == null || url.trim().isEmpty) return;
    String fullUrl = url.trim();
    // If user stored just handle (e.g. "@username" or "username"), prepend the base URL
    if (!fullUrl.startsWith('http')) {
      fullUrl = '$prefix${fullUrl.replaceAll('@', '')}';
    }
    final uri = Uri.tryParse(fullUrl);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _profileFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
              child: CircularProgressIndicator(color: context.themeColors.primary500),
            );
          }
          if (snapshot.hasError || snapshot.data == null) {
            return const Center(
              child: Text('Failed to load profile.', style: TextStyle(color: Colors.redAccent)),
            );
          }

          final profile = snapshot.data!;
          final followerCount = profile['followerCount'] ?? 0;
          final isOwnProfile = widget.userId == Supabase.instance.client.auth.currentUser?.id;

          return FutureBuilder<List<Map<String, dynamic>>>(
            future: _roomsFuture,
            builder: (context, roomsSnapshot) {
              final rooms = roomsSnapshot.data ?? [];
              final projectsCount = rooms.length;

              return NestedScrollView(
                headerSliverBuilder: (context, innerBoxIsScrolled) {
                  return [
                    SliverToBoxAdapter(
                      child: SafeArea(
                        bottom: false,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (Navigator.of(context).canPop())
                              Padding(
                                padding: const EdgeInsets.only(left: 16, top: 12, bottom: 4),
                                child: GestureDetector(
                                  onTap: () {
                                    HapticFeedback.lightImpact();
                                    Navigator.of(context).pop();
                                  },
                                  behavior: HitTestBehavior.opaque,
                                  child: Container(
                                    width: 36,
                                    height: 36,
                                    decoration: BoxDecoration(
                                      color: context.themeColors.surfaceHighlight,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: context.themeColors.borderSubtle),
                                    ),
                                    child: Icon(
                                      LucideIcons.arrowLeft,
                                      size: 18,
                                      color: context.themeColors.textPrimary,
                                    ),
                                  ),
                                ),
                              )
                            else
                              const SizedBox(height: 16),
                            const SizedBox(height: 8),
                            BentoProfileHeader(
                              profile: profile,
                              projectsCount: projectsCount,
                              followerCount: followerCount,
                              isOwnProfile: isOwnProfile,
                              isFollowing: _isFollowing,
                              isTogglingFollow: _isTogglingFollow,
                              onToggleFollow: _toggleFollow,
                              onLaunchUrl: _launchSocialUrl,
                            ),
                            const SizedBox(height: 16),
                          ],
                        ),
                      ),
                    ),
                    SliverPersistentHeader(
                      pinned: true,
                      delegate: _SliverAppBarDelegate(
                        TabBar(
                          controller: _tabController,
                          labelColor: context.themeColors.textPrimary,
                          unselectedLabelColor: context.themeColors.textTertiary,
                          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
                          indicatorColor: const Color(0xFF1D9BF0),
                          indicatorWeight: 3.5,
                          indicatorSize: TabBarIndicatorSize.label,
                          dividerColor: context.themeColors.borderSubtle,
                          isScrollable: false,
                          tabs: [
                            const Tab(text: 'Proof of Work'),
                            const Tab(text: 'Updates'),
                            Tab(text: 'Rooms (${rooms.length})'),
                          ],
                        ),
                        context.themeColors.background,
                      ),
                    ),
                  ];
                },
                body: TabBarView(
                  controller: _tabController,
                  children: [
                    // Tab 1: Living Proof of Work Ledger
                    ProofOfWorkLedger(
                      userId: widget.userId,
                      isOwnProfile: isOwnProfile,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),

                    // Tab 2: Updates Tab
                    FutureBuilder<List<Map<String, dynamic>>>(
                      future: _postsFuture,
                      builder: (context, postsSnapshot) {
                        if (postsSnapshot.connectionState == ConnectionState.waiting) {
                          return Center(
                            child: CircularProgressIndicator(color: context.themeColors.primary500),
                          );
                        }
                        final posts = postsSnapshot.data ?? [];
                        final hasPinned = profile['pinned_update'] != null;

                        if (posts.isEmpty && !hasPinned) {
                          return Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.messageSquare, size: 36, color: context.themeColors.textTertiary),
                                const SizedBox(height: 12),
                                Text(
                                  'No updates yet',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: context.themeColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Product milestones and logs from this builder will appear here.',
                                  style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary),
                                ),
                              ],
                            ),
                          );
                        }

                        return ListView(
                          padding: EdgeInsets.zero,
                          children: [
                            if (hasPinned) ...[
                              Padding(
                                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                                child: Row(
                                  children: [
                                    Icon(LucideIcons.pin, size: 12, color: context.themeColors.primary500),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Pinned Milestone',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: context.themeColors.textPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              FeedUpdateCard(
                                heroTagPrefix: "pubprof_pinned_",
                                update: profile['pinned_update'],
                              ),
                              Divider(height: 1, color: context.themeColors.borderSubtle),
                            ],
                            ...posts.map((post) {
                              return FeedUpdateCard(
                                heroTagPrefix: "pubprof_",
                                update: post,
                              );
                            }),
                            const SizedBox(height: 40),
                          ],
                        );
                      },
                    ),

                    // Tab 3: Rooms Tab
                    if (rooms.isEmpty)
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.layoutGrid, size: 36, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No rooms yet',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: context.themeColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Active project rooms will appear here.',
                              style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: rooms.length,
                        itemBuilder: (context, index) {
                          final room = rooms[index];
                          return GestureDetector(
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => RoomDetailScreen(
                                  roomId: room['id'],
                                  title: room['title'] ?? 'Untitled',
                                ),
                              ),
                            ),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: context.themeColors.surfaceHighlight.withOpacity(0.4),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: context.themeColors.borderSubtle),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          room['title'] ?? 'Untitled',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13.5,
                                            color: context.themeColors.textPrimary,
                                          ),
                                        ),
                                      ),
                                      Icon(LucideIcons.chevronRight, size: 14, color: context.themeColors.textTertiary),
                                    ],
                                  ),
                                  if (room['description'] != null && room['description'].toString().isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      room['description'],
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        color: context.themeColors.textSecondary,
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          )
                              .animate()
                              .fadeIn(duration: 300.ms, delay: (index * 40).ms)
                              .slideY(begin: 0.08, end: 0, curve: Curves.easeOutQuad);
                        },
                      ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar, this.backgroundColor);

  final TabBar _tabBar;
  final Color backgroundColor;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: backgroundColor,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
