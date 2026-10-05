import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'public_profile_screen.dart';
import 'update_thread_screen.dart';
import 'room_detail_screen.dart';
import 'bounty_dashboard_screen.dart';
import 'chat_thread_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<List<Map<String, dynamic>>> _notificationsFuture;

  @override
  void initState() {
    super.initState();
    _notificationsFuture = _fetchNotifications();
  }

  Future<List<Map<String, dynamic>>> _fetchNotifications() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];

    final response = await Supabase.instance.client
        .from('notifications')
        .select('*, actor:users!actor_id(name, avatar, is_verified_expert, organization_logo_url)')
        .eq('user_id', user.id)
        .order('created_at', ascending: false);

    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> _markAsRead(String id) async {
    try {
      await Supabase.instance.client
          .from('notifications')
          .update({'read': true, 'is_read': true}).eq('id', id);
      setState(() {
        _notificationsFuture = _fetchNotifications();
      });
    } catch (e) {
      // Silently fail — column may not exist yet
    }
  }

  Future<void> _markAllAsRead() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    try {
      await Supabase.instance.client
          .from('notifications')
          .update({'read': true, 'is_read': true})
          .eq('user_id', user.id)
          .eq('read', false);
      setState(() {
        _notificationsFuture = _fetchNotifications();
      });
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> _navigateToNotification(Map<String, dynamic> notif) async {
    if (!mounted) return;
    final type = notif['type'] ?? '';
    final metadata = notif['metadata'] ?? {};

    if (type == 'reaction' || type == 'update_posted') {
      final updateId = metadata['update_id']?.toString();
      if (updateId == null || updateId.isEmpty) return;
      try {
        final update = await Supabase.instance.client
            .from('updates')
            .select(
                '*, rooms(title, tags, update_count), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
            .eq('id', updateId)
            .maybeSingle();
        if (update != null && mounted) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => UpdateThreadScreen(update: update),
            ),
          );
        }
      } catch (_) {}
    } else if (type == 'bounty_pitch') {
      // Navigate to the observer's Bounty Dashboard to review and accept/reject the pitch
      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const BountyDashboardScreen(),
          ),
        );
      }
    } else if (type == 'room_follow') {
      final roomId = metadata['room_id']?.toString();
      if (roomId == null || roomId.isEmpty) return;
      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => RoomDetailScreen(
              roomId: roomId,
              title: metadata['room_title']?.toString() ?? 'Room',
            ),
          ),
        );
      }
    } else if (type == 'mention' || type == 'new_message') {
      final roomId = metadata['room_id']?.toString();
      if (roomId == null || roomId.isEmpty) return;
      final roomTitle = metadata['room_title']?.toString() ?? 'Room Chat';
      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ChatThreadScreen(
              roomId: roomId,
              roomTitle: roomTitle,
            ),
          ),
        );
      }
    }
  }

  Future<void> _handleInlineReaction(Map<String, dynamic> notif, String reactionType) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    final roomId = notif['metadata']?['room_id'];
    final updateId = notif['metadata']?['update_id'];
    if (roomId == null || updateId == null) return;

    final reactionId = '$roomId-reaction-$reactionType-${user.id}-${DateTime.now().millisecondsSinceEpoch}';

    try {
      await Supabase.instance.client.from('reactions').insert({
        'id': reactionId,
        'room_id': roomId,
        'update_id': updateId,
        'observer_id': user.id,
        'observer_name': user.userMetadata?['name'] ?? 'Observer',
        'type': reactionType,
        'text': reactionType,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Reaction sent!'), duration: Duration(seconds: 1)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to send reaction'), duration: Duration(seconds: 2)));
      }
    }
  }

  String _formatShortTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${date.day}/${date.month}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Notifications',
            style: TextStyle(
                fontWeight: FontWeight.bold,
                color: context.themeColors.textPrimary)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.checkCheck,
                color: context.themeColors.primary500, size: 17),
            onPressed: _markAllAsRead,
            tooltip: 'Mark all as read',
          ),
        ],
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
          FutureBuilder<List<Map<String, dynamic>>>(
            future: _notificationsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(
                    child: CircularProgressIndicator(
                        color: context.themeColors.primary500));
              }
              if (snapshot.hasError) {
                return const Center(
                    child: Text('Failed to load notifications.',
                        style: TextStyle(color: Colors.redAccent)));
              }

              final notifications = snapshot.data ?? [];
              if (notifications.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.02),
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: Colors.white.withOpacity(0.05)),
                        ),
                        child: Icon(LucideIcons.bellRing,
                            size: 40,
                            color: context.themeColors.textTertiary),
                      ),
                      const SizedBox(height: 24),
                      Text('You\'re all caught up!',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: context.themeColors.textPrimary)),
                      const SizedBox(height: 8),
                      Text('No new notifications right now.',
                          style: TextStyle(
                              color: context.themeColors.textSecondary)),
                    ],
                  )
                      .animate()
                      .fadeIn(duration: 400.ms)
                      .slideY(
                          begin: 0.1,
                          end: 0,
                          curve: Curves.easeOutQuad),
                );
              }

              return ListView.separated(
                separatorBuilder: (context, index) => Divider(
                  color: Colors.white.withOpacity(0.05),
                  height: 1,
                  indent: 16,
                  endIndent: 16,
                ),
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: notifications.length,
                itemBuilder: (context, index) {
                  final notif = notifications[index];
                  final isRead = notif['read'] == true;
                  final type = notif['type'] ?? 'unknown';
                  final actor = notif['actor'] ?? {};
                  final metadata = notif['metadata'] ?? {};
                  final createdAt =
                      DateTime.tryParse(notif['created_at'] ?? '') ??
                          DateTime.now();

                  IconData notifIcon = LucideIcons.bell;
                  Color notifColor = context.themeColors.textSecondary;
                  String actionText = 'sent you a notification';
                  String contextText = '';
                  String? previewText;

                  if (type == 'reaction') {
                    final rType = metadata['reaction_type'];
                    if (rType == 'reply') {
                      notifIcon = LucideIcons.messageCircle;
                      notifColor = context.themeColors.primary500;
                      actionText = 'replied to your update in';
                      contextText = metadata['room_title'] ?? 'a room';
                      previewText = metadata['reaction_text'];
                    } else {
                      notifIcon = LucideIcons.heart;
                      notifColor = Colors.pinkAccent;
                      actionText = 'reacted to your update in';
                      contextText = metadata['room_title'] ?? 'a room';
                      previewText = metadata['reaction_text'] ?? rType;
                    }
                  } else if (type == 'room_follow') {
                    notifIcon = LucideIcons.eye;
                    notifColor = Colors.greenAccent;
                    actionText = 'started following';
                    contextText = metadata['room_title'] ?? 'a room';
                  } else if (type == 'update_posted') {
                    notifIcon = LucideIcons.bellRing;
                    notifColor = Colors.amberAccent;
                    actionText = 'posted a new update in';
                    contextText = metadata['room_title'] ?? 'a room';
                    previewText = metadata['update_text'];
                  } else if (type == 'decision_updated' || type == 'decision') {
                    notifIcon = LucideIcons.fileText;
                    notifColor = Colors.purpleAccent;
                    actionText = 'updated a decision in';
                    contextText = metadata['room_title'] ?? 'a room';
                    previewText = metadata['decision_text'];
                  } else if (type == 'bounty_pitch') {
                    notifIcon = LucideIcons.target;
                    notifColor = Colors.cyanAccent;
                    actionText = 'wants to build your idea!';
                  } else if (type == 'new_message') {
                    notifIcon = LucideIcons.messageCircle;
                    notifColor = Colors.blueAccent;
                    actionText = 'sent a message in';
                    contextText = metadata['room_title'] ?? 'a room';
                    previewText = metadata['message_preview'];
                  } else if (type == 'mention') {
                    notifIcon = LucideIcons.atSign;
                    notifColor = context.themeColors.primary500;
                    actionText = 'mentioned you in';
                    contextText = metadata['room_title'] ?? 'a room';
                    previewText = metadata['message_preview'];
                  }

                  final bool isUpdate = type == 'update_posted';
                  final actorName = actor['name'] ?? 'Someone';

                  return GestureDetector(
                    onTap: () {
                      if (!isRead) _markAsRead(notif['id']);
                      _navigateToNotification(notif);
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      color: isRead
                          ? Colors.transparent
                          : context.themeColors.primary500.withOpacity(0.05),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // GUTTER: Action Icon
                          Container(
                            width: 32,
                            alignment: Alignment.topRight,
                            padding: const EdgeInsets.only(right: 8, top: 4),
                            child: Icon(notifIcon, size: 17, color: notifColor),
                          ),
                          
                          // CONTENT AREA
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Avatar and Header Row
                                Row(
                                  children: [
                                    GestureDetector(
                                      onTap: () {
                                        if (notif['actor_id'] != null) {
                                          Navigator.push(context, MaterialPageRoute(builder: (context) => PublicProfileScreen(userId: notif['actor_id'])));
                                        }
                                      },
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        margin: const EdgeInsets.only(right: 8),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: context.themeColors.surfaceHighlight,
                                          image: actor['avatar'] != null && actor['avatar'].toString().isNotEmpty
                                              ? DecorationImage(image: NetworkImage(actor['avatar']), fit: BoxFit.cover)
                                              : null,
                                        ),
                                        child: (actor['avatar'] == null || actor['avatar'].toString().isEmpty)
                                            ? Center(child: Text(actorName.substring(0, 1).toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold)))
                                            : null,
                                      ),
                                    ),
                                    
                                    Expanded(
                                      child: RichText(
                                        text: TextSpan(
                                          style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary, height: 1.4),
                                          children: [
                                            TextSpan(text: actorName, style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                                            TextSpan(text: ' $actionText '),
                                            if (contextText.isNotEmpty)
                                              TextSpan(text: contextText, style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                
                                // RICH PREVIEW
                                if (previewText != null && previewText.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    previewText,
                                    maxLines: 3,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: context.themeColors.textSecondary.withOpacity(0.9),
                                      height: 1.4,
                                    ),
                                  ),
                                ],

                                // INLINE ACTION BAR (Only for update_posted)
                                if (isUpdate) ...[
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      // Reply
                                      GestureDetector(
                                        onTap: () {
                                          if (!isRead) _markAsRead(notif['id']);
                                          _navigateToNotification(notif);
                                        },
                                        behavior: HitTestBehavior.opaque,
                                        child: Padding(
                                          padding: const EdgeInsets.all(4.0),
                                          child: Row(
                                            children: [
                                              Icon(LucideIcons.messageCircle, size: 13, color: context.themeColors.textTertiary),
                                            ],
                                          ),
                                        ),
                                      ),
                                      
                                      // Repost
                                      GestureDetector(
                                        onTap: () => _handleInlineReaction(notif, 'repost'),
                                        behavior: HitTestBehavior.opaque,
                                        child: Padding(
                                          padding: const EdgeInsets.all(4.0),
                                          child: Row(
                                            children: [
                                              Icon(LucideIcons.repeat, size: 13, color: context.themeColors.textTertiary),
                                            ],
                                          ),
                                        ),
                                      ),
                                      
                                      // Like
                                      GestureDetector(
                                        onTap: () => _handleInlineReaction(notif, 'heart'),
                                        behavior: HitTestBehavior.opaque,
                                        child: Padding(
                                          padding: const EdgeInsets.all(4.0),
                                          child: Row(
                                            children: [
                                              Icon(LucideIcons.heart, size: 13, color: context.themeColors.textTertiary),
                                            ],
                                          ),
                                        ),
                                      ),
                                      
                                      // Bookmark
                                      GestureDetector(
                                        onTap: () => _handleInlineReaction(notif, 'bookmark'),
                                        behavior: HitTestBehavior.opaque,
                                        child: Padding(
                                          padding: const EdgeInsets.all(4.0),
                                          child: Row(
                                            children: [
                                              Icon(LucideIcons.bookmark, size: 13, color: context.themeColors.textTertiary),
                                            ],
                                          ),
                                        ),
                                      ),
                                      
                                      // Spacer for alignment
                                      const SizedBox(width: 16),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                          
                          // TIMESTAMP
                          Container(
                            padding: const EdgeInsets.only(left: 8),
                            child: Text(
                              _formatShortTimeAgo(createdAt),
                              style: TextStyle(
                                fontSize: 11,
                                color: isRead ? context.themeColors.textTertiary : context.themeColors.primary400,
                                fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 300.ms, delay: (index * 40).ms)
                        .slideX(begin: 0.05, end: 0, curve: Curves.easeOut),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}
