import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';
import 'chat_thread_screen.dart';
import '../widgets/skeleton_loaders.dart';
import '../services/cache_service.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Map<String, dynamic>> _conversations = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchConversations();
  }

  Future<void> _fetchConversations() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    // 1. Load from cache
    try {
      final cachedData = await CacheService().getJson(CacheService.keyChatInbox);
      if (cachedData != null && cachedData is List && _conversations.isEmpty) {
        if (mounted) {
          setState(() {
            _conversations = List<Map<String, dynamic>>.from(cachedData);
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      print('Cache read error: $e');
    }

    if (_conversations.isEmpty) {
      setState(() => _isLoading = true);
    }

    try {
      // Fetch all rooms where the current user is the builder or an observer
      final builderRooms = await Supabase.instance.client
          .from('rooms')
          .select('id, title, is_private')
          .eq('builder_id', userId);

      final observerRoomsRes = await Supabase.instance.client
          .from('room_observers')
          .select('room_id, rooms(id, title, is_private)')
          .eq('observer_id', userId);

      final allRooms = <Map<String, dynamic>>[];

      for (final r in builderRooms as List) {
        allRooms.add(Map<String, dynamic>.from(r));
      }
      for (final r in observerRoomsRes as List) {
        final room = r['rooms'];
        if (room != null) allRooms.add(Map<String, dynamic>.from(room));
      }

      // Deduplicate rooms
      final seen = <String>{};
      final uniqueRooms = allRooms.where((r) => seen.add(r['id']?.toString() ?? '')).toList();

      // For each room, fetch the last message
      final conversations = <Map<String, dynamic>>[];
      for (final room in uniqueRooms) {
        final roomId = room['id']?.toString() ?? '';
        try {
          final msgs = await Supabase.instance.client
              .from('room_messages')
              .select('*, users:sender_id(name, avatar)')
              .eq('room_id', roomId)
              .order('created_at', ascending: false)
              .limit(1);

          final lastMessage = (msgs as List).isNotEmpty ? Map<String, dynamic>.from(msgs.first) : null;
          conversations.add({
            ...room,
            'last_message': lastMessage,
          });
        } catch (_) {
          conversations.add({...room, 'last_message': null});
        }
      }

      // Sort: rooms with messages first, then by recency
      conversations.sort((a, b) {
        final aTime = a['last_message']?['created_at'] as String?;
        final bTime = b['last_message']?['created_at'] as String?;
        if (aTime == null && bTime == null) return 0;
        if (aTime == null) return 1;
        if (bTime == null) return -1;
        return bTime.compareTo(aTime);
      });

      if (mounted) {
        setState(() {
          _conversations = conversations;
          _isLoading = false;
        });
        // 2. Save fresh data to cache
        CacheService().saveJson(CacheService.keyChatInbox, conversations);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Messages',
                          style: TextStyle(
                            fontSize: 23,
                            fontWeight: FontWeight.w900,
                            color: context.themeColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        Text(
                          'Conversations with your collaborators',
                          style: TextStyle(
                            fontSize: 11,
                            color: context.themeColors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _fetchConversations,
                    icon: Icon(LucideIcons.refreshCw, color: context.themeColors.textSecondary, size: 17),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Body
            Expanded(
              child: _isLoading
                  ? const MessageInboxSkeleton()
                  : _conversations.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _fetchConversations,
                          color: context.themeColors.primary500,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: _conversations.length,
                            separatorBuilder: (_, __) => Divider(
                              color: context.themeColors.borderSubtle,
                              height: 1,
                              indent: 72,
                            ),
                            itemBuilder: (context, index) {
                              return _buildConversationTile(_conversations[index]);
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConversationTile(Map<String, dynamic> convo) {
    final roomId = convo['id']?.toString() ?? '';
    final roomTitle = convo['title'] ?? 'Room';
    final isPrivate = convo['is_private'] == true;
    final lastMessage = convo['last_message'] as Map<String, dynamic>?;
    final lastContent = lastMessage?['content'] as String?;
    final lastSender = (lastMessage?['users'] as Map?)? ['name'] as String?;
    final lastTime = lastMessage?['created_at'] as String?;
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final isMyMessage = lastMessage?['sender_id']?.toString() == currentUserId;
    
    final isUnread = lastMessage != null && !isMyMessage && lastMessage['read_at'] == null;

    return GestureDetector(
      onTap: () async {
        HapticFeedback.selectionClick();
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ChatThreadScreen(
              roomId: roomId,
              roomTitle: roomTitle,
            ),
          ),
        );
        _fetchConversations();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
        color: Colors.transparent,
        child: Row(
          children: [
            // Room icon / avatar
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: context.themeColors.primary500.withOpacity(0.15),
                border: Border.all(color: context.themeColors.primary500.withOpacity(0.25)),
              ),
              child: Center(
                child: Icon(
                  isPrivate ? LucideIcons.lock : LucideIcons.messageCircle,
                  color: context.themeColors.primary500,
                  size: 18,
                ),
              ),
            ),
            const SizedBox(width: 14),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          roomTitle,
                          style: TextStyle(
                            fontWeight: isUnread ? FontWeight.w900 : FontWeight.w700,
                            fontSize: 12,
                            color: isUnread ? context.themeColors.textPrimary : context.themeColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (lastTime != null)
                        Text(
                          timeago.format(DateTime.parse(lastTime)),
                          style: TextStyle(
                            fontSize: 11,
                            color: isUnread ? context.themeColors.primary500 : context.themeColors.textTertiary,
                            fontWeight: isUnread ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    lastContent != null
                        ? '${isMyMessage ? 'You' : (lastSender ?? 'Them')}: $lastContent'
                        : 'Tap to start chatting',
                    style: TextStyle(
                      fontSize: 11,
                      color: isUnread 
                          ? context.themeColors.textPrimary 
                          : (lastContent != null ? context.themeColors.textSecondary : context.themeColors.textTertiary),
                      fontStyle: lastContent == null ? FontStyle.italic : FontStyle.normal,
                      fontWeight: isUnread ? FontWeight.w600 : FontWeight.normal,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),
            if (isUnread)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  color: context.themeColors.primary500,
                  shape: BoxShape.circle,
                ),
              ),
            Icon(LucideIcons.chevronRight, size: 13, color: context.themeColors.textTertiary),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: context.themeColors.primary500.withOpacity(0.1),
              ),
              child: Icon(LucideIcons.messageCircle, size: 40, color: context.themeColors.primary500),
            ),
            const SizedBox(height: 24),
            Text(
              'No conversations yet',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: context.themeColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'When you accept a Bounty Match or join a Room, your conversation threads will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: context.themeColors.textTertiary,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
