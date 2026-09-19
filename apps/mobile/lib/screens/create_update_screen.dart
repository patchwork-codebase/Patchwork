import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_mentions/flutter_mentions.dart';
import 'dart:typed_data';
import 'dart:math';
import '../theme.dart';

class CreateUpdateScreen extends StatefulWidget {
  final String? preselectedRoomId;
  final String? preselectedRoomTitle;
  final String? quotedUpdateId;
  final String? quotedUpdateContent;
  final String? quotedUpdateAuthor;

  const CreateUpdateScreen({
    super.key,
    this.preselectedRoomId,
    this.preselectedRoomTitle,
    this.quotedUpdateId,
    this.quotedUpdateContent,
    this.quotedUpdateAuthor,
  });

  @override
  State<CreateUpdateScreen> createState() => _CreateUpdateScreenState();
}

class _CreateUpdateScreenState extends State<CreateUpdateScreen> {
  final GlobalKey<FlutterMentionsState> _mentionsKey = GlobalKey<FlutterMentionsState>();
  String? _selectedRoomId;
  String _selectedUpdateType = 'insight';
  bool _isLoading = false;
  bool _needsFeedback = false;
  
  XFile? _selectedMedia;
  Uint8List? _mediaBytes;
  bool _isUploadingMedia = false;

  late Future<List<Map<String, dynamic>>> _roomsFuture;
  List<Map<String, dynamic>> _allUsers = [];

  final Map<String, Map<String, dynamic>> _updateTypes = {
    'insight': {'label': 'Insight', 'icon': LucideIcons.lightbulb, 'color': Colors.amber},
    'decision': {'label': 'Decision', 'icon': LucideIcons.zap, 'color': AppTheme.primary500},
    'blocker': {'label': 'Blocker', 'icon': LucideIcons.alertTriangle, 'color': Colors.redAccent},
    'shipped': {'label': 'Shipped', 'icon': LucideIcons.rocket, 'color': Colors.greenAccent},
    'open_question': {'label': 'Question', 'icon': LucideIcons.helpCircle, 'color': Colors.lightBlue},
  };

  @override
  void initState() {
    super.initState();
    _selectedRoomId = widget.preselectedRoomId;
    _roomsFuture = _fetchMyRooms();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    try {
      final response = await Supabase.instance.client.from('users').select('id, name, avatar');
      if (mounted) {
        setState(() {
          _allUsers = List<Map<String, dynamic>>.from(response).map((u) => {
            'id': u['id'],
            'display': (u['name'] as String).replaceAll(' ', ''),
            'full_name': u['name'],
            'photo': u['avatar'] ?? 'https://api.dicebear.com/9.x/micah/png?seed=${u['name']}&backgroundColor=transparent'
          }).toList();
        });
      }
    } catch (e) {
      // Handle error gracefully
    }
  }

