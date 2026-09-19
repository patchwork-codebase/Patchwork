import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:cached_network_image/cached_network_image.dart';
import '../theme.dart';
import '../widgets/feed_update_card.dart';

class UpdateThreadScreen extends StatefulWidget {
  final Map<String, dynamic> update;

  const UpdateThreadScreen({
    super.key,
    required this.update,
  });

  @override
  State<UpdateThreadScreen> createState() => _UpdateThreadScreenState();
}

class _UpdateThreadScreenState extends State<UpdateThreadScreen> {
  final TextEditingController _replyController = TextEditingController();
  final FocusNode _replyFocusNode = FocusNode();
  List<Map<String, dynamic>> _replies = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _fetchReplies();
  }

  Future<void> _fetchReplies() async {
    final updateId = widget.update['id'];
    if (updateId == null) return;
    
    try {
      final res = await Supabase.instance.client
          .from('reactions')
          .select('*, users!observer_id(avatar)')
          .eq('update_id', updateId)
          .eq('type', 'reply')
          .order('created_at', ascending: true);

      if (mounted) {
        setState(() {
          _replies = List<Map<String, dynamic>>.from(res);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitReply() async {
    final text = _replyController.text.trim();
    if (text.isEmpty || _isSubmitting) return;

    final userId = Supabase.instance.client.auth.currentUser?.id;
    final userName = Supabase.instance.client.auth.currentUser?.userMetadata?['name'] ?? 'Unknown';
    if (userId == null) return;

    setState(() => _isSubmitting = true);

    try {
      final newReply = {
        'id': DateTime.now().millisecondsSinceEpoch.toString(), // Unique ID
        'room_id': widget.update['room_id'],
        'update_id': widget.update['id'],
        'observer_id': userId,
        'observer_name': userName,
        'type': 'reply',
        'text': text,
      };

      await Supabase.instance.client.from('reactions').insert(newReply);
      _replyController.clear();
      _replyFocusNode.unfocus();
      
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          barrierColor: Colors.black.withOpacity(0.4),
          builder: (context) => Center(
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.8, end: 1.0),
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOutBack,
              builder: (context, scale, child) {
                return Transform.scale(
                  scale: scale,
                  child: Opacity(
                    opacity: (scale - 0.8) * 5, // Fades in quickly
                    child: Material(
                      color: Colors.transparent,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                        decoration: BoxDecoration(
                          color: context.themeColors.surface,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: context.themeColors.borderSubtle, width: 1),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 24, offset: const Offset(0, 12)),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: context.themeColors.primary500.withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(LucideIcons.check, color: context.themeColors.primary500, size: 40),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Reply sent!',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: context.themeColors.textPrimary,
                              ),
                            ),
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
        if (mounted) {
          Navigator.of(context).pop(); // dismiss dialog
          // Don't pop the screen here, unlike create post, you stay on the thread screen when replying!
        }
      }
      
      await _fetchReplies(); // Refresh list
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _replyController.dispose();
    _replyFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final updateAuthor = widget.update['author_name'] ?? widget.update['users']?['name'] ?? 'Unknown';
    final handle = '@${updateAuthor.toLowerCase().replaceAll(' ', '')}';

    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        backgroundColor: context.themeColors.background.withOpacity(0.9),
        elevation: 0,
        title: const Text('Thread', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: context.themeColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Column(
                      children: [
                        // The Parent Post
                        FeedUpdateCard(
                          update: widget.update, 
                          isThreadView: true,
                          onReplyTap: () => _replyFocusNode.requestFocus(),
                        ),
                        
                        // Connector line from parent to first reply (if replies exist)
                        if (_replies.isNotEmpty)
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(left: 31), // Aligns with avatar center (16 + 16/2 approx)
                              width: 2,
                              height: 16,
                              color: context.themeColors.borderSubtle,
                            ),
                          ),
                      ],
                    ),
                  ),
                  
                  // The Replies
                  if (_isLoading)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Center(child: CircularProgressIndicator(color: context.themeColors.primary500)),
                      ),
                    )
                  else if (_replies.isEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Center(
                          child: Text('No replies yet. Start the conversation!', 
                            style: TextStyle(color: context.themeColors.textTertiary),
                          ),
                        ),
                      ),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final reply = _replies[index];
                          final createdAt = DateTime.tryParse(reply['created_at'] ?? '') ?? DateTime.now();
                          final users = reply['users'] ?? {};
                          final avatar = users['avatar']?.toString();
                          
                          // Determine if this reply is from the author of the original update
                          final isAuthor = reply['observer_id'] == widget.update['author_id'];

                          return IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Left column: Avatar and Thread Line
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Column(
                                    children: [
                                      // Avatar
                                      Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: context.themeColors.surfaceHighlight,
                                          border: Border.all(color: context.themeColors.borderSubtle, width: 1),
                                        ),
                                        child: ClipOval(
                                          child: avatar != null && avatar.isNotEmpty
                                              ? CachedNetworkImage(
                                                  imageUrl: avatar,
                                                  fit: BoxFit.cover,
                                                  placeholder: (c, url) => Container(color: context.themeColors.surfaceHighlight),
                                                  errorWidget: (c, e, s) => Container(color: context.themeColors.surfaceHighlight),
                                                )
                                              : Center(
                                                  child: Text(
                                                    reply['observer_name'].toString().substring(0, 1).toUpperCase(),
                                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: context.themeColors.textPrimary),
                                                  ),
                                                ),
                                        ),
                                      ),
                                      // Thread Line (unless it's the last item)
                                      if (index < _replies.length - 1)
                                        Expanded(
                                          child: Container(
                                            width: 2,
                                            color: context.themeColors.borderSubtle,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                
                                // Right column: Content
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.only(bottom: 16, right: 16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(
                                              reply['observer_name'], 
                                              style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary, fontSize: 14),
                                            ),
                                            if (isAuthor) ...[
                                              const SizedBox(width: 6),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: context.themeColors.primary500.withOpacity(0.15),
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Text('AUTHOR', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: context.themeColors.primary500)),
                                              ),
                                            ],
                                            const SizedBox(width: 6),
                                            Text(
                                              '@${reply['observer_name'].toString().toLowerCase().replaceAll(' ', '')}',
                                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12),
                                            ),
                                            const Spacer(),
                                            Text(timeago.format(createdAt, locale: 'en_short'), style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12)),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(reply['text'], style: TextStyle(color: context.themeColors.textPrimary, fontSize: 14, height: 1.4)),
                                        
                                        const SizedBox(height: 12),
                                        // Mini reply/like row for comments
                                        Row(
                                          children: [
                                            Icon(LucideIcons.messageCircle, size: 14, color: context.themeColors.textTertiary),
                                            const SizedBox(width: 16),
                                            Icon(LucideIcons.heart, size: 14, color: context.themeColors.textTertiary),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                        childCount: _replies.length,
                      ),
                    ),
                ],
              ),
            ),
            
            // X-Style Reply Input Area
            Container(
              padding: EdgeInsets.only(
                left: 16, 
                right: 16, 
                top: 12, 
                bottom: MediaQuery.of(context).viewInsets.bottom > 0 ? 12 : 24,
              ),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: context.themeColors.border)),
                color: context.themeColors.background,
              ),
              child: Row(
                children: [
                  // Current user avatar placeholder
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: context.themeColors.surfaceHighlight,
                    ),
                    child: Icon(LucideIcons.user, size: 16, color: context.themeColors.textTertiary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _replyController,
                      focusNode: _replyFocusNode,
                      style: TextStyle(color: context.themeColors.textPrimary, fontSize: 14),
                      maxLines: null,
                      keyboardType: TextInputType.multiline,
                      decoration: InputDecoration(
                        hintText: 'Post your reply',
                        hintStyle: TextStyle(color: context.themeColors.textTertiary),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                  _isSubmitting
                    ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: context.themeColors.primary500))
                    : IconButton(
                        icon: Icon(LucideIcons.send, color: context.themeColors.primary500),
                        onPressed: _submitReply,
                      ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
