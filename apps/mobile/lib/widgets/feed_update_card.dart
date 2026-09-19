import 'package:flutter/material.dart';
import 'dart:math' as dart_math;
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'toast_notification.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/github.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:flutter/services.dart';
import '../screens/public_profile_screen.dart';
import '../screens/update_thread_screen.dart';
import '../screens/create_update_screen.dart';

class FeedUpdateCard extends StatefulWidget {
  final Map<String, dynamic> update;
  final bool isThreadView;
  final VoidCallback? onReplyTap;

  const FeedUpdateCard({
    super.key, 
    required this.update,
    this.isThreadView = false,
    this.onReplyTap,
  });

  @override
  State<FeedUpdateCard> createState() => _FeedUpdateCardState();
}

class _FeedUpdateCardState extends State<FeedUpdateCard> {
  bool _isHovered = false;
  bool _isDeleted = false; // To hide the card immediately after deletion
  
  // Emojis
  Map<String, int> _emojiCounts = {};
  bool _hasReacted = false;
  String? _userReactionId;
  String? _userReactionEmoji;
  
  // Replies
  int _replyCount = 0;

  // Avatar Pill
  List<String> _reactionAvatars = [];
  
  // Bookmarks & Views
  int _viewCount = 0;
  bool _hasRecordedView = false;
  bool _hasBookmarked = false;

  @override
  void initState() {
    super.initState();
    _viewCount = widget.update['view_count'] ?? 0;
    _fetchReactions();
    _checkBookmarkStatus();
  }

