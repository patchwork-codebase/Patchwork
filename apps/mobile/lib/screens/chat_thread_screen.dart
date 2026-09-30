import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'dart:math' as math;
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';

class ChatThreadScreen extends StatefulWidget {
  final String roomId;
  final String roomTitle;

  const ChatThreadScreen({
    super.key,
    required this.roomId,
    required this.roomTitle,
  });

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  bool _isUploadingMedia = false;
  RealtimeChannel? _channel;
  RealtimeChannel? _presenceChannel;
  String? _currentUserId;
  Map<String, dynamic>? _currentUserProfile;
  bool _isOtherUserTyping = false;
  String? _editingMessageId;
  String? _editingOriginalContent;
  Map<String, List<Map<String, dynamic>>> _reactions = {};
  bool _showTip = false;
  final Set<String> _optimisticIds = {}; // temp IDs for optimistically added messages

  @override
  void initState() {
    super.initState();
    _currentUserId = Supabase.instance.client.auth.currentUser?.id;
    _fetchCurrentUser();
    _fetchMessages();
    _markMessagesAsRead();
    _setupRealtime();
    _messageController.addListener(_onTextChanged);
    _checkIfShowTip();
  }

  Future<void> _checkIfShowTip() async {
    // Show tip after first message is sent or received — just show it once on open
    await Future.delayed(const Duration(seconds: 2));
    if (mounted && _messages.isNotEmpty) {
      setState(() => _showTip = true);
      await Future.delayed(const Duration(seconds: 6));
      if (mounted) setState(() => _showTip = false);
    }
  }

  void _onTextChanged() {
    if (_presenceChannel != null && _currentUserId != null) {
      final isTyping = _messageController.text.isNotEmpty;
      _presenceChannel!.track({'userId': _currentUserId, 'typing': isTyping});
    }
  }

  @override
  void dispose() {
    _messageController.removeListener(_onTextChanged);
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    if (_channel != null) {
      Supabase.instance.client.removeChannel(_channel!);
    }
    if (_presenceChannel != null) {
      Supabase.instance.client.removeChannel(_presenceChannel!);
    }
    super.dispose();
  }

  Future<void> _fetchCurrentUser() async {
    if (_currentUserId == null) return;
    try {
      final res = await Supabase.instance.client
          .from('users')
          .select('name, avatar')
          .eq('id', _currentUserId!)
          .single();
      if (mounted) setState(() => _currentUserProfile = Map<String, dynamic>.from(res));
    } catch (_) {}
  }

  Future<void> _markMessagesAsRead() async {
    if (_currentUserId == null) return;
    try {
      // 1. Mark notifications as read
      await Supabase.instance.client
          .from('notifications')
          .update({'read': true})
          .eq('user_id', _currentUserId!)
          .eq('type', 'new_message')
          .eq('read', false)
          .contains('metadata', {'room_id': widget.roomId});
          
      // 2. Mark chat messages as read in room_messages
      await Supabase.instance.client
          .from('room_messages')
          .update({'read_at': DateTime.now().toUtc().toIso8601String()})
          .eq('room_id', widget.roomId)
          .neq('sender_id', _currentUserId!)
          .isFilter('read_at', null);
    } catch (_) {}
  }

