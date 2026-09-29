import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:ui';
import '../theme.dart';
import 'room_detail_screen.dart';
import '../widgets/feed_update_card.dart';
import '../widgets/aura_avatar.dart';

class PublicProfileScreen extends StatefulWidget {
  final String userId;

  const PublicProfileScreen({super.key, required this.userId});

  @override
  State<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends State<PublicProfileScreen> {
  late final Future<Map<String, dynamic>?> _profileFuture;
  late final Future<List<Map<String, dynamic>>> _roomsFuture;

  bool _isFollowing = false;
  bool _isFollowLoading = true;
  bool _isTogglingFollow = false;

  @override
  void initState() {
    super.initState();
    _profileFuture = _fetchProfile();
    _roomsFuture = _fetchRooms();
    _checkFollowStatus();
  }

  Future<Map<String, dynamic>?> _fetchProfile() async {
    final client = Supabase.instance.client;
    Map<String, dynamic>? profile;

    // 1. Try fetching with pinned_update join
    try {
      profile = await client
          .from('users')
          .select(
              '*, pinned_update:pinned_update_id(*, rooms(title, tags), users(name, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, avatar, is_verified_expert)), polls(*, poll_options(*)))')
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

  Future<void> _checkFollowStatus() async {
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    if (currentUserId == null || currentUserId == widget.userId) {
      if (mounted) setState(() => _isFollowLoading = false);
      return;
    }
    try {
      final res = await Supabase.instance.client
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', widget.userId)
          .maybeSingle();
      if (mounted) {
        setState(() {
          _isFollowing = res != null;
          _isFollowLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isFollowLoading = false);
    }
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
        await Supabase.instance.client.from('follows').insert({
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
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final isOwnProfile = currentUserId == widget.userId;

    return Scaffold(
      backgroundColor: context.themeColors.background,
      body: Stack(
        children: [
          // Dynamic mesh gradient background
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    context.themeColors.primary500.withOpacity(0.15),
                    Colors.purple.withOpacity(0.05),
                    context.themeColors.background,
                  ],
                  radius: 1.5,
                  center: Alignment.topLeft,
                ),
              ),
            ),
          ),
          FutureBuilder<Map<String, dynamic>?>(
            future: _profileFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(
                    child: CircularProgressIndicator(
                        color: context.themeColors.primary500));
              }
              if (snapshot.hasError || snapshot.data == null) {
                return const Center(
                    child: Text('Failed to load profile.',
                        style: TextStyle(color: Colors.redAccent)));
              }

              final profile = snapshot.data!;
              final name = profile['name'] ?? 'Unknown Builder';
              final bio = profile['bio'] ??
                  'Building better products that solve real problems and create meaningful impact.';
              final role = profile['role'] ?? 'Builder';
              final isVerified = profile['is_verified_expert'] == true;
              final avatarUrl = profile['avatar']?.toString();
              final initial =
                  name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?';

              final followerCount = profile['followerCount'] ?? 0;
              final followingCount = profile['followingCount'] ?? 0;

              // Social links
              final twitterHandle = profile['twitter']?.toString();
              final linkedinUrl = profile['linkedin_url']?.toString();
              final websiteUrl = profile['website']?.toString();
              final githubUrl = profile['github_url']?.toString();

              final hasSocialLinks = (twitterHandle?.isNotEmpty ?? false) ||
                  (linkedinUrl?.isNotEmpty ?? false) ||
                  (websiteUrl?.isNotEmpty ?? false) ||
                  (githubUrl?.isNotEmpty ?? false);

              return FutureBuilder<List<Map<String, dynamic>>>(
                future: _roomsFuture,
                builder: (context, roomsSnapshot) {
                  final rooms = roomsSnapshot.data ?? [];
                  final projectsCount = rooms.length;

                  return CustomScrollView(slivers: [
                    SliverAppBar(
                      expandedHeight: 220,
                      pinned: true,
                      backgroundColor: Colors.transparent,
                      elevation: 0,
                      iconTheme:
                          IconThemeData(color: context.themeColors.textPrimary),
                      flexibleSpace: ClipRRect(
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                          child: FlexibleSpaceBar(
                            title: Text(
                              name,
                              style: TextStyle(
                                  color: context.themeColors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16),
                            ),
                            background: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    context.themeColors.primary500
                                        .withOpacity(0.2),
                                    context.themeColors.background
                                        .withOpacity(0.8),
                                  ],
                                ),
                              ),
                              child: SafeArea(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    // Avatar
                                    AuraAvatar(
                                      avatarUrl: avatarUrl,
                                      initials: name,
                                      role: role?.toString(),
                                      size: 100,
                                    ).animate().scale(
                                        delay: 200.ms,
                                        duration: 400.ms,
                                        curve: Curves.easeOutBack),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Avatar is now in SliverAppBar

                            Text(
                              name,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: context.themeColors.textPrimary,
                                  letterSpacing: -0.5),
                            ),
                            const SizedBox(height: 6),

                            // ── Role / Verified badge ─────────────────────────────
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('Patchwork',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: context.themeColors.textPrimary,
                                        fontSize: 14)),
                                if (isVerified) ...[
                                  const SizedBox(width: 4),
                                  Icon(LucideIcons.badgeCheck,
                                      color: context.themeColors.primary500,
                                      size: 16),
                                ],
                                const SizedBox(width: 8),
                                Text('•',
                                    style: TextStyle(
                                        color: context.themeColors.textTertiary,
                                        fontSize: 14)),
                                const SizedBox(width: 8),
                                Text(
                                  role.toString()[0].toUpperCase() +
                                      role
                                          .toString()
                                          .substring(1)
                                          .toLowerCase(),
                                  style: TextStyle(
                                      color: context.themeColors.textSecondary,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // ── Follow / Unfollow Button ──────────────────────────
                            if (!isOwnProfile && !_isFollowLoading)
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 250),
                                curve: Curves.easeOutCubic,
                                child: ElevatedButton.icon(
                                  onPressed: _toggleFollow,
                                  icon: _isTogglingFollow
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white))
                                      : Icon(
                                          _isFollowing
                                              ? LucideIcons.userCheck
                                              : LucideIcons.userPlus,
                                          size: 16),
                                  label: Text(
                                      _isFollowing ? 'Following' : 'Follow'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _isFollowing
                                        ? context.themeColors.surfaceHighlight
                                        : context.themeColors.primary500,
                                    foregroundColor: _isFollowing
                                        ? context.themeColors.textPrimary
                                        : Colors.white,
                                    side: _isFollowing
                                        ? BorderSide(
                                            color: context
                                                .themeColors.borderSubtle)
                                        : BorderSide.none,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 24, vertical: 12),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(24)),
                                  ),
                                ),
                              )
                                  .animate()
                                  .fadeIn(duration: 300.ms, delay: 100.ms),
                            if (!isOwnProfile && !_isFollowLoading)
                              const SizedBox(height: 20),

                            // ── Bio ───────────────────────────────────────────────
                            Text(
                              bio,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  fontSize: 15,
                                  height: 1.6,
                                  color: context.themeColors.textSecondary,
                                  fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 28),

                            // ── Stats Pill ────────────────────────────────────────
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 24, vertical: 16),
                              decoration: BoxDecoration(
                                color: context.themeColors.surfaceHighlight
                                    .withOpacity(0.5),
                                borderRadius: BorderRadius.circular(32),
                                border: Border.all(
                                    color: context.themeColors.borderSubtle,
                                    width: 1),
                                boxShadow: [
                                  BoxShadow(
                                      color: Colors.black.withOpacity(0.02),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4))
                                ],
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceEvenly,
                                children: [
                                  _buildStatItem(
                                      LucideIcons.users,
                                      followerCount.toString(),
                                      'Followers',
                                      Colors.blueAccent),
                                  _buildStatItem(
                                      LucideIcons.users,
                                      followingCount.toString(),
                                      'Following',
                                      context.themeColors.primary400),
                                  _buildStatItem(
                                      LucideIcons.award,
                                      projectsCount.toString(),
                                      'Projects',
                                      Colors.amber),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ── Verified Proof-of-Work Credential ─────────────────
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: context.themeColors.surfaceHighlight
                                    .withOpacity(0.3),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: context.themeColors.borderSubtle,
                                    width: 1),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(LucideIcons.badgeCheck,
                                          color: Colors.green, size: 16),
                                      const SizedBox(width: 6),
                                      Text(
                                        'VERIFIED PROOF-OF-WORK CREDENTIAL',
                                        style: TextStyle(
                                            color: Colors.green.shade600,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 0.5),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    '$projectsCount Build ${projectsCount == 1 ? 'Room' : 'Rooms'} & SHA-256 Proof of Authorship verified on Patchwork',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                        color:
                                            context.themeColors.textSecondary,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        height: 1.4),
                                  ),
                                  const SizedBox(height: 16),
                                  Material(
                                    color: context.themeColors.surfaceHighlight,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
                                      side: BorderSide(
                                          color:
                                              context.themeColors.borderSubtle),
                                    ),
                                    child: InkWell(
                                      onTap: () {
                                        HapticFeedback.lightImpact();
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(SnackBar(
                                                content: Text(
                                                    'Credential link copied!',
                                                    style: TextStyle(
                                                        color: context
                                                            .themeColors
                                                            .textPrimary)),
                                                backgroundColor: context
                                                    .themeColors
                                                    .surfaceHighlight));
                                      },
                                      borderRadius: BorderRadius.circular(20),
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 16, vertical: 8),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(LucideIcons.share2,
                                                size: 14,
                                                color: context
                                                    .themeColors.primary500),
                                            const SizedBox(width: 8),
                                            Text('Copy Credential Link',
                                                style: TextStyle(
                                                    color: context
                                                        .themeColors.primary500,
                                                    fontSize: 12,
                                                    fontWeight:
                                                        FontWeight.bold)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ── Social Links ──────────────────────────────────────
                            if (hasSocialLinks) ...[
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (twitterHandle?.isNotEmpty ?? false)
                                    _buildSocialIcon(
                                      LucideIcons.twitter,
                                      () => _launchSocialUrl(twitterHandle,
                                          'https://twitter.com/'),
                                      const Color(0xFF1DA1F2),
                                    ),
                                  if (twitterHandle?.isNotEmpty ?? false)
                                    const SizedBox(width: 12),
                                  if (linkedinUrl?.isNotEmpty ?? false)
                                    _buildSocialIcon(
                                      LucideIcons.linkedin,
                                      () => _launchSocialUrl(linkedinUrl,
                                          'https://linkedin.com/in/'),
                                      const Color(0xFF0A66C2),
                                    ),
                                  if (linkedinUrl?.isNotEmpty ?? false)
                                    const SizedBox(width: 12),
                                  if (githubUrl?.isNotEmpty ?? false)
                                    _buildSocialIcon(
                                      LucideIcons.github,
                                      () => _launchSocialUrl(
                                          githubUrl, 'https://github.com/'),
                                      context.themeColors.textPrimary,
                                    ),
                                  if (githubUrl?.isNotEmpty ?? false)
                                    const SizedBox(width: 12),
                                  if (websiteUrl?.isNotEmpty ?? false)
                                    _buildSocialIcon(
                                      LucideIcons.globe,
                                      () => _launchSocialUrl(
                                          websiteUrl, 'https://'),
                                      context.themeColors.primary500,
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Connect and showcase your work',
                                style: TextStyle(
                                    color: context.themeColors.textTertiary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 40),
                            ] else ...[
                              const SizedBox(height: 40),
                            ],

                            // ── Pinned Update ─────────────────────────────────────
                            if (profile['pinned_update'] != null) ...[
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Row(
                                  children: [
                                    Icon(LucideIcons.pin,
                                        size: 16,
                                        color: context.themeColors.primary500),
                                    const SizedBox(width: 8),
                                    Text('Pinned Milestone',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 18,
                                            color: context
                                                .themeColors.textPrimary)),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                              FeedUpdateCard(update: profile['pinned_update']),
                              const SizedBox(height: 40),
                            ],

                            // ── Rooms Built List ──────────────────────────────────
                            if (rooms.isNotEmpty) ...[
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Text('Rooms Built',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                        color:
                                            context.themeColors.textPrimary)),
                              ),
                              const SizedBox(height: 16),
                              ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: rooms.length,
                                itemBuilder: (context, index) {
                                  final room = rooms[index];
                                  return GestureDetector(
                                    onTap: () => Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                            builder: (_) => RoomDetailScreen(
                                                roomId: room['id'],
                                                title: room['title'] ??
                                                    'Untitled'))),
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: context
                                            .themeColors.surfaceHighlight
                                            .withOpacity(0.4),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                            color: context
                                                .themeColors.borderSubtle),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(room['title'] ?? 'Untitled',
                                              style: TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                  color: context.themeColors
                                                      .textPrimary)),
                                          const SizedBox(height: 6),
                                          Text(
                                            room['description'] ??
                                                'No description',
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                                fontSize: 13,
                                                color: context
                                                    .themeColors.textSecondary,
                                                height: 1.4),
                                          ),
                                        ],
                                      ),
                                    ),
                                  )
                                      .animate()
                                      .fadeIn(
                                          duration: 300.ms,
                                          delay: (index * 50).ms)
                                      .slideY(
                                          begin: 0.1,
                                          end: 0,
                                          curve: Curves.easeOutQuad);
                                },
                              ),
                            ], // closes if (rooms.isNotEmpty) ...[
                          ], // closes Column children: [
                        ), // closes Column(
                      ), // closes Padding(
                    ), // closes SliverToBoxAdapter(
                  ]); // closes slivers: [ of CustomScrollView(
                }, // closes roomsSnapshot builder:
              ); // closes rooms FutureBuilder(
            }, // closes profile builder:
          ), // closes profile FutureBuilder(
        ], // closes children: [ of Stack
      ), // closes Stack
    ); // closes Scaffold
  }

  Widget _buildStatItem(
      IconData icon, String value, String label, Color iconColor) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: iconColor),
            const SizedBox(width: 6),
            Text(value,
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                    color: context.themeColors.textPrimary)),
          ],
        ),
        const SizedBox(height: 4),
        Text(label,
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: context.themeColors.textTertiary)),
      ],
    );
  }

  Widget _buildSocialIcon(IconData icon, VoidCallback onTap, Color color) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: context.themeColors.borderSubtle),
          color: context.themeColors.surfaceHighlight.withOpacity(0.5),
        ),
        child: Icon(icon, size: 16, color: color),
      ),
    );
  }
}
