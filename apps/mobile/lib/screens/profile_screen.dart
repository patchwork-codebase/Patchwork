import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import 'edit_profile_screen.dart';
import '../widgets/feed_update_card.dart';

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
          .select('*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert)), polls(*, poll_options(*))')
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
          .select('*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert)), polls(*, poll_options(*))')
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
          .select('*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert)), polls(*, poll_options(*))')
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
          .select('*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert)), polls(*, poll_options(*))')
          .eq('author_id', user.id)
          .not('media_url', 'is', null)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      return [];
    }
  }

  String _formatNumber(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 10000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    } else if (count >= 1000) {
      return count.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    }
    return count.toString();
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

          final name = (profile['name'] as String?)?.isNotEmpty == true ? profile['name'] as String : 'Builder';
          final bio = (profile['bio'] as String?) ?? '';
          final city = (profile['city'] as String?) ?? '';
          final avatarUrl = profile['avatar'] as String?;
          final coverUrl = profile['cover_url'] as String?;
          final isVerified = profile['is_verified_expert'] == true;
          
          final followerCount = (profile['followerCount'] as int?) ?? 0;
          final followingCount = (profile['followingCount'] as int?) ?? 0;
          final postsCount = (profile['postsCount'] as int?) ?? 0;

          // Format real joined date from user account
          String joinedText = 'Joined';
          final createdAtStr = profile['created_at'] as String?;
          if (createdAtStr != null) {
            final dt = DateTime.tryParse(createdAtStr);
            if (dt != null) {
              const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ];
              joinedText = 'Joined ${months[dt.month - 1]} ${dt.year}';
            }
          }

          // Handle username/handle format
          String handle = '@${name.toLowerCase().replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '')}';
          if (profile['username'] != null && (profile['username'] as String).trim().isNotEmpty) {
            final u = (profile['username'] as String).trim();
            handle = u.startsWith('@') ? u : '@$u';
          } else if (profile['twitter'] != null && (profile['twitter'] as String).trim().isNotEmpty) {
            final t = (profile['twitter'] as String).trim();
            handle = t.startsWith('@') ? t : '@$t';
          }

          return NestedScrollView(
            headerSliverBuilder: (context, innerBoxIsScrolled) {
              return [
                // Top AppBar with Cover Banner
                SliverAppBar(
                  expandedHeight: 140.0,
                  pinned: true,
                  backgroundColor: context.themeColors.background,
                  elevation: 0,
                  iconTheme: IconThemeData(color: context.themeColors.textPrimary),
                  leading: IconButton(
                    icon: Icon(Icons.arrow_back, color: context.themeColors.textPrimary),
                    onPressed: () {
                      if (Navigator.of(context).canPop()) {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  title: innerBoxIsScrolled ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.themeColors.textPrimary),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.verified, color: Color(0xFF1D9BF0), size: 16),
                        ],
                      ),
                      Text(
                        '${_formatNumber(postsCount)} posts',
                        style: TextStyle(fontSize: 12, color: context.themeColors.textTertiary, fontWeight: FontWeight.normal),
                      ),
                    ],
                  ) : null,
                  actions: [
                    IconButton(
                      icon: Icon(LucideIcons.compass, color: context.themeColors.textPrimary, size: 22),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: Icon(LucideIcons.search, color: context.themeColors.textPrimary, size: 22),
                      onPressed: () {},
                    ),
                  ],
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        color: Colors.grey.shade900,
                        image: DecorationImage(
                          image: (coverUrl != null && coverUrl.isNotEmpty)
                              ? NetworkImage(coverUrl)
                              : const NetworkImage('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                ),
                
                // Profile Information (Avatar, Edit Profile, Bio, Metas, Stats)
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Avatar & Edit Profile Button Row
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            height: 48,
                            padding: const EdgeInsets.only(top: 8, right: 16),
                            alignment: Alignment.topRight,
                            child: OutlinedButton(
                              onPressed: () async {
                                final result = await Navigator.of(context).push(
                                  MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                                );
                                if (result == true) {
                                  setState(() {
                                    _loadData();
                                  });
                                }
                              },
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: context.themeColors.borderSubtle, width: 1.2),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 0),
                                minimumSize: const Size(0, 36),
                                backgroundColor: Colors.transparent,
                              ),
                              child: Text(
                                'Edit profile',
                                style: TextStyle(
                                  color: context.themeColors.textPrimary,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            top: -38,
                            left: 16,
                            child: Container(
                              width: 82,
                              height: 82,
                              decoration: BoxDecoration(
                                color: context.themeColors.surfaceHighlight,
                                shape: BoxShape.circle,
                                border: Border.all(color: context.themeColors.background, width: 4),
                                image: (avatarUrl != null && avatarUrl.isNotEmpty) 
                                  ? DecorationImage(image: NetworkImage(avatarUrl), fit: BoxFit.cover)
                                  : null,
                              ),
                              child: (avatarUrl == null || avatarUrl.isEmpty)
                                  ? Center(
                                      child: Text(
                                        name.isNotEmpty ? name[0].toUpperCase() : 'B',
                                        style: TextStyle(
                                          color: context.themeColors.textPrimary,
                                          fontSize: 30,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                          ),
                        ],
                      ),
                      
                      // Name & Verified Badge & Username
                      Padding(
                        padding: const EdgeInsets.only(left: 16, right: 16, top: 4),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    name,
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w900,
                                      color: context.themeColors.textPrimary,
                                      letterSpacing: -0.4,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (isVerified) ...[
                                  const SizedBox(width: 4),
                                  const Icon(Icons.verified, color: Color(0xFF1D9BF0), size: 20),
                                ],
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              handle,
                              style: TextStyle(
                                fontSize: 15,
                                color: context.themeColors.textTertiary,
                                fontWeight: FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 12),
                      
                      // Rich Bio with highlighted links / mentions
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _buildRichBio(bio, context),
                      ),
                      
                      const SizedBox(height: 12),
                      
                      // Metadata (City / Location, Joined Date)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Wrap(
                          spacing: 12,
                          runSpacing: 6,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            if (city.isNotEmpty)
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(LucideIcons.mapPin, size: 15, color: context.themeColors.textTertiary),
                                  const SizedBox(width: 4),
                                  Text(city, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 14)),
                                ],
                              ),
                            if (profile['website'] != null && (profile['website'] as String).isNotEmpty)
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(LucideIcons.link, size: 15, color: context.themeColors.textTertiary),
                                  const SizedBox(width: 4),
                                  Text(
                                    profile['website'].toString().replaceAll(RegExp(r'https?://'), ''),
                                    style: const TextStyle(color: Color(0xFF1D9BF0), fontSize: 14),
                                  ),
                                ],
                              ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.calendar, size: 15, color: context.themeColors.textTertiary),
                                const SizedBox(width: 4),
                                Text(joinedText, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 14)),
                                const SizedBox(width: 2),
                                Icon(Icons.chevron_right, size: 16, color: context.themeColors.textTertiary),
                              ],
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 14),
                      
                      // Following & Followers count row
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            RichText(
                              text: TextSpan(
                                children: [
                                  TextSpan(
                                    text: '${_formatNumber(followingCount)} ',
                                    style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  TextSpan(
                                    text: 'Following',
                                    style: TextStyle(color: context.themeColors.textTertiary, fontSize: 15),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            RichText(
                              text: TextSpan(
                                children: [
                                  TextSpan(
                                    text: '${_formatNumber(followerCount)} ',
                                    style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  TextSpan(
                                    text: 'Followers',
                                    style: TextStyle(color: context.themeColors.textTertiary, fontSize: 15),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 14),
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
                      labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                      unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 15),
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
                              Icon(Icons.keyboard_arrow_down, size: 16),
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
                            Icon(LucideIcons.messageSquare, size: 40, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No posts yet',
                              style: TextStyle(color: context.themeColors.textSecondary, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Updates and project logs will appear here.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 14),
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
                        return FeedUpdateCard(
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
                            Icon(LucideIcons.messageCircle, size: 40, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No replies yet',
                              style: TextStyle(color: context.themeColors.textSecondary, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Replies to builder updates will appear here.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 14),
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
                        return FeedUpdateCard(
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
                            Icon(LucideIcons.repeat, size: 40, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No reposts yet',
                              style: TextStyle(color: context.themeColors.textSecondary, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Milestones reposted will appear here.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 14),
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
                        return FeedUpdateCard(
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
                            Icon(LucideIcons.image, size: 40, color: context.themeColors.textTertiary),
                            const SizedBox(height: 12),
                            Text(
                              'No media shared yet',
                              style: TextStyle(color: context.themeColors.textSecondary, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Updates with photos or videos will appear here.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 14),
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
                        return FeedUpdateCard(
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
              fontSize: 15,
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
              fontSize: 15,
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