  Future<void> _fetchMessages() async {
    try {
      final res = await Supabase.instance.client
          .from('room_messages')
          .select('*, users:sender_id(id, name, avatar)')
          .eq('room_id', widget.roomId)
          .order('created_at', ascending: true);
      if (mounted) {
        setState(() {
          _messages = List<Map<String, dynamic>>.from(res);
          _isLoading = false;
        });
        _scrollToBottom();
        _fetchReactions();
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchReactions() async {
    if (_messages.isEmpty) return;
    try {
      final messageIds = _messages.map((m) => m['id']).toList();
      final res = await Supabase.instance.client
          .from('message_reactions')
          .select('*, users:user_id(name)')
          .inFilter('message_id', messageIds);
      final Map<String, List<Map<String, dynamic>>> grouped = {};
      for (final r in res as List) {
        final msgId = r['message_id']?.toString() ?? '';
        grouped.putIfAbsent(msgId, () => []);
        grouped[msgId]!.add(Map<String, dynamic>.from(r));
      }
      if (mounted) setState(() => _reactions = grouped);
    } catch (_) {}
  }

  void _setupRealtime() {
    _channel = Supabase.instance.client
        .channel('room_messages:${widget.roomId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'room_messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'room_id',
            value: widget.roomId,
          ),
          callback: (payload) async {
            if (!mounted) return;
            if (payload.eventType == 'INSERT') {
              final newMsg = Map<String, dynamic>.from(payload.newRecord);
              final senderId = newMsg['sender_id']?.toString();
              if (senderId != null) {
                try {
                  final userRes = await Supabase.instance.client
                      .from('users')
                      .select('id, name, avatar')
                      .eq('id', senderId)
                      .single();
                  newMsg['users'] = userRes;
                } catch (_) {}
              }
              if (mounted) {
                setState(() => _messages.add(newMsg));
                _scrollToBottom();
                if (senderId != _currentUserId) {
                  _markMessagesAsRead();
                } else {
                  // Replace the optimistic message with the real one (matching by sender+content+time proximity)
                  final tempIdx = _messages.indexWhere((m) =>
                      _optimisticIds.contains(m['id']?.toString()) &&
                      m['content'] == newMsg['content'] &&
                      m['sender_id'] == newMsg['sender_id']);
                  if (tempIdx != -1) {
                    _optimisticIds.remove(_messages[tempIdx]['id']);
                    _messages.removeAt(tempIdx);
                    // newMsg already added above, so no duplicate
                  }
                }
              }
            } else if (payload.eventType == 'UPDATE') {
              final updatedMsg = Map<String, dynamic>.from(payload.newRecord);
              final index = _messages.indexWhere((m) => m['id'] == updatedMsg['id']);
              if (index != -1) {
                 final oldUsers = _messages[index]['users'];
                 updatedMsg['users'] = oldUsers;
                 if (mounted) {
                   setState(() {
                     _messages[index] = updatedMsg;
                   });
                 }
              }
            }
          },
        )
        .subscribe();
        
    _presenceChannel = Supabase.instance.client.channel('presence-chat:${widget.roomId}');
    _presenceChannel!.onPresenceSync((_) {
      if (!mounted) return;
      final presenceList = _presenceChannel!.presenceState();
      bool someoneTyping = false;
      for (final state in presenceList) {
        for (final presence in state.presences) {
          final payload = presence.payload;
          if (payload['userId'] != _currentUserId && payload['typing'] == true) {
            someoneTyping = true;
          }
        }
      }
      setState(() => _isOtherUserTyping = someoneTyping);
    }).subscribe((status, [err]) async {
      if (status == 'SUBSCRIBED' && _currentUserId != null) {
        await _presenceChannel!.track({'userId': _currentUserId, 'typing': false});
      }
    });
  }

  void _scrollToBottom({bool animated = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        if (animated) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        } else {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      }
    });
  }

