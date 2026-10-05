import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import 'edit_profile_screen.dart';
import '../widgets/feed_update_card.dart';
import '../widgets/bento_profile_header.dart';

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
    _tabController = TabController(length: 4, vsync: this);
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
      'name': user.userMetadata?['name'] ?? user.userMetadata?['full_name'] ?? 'Builder',
      'avatar': user.userMetadata?['avatar'] ?? user.userMetadata?['avatar_url'],
      'username': user.userMetadata?['username'] ?? '',
      'bio': user.userMetadata?['bio'] ?? '',
      'created_at': user.createdAt,
    };

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
                      child: Column(
                        children: [
                          const SizedBox(height: 24),
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
                      isScrollable: false,
                      tabs: const [
                        Tab(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Posts'),
                              SizedBox(width: 4),
                              Icon(Icons.keyboard_arrow_down, size: 13),
                            ],
                          ),
                        ),
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

  // Parses text with @mentions and links to display Twitter-like blue text
  Widget _buildRichBio(String bio, BuildContext context) {
    final words = bio.split(' ');
    List<InlineSpan> spans = [];

    for (int i = 0; i < words.length; i++) {
      final word = words[i];
      final isLink = word.contains('medium.com') || word.startsWith('http://') || word.startsWith('https://');
      final isMention = word.startsWith('@');

      if (isLink || isMention) {
        spans.add(
          TextSpan(
            text: '$word ',
            style: const TextStyle(
              color: Color(0xFF1D9BF0), // Signature Twitter Blue
              fontSize: 12,
              height: 1.35,
              fontWeight: FontWeight.normal,
            ),
          ),
        );
      } else {
        spans.add(
          TextSpan(
            text: '$word ',
            style: TextStyle(
              color: context.themeColors.textPrimary,
              fontSize: 12,
              height: 1.35,
              fontWeight: FontWeight.normal,
            ),
          ),
        );
      }
    }

    return RichText(text: TextSpan(children: spans));
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
