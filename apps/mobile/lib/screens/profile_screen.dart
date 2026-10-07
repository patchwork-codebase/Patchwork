import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import 'edit_profile_screen.dart';
import '../widgets/feed_update_card.dart';
import '../widgets/bento_profile_header.dart';
import '../widgets/proof_of_work_ledger.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  late Future<Map<String, dynamic>?> _profileFuture;
  late Future<List<Map<String, dynamic>>> _userPostsFuture;
  late Future<List<Map<String, dynamic>>> _userRepliesFuture;
  late Future<List<Map<String, dynamic>>> _userRepostsFuture;
  late Future<List<Map<String, dynamic>>> _userMediaFuture;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadData();
  }

  void _loadData() {
    _profileFuture = _fetchProfile();
    _userPostsFuture = _fetchUserPosts();
    _userRepliesFuture = _fetchUserReplies();
    _userRepostsFuture = _fetchUserReposts();
    _userMediaFuture = _fetchUserMedia();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>?> _fetchProfile() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return null;

    final client = Supabase.instance.client;
    Map<String, dynamic>? profile;

    try {
      profile = await client
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
    } catch (e) {
      debugPrint('Error loading user profile: $e');
    }

    // Fallback if DB row doesn't exist yet or had error
    profile ??= {
      'id': user.id,
      'name': user.userMetadata?['name'] ?? user.userMetadata?['full_name'] ?? (user.email?.split('@')[0] ?? 'Product Builder'),
      'avatar': user.userMetadata?['avatar'] ?? user.userMetadata?['avatar_url'],
      'username': user.userMetadata?['username'] ?? '',
      'bio': user.userMetadata?['bio'] ?? '',
      'created_at': user.createdAt,
    };

    // Ensure valid name & auto-heal DB if name is missing or 'Unknown Builder'
    final rawName = profile['name']?.toString().trim();
    if (rawName == null || rawName.isEmpty || rawName.toLowerCase() == 'unknown builder') {
      final metaName = user.userMetadata?['name']?.toString().trim() ??
          user.userMetadata?['full_name']?.toString().trim();
      final emailPrefix = user.email?.split('@')[0].trim();
      final resolvedName = (metaName != null && metaName.isNotEmpty && metaName.toLowerCase() != 'unknown builder')
          ? metaName
          : (emailPrefix != null && emailPrefix.isNotEmpty
              ? (emailPrefix[0].toUpperCase() + emailPrefix.substring(1))
              : 'Product Builder');
      profile['name'] = resolvedName;

      Future.microtask(() async {
        try {
          await client.from('users').update({'name': resolvedName}).eq('id', user.id);
        } catch (_) {}
      });
    }

    // Ensure valid avatar & auto-heal DB if avatar has the bugged old cartoon
    final rawAvatar = profile['avatar']?.toString();
    if (rawAvatar != null && rawAvatar.contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg')) {
      final metaAvatar = user.userMetadata?['avatar']?.toString() ?? user.userMetadata?['avatar_url']?.toString();
      final healedAvatar = (metaAvatar != null && metaAvatar.isNotEmpty && !metaAvatar.contains('1791234378920'))
          ? metaAvatar
          : 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg';
      profile['avatar'] = healedAvatar;
      Future.microtask(() async {
        try {
          await client.from('users').update({'avatar': healedAvatar}).eq('id', user.id);
          await client.auth.updateUser(UserAttributes(data: {'avatar': healedAvatar, 'avatar_url': healedAvatar}));
        } catch (_) {}
      });
    }

    try {
      final followersRes = await client.from('follows').select('follower_id').eq('following_id', user.id);
      final followingRes = await client.from('follows').select('following_id').eq('follower_id', user.id);
      final postsRes = await client.from('updates').select('id').eq('author_id', user.id);
      
      profile['followerCount'] = (followersRes as List).length;
      profile['followingCount'] = (followingRes as List).length;
      profile['postsCount'] = (postsRes as List).length;
    } catch (e) {
      profile['followerCount'] = profile['followerCount'] ?? 0;
      profile['followingCount'] = profile['followingCount'] ?? 0;
      profile['postsCount'] = profile['postsCount'] ?? 0;
    }

    return profile;
  }

  Future<List<Map<String, dynamic>>> _fetchUserPosts() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];

    try {
      final response = await Supabase.instance.client
          .from('updates')
          .select('*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
          .eq('author_id', user.id)
          .isFilter('parent_update_id', null)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> _fetchUserReplies() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];

    try {
      final response = await Supabase.instance.client
          .from('updates')
          .select('*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
          .eq('author_id', user.id)
          .not('parent_update_id', 'is', null)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> _fetchUserReposts() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];

    try {
      final response = await Supabase.instance.client
          .from('updates')
          .select('*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
          .eq('author_id', user.id)
          .not('repost_id', 'is', null)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> _fetchUserMedia() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];

    try {
      final response = await Supabase.instance.client
          .from('updates')
          .select('*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
          .eq('author_id', user.id)
          .not('media_url', 'is', null)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      return [];
    }
  }



  Future<void> _launchSocialUrl(String? url, String prefix) async {
    if (url == null || url.trim().isEmpty) return;
    String fullUrl = url.trim();
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
            return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: TextStyle(color: context.themeColors.textPrimary)));
          }

          final profile = snapshot.data;
          if (profile == null) {
            return const Center(child: Text('Failed to load profile.'));
          }

          final followerCount = (profile['followerCount'] as int?) ?? 0;
          final postsCount = (profile['postsCount'] as int?) ?? 0;

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
                            projectsCount: postsCount, // Since it's their own profile, we show posts count for now.
                            followerCount: followerCount,
                            isOwnProfile: true,
                            onEditProfile: () async {
                                final result = await Navigator.of(context).push(
                                  MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                                );
                                if (result == true) {
                                  setState(() {
                                    _loadData();
                                  });
                                }
                            },
                            onLaunchUrl: _launchSocialUrl,
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                    
                    // Tabs: Posts ∨, Replies, Reposts, Media
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
                      isScrollable: true,
                      tabAlignment: TabAlignment.start,
                      tabs: const [
                        Tab(text: 'Posts'),
                        Tab(text: 'Proof of Work'),
                        Tab(text: 'Replies'),
                        Tab(text: 'Reposts'),
                        Tab(text: 'Media'),
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
                // Posts Tab
                FutureBuilder<List<Map<String, dynamic>>>(
                  future: _userPostsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
                    }
                    final posts = snapshot.data ?? [];
                    if (posts.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.messageSquare, size: 34, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No posts yet',
                              style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Updates and project logs will appear here.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11),
                            ),
                          ],
                        ),
                      );
                    }
                    return ListView.separated(
                      padding: EdgeInsets.zero,
                      itemCount: posts.length,
                      separatorBuilder: (context, index) => Divider(height: 1, color: context.themeColors.borderSubtle),
                      itemBuilder: (context, index) {
                        return FeedUpdateCard(heroTagPrefix: "prof_", 
                          update: posts[index],
                          onRefresh: () {
                            setState(() {
                              _userPostsFuture = _fetchUserPosts();
                            });
                          },
                        );
                      },
                    );
                  },
                ),

                // Proof of Work Tab
                ProofOfWorkLedger(
                  userId: Supabase.instance.client.auth.currentUser?.id ?? '',
                  isOwnProfile: true,
                ),
                
                // Replies Tab
                FutureBuilder<List<Map<String, dynamic>>>(
                  future: _userRepliesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
                    }
                    final replies = snapshot.data ?? [];
                    if (replies.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.messageCircle, size: 34, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No replies yet',
                              style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Replies to builder updates will appear here.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11),
                            ),
                          ],
                        ),
                      );
                    }
                    return ListView.separated(
                      padding: EdgeInsets.zero,
                      itemCount: replies.length,
                      separatorBuilder: (context, index) => Divider(height: 1, color: context.themeColors.borderSubtle),
                      itemBuilder: (context, index) {
                        return FeedUpdateCard(heroTagPrefix: "prof_", 
                          update: replies[index],
                          onRefresh: () {
                            setState(() {
                              _userRepliesFuture = _fetchUserReplies();
                            });
                          },
                        );
                      },
                    );
                  },
                ),
                
                // Reposts Tab
                FutureBuilder<List<Map<String, dynamic>>>(
                  future: _userRepostsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
                    }
                    final reposts = snapshot.data ?? [];
                    if (reposts.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.repeat, size: 34, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No reposts yet',
                              style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Milestones reposted will appear here.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11),
                            ),
                          ],
                        ),
                      );
                    }
                    return ListView.separated(
                      padding: EdgeInsets.zero,
                      itemCount: reposts.length,
                      separatorBuilder: (context, index) => Divider(height: 1, color: context.themeColors.borderSubtle),
                      itemBuilder: (context, index) {
                        return FeedUpdateCard(heroTagPrefix: "prof_", 
                          update: reposts[index],
                          onRefresh: () {
                            setState(() {
                              _userRepostsFuture = _fetchUserReposts();
                            });
                          },
                        );
                      },
                    );
                  },
                ),
                
                // Media Tab
                FutureBuilder<List<Map<String, dynamic>>>(
                  future: _userMediaFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
                    }
                    final mediaPosts = snapshot.data ?? [];
                    if (mediaPosts.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.image, size: 34, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No media shared yet',
                              style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Updates with photos or videos will appear here.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11),
                            ),
                          ],
                        ),
                      );
                    }
                    return ListView.separated(
                      padding: EdgeInsets.zero,
                      itemCount: mediaPosts.length,
                      separatorBuilder: (context, index) => Divider(height: 1, color: context.themeColors.borderSubtle),
                      itemBuilder: (context, index) {
                        return FeedUpdateCard(heroTagPrefix: "prof_", 
                          update: mediaPosts[index],
                          onRefresh: () {
                            setState(() {
                              _userMediaFuture = _fetchUserMedia();
                            });
                          },
                        );
                      },
                    );
                  },
                ),
              ],
            ),
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