  Future<void> _sendMessage({String? mediaUrl, String? mediaType}) async {
    final content = _messageController.text.trim();
    if ((content.isEmpty && mediaUrl == null) || _isSending || _currentUserId == null) return;

    HapticFeedback.lightImpact();

    if (_editingMessageId != null) {
      // Editing: update the local message instantly
      final idx = _messages.indexWhere((m) => m['id']?.toString() == _editingMessageId);
      if (idx != -1) {
        setState(() {
          _messages[idx] = {..._messages[idx], 'content': content, 'is_edited': true};
        });
      }
      final editId = _editingMessageId!;
      _cancelEditing();
      try {
        await Supabase.instance.client
            .from('room_messages')
            .update({'content': content, 'is_edited': true})
            .eq('id', editId);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to edit: $e')),
          );
        }
      }
      return;
    }

    // Optimistic insert: add to UI instantly with a temp ID
    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final optimisticMsg = <String, dynamic>{
      'id': tempId,
      'room_id': widget.roomId,
      'sender_id': _currentUserId,
      'content': content.isEmpty ? '' : content,
      'created_at': DateTime.now().toUtc().toIso8601String(),
      'read_at': null,
      'is_edited': false,
      if (mediaUrl != null) 'media_url': mediaUrl,
      if (mediaType != null) 'media_type': mediaType,
      'users': _currentUserProfile != null
          ? {'id': _currentUserId, 'name': _currentUserProfile!['name'], 'avatar': _currentUserProfile!['avatar']}
          : null,
    };

    setState(() {
      _messages.add(optimisticMsg);
      _optimisticIds.add(tempId);
    });
    _messageController.clear();
    _scrollToBottom();

    try {
      await Supabase.instance.client.from('room_messages').insert({
        'room_id': widget.roomId,
        'sender_id': _currentUserId,
        'content': content.isEmpty ? '' : content,
        if (mediaUrl != null) 'media_url': mediaUrl,
        if (mediaType != null) 'media_type': mediaType,
      });
      // The realtime INSERT event will replace the optimistic msg via _optimisticIds tracking
    } catch (e) {
      // Remove the optimistic message on failure
      if (mounted) {
        setState(() {
          _messages.removeWhere((m) => m['id'] == tempId);
          _optimisticIds.remove(tempId);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send: $e')),
        );
      }
    }
  }

  void _startEditing(Map<String, dynamic> msg) {
    setState(() {
      _editingMessageId = msg['id']?.toString();
      _editingOriginalContent = msg['content']?.toString() ?? '';
    });
    _messageController.text = _editingOriginalContent ?? '';
    _messageController.selection = TextSelection.fromPosition(
      TextPosition(offset: _messageController.text.length),
    );
    _focusNode.requestFocus();
    Navigator.of(context).pop(); // Close bottom sheet
  }

  void _cancelEditing() {
    setState(() {
      _editingMessageId = null;
      _editingOriginalContent = null;
    });
    _messageController.clear();
  }

  Future<void> _deleteMessage(String msgId) async {
    Navigator.of(context).pop(); // Close bottom sheet
    try {
      await Supabase.instance.client
          .from('room_messages')
          .delete()
          .eq('id', msgId);
      if (mounted) {
        setState(() => _messages.removeWhere((m) => m['id']?.toString() == msgId));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e')),
        );
      }
    }
  }

  Future<void> _sendReaction(String msgId, String emoji) async {
    Navigator.of(context).pop(); // Close bottom sheet
    if (_currentUserId == null) return;
    try {
      await Supabase.instance.client.from('message_reactions').upsert({
        'message_id': msgId,
        'user_id': _currentUserId,
        'emoji': emoji,
      });
      await _fetchReactions();
    } catch (_) {}
  }

  void _showMessageOptions(Map<String, dynamic> msg, bool isMe) {
    final msgId = msg['id']?.toString() ?? '';
    final content = msg['content']?.toString() ?? '';
    HapticFeedback.mediumImpact();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: context.themeColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.themeColors.borderSubtle),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Emoji Quick Reactions
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: ['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) {
                    return GestureDetector(
                      onTap: () => _sendReaction(msgId, emoji),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: context.themeColors.surfaceHighlight,
                        ),
                        child: Center(
                          child: Text(emoji, style: const TextStyle(fontSize: 22)),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              Divider(color: context.themeColors.borderSubtle, height: 1),
              // Action Buttons
              if (content.isNotEmpty)
                _buildActionTile(
                  icon: LucideIcons.copy,
                  label: 'Copy',
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: content));
                    Navigator.of(ctx).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Copied to clipboard')),
                    );
                  },
                ),
              if (isMe && content.isNotEmpty)
                _buildActionTile(
                  icon: LucideIcons.pencil,
                  label: 'Edit',
                  onTap: () => _startEditing(msg),
                ),
              if (isMe)
                _buildActionTile(
                  icon: LucideIcons.trash2,
                  label: 'Delete',
                  isDestructive: true,
                  onTap: () => _deleteMessage(msgId),
                ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: isDestructive ? Colors.red : context.themeColors.textPrimary,
        size: 20,
      ),
      title: Text(
        label,
        style: TextStyle(
          color: isDestructive ? Colors.red : context.themeColors.textPrimary,
          fontSize: 15,
        ),
      ),
      onTap: onTap,
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
    );
  }

  Future<void> _pickAndSendImage() async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
      maxWidth: 1200,
    );
    if (image == null) return;

    setState(() => _isUploadingMedia = true);
    HapticFeedback.lightImpact();

    try {
      final bytes = await image.readAsBytes();
      final ext = image.name.split('.').last.toLowerCase();
      final fileName = '${widget.roomId}/${_currentUserId}_${DateTime.now().millisecondsSinceEpoch}.$ext';
      final mimeType = ext == 'png' ? 'image/png' : 'image/jpeg';

      await Supabase.instance.client.storage
          .from('chat_media')
          .uploadBinary(fileName, bytes, fileOptions: FileOptions(contentType: mimeType));

      final publicUrl = Supabase.instance.client.storage
          .from('chat_media')
          .getPublicUrl(fileName);

      await _sendMessage(mediaUrl: publicUrl, mediaType: 'image');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to upload image: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingMedia = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        backgroundColor: context.themeColors.surface,
        elevation: 0,
        titleSpacing: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: context.themeColors.primary500.withOpacity(0.15),
                border: Border.all(color: context.themeColors.primary500.withOpacity(0.3)),
              ),
              child: Center(
                child: Icon(LucideIcons.messageCircle, color: context.themeColors.primary500, size: 18),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    widget.roomTitle,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: context.themeColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'Private Room',
                    style: TextStyle(
                      fontSize: 11,
                      color: context.themeColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Divider(height: 1, color: context.themeColors.borderSubtle),
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // Messages List
              Expanded(
                child: _isLoading
                    ? Center(child: CircularProgressIndicator(color: context.themeColors.primary500))
                    : _messages.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            itemCount: _messages.length + (_isOtherUserTyping ? 1 : 0),
                            itemBuilder: (context, index) {
                          if (index == _messages.length && _isOtherUserTyping) {
                            return _buildTypingIndicator();
                          }
                          final msg = _messages[index];
                          final senderId = msg['sender_id']?.toString() ?? msg['users']?['id']?.toString();
                          final isMe = senderId == _currentUserId;
                          final isOptimistic = _optimisticIds.contains(msg['id']?.toString());
                          final showAvatar = !isMe && (index == 0 || _messages[index - 1]['sender_id']?.toString() != senderId);
                          final showTimestamp = index == _messages.length - 1 ||
                              _messages[index + 1]['sender_id']?.toString() != senderId ||
                              (_isOtherUserTyping && !isMe);
                          return Opacity(
                            opacity: isOptimistic ? 0.65 : 1.0,
                            child: _buildMessageBubble(msg, isMe, showAvatar, showTimestamp),
                          );
                        },
                          ),
              ),

              // Input Bar
              _buildInputBar(),
            ],
          ),

          // Tip overlay
          if (_showTip) _buildTipBanner(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(
    Map<String, dynamic> msg,
    bool isMe,
    bool showAvatar,
    bool showTimestamp,
  ) {
    final content = msg['content'] ?? '';
    final sender = msg['users'] as Map?;
    final senderName = sender?['name'] as String? ?? 'User';
    final senderAvatar = sender?['avatar'] as String?;
    final createdAt = msg['created_at'] as String?;
    final readAt = msg['read_at'] as String?;

    return Padding(
      padding: EdgeInsets.only(
        bottom: showTimestamp ? 16 : 4,
        top: showAvatar ? 8 : 0,
      ),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Other person's avatar
          if (!isMe) ...[
            showAvatar
                ? CircleAvatar(
                    radius: 16,
                    backgroundColor: context.themeColors.primary500.withOpacity(0.2),
                    backgroundImage: senderAvatar != null ? NetworkImage(senderAvatar) : null,
                    child: senderAvatar == null
                        ? Text(senderName[0].toUpperCase(),
                            style: TextStyle(color: context.themeColors.primary500, fontSize: 12, fontWeight: FontWeight.bold))
                        : null,
                  )
                : const SizedBox(width: 32),
            const SizedBox(width: 8),
          ],

          // Bubble
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMe && showAvatar)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4, left: 2),
                    child: Text(
                      senderName,
                      style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary, fontWeight: FontWeight.w600),
                    ),
                  ),
                GestureDetector(
                  onLongPress: () => _showMessageOptions(msg, isMe),
                  child: Container(
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.68),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: _editingMessageId == msg['id']?.toString()
                          ? context.themeColors.primary500.withOpacity(0.85)
                          : isMe
                              ? context.themeColors.primary500
                              : context.themeColors.surface,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: Radius.circular(isMe ? 18 : 4),
                        bottomRight: Radius.circular(isMe ? 4 : 18),
                      ),
                      border: isMe ? null : Border.all(color: context.themeColors.borderSubtle),
                    ),
                    child: _buildBubbleContent(msg, isMe, content),
                  ),
                ),
                // Reactions
                if ((_reactions[msg['id']?.toString()] ?? []).isNotEmpty)
                  _buildReactionBubbles(msg['id']?.toString() ?? '', isMe),
                if (showTimestamp && createdAt != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          timeago.format(DateTime.parse(createdAt)),
                          style: TextStyle(fontSize: 10, color: context.themeColors.textTertiary),
                        ),
                        if (isMe) ...[
                          const SizedBox(width: 4),
                          Icon(
                            readAt != null ? LucideIcons.checkCheck : LucideIcons.check,
                            size: 14,
                            color: readAt != null ? Colors.blue : context.themeColors.textTertiary,
                          ),
                        ],
                      ],
                    ),
                  ),
              ],
            ),
          ),

          if (isMe) const SizedBox(width: 4),
        ],
      ),
    );
  }

  Widget _buildReactionBubbles(String msgId, bool isMe) {
    final reactions = _reactions[msgId] ?? [];
    // Group by emoji
    final Map<String, int> counts = {};
    for (final r in reactions) {
      final emoji = r['emoji'] as String? ?? '';
      counts[emoji] = (counts[emoji] ?? 0) + 1;
    }
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Wrap(
        alignment: isMe ? WrapAlignment.end : WrapAlignment.start,
        spacing: 4,
        children: counts.entries.map((e) {
          return GestureDetector(
            onTap: () => _sendReaction(msgId, e.key),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: context.themeColors.surfaceHighlight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.themeColors.borderSubtle),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(e.key, style: const TextStyle(fontSize: 14)),
                  if (e.value > 1) ...[
                    const SizedBox(width: 3),
                    Text(
                      e.value.toString(),
                      style: TextStyle(
                        fontSize: 11,
                        color: context.themeColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildBubbleContent(Map<String, dynamic> msg, bool isMe, String content) {
    final mediaUrl = msg['media_url'] as String?;
    final mediaType = msg['media_type'] as String?;

    if (mediaUrl != null && mediaType == 'image') {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: mediaUrl,
          width: 220,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            width: 220,
            height: 160,
            color: isMe
                ? Colors.white.withOpacity(0.15)
                : context.themeColors.surfaceHighlight,
            child: Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: isMe ? Colors.white : context.themeColors.primary500,
              ),
            ),
          ),
          errorWidget: (context, url, error) => Container(
            width: 220,
            height: 80,
            color: isMe
                ? Colors.white.withOpacity(0.15)
                : context.themeColors.surfaceHighlight,
            child: Center(
              child: Icon(
                LucideIcons.imageOff,
                color: isMe ? Colors.white54 : context.themeColors.textTertiary,
              ),
            ),
          ),
        ),
      );
    }

    return Text(
      content,
      style: TextStyle(
        color: isMe ? Colors.white : context.themeColors.textPrimary,
        fontSize: 14,
        height: 1.4,
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          const SizedBox(width: 32 + 8), // Match avatar indent
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(0),
                const SizedBox(width: 4),
                _buildDot(1),
                const SizedBox(width: 4),
                _buildDot(2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        final offset = (value * 3.14 * 2) + (index * 1.5);
        final y = (math.sin(offset) * -3);
        return Transform.translate(
          offset: Offset(0, y),
          child: Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: context.themeColors.textTertiary,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.messageCircle, size: 56, color: context.themeColors.textTertiary),
            const SizedBox(height: 16),
            Text(
              'No messages yet',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: context.themeColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Say hello to kick off the collaboration! 👋',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: context.themeColors.textTertiary,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTipBanner() {
    return Positioned(
      bottom: 100,
      left: 24,
      right: 24,
      child: AnimatedOpacity(
        opacity: _showTip ? 1.0 : 0.0,
        duration: const Duration(milliseconds: 400),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: context.themeColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.themeColors.primary500.withOpacity(0.4)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Icon(LucideIcons.lightbulb,
                      size: 16, color: context.themeColors.primary500),
                  const SizedBox(width: 8),
                  Text(
                    'Tips for this chat',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: context.themeColors.primary500,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => setState(() => _showTip = false),
                    child: Icon(LucideIcons.x,
                        size: 16, color: context.themeColors.textTertiary),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _buildTipRow(LucideIcons.hand, 'Long-press any message to react, edit or delete'),
              const SizedBox(height: 6),
              _buildTipRow(LucideIcons.paperclip, 'Tap the 📎 icon to send images and files'),
              const SizedBox(height: 6),
              _buildTipRow(LucideIcons.checkCheck, 'Blue ticks mean your message has been read'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTipRow(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: context.themeColors.textTertiary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: context.themeColors.textSecondary,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInputBar() {
    return Container(
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        border: Border(top: BorderSide(color: context.themeColors.borderSubtle)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_editingMessageId != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: context.themeColors.primary500.withOpacity(0.1),
              child: Row(
                children: [
                  Icon(LucideIcons.pencil, size: 14, color: context.themeColors.primary500),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Editing message',
                      style: TextStyle(
                        fontSize: 12,
                        color: context.themeColors.primary500,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: _cancelEditing,
                    child: Icon(LucideIcons.x, size: 18, color: context.themeColors.textTertiary),
                  ),
                ],
              ),
            ),
          Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 8,
              top: 10,
              bottom: MediaQuery.of(context).viewInsets.bottom > 0
                  ? 10
                  : MediaQuery.of(context).padding.bottom + 10,
            ),
            child: Row(
              children: [
                if (_editingMessageId == null) ...[
                  GestureDetector(
                    onTap: _isUploadingMedia ? null : _pickAndSendImage,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: context.themeColors.surfaceHighlight,
                        border: Border.all(color: context.themeColors.borderSubtle),
                      ),
                      child: _isUploadingMedia
                          ? Padding(
                              padding: const EdgeInsets.all(10),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: context.themeColors.primary500,
                              ),
                            )
                          : Icon(LucideIcons.paperclip,
                              color: context.themeColors.textSecondary, size: 18),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color: context.themeColors.surfaceHighlight,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: context.themeColors.borderSubtle),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      child: TextField(
                        controller: _messageController,
                        focusNode: _focusNode,
                        maxLines: null,
                        keyboardType: TextInputType.multiline,
                        textInputAction: TextInputAction.newline,
                        style: TextStyle(color: context.themeColors.textPrimary, fontSize: 15),
                        decoration: InputDecoration(
                          border: InputBorder.none,
                          hintText: _editingMessageId != null ? 'Edit message...' : 'Message...',
                          hintStyle: TextStyle(color: context.themeColors.textTertiary, fontSize: 15),
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _sendMessage(),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _editingMessageId != null ? Colors.green : context.themeColors.primary500,
                    ),
                    child: _isSending
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Icon(
                            _editingMessageId != null ? LucideIcons.check : LucideIcons.send,
                            color: Colors.white,
                            size: 20,
                          ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
