import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:math' as dart_math;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'toast_notification.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import 'poll_widget.dart';
import 'aura_avatar.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/github.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:flutter/services.dart';
import '../screens/public_profile_screen.dart';
import '../screens/update_thread_screen.dart';
import '../screens/create_update_screen.dart';
import 'fullscreen_image_viewer.dart';
import 'rich_link_preview_card.dart';
import 'parallax_container.dart';

class FeedUpdateCard extends StatefulWidget {
  final Map<String, dynamic> update;
  final bool isThreadView;
  final VoidCallback? onReplyTap;
  final VoidCallback? onRefresh;
  final String heroTagPrefix;

  const FeedUpdateCard({
    super.key, 
    required this.update,
    this.isThreadView = false,
    this.onReplyTap,
    this.onRefresh,
    this.heroTagPrefix = '',
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

  String _buildFigmaEmbedUrl(String? explicitUrl, String content) {
    String? rawUrl = explicitUrl;
    if (rawUrl == null || rawUrl.isEmpty) {
      if (content.contains('figma.com')) {
        final regex = RegExp(r'(https?://(?:www\.)?figma\.com/[^\s]+)');
        final match = regex.firstMatch(content);
        if (match != null) {
          rawUrl = match.group(0);
        }
      }
    }
    if (rawUrl == null || rawUrl.isEmpty) return '';
    return 'https://www.figma.com/embed?embed_host=patchwork&url=${Uri.encodeComponent(rawUrl)}';
  }

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
                onTap: () async {
                  Navigator.pop(context);
                  final result = await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CreateUpdateScreen(
                        quotedUpdateId: widget.update['id'],
                        quotedUpdateContent: widget.update['content'],
                        quotedUpdateAuthor: widget.update['users']?['name'],
                      )
                    )
                  );
                  if (result == true && widget.onRefresh != null) {
                    widget.onRefresh!();
                  }
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

  void _showBountyPitchSheet() {
    final TextEditingController pitchController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) {
          final bottomPadding = MediaQuery.of(context).viewInsets.bottom;
          return Container(
            margin: EdgeInsets.only(bottom: bottomPadding),
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border.all(color: Colors.cyanAccent.withOpacity(0.3)),
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.cyanAccent.withOpacity(0.2), shape: BoxShape.circle),
                        child: const Icon(LucideIcons.target, color: Colors.cyanAccent, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Text('Apply to Build This', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Pitch yourself! Why are you the right builder for this idea? Keep it short and sharp.',
                    style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: pitchController,
                    maxLines: 4,
                    style: TextStyle(color: context.themeColors.textPrimary, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: "E.g. I've built 3 Web3 wallets, I can ship the MVP in 2 weeks...",
                      hintStyle: TextStyle(color: context.themeColors.textTertiary),
                      filled: true,
                      fillColor: context.themeColors.surfaceHighlight,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: isSubmitting ? null : () async {
                        final pitch = pitchController.text.trim();
                        if (pitch.isEmpty) return;

                        setSheetState(() => isSubmitting = true);
                        try {
                          final userId = Supabase.instance.client.auth.currentUser?.id;
                          if (userId == null) throw Exception('Not authenticated');

                          final observerId = widget.update['author_id'];
                          
                          await Supabase.instance.client.from('bounty_applications').insert({
                            'update_id': widget.update['id'],
                            'builder_id': userId,
                            'observer_id': observerId,
                            'pitch_text': pitch,
                          });

                          if (mounted) {
                            Navigator.pop(sheetContext);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Pitch submitted successfully! 🚀')),
                            );
                          }
                        } catch (e) {
                          setSheetState(() => isSubmitting = false);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to submit pitch: $e')),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.cyan,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: isSubmitting 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Submit Pitch', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
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
      
      final userId = Supabase.instance.client.auth.currentUser?.id;
      
      // 1. Insert into new page_views table for funnel tracking
      await Supabase.instance.client.from('page_views').insert({
        'viewer_id': userId,
        'target_type': 'update',
        'target_id': updateId,
      });

      // 2. Legacy view_count increment
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
    if (updateId == null) return;

    final emojis = ['🔥', '🇳🇬', '🚀', '🙌🏾', '🥁', '💯'];

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
                ).animate()
                 .scale(delay: (emojis.indexOf(emoji) * 50).ms, duration: 600.ms, curve: Curves.elasticOut)
                 .rotate(begin: -0.1, end: 0, duration: 600.ms, curve: Curves.elasticOut)).toList().cast<Widget>(),
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
    final roomId = widget.update['room_id'] ?? widget.update['rooms']?['id'];
    final userId = Supabase.instance.client.auth.currentUser?.id;
    final userName = Supabase.instance.client.auth.currentUser?.userMetadata?['name'] ?? 'Unknown';
    if (updateId == null || userId == null) return;

    // Backup state for rollback
    final previousHasReacted = _hasReacted;
    final previousReactionId = _userReactionId;
    final previousReactionEmoji = _userReactionEmoji;
    final previousEmojiCounts = Map<String, int>.from(_emojiCounts);

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
        'id': DateTime.now().millisecondsSinceEpoch.toString() + '_' + (userId ?? ''),
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
      // Rollback on failure
      if (mounted) {
        setState(() {
          _hasReacted = previousHasReacted;
          _userReactionId = previousReactionId;
          _userReactionEmoji = previousReactionEmoji;
          _emojiCounts.clear();
          _emojiCounts.addAll(previousEmojiCounts);
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to react: $e')));
      }
    }
  }

  void _showComments() {
    final originalUpdate = widget.update['original_update'];
    final rawContent = (widget.update['content'] ?? '').toString();
    final isPureRepost = originalUpdate != null && (widget.update['is_repost_only'] == true || rawContent.trim().isEmpty);
    final targetUpdate = (isPureRepost && originalUpdate is Map<String, dynamic>)
        ? originalUpdate
        : widget.update;
    final updateId = targetUpdate['id'] ?? widget.update['id'];
    if (updateId == null) return;
    
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
    'spotlight': {'label': 'Observer Spotlight', 'color': Colors.purpleAccent, 'bg': Colors.purple, 'icon': '🌟'},
    'rfb': {'label': 'Request For Builder', 'color': Colors.cyanAccent, 'bg': Colors.cyan, 'icon': '🎯'},
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
      // Direct database deletion as fallback for edge function issues
      final updateId = widget.update['id'];
      
      // Optionally try to delete media if present, ignoring errors
      final mediaUrls = widget.update['media_urls'] as List?;
      final mediaUrl = widget.update['media_url'] as String?;
      
      if (mediaUrls != null && mediaUrls.isNotEmpty) {
         try {
            for (var url in mediaUrls) {
               final path = Uri.parse(url).pathSegments.last;
               await Supabase.instance.client.storage.from('updates_media').remove([path]);
            }
         } catch (_) {}
      } else if (mediaUrl != null && mediaUrl.isNotEmpty) {
         try {
            final path = Uri.parse(mediaUrl).pathSegments.last;
            await Supabase.instance.client.storage.from('updates_media').remove([path]);
         } catch (_) {}
      }

      await Supabase.instance.client.from('updates').delete().eq('id', updateId);

      if (mounted) {
        setState(() => _isDeleted = true);
        ToastService.show(context, 'Update deleted successfully');
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
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final rawContent = (update['content'] ?? '').toString();
    final originalUpdate = update['original_update'];
    final isPureRepost = originalUpdate != null && (update['is_repost_only'] == true || rawContent.trim().isEmpty);
    final isQuoteRepost = originalUpdate != null && !isPureRepost;

    final reposterId = update['author_id'] ?? update['users']?['id'];
    final reposterName = update['author_name'] ?? update['users']?['name'] ?? 'Builder';

    final Map<String, dynamic> activeUpdate = isPureRepost ? Map<String, dynamic>.from(originalUpdate) : update;
    final users = activeUpdate['users'] ?? {};
    final rooms = update['rooms'] ?? activeUpdate['rooms'] ?? {};
    final authorName = activeUpdate['author_name'] ?? users['name'] ?? 'Unknown Author';
    final content = (activeUpdate['content'] ?? '').toString();
    final createdAt = DateTime.tryParse(activeUpdate['created_at'] ?? '') ?? DateTime.now();
    final updateType = activeUpdate['update_type']?.toString().toLowerCase();
    
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
          color: context.themeColors.surfaceHighlight, // Subtle color for premium feel
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 24),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: context.themeColors.primary500.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.reply, color: context.themeColors.primary500, size: 20),
          ),
        ),
        confirmDismiss: (direction) async {
          HapticFeedback.mediumImpact();
          if (direction == DismissDirection.startToEnd) {
            _toggleBookmark();
          } else {
            // Swipe to Reply / Quote
            final result = await Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => CreateUpdateScreen(
                  quotedUpdateId: widget.update['id'],
                  quotedUpdateContent: widget.update['content'],
                  quotedUpdateAuthor: widget.update['users']?['name'],
                )
              )
            );
            if (result == true && widget.onRefresh != null) {
              widget.onRefresh!();
            }
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
                child: Stack(
          children: [
            if (widget.isThreadView)
              Positioned(
                top: 56, // avatar height + padding
                bottom: 0,
                left: 31, // 16px padding + 15px to center of 32px avatar
                child: Container(
                  width: 2,
                  color: context.themeColors.borderSubtle,
                ),
              ),
            Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _isHovered ? Colors.white.withOpacity(0.02) : Colors.transparent,
              border: widget.isThreadView 
                  ? null 
                  : Border(bottom: BorderSide(color: context.themeColors.borderSubtle, width: 1)),
            ),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Pure Retweet Header (Twitter/X style)
              if (isPureRepost) ...[
                Padding(
                  padding: const EdgeInsets.only(left: 52, bottom: 6),
                  child: Row(
                    children: [
                      Icon(LucideIcons.repeat, size: 13, color: context.themeColors.textTertiary),
                      const SizedBox(width: 6),
                      GestureDetector(
                        onTap: () {
                          if (reposterId != null) {
                            Navigator.push(context, MaterialPageRoute(
                              builder: (context) => PublicProfileScreen(userId: reposterId),
                            ));
                          }
                        },
                        child: Text(
                          (reposterId == currentUserId) ? 'You reposted' : '$reposterName reposted',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: context.themeColors.textTertiary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              // Header Row: Avatar, Name, Handle, Time, Trash
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
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
                          tag: '${widget.heroTagPrefix}avatar-${update['id']}-${update['author_id'] ?? users['id']}',
                          child: AuraAvatar(
                            avatarUrl: finalAvatarUrl,
                            initials: authorName,
                            role: users['role']?.toString(),
                            size: 40.0,
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Name, Handle, and Badges
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: GestureDetector(
                                behavior: HitTestBehavior.opaque,
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
                                if (users['organization_logo_url'] != null && users['organization_logo_url'].toString().trim().isNotEmpty) ...[
                                  const SizedBox(width: 4),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(2),
                                    child: Image.network(
                                      users['organization_logo_url'],
                                      width: 12,
                                      height: 12,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                                    ),
                                  ),
                                ],
                            ],
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                (users['username'] != null && users['username'].toString().trim().isNotEmpty)
                                    ? '@${users['username'].toString().trim().replaceAll('@', '')}'
                                    : (users['twitter'] != null && users['twitter'].toString().trim().isNotEmpty)
                                        ? (users['twitter'].toString().trim().startsWith('@') ? users['twitter'].toString().trim() : '@${users['twitter'].toString().trim()}')
                                        : '@${authorName.toLowerCase().replaceAll(' ', '')}',
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
                          ],
                        ),
                        // Badges Row
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            if (typeUI != null) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                decoration: BoxDecoration(
                                  border: Border.all(color: typeUI['color'].withOpacity(0.4)),
                                  borderRadius: BorderRadius.circular(4),
                                  color: typeUI['color'].withOpacity(0.05),
                                ),
                                child: Text(
                                  typeUI['label'],
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: typeUI['color']),
                                ),
                              ),
                              const SizedBox(width: 6),
                            ],
                            if (isLaunch) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                decoration: BoxDecoration(color: context.themeColors.primary500.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                                child: Text('LAUNCH', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: context.themeColors.primary500)),
                              ),
                              const SizedBox(width: 6),
                            ],
                            if (rooms['title'] != null)
                              Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                  decoration: BoxDecoration(color: context.themeColors.textPrimary, borderRadius: BorderRadius.circular(4)),
                                  child: Text('In ${rooms['title']}', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.surface)),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (isAuthor)
                    InkWell(
                      onTap: _deleteUpdate,
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Icon(LucideIcons.trash2, size: 16, color: context.themeColors.textTertiary.withOpacity(0.5)),
                      ),
                    ),
                ],
              ),
              
              if (content.isNotEmpty) const SizedBox(height: 12),
                  
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

                  // Poll Widget
                  if (activeUpdate['polls'] != null && (activeUpdate['polls'] as List).isNotEmpty)
                    PollWidget(poll: (activeUpdate['polls'] as List).first),

                  // Quoted Content (Only for quote reposts with thoughts)
                  if (isQuoteRepost)
                    Builder(
                      builder: (context) {
                        final origUpdate = update['original_update'];
                        final origUser = origUpdate['users'] ?? {};
                        final origName = origUser['name'] ?? 'Unknown Author';
                        final origUsername = (origUser['username'] != null && origUser['username'].toString().trim().isNotEmpty)
                            ? '@${origUser['username'].toString().trim().replaceAll('@', '')}'
                            : (origUser['twitter'] != null && origUser['twitter'].toString().trim().isNotEmpty)
                                ? (origUser['twitter'].toString().trim().startsWith('@') ? origUser['twitter'].toString().trim() : '@${origUser['twitter'].toString().trim()}')
                                : '@${origName.toLowerCase().replaceAll(' ', '')}';
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
                  
                  // Figma Embed
                  if (activeUpdate['figma_url'] != null || content.contains('figma.com'))
                    FigmaEmbedWidget(url: _buildFigmaEmbedUrl(activeUpdate['figma_url']?.toString(), content))
                  else if (RegExp(r'(https?:\/\/[^\s]+)', caseSensitive: false).hasMatch(content))
                    RichLinkPreviewCard(url: RegExp(r'(https?:\/\/[^\s]+)', caseSensitive: false).firstMatch(content)!.group(0)!),

                  // Code Snippet block
                  if (activeUpdate['code_snippet'] != null)
                    Container(
                      margin: const EdgeInsets.only(top: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: context.themeColors.borderSubtle),
                        color: context.themeColors.surfaceHighlight,
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: HighlightView(
                        activeUpdate['code_snippet'],
                        language: 'dart',
                        theme: githubTheme,
                        padding: const EdgeInsets.all(16),
                        textStyle: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                      ),
                    ),

                  // Uploaded Media (Single or Multiple Images)
                  _buildMediaGallery(activeUpdate),

                  const SizedBox(height: 12),
                  
                  // Action Bar (Original Logic & Icons with Improved Layout)
                  Wrap(
                    spacing: 0,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (updateType == 'rfb')
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InkWell(
                            onTap: () {
                               HapticFeedback.mediumImpact();
                               _showBountyPitchSheet();
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                               padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                               decoration: BoxDecoration(color: Colors.cyanAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.cyanAccent.withOpacity(0.3))),
                               child: const Text('🎯 Build This', style: TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold, fontSize: 12)),
                            )
                          ),
                        ),
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
                      // Reaction Chips
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (_emojiCounts.isNotEmpty)
                            ..._emojiCounts.entries.where((entry) => 
                                ['sharp', 'pushback', 'tellmemore'].contains(entry.key.toLowerCase()) || entry.key.length <= 4
                            ).map((entry) {
                              final isSelected = _userReactionEmoji == entry.key;
                              return Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: () {
                                     HapticFeedback.lightImpact();
                                     _submitReaction(entry.key);
                                  },
                                  borderRadius: BorderRadius.circular(16),
                                  child: AnimatedScale(
                                    scale: isSelected ? 1.08 : 1.0,
                                    duration: const Duration(milliseconds: 200),
                                    curve: Curves.elasticOut,
                                    child: Container(
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
                                        Text(
                                          entry.key == 'sharp' ? '🎯 Sharp' 
                                            : entry.key == 'pushback' ? '🤔 Pushback' 
                                            : entry.key == 'tellmemore' ? '💡 Tell me more' 
                                            : entry.key, 
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)
                                        ),
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
                            // ignore: deprecated_member_use
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
            ), // Container
          ], // Stack children
        ), // Stack
      ), // VisibilityDetector
      ), // Dismissible
    ); // GestureDetector
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

  Widget _buildMediaGallery(Map<String, dynamic> update) {
    List<String> images = [];

    if (update['media_urls'] != null) {
      if (update['media_urls'] is List) {
        images = (update['media_urls'] as List)
            .map((e) => e.toString().trim())
            .where((s) => s.isNotEmpty)
            .toList();
      }
    }

    // Fallback to legacy single media_url if media_urls is absent or empty
    if (images.isEmpty && update['media_url'] != null && update['media_url'].toString().trim().isNotEmpty) {
      images = [update['media_url'].toString().trim()];
    }

    if (images.isEmpty) return const SizedBox.shrink();

    final updateId = update['id']?.toString() ?? 'unknown';

    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: ParallaxContainer(
        maxTilt: 0.1,
        enableShadows: true,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: context.themeColors.borderSubtle),
              borderRadius: BorderRadius.circular(16),
            ),
            clipBehavior: Clip.antiAlias,
            child: _buildGalleryLayout(images, updateId),
          ),
        ),
      ),
    );
  }

  Widget _buildGalleryLayout(List<String> images, String updateId) {
    if (images.length == 1) {
      return GestureDetector(
        onTap: () => _openGalleryViewer(images, 0, updateId),
        child: Hero(
          tag: '${widget.heroTagPrefix}media-$updateId-0',
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 360),
            child: _buildSingleImageTile(images[0]),
          ),
        ),
      );
    }

    if (images.length == 2) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: Row(
          children: [
            Expanded(child: _buildInteractiveTile(images, 0, updateId)),
            const SizedBox(width: 3),
            Expanded(child: _buildInteractiveTile(images, 1, updateId)),
          ],
        ),
      );
    }

    if (images.length == 3) {
      return AspectRatio(
        aspectRatio: 16 / 10,
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: _buildInteractiveTile(images, 0, updateId),
            ),
            const SizedBox(width: 3),
            Expanded(
              flex: 2,
              child: Column(
                children: [
                  Expanded(child: _buildInteractiveTile(images, 1, updateId)),
                  const SizedBox(height: 3),
                  Expanded(child: _buildInteractiveTile(images, 2, updateId)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // 4 or more images -> 2x2 grid
    return AspectRatio(
      aspectRatio: 1,
      child: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Expanded(child: _buildInteractiveTile(images, 0, updateId)),
                const SizedBox(width: 3),
                Expanded(child: _buildInteractiveTile(images, 1, updateId)),
              ],
            ),
          ),
          const SizedBox(height: 3),
          Expanded(
            child: Row(
              children: [
                Expanded(child: _buildInteractiveTile(images, 2, updateId)),
                const SizedBox(width: 3),
                Expanded(child: _buildInteractiveTile(images, 3, updateId)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInteractiveTile(List<String> images, int index, String updateId) {
    final url = images[index];
    final lowerUrl = url.toLowerCase();
    final isVideo = lowerUrl.contains('.mp4') || lowerUrl.contains('.mov');
    final isDoc = lowerUrl.contains('.pdf') || lowerUrl.contains('.doc') || lowerUrl.contains('.txt');

    return GestureDetector(
      onTap: () {
        if (isDoc) {
          launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        } else if (isVideo) {
          // Video handles its own taps for play/pause
        } else {
          _openGalleryViewer(images, index, updateId);
        }
      },
      child: Hero(
        tag: '${widget.heroTagPrefix}media-$updateId-$index',
        child: _buildSingleImageTile(url),
      ),
    );
  }

  Widget _buildSingleImageTile(String url) {
    final lowerUrl = url.toLowerCase();
    final isVideo = lowerUrl.contains('.mp4') || lowerUrl.contains('.mov');
    final isDoc = lowerUrl.contains('.pdf') || lowerUrl.contains('.doc') || lowerUrl.contains('.docx') || lowerUrl.contains('.txt');

    if (isVideo) {
      return _VideoFeedWidget(url: url);
    }

    if (isDoc) {
      return Container(
        color: context.themeColors.surfaceHighlight,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.fileText, size: 48, color: context.themeColors.primary500),
              const SizedBox(height: 8),
              Text('Document Attachment', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Tap to open', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 10)),
            ],
          ),
        ),
      );
    }

    return CachedNetworkImage(
      imageUrl: url,
      width: double.infinity,
      height: double.infinity,
      fit: BoxFit.cover,
      alignment: Alignment.topCenter,
      placeholder: (context, url) => Container(
        color: context.themeColors.surfaceHighlight,
        child: Center(
          child: CircularProgressIndicator(
            color: context.themeColors.primary500,
            strokeWidth: 2,
          ),
        ),
      ),
      errorWidget: (context, error, stackTrace) => Container(
        color: context.themeColors.surfaceHighlight,
        child: Center(
          child: Icon(LucideIcons.imageOff, color: context.themeColors.textTertiary),
        ),
      ),
    );
  }

  void _openGalleryViewer(List<String> images, int initialIndex, String updateId) {
    HapticFeedback.lightImpact();
    Navigator.push(
      context,
      PageRouteBuilder(
        opaque: false,
        pageBuilder: (context, _, __) => FullScreenImageViewer.gallery(
          imageUrls: images,
          initialIndex: initialIndex,
          heroTag: '${widget.heroTagPrefix}media-$updateId',
        ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
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

class _VideoFeedWidget extends StatefulWidget {
  final String url;
  const _VideoFeedWidget({required this.url});

  @override
  _VideoFeedWidgetState createState() => _VideoFeedWidgetState();
}

class _VideoFeedWidgetState extends State<_VideoFeedWidget> {
  late VideoPlayerController _controller;
  bool _initialized = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        if (mounted) {
          setState(() { _initialized = true; });
          _controller.setVolume(0); // Muted by default in feed
          _controller.setLooping(true);
        }
      }).catchError((error) {
        if (mounted) {
          setState(() { _hasError = true; });
        }
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Container(
        color: Colors.black12,
        child: const Center(child: Icon(LucideIcons.videoOff, color: Colors.grey)),
      );
    }
    if (!_initialized) {
      return Container(
        color: Colors.black12,
        child: const Center(child: CircularProgressIndicator()),
      );
    }
    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox.expand(
          child: FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _controller.value.size.width,
              height: _controller.value.size.height,
              child: VideoPlayer(_controller),
            ),
          ),
        ),
        GestureDetector(
          onTap: () {
            setState(() {
              _controller.value.isPlaying ? _controller.pause() : _controller.play();
            });
          },
          child: Container(
            color: Colors.transparent,
            constraints: const BoxConstraints.expand(),
            child: Center(
              child: AnimatedOpacity(
                opacity: _controller.value.isPlaying ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.play, size: 32, color: Colors.white),
                ),
              ),
            ),
          ),
        ),
      ],
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