  Future<void> _pickMedia() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1024, maxHeight: 1024);
    
    if (pickedFile == null) return;
    
    final bytes = await pickedFile.readAsBytes();
    
    setState(() {
      _selectedMedia = pickedFile;
      _mediaBytes = bytes;
    });
  }

  Future<List<Map<String, dynamic>>> _fetchMyRooms() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return [];
    
    final response = await Supabase.instance.client
        .from('rooms')
        .select('id, title')
        .eq('builder_id', userId)
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> _submitUpdate() async {
    if (_selectedRoomId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a room')));
      return;
    }
    
    final markupContent = _mentionsKey.currentState?.controller?.markupText ?? '';
    final content = _mentionsKey.currentState?.controller?.text.trim() ?? '';
    if (content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Update content cannot be empty')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      String? mediaUrl;
      if (_selectedMedia != null && _mediaBytes != null) {
        setState(() => _isUploadingMedia = true);
        final fileExt = _selectedMedia!.name.split('.').last;
        final fileName = '${DateTime.now().millisecondsSinceEpoch}_$userId.$fileExt';
        final filePath = 'updates/$fileName';
        
        await Supabase.instance.client.storage
            .from('updates_media')
            .uploadBinary(filePath, _mediaBytes!);
            
        mediaUrl = Supabase.instance.client.storage.from('updates_media').getPublicUrl(filePath);
      }

      final userProfile = await Supabase.instance.client
          .from('users')
          .select('name')
          .eq('id', userId)
          .maybeSingle();
      final authorName = userProfile?['name'] ?? 'Builder';

      String generateUuid() {
        final random = Random();
        String hex() => random.nextInt(256).toRadixString(16).padLeft(2, '0');
        return '${hex()}${hex()}${hex()}${hex()}-'
               '${hex()}${hex()}-'
               '4${hex().substring(1)}-'
               '${(random.nextInt(4) + 8).toRadixString(16)}${hex().substring(1)}-'
               '${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}';
      }

      await Supabase.instance.client.from('updates').insert({
        'id': generateUuid(),
        'room_id': _selectedRoomId,
        'author_id': userId,
        'author_name': authorName,
        'update_type': _selectedUpdateType,
        'content': markupContent,
        'needs_feedback': _needsFeedback,
        'media_url': mediaUrl,
        'quoted_update_id': widget.quotedUpdateId,
      });

      // Extract mentioned user IDs from markupText: @[display_name](id)
      final mentionRegExp = RegExp(r'@\[.*?\]\((.*?)\)');
      final Iterable<Match> matches = mentionRegExp.allMatches(markupContent);
      final mentionedUserIds = matches.map((m) => m.group(1)).toSet();

      for (var mentionedId in mentionedUserIds) {
        if (mentionedId != null && mentionedId.isNotEmpty) {
          await Supabase.instance.client.from('notifications').insert({
            'user_id': mentionedId,
            'title': 'You were mentioned!',
            'message': '$authorName mentioned you in an update.',
            'type': 'mention',
            'link_id': widget.preselectedRoomId, // Can also link to update ID
          });
        }
      }

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
                              'Posted successfully',
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
          Navigator.of(context).pop(true); // dismiss screen
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Share Update', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _submitUpdate,
            child: _isLoading 
                ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: context.themeColors.primary500))
                : Text('Post', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _roomsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
          }

          final rooms = snapshot.data ?? [];
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Room Selector
                Text('ROOM', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: context.themeColors.surface,
                    border: Border.all(color: context.themeColors.borderSubtle),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedRoomId,
                      hint: Text('Select a Room', style: TextStyle(color: context.themeColors.textTertiary)),
                      dropdownColor: context.themeColors.surface,
                      icon: Icon(LucideIcons.chevronDown, color: context.themeColors.textSecondary),
                      isExpanded: true,
                      style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600),
                      items: rooms.map((room) {
                        return DropdownMenuItem<String>(
                          value: room['id'],
                          child: Text(room['title']),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedRoomId = val);
                      },
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Update Type Selector
                Text('TYPE', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _updateTypes.entries.map((entry) {
                      final type = entry.key;
                      final data = entry.value;
                      final isSelected = _selectedUpdateType == type;
                      
                      return GestureDetector(
                        onTap: () => setState(() => _selectedUpdateType = type),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: isSelected ? data['color'].withOpacity(0.15) : context.themeColors.surfaceHighlight,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: isSelected ? data['color'].withOpacity(0.5) : context.themeColors.borderSubtle),
                          ),
                          child: Row(
                            children: [
                              Icon(data['icon'], size: 16, color: isSelected ? data['color'] : context.themeColors.textSecondary),
                              const SizedBox(width: 8),
                              Text(
                                data['label'],
                                style: TextStyle(
                                  color: isSelected ? data['color'] : context.themeColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Content Input
                Text('CONTENT (MARKDOWN SUPPORTED)', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: context.themeColors.surface,
                    border: Border.all(color: context.themeColors.borderSubtle),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: FlutterMentions(
                    key: _mentionsKey,
                    suggestionPosition: SuggestionPosition.Bottom,
                    maxLines: 12,
                    minLines: 4,
                    style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16, height: 1.5),
                    decoration: InputDecoration(
                      hintText: "What's the latest? Support for markdown, code snippets, and embeds coming soon...",
                      hintStyle: TextStyle(color: context.themeColors.textTertiary),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(20),
                    ),
                    mentions: [
                      Mention(
                        trigger: '@',
                        style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold),
                        data: _allUsers,
                        suggestionBuilder: (data) {
                          return Container(
                            padding: const EdgeInsets.all(12),
                            color: context.themeColors.surfaceHighlight,
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundImage: NetworkImage(data['photo']),
                                  radius: 16,
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(data['full_name'], style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
                                    Text('@${data['display']}', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12)),
                                  ],
                                )
                              ],
                            ),
                          );
                        }
                      )
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Media Picker
                if (_selectedMedia == null)
                  GestureDetector(
                    onTap: _pickMedia,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: context.themeColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: context.themeColors.borderSubtle),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: context.themeColors.surfaceHighlight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(LucideIcons.imagePlus, color: context.themeColors.textSecondary),
                          ),
                          const SizedBox(height: 12),
                          Text('Attach an image', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('JPG, PNG up to 5MB', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12)),
                        ],
                      ),
                    ),
                  )
                else
                  Stack(
                    children: [
                      Container(
                        width: double.infinity,
                        height: 200,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: context.themeColors.borderSubtle),
                          image: _mediaBytes != null ? DecorationImage(
                            image: MemoryImage(_mediaBytes!),
                            fit: BoxFit.cover,
                          ) : null,
                        ),
                      ),
                      if (_isUploadingMedia)
                        Container(
                          width: double.infinity,
                          height: 200,
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(child: CircularProgressIndicator(color: context.themeColors.primary500)),
                        ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: GestureDetector(
                          onTap: () {
                            if (!_isUploadingMedia) {
                              setState(() {
                                _selectedMedia = null;
                                _mediaBytes = null;
                              });
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Colors.black87,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.x, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                const SizedBox(height: 100),
              ],
            ),
          );
    },
      ),
    );
  }
}
