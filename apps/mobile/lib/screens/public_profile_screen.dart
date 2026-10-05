import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:ui';
import '../theme.dart';
import 'room_detail_screen.dart';
import '../widgets/feed_update_card.dart';
import '../widgets/aura_avatar.dart';
import '../widgets/bento_profile_header.dart';

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
          .select('follower_id')
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
              final followerCount = profile['followerCount'] ?? 0;
              final isOwnProfile = widget.userId == Supabase.instance.client.auth.currentUser?.id;

              return FutureBuilder<List<Map<String, dynamic>>>(
                future: _roomsFuture,
                builder: (context, roomsSnapshot) {
                  final rooms = roomsSnapshot.data ?? [];
                  final projectsCount = rooms.length;

                  return CustomScrollView(slivers: [
                    SliverToBoxAdapter(
                      child: Column(
                        children: [
                          const SizedBox(height: 24),
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
                          const SizedBox(height: 24),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              children: [

                            // ── Pinned Update ─────────────────────────────────────
                            if (profile['pinned_update'] != null) ...[
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Row(
                                  children: [
                                    Icon(LucideIcons.pin,
                                        size: 13,
                                        color: context.themeColors.primary500),
                                    const SizedBox(width: 8),
                                    Text('Pinned Milestone',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15,
                                            color: context
                                                .themeColors.textPrimary)),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                              FeedUpdateCard(heroTagPrefix: "pubprof_", update: profile['pinned_update']),
                              const SizedBox(height: 40),
                            ],

                            // ── Rooms Built List ──────────────────────────────────
                            if (rooms.isNotEmpty) ...[
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Text('Rooms Built',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
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
                                                  fontSize: 13,
                                                  color: context.themeColors
                                                      .textPrimary)),
                                          const SizedBox(height: 6),
                                          Text(
                                            room['description'] ??
                                                'No description',
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                                fontSize: 11,
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
                          ],
                        ),
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
            Icon(icon, size: 11, color: iconColor),
            const SizedBox(width: 6),
            Text(value,
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: context.themeColors.textPrimary)),
          ],
        ),
        const SizedBox(height: 4),
        Text(label,
            style: TextStyle(
                fontSize: 9,
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
        child: Icon(icon, size: 13, color: color),
      ),
    );
  }
}