  void _showRepostOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          color: context.themeColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: context.themeColors.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: context.themeColors.primary500.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(LucideIcons.edit, color: context.themeColors.primary500),
                ),
                title: Text('Repost with thoughts', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
                subtitle: Text('Create a new update and quote this one', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13)),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CreateUpdateScreen(
                        quotedUpdateId: widget.update['id'],
                        quotedUpdateContent: widget.update['content'],
                        quotedUpdateAuthor: widget.update['users']?['name'],
                      )
                    )
                  );
                },
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: context.themeColors.primary500.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(LucideIcons.repeat, color: context.themeColors.primary500),
                ),
                title: Text('Repost instantly', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
                subtitle: Text('Instantly share this to your feed', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13)),
                onTap: () {
                  Navigator.pop(context);
                  _handleInstantRepost();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleInstantRepost() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      String generateUuid() {
        final random = dart_math.Random();
        String hex() => random.nextInt(256).toRadixString(16).padLeft(2, '0');
        return '${hex()}${hex()}${hex()}${hex()}-${hex()}${hex()}-4${hex().substring(1)}-${(random.nextInt(4) + 8).toRadixString(16)}${hex().substring(1)}-${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}';
      }

      final userProfile = await Supabase.instance.client.from('users').select('name').eq('id', userId).maybeSingle();
      await Supabase.instance.client.from('updates').insert({
        'id': generateUuid(),
        'room_id': widget.update['room_id'],
        'author_id': userId,
        'author_name': userProfile?['name'] ?? 'Builder',
        'update_type': widget.update['update_type'] ?? 'insight',
        'content': '', // Satisfies the not-null constraint for instant reposts
        'repost_id': widget.update['id'],
        'is_repost_only': true,
      });

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          barrierColor: Colors.black.withOpacity(0.4),
          builder: (context) => Center(
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.8, end: 1.0),
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOutCubic,
              builder: (context, scale, child) {
                final safeOpacity = ((scale - 0.8) * 5).clamp(0.0, 1.0);
                return Transform.scale(
                  scale: scale,
                  child: Opacity(
                    opacity: safeOpacity,
                    child: Material(
                      color: Colors.transparent,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                        decoration: BoxDecoration(
                          color: context.themeColors.surface,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: context.themeColors.borderSubtle, width: 1),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 24, offset: const Offset(0, 12))],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(color: context.themeColors.primary500.withOpacity(0.15), shape: BoxShape.circle),
                              child: Icon(LucideIcons.check, color: context.themeColors.primary500, size: 40),
                            ),
                            const SizedBox(height: 16),
                            Text('Reposted!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        );
        await Future.delayed(const Duration(milliseconds: 1200));
        if (mounted) Navigator.of(context).pop();
      }
    } catch (e) {
      print('Instant repost failed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to repost: $e', style: const TextStyle(color: Colors.white)),
            backgroundColor: Colors.red.shade600,
          ),
        );
      }
    }
  }

  Future<void> _checkBookmarkStatus() async {
    final updateId = widget.update['id'];
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (updateId == null || userId == null) return;

    try {
      final res = await Supabase.instance.client
          .from('update_bookmarks')
          .select('id')
          .eq('update_id', updateId)
          .eq('user_id', userId)
          .maybeSingle();

      if (mounted && res != null) {
        setState(() => _hasBookmarked = true);
      }
    } catch (_) {}
  }

  Future<void> _toggleBookmark() async {
    final updateId = widget.update['id'];
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (updateId == null || userId == null) return;

    final wasBookmarked = _hasBookmarked;
    setState(() => _hasBookmarked = !wasBookmarked);

    try {
      if (wasBookmarked) {
        await Supabase.instance.client
            .from('update_bookmarks')
            .delete()
            .eq('update_id', updateId)
            .eq('user_id', userId);
      } else {
        await Supabase.instance.client
            .from('update_bookmarks')
            .insert({
              'update_id': updateId,
              'user_id': userId,
            });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _hasBookmarked = wasBookmarked); // Rollback
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to bookmark: $e')));
      }
    }
  }

  Future<void> _recordView() async {
    if (_hasRecordedView) return;
    _hasRecordedView = true;

    final updateId = widget.update['id'];
    if (updateId == null) return;

    try {
      // Optimistic UI update
      if (mounted) {
        setState(() => _viewCount += 1);
      }
      // Direct SQL RPC call to increment view_count could be better, but for now we update it
      // Since we don't have an RPC, we will fetch, increment and save.
      final res = await Supabase.instance.client
          .from('updates')
          .select('view_count')
          .eq('id', updateId)
          .single();
          
      final currentViews = res['view_count'] ?? 0;
      await Supabase.instance.client
          .from('updates')
          .update({'view_count': currentViews + 1})
          .eq('id', updateId);
    } catch (_) {}
  }

  Future<void> _fetchReactions() async {
    final updateId = widget.update['id'];
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (updateId == null) return;

    try {
      final res = await Supabase.instance.client
          .from('reactions')
          .select('id, type, text, observer_id, users(avatar)')
          .eq('update_id', updateId);

      final reactions = List<Map<String, dynamic>>.from(res);
      
      int replies = 0;
      Map<String, int> emojis = {};
      bool reacted = false;
      String? reactionId;
      String? reactionEmoji;
      Set<String> uniqueAvatars = {};

      for (var r in reactions) {
        if (r['type'] == 'reply') {
          replies++;
        } else {
          final emoji = r['text'] as String;
          emojis[emoji] = (emojis[emoji] ?? 0) + 1;
          
          if (userId != null && r['observer_id'] == userId) {
            reacted = true;
            reactionId = r['id'];
            reactionEmoji = emoji;
          }
        }
        
        final user = r['users'] as Map<String, dynamic>?;
        if (user != null && user['avatar'] != null && user['avatar'].toString().isNotEmpty) {
           uniqueAvatars.add(user['avatar'].toString());
        }
      }

      if (mounted) {
        setState(() {
          _replyCount = replies;
          _emojiCounts = emojis;
          _hasReacted = reacted;
          _userReactionId = reactionId;
          _userReactionEmoji = reactionEmoji;
          _reactionAvatars = uniqueAvatars.take(3).toList(); // Show max 3 in pill
        });
      }
    } catch (_) {}
  }

  void _showEmojiPicker() {
    final updateId = widget.update['id'];
    final roomId = widget.update['room_id'];
    if (updateId == null || roomId == null) return;

    final emojis = ['👍', '❤️', '🚀', '👀', '🎉', '🔥'];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: context.themeColors.surfaceHighlight,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: context.themeColors.border),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('React', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 24),
              Wrap(
                spacing: 16,
                runSpacing: 16,
                alignment: WrapAlignment.center,
                children: emojis.map((emoji) => GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                    _submitReaction(emoji);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      shape: BoxShape.circle,
                    ),
                    child: Text(emoji, style: const TextStyle(fontSize: 24)),
                  ),
                )).toList(),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitReaction(String emoji) async {
    final updateId = widget.update['id'];
    final roomId = widget.update['room_id'];
    final userId = Supabase.instance.client.auth.currentUser?.id;
    final userName = Supabase.instance.client.auth.currentUser?.userMetadata?['name'] ?? 'Unknown';
    if (updateId == null || userId == null) return;

    try {
      // If already reacted with the exact same emoji, toggle it off
      if (_hasReacted && _userReactionId != null && _userReactionEmoji == emoji) {
        setState(() {
          _hasReacted = false;
          _userReactionEmoji = null;
          _emojiCounts[emoji] = (_emojiCounts[emoji] ?? 1) - 1;
          if (_emojiCounts[emoji] == 0) _emojiCounts.remove(emoji);
        });
        await Supabase.instance.client.from('reactions').delete().eq('id', _userReactionId!);
        _fetchReactions();
        return;
      }
      
      // If already reacted with a DIFFERENT emoji, delete old one
      if (_hasReacted && _userReactionId != null) {
        if (_userReactionEmoji != null) {
          setState(() {
            _emojiCounts[_userReactionEmoji!] = (_emojiCounts[_userReactionEmoji!] ?? 1) - 1;
            if (_emojiCounts[_userReactionEmoji!] == 0) _emojiCounts.remove(_userReactionEmoji!);
          });
        }
        await Supabase.instance.client.from('reactions').delete().eq('id', _userReactionId!);
      }
      
      setState(() {
        _hasReacted = true;
        _userReactionEmoji = emoji;
        _emojiCounts[emoji] = (_emojiCounts[emoji] ?? 0) + 1;
      });
      
      final newReaction = {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'room_id': roomId,
        'update_id': updateId,
        'observer_id': userId,
        'observer_name': userName,
        'type': 'emoji',
        'text': emoji,
      };
      
      await Supabase.instance.client.from('reactions').insert(newReaction);
      _fetchReactions(); // Refresh state for actual DB IDs
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showComments() {
    final updateId = widget.update['id'];
    final roomId = widget.update['room_id'];
    if (updateId == null || roomId == null) return;
    
    if (widget.isThreadView && widget.onReplyTap != null) {
      widget.onReplyTap!();
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => UpdateThreadScreen(update: widget.update),
      ),
    ).then((_) => _fetchReactions());
  }

  static Map<String, Map<String, dynamic>> updateTypeUI = {
    'decision': {'label': 'Decision', 'color': AppTheme.primary400, 'bg': AppTheme.primary500, 'icon': '⚡'},
    'scrap': {'label': 'Scrap', 'color': Colors.redAccent, 'bg': Colors.red, 'icon': '🗑'},
    'pivot': {'label': 'Pivot', 'color': Colors.orangeAccent, 'bg': Colors.orange, 'icon': '🔄'},
    'blocker': {'label': 'Blocker', 'color': Colors.redAccent, 'bg': Colors.red, 'icon': '🚧'},
    'insight': {'label': 'Insight', 'color': Colors.amber, 'bg': Colors.amberAccent, 'icon': '💡'},
    'open_question': {'label': 'Open question', 'color': Colors.lightBlue, 'bg': Colors.blue, 'icon': '❓'},
    'shipped': {'label': 'Shipped', 'color': Colors.greenAccent, 'bg': Colors.green, 'icon': '🚀'},
    'crossroad': {'label': 'Crossroad', 'color': AppTheme.primary400, 'bg': AppTheme.primary500, 'icon': '🔀'},
  };

  String _extractUrl(String text, String domain) {
    final RegExp urlRegExp = RegExp(r'(https?://(?:www\.)?' + RegExp.escape(domain) + r'[^\s]+)');
    final match = urlRegExp.firstMatch(text);
    return match?.group(0) ?? '';
  }

  Future<void> _deleteUpdate() async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.themeColors.surface,
        title: Text('Delete Update', style: TextStyle(color: context.themeColors.textPrimary)),
        content: Text('Are you sure you want to delete this? This action cannot be undone.', style: TextStyle(color: context.themeColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: TextStyle(color: context.themeColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      )
    );

    if (confirm != true) return;

    try {
      await Supabase.instance.client.from('updates').delete().eq('id', widget.update['id']);
      if (mounted) {
        setState(() => _isDeleted = true);
      }
    } catch (e) {
      if (mounted) {
        ToastService.show(context, 'Failed to delete: $e', isError: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isDeleted) return const SizedBox.shrink();

    final update = widget.update;
    final isAuthor = update['author_id'] == Supabase.instance.client.auth.currentUser?.id;
    final users = update['users'] ?? {};
    final rooms = update['rooms'] ?? {};
    final authorName = update['author_name'] ?? users['name'] ?? 'Unknown Author';
    final content = update['content'] ?? '';
    final roomTitle = rooms['title'] ?? 'Unknown Room';
    final createdAt = DateTime.tryParse(update['created_at'] ?? '') ?? DateTime.now();
    final updateType = update['update_type']?.toString().toLowerCase();
    
    // Fallback UI data if type matches
    final typeUI = updateTypeUI[updateType];
    final isLaunch = (rooms['update_count'] == 1);

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        _showComments();
      },
      onTapDown: (_) => setState(() => _isHovered = true),
      onTapUp: (_) => setState(() => _isHovered = false),
      onTapCancel: () => setState(() => _isHovered = false),
      child: Dismissible(
        key: Key('dismissible-${update['id']}'),
        background: Container(
          color: context.themeColors.primary500.withOpacity(0.8),
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.only(left: 24),
          child: const Icon(LucideIcons.bookmark, color: Colors.white, size: 28),
        ),
        secondaryBackground: Container(
          color: Colors.blueAccent.withOpacity(0.8),
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 24),
          child: const Icon(LucideIcons.messageCircle, color: Colors.white, size: 28),
        ),
        confirmDismiss: (direction) async {
          HapticFeedback.mediumImpact();
          if (direction == DismissDirection.startToEnd) {
            _toggleBookmark();
          } else {
            _showComments();
          }
          return false; // Don't actually remove the item
        },
        child: VisibilityDetector(
          key: Key('update-card-${update['id']}'),
          onVisibilityChanged: (info) {
            if (info.visibleFraction > 0.5) {
              _recordView();
            }
          },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: _isHovered ? Colors.white.withOpacity(0.02) : Colors.transparent,
            border: Border(bottom: BorderSide(color: context.themeColors.borderSubtle, width: 1)),
          ),
          child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar (Left Column)
            GestureDetector(
              onTap: () {
                final authorId = update['author_id'] ?? users['id'];
                if (authorId != null) {
                  Navigator.push(context, MaterialPageRoute(
                    builder: (context) => PublicProfileScreen(userId: authorId),
                  ));
                }
              },
              child: Builder(
                builder: (context) {
                  String finalAvatarUrl = users['avatar']?.toString() ?? '';
                  if (finalAvatarUrl.isEmpty || !finalAvatarUrl.startsWith('http')) {
                    final seed = users['id']?.toString() ?? authorName;
                    finalAvatarUrl = 'https://api.dicebear.com/9.x/micah/png?seed=${Uri.encodeComponent(seed)}&backgroundColor=transparent';
                  }

                  return Hero(
                    tag: 'avatar-${update['id']}-${update['author_id'] ?? users['id']}',
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: context.themeColors.surfaceHighlight,
                      ),
                      child: ClipOval(
                        child: CachedNetworkImage(
                          imageUrl: finalAvatarUrl,
                          fit: BoxFit.cover,
                          placeholder: (c, url) => Container(color: context.themeColors.surfaceHighlight),
                          errorWidget: (c, e, s) => Center(
                            child: Text(
                              authorName.substring(0, 1).toUpperCase(),
                              style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            
            // Content (Right Column)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Row: Name, Handle, Time
                  Row(
                    children: [
                      Flexible(
                        child: GestureDetector(
                          onTap: () {
                            final authorId = update['author_id'] ?? users['id'];
                            if (authorId != null) {
                              Navigator.push(context, MaterialPageRoute(
                                builder: (context) => PublicProfileScreen(userId: authorId),
                              ));
                            }
                          },
                          child: Text(
                            authorName,
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: context.themeColors.textPrimary),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                      if (users['is_verified_expert'] == true) ...[
                        const SizedBox(width: 4),
                        Icon(LucideIcons.badgeCheck, color: context.themeColors.primary500, size: 12),
                      ],
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          '@${authorName.toLowerCase().replaceAll(' ', '')}',
                          style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text('·', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12)),
                      const SizedBox(width: 4),
                      Text(
                        timeago.format(createdAt, locale: 'en_short'),
                        style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12),
                      ),
                      if (isAuthor) ...[
                        const Spacer(),
                        InkWell(
                          onTap: _deleteUpdate,
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(4.0),
                            child: Icon(LucideIcons.trash2, size: 14, color: context.themeColors.textTertiary.withOpacity(0.5)),
                          ),
                        ),
                      ],
                    ],
                  ),
                  
                  // Context / Tag (e.g. Launched, specific room)
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      if (typeUI != null) ...[
                        Text(typeUI['icon'], style: const TextStyle(fontSize: 11)),
                        const SizedBox(width: 4),
                        Text(
                          typeUI['label'],
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: typeUI['color']),
                        ),
                        const SizedBox(width: 8),
                      ],
                      if (isLaunch) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(color: context.themeColors.primary500.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                          child: Text('LAUNCHED', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: context.themeColors.primary500, letterSpacing: 0.5)),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        child: Text(
                          'in $roomTitle',
                          style: TextStyle(color: context.themeColors.primary500, fontSize: 12, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 6),
                  
                  // Text Content
                  if (content.isNotEmpty && !content.contains('figma.com'))
                    MarkdownBody(
                      data: content.toString().replaceAllMapped(
                        RegExp(r'@\[(.*?)\]\((.*?)\)'), 
                        (match) => '[**@${match.group(1)}**](/profile/${match.group(2)})'
                      ),
                      onTapLink: (text, href, title) {
                        if (href != null && href.startsWith('/profile/')) {
                          final userId = href.split('/').last;
                          Navigator.push(context, MaterialPageRoute(
                            builder: (context) => PublicProfileScreen(userId: userId),
                          ));
                        } else if (href != null) {
                          launchUrl(Uri.parse(href), mode: LaunchMode.externalApplication);
                        }
                      },
                      styleSheet: MarkdownStyleSheet(
                        p: TextStyle(fontSize: 13, color: context.themeColors.textPrimary, height: 1.4, letterSpacing: 0),
                        h1: TextStyle(fontSize: 16, color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, height: 1.2),
                        h2: TextStyle(fontSize: 14, color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, height: 1.2),
                        h3: TextStyle(fontSize: 13, color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, height: 1.2),
                        listBullet: TextStyle(color: context.themeColors.textPrimary),
                        code: TextStyle(fontFamily: 'monospace', backgroundColor: Colors.transparent, color: context.themeColors.primary400, fontSize: 12),
                        codeblockDecoration: BoxDecoration(color: context.themeColors.surfaceHighlight, borderRadius: BorderRadius.circular(8)),
                      ),
                    ),

                  // Quoted / Reposted Content
                  if (update['original_update'] != null)
                    Builder(
                      builder: (context) {
                        final origUpdate = update['original_update'];
                        final origUser = origUpdate['users'] ?? {};
                        final origName = origUser['name'] ?? 'Unknown Author';
                        final origUsername = '@${origName.toLowerCase().replaceAll(' ', '')}';
                        final origAvatar = origUser['avatar'] ?? 'https://api.dicebear.com/9.x/micah/png?seed=${Uri.encodeComponent(origName)}&backgroundColor=transparent';
                        final origContent = origUpdate['content']?.toString() ?? '';

                        return Container(
                          margin: const EdgeInsets.only(top: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: context.themeColors.borderSubtle),
                            color: context.themeColors.surfaceHighlight.withOpacity(0.3),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  // Original Author Avatar
                                  Container(
                                    width: 20,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: context.themeColors.surfaceHighlight,
                                    ),
                                    clipBehavior: Clip.antiAlias,
                                    child: CachedNetworkImage(
                                      imageUrl: origAvatar,
                                      fit: BoxFit.cover,
                                      errorWidget: (c, e, s) => const Icon(LucideIcons.user, size: 12),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Original Author Name
                                  Expanded(
                                    child: Row(
                                      children: [
                                        Text(
                                          origName,
                                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: context.themeColors.textPrimary),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        if (origUser['is_verified_expert'] == true) ...[
                                          const SizedBox(width: 4),
                                          Icon(LucideIcons.badgeCheck, color: context.themeColors.primary500, size: 12),
                                        ],
                                        const SizedBox(width: 4),
                                        Flexible(
                                          child: Text(
                                            origUsername,
                                            style: TextStyle(fontSize: 12, color: context.themeColors.textTertiary),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              if (origContent.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(
                                  origContent,
                                  style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary, height: 1.4),
                                  maxLines: 4,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                              if (origContent.isEmpty) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Icon(LucideIcons.quote, size: 12, color: context.themeColors.textTertiary),
                                    const SizedBox(width: 6),
                                    Text(
                                      origUpdate['update_type'] != null 
                                          ? 'Shared a ${origUpdate['update_type']}'
                                          : 'Reposted update',
                                      style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: context.themeColors.textTertiary),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        );
                      }
                    ),
                  
                  // Figma Embed Simulation
                  if (content.contains('figma.com'))
                    FigmaEmbedWidget(url: _extractUrl(content, 'figma.com')),

                  // Code Snippet block
                  if (update['code_snippet'] != null)
                    Container(
                      margin: const EdgeInsets.only(top: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: context.themeColors.borderSubtle),
                        color: context.themeColors.surfaceHighlight,
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: HighlightView(
                        update['code_snippet'],
                        language: 'dart',
                        theme: githubTheme,
                        padding: const EdgeInsets.all(16),
                        textStyle: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                      ),
                    ),

                  // Uploaded Media Image
                  if (update['media_url'] != null && update['media_url'].toString().isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 12),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: context.themeColors.borderSubtle),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: CachedNetworkImage(
                        imageUrl: update['media_url'],
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          height: 200,
                          color: context.themeColors.surfaceHighlight,
                          child: Center(child: CircularProgressIndicator(color: context.themeColors.primary500)),
                        ),
                        errorWidget: (context, error, stackTrace) => Container(
                          height: 200,
                          color: context.themeColors.surfaceHighlight,
                          child: Center(child: Icon(LucideIcons.imageOff, color: context.themeColors.textTertiary)),
                        ),
                      ),
                    ),

                  const SizedBox(height: 12),
                  
                  // X-Style Icon Action Bar
                  Wrap(
                    spacing: 0,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            _showComments();
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: _buildReactionGhostButton(LucideIcons.messageCircle, _replyCount > 0 ? _replyCount.toString() : null),
                        ),
                      ),
                      if (_reactionAvatars.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InkWell(
                            onTap: _showEmojiPicker,
                            borderRadius: BorderRadius.circular(12),
                            child: _buildAvatarPill(),
                          ),
                        ),
                      // Reaction Chips (Wrap layout to prevent horizontal scroll)
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (_emojiCounts.isNotEmpty)
                            ..._emojiCounts.entries.map((entry) {
                              final isSelected = _userReactionEmoji == entry.key;
                              return Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: () {
                                     HapticFeedback.lightImpact();
                                     _submitReaction(entry.key);
                                  },
                                  borderRadius: BorderRadius.circular(16),
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    curve: Curves.easeOutCubic,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: isSelected 
                                          ? context.themeColors.primary500.withOpacity(0.15) 
                                          : context.themeColors.surfaceHighlight.withOpacity(0.3),
                                      border: Border.all(
                                        color: isSelected 
                                            ? context.themeColors.primary500.withOpacity(0.5) 
                                            : context.themeColors.borderSubtle.withOpacity(0.5),
                                        width: isSelected ? 1.5 : 1.0,
                                      ),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(entry.key, style: const TextStyle(fontSize: 13)), // Larger emoji
                                        const SizedBox(width: 6),
                                        Text(
                                          '${entry.value}',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: isSelected 
                                                ? context.themeColors.primary500 
                                                : context.themeColors.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }),
                            
                          // Add Reaction Button
                          InkResponse(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              _showEmojiPicker();
                            },
                            radius: 20,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: EdgeInsets.only(
                                right: _emojiCounts.isEmpty ? 16 : 8, 
                                left: 4, 
                                top: 4, 
                                bottom: 4
                              ),
                              child: Icon(
                                _emojiCounts.isEmpty ? LucideIcons.heart : LucideIcons.plusCircle, 
                                size: 16, 
                                color: context.themeColors.textTertiary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            _showRepostOptions();
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: _buildReactionGhostButton(LucideIcons.repeat, null),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            Share.share('Check out this update on Patchwork: https://www.joinpatchwork.xyz/update/${widget.update['id']}');
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: _buildReactionGhostButton(LucideIcons.share2, null),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: InkWell(
                          onTap: () {},
                          borderRadius: BorderRadius.circular(8),
                          child: _buildReactionGhostButton(LucideIcons.barChart2, _viewCount > 0 ? _viewCount.toString() : null),
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          _toggleBookmark();
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: _buildReactionGhostButton(
                          _hasBookmarked ? LucideIcons.bookmarkMinus : LucideIcons.bookmark, 
                          null, 
                          isActive: _hasBookmarked,
                          noRightPadding: true,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      ),
      ),
    );
  }

  Widget _buildReactionGhostButton(IconData icon, String? count, {bool isActive = false, bool noRightPadding = false}) {
    final color = isActive ? context.themeColors.primary500 : context.themeColors.textTertiary;
    return Padding(
      padding: EdgeInsets.only(right: noRightPadding ? 8 : 12, left: 8, top: 8, bottom: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          if (count != null) ...[
            const SizedBox(width: 6),
            Text(count, style: TextStyle(fontSize: 11, color: color)),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatarPill() {
    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.blueAccent,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.blueAccent.withOpacity(0.3),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Icon(LucideIcons.arrowUp, color: Colors.white, size: 12),
          const SizedBox(width: 6),
          SizedBox(
            width: (_reactionAvatars.length * 12.0) + 4.0, // Proper width calculation
            height: 16,
            child: Stack(
              clipBehavior: Clip.none,
              children: List.generate(_reactionAvatars.length, (i) {
                // Reverse the rendering order so the first avatar is on top
                final index = _reactionAvatars.length - 1 - i;
                return Positioned(
                  left: index * 12.0, // Space them by 12px
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.blueAccent, width: 1.5),
                      color: Colors.white,
                    ),
                    child: ClipOval(
                      child: CachedNetworkImage(
                        imageUrl: _reactionAvatars[index],
                        fit: BoxFit.cover,
                        placeholder: (c, u) => Container(color: Colors.white24),
                        errorWidget: (c, e, s) => Container(color: Colors.white24),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class FigmaEmbedWidget extends StatefulWidget {
  final String url;
  const FigmaEmbedWidget({super.key, required this.url});

  @override
  State<FigmaEmbedWidget> createState() => _FigmaEmbedWidgetState();
}

class _FigmaEmbedWidgetState extends State<FigmaEmbedWidget> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      );
    
    if (widget.url.isNotEmpty) {
      _controller.loadRequest(Uri.parse(widget.url));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.url.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 300,
      margin: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.themeColors.border),
        color: context.themeColors.surface,
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            Center(child: CircularProgressIndicator(color: context.themeColors.primary500)),
        ],
      ),
    );
  }
}
