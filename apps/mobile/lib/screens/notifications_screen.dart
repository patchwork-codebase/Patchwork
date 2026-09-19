import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'public_profile_screen.dart';

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
        .select('*, actor:users!actor_id(name, avatar, is_verified_expert)')
        .eq('user_id', user.id)
        .order('created_at', ascending: false);
    
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> _markAsRead(String id) async {
    try {
      await Supabase.instance.client
          .from('notifications')
          .update({'read': true})
          .eq('id', id);
      setState(() {
        _notificationsFuture = _fetchNotifications();
      });
    } catch (e) {
      // Silently fail or log
    }
  }
  
  Future<void> _markAllAsRead() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    try {
      await Supabase.instance.client
          .from('notifications')
          .update({'read': true})
          .eq('user_id', user.id)
          .eq('read', false);
      setState(() {
        _notificationsFuture = _fetchNotifications();
      });
    } catch (e) {
      // Silently fail or log
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.checkCheck, color: context.themeColors.primary500, size: 20),
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
                return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
              }
              if (snapshot.hasError) {
                return const Center(child: Text('Failed to load notifications.', style: TextStyle(color: Colors.redAccent)));
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
                          border: Border.all(color: Colors.white.withOpacity(0.05)),
                        ),
                        child: Icon(LucideIcons.bellRing, size: 48, color: context.themeColors.textTertiary),
                      ),
                      const SizedBox(height: 24),
                      Text('You\'re all caught up!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                      const SizedBox(height: 8),
                      Text('No new notifications right now.', style: TextStyle(color: context.themeColors.textSecondary)),
                    ],
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOutQuad),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                itemCount: notifications.length,
                itemBuilder: (context, index) {
                  final notif = notifications[index];
                  final isRead = notif['read'] == true;
                  final type = notif['type'] ?? 'unknown';
                  final actor = notif['actor'] ?? {};
                  final metadata = notif['metadata'] ?? {};
                  final createdAt = DateTime.tryParse(notif['created_at'] ?? '') ?? DateTime.now();

                  // Determine Icon and Message
                  IconData notifIcon = LucideIcons.bell;
                  Color notifColor = context.themeColors.textSecondary;
                  Widget messageWidget = const SizedBox.shrink();

                  if (type == 'reaction') {
                    final rType = metadata['reaction_type'];
                    if (rType == 'reply') {
                      notifIcon = LucideIcons.messageCircle;
                      notifColor = Colors.blueAccent;
                      messageWidget = RichText(
                        text: TextSpan(
                          style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary, height: 1.4),
                          children: [
                            TextSpan(text: '${actor['name'] ?? 'Someone'}', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                            const TextSpan(text: ' replied to your update in '),
                            TextSpan(text: metadata['room_title'] ?? 'a room', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                            const TextSpan(text: '.\n\n"'),
                            TextSpan(text: metadata['reaction_text'] ?? '', style: const TextStyle(fontStyle: FontStyle.italic)),
                            const TextSpan(text: '"'),
                          ],
                        ),
                      );
                    } else {
                      notifIcon = LucideIcons.heart;
                      notifColor = Colors.redAccent;
                      messageWidget = RichText(
                        text: TextSpan(
                          style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary, height: 1.4),
                          children: [
                            TextSpan(text: '${actor['name'] ?? 'Someone'}', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                            const TextSpan(text: ' reacted with '),
                            TextSpan(text: metadata['reaction_text'] ?? rType, style: const TextStyle(fontSize: 16)),
                            const TextSpan(text: ' to your update in '),
                            TextSpan(text: metadata['room_title'] ?? 'a room', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                            const TextSpan(text: '.'),
                          ],
                        ),
                      );
                    }
                  } else if (type == 'room_follow') {
                    notifIcon = LucideIcons.eye;
                    notifColor = context.themeColors.primary400;
                    messageWidget = RichText(
                      text: TextSpan(
                        style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary, height: 1.4),
                        children: [
                          TextSpan(text: '${actor['name'] ?? 'Someone'}', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                          const TextSpan(text: ' started observing your room '),
                          TextSpan(text: metadata['room_title'] ?? '', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                          const TextSpan(text: '.'),
                        ],
                      ),
                    );
                  }

                  return GestureDetector(
                    onTap: () {
                      if (!isRead) _markAsRead(notif['id']);
                      // Optional: Navigate to reference
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isRead ? Colors.white.withOpacity(0.01) : Colors.white.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isRead ? Colors.white.withOpacity(0.05) : context.themeColors.primary500.withOpacity(0.4),
                          width: isRead ? 1 : 1.5,
                        ),
                        boxShadow: isRead ? null : [
                          BoxShadow(color: context.themeColors.primary500.withOpacity(0.1), blurRadius: 10)
                        ],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Actor Avatar
                          GestureDetector(
                            onTap: () {
                              if (notif['actor_id'] != null) {
                                Navigator.push(context, MaterialPageRoute(
                                  builder: (context) => PublicProfileScreen(userId: notif['actor_id']),
                                ));
                              }
                            },
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: context.themeColors.surfaceHighlight,
                                border: Border.all(color: context.themeColors.borderSubtle),
                                image: actor['avatar'] != null && actor['avatar'].toString().isNotEmpty
                                    ? DecorationImage(image: NetworkImage(actor['avatar']), fit: BoxFit.cover)
                                    : null,
                              ),
                              child: (actor['avatar'] == null || actor['avatar'].toString().isEmpty)
                                  ? Center(child: Text((actor['name'] ?? '?').substring(0, 1).toUpperCase(), style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)))
                                  : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Content
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(notifIcon, size: 14, color: isRead ? context.themeColors.textTertiary : notifColor),
                                    const SizedBox(width: 6),
                                    Text(
                                      timeago.format(createdAt),
                                      style: TextStyle(fontSize: 12, fontWeight: isRead ? FontWeight.normal : FontWeight.bold, color: isRead ? context.themeColors.textTertiary : context.themeColors.primary400),
                                    ),
                                    const Spacer(),
                                    if (!isRead)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: context.themeColors.primary500,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                messageWidget,
                              ],
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(duration: 300.ms, delay: (index * 40).ms).slideX(begin: 0.1, end: 0, curve: Curves.easeOut),
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
