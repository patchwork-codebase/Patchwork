import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_mentions/flutter_mentions.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:video_compress/video_compress.dart';
import 'dart:typed_data';
import 'dart:math';
import '../theme.dart';

class CreateUpdateScreen extends StatefulWidget {
  final String? preselectedRoomId;
  final String? preselectedRoomTitle;
  final String? quotedUpdateId;
  final String? quotedUpdateContent;
  final String? quotedUpdateAuthor;
  final String? parentUpdateId;

  const CreateUpdateScreen({
    super.key,
    this.preselectedRoomId,
    this.preselectedRoomTitle,
    this.quotedUpdateId,
    this.quotedUpdateContent,
    this.quotedUpdateAuthor,
    this.parentUpdateId,
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
  bool _isPreviewMode = false;
  
  final List<PlatformFile> _selectedMediaList = [];
  final List<Uint8List> _mediaBytesList = [];
  final List<Uint8List> _previewBytesList = [];
  bool _isUploadingMedia = false;
  double _uploadProgress = 0.0;
  String _uploadStatus = '';

  // Poll state
  bool _hasPoll = false;
  final TextEditingController _pollQuestionController = TextEditingController();
  final List<TextEditingController> _pollOptionControllers = [
    TextEditingController(),
    TextEditingController(),
  ];
  int _pollDurationDays = 3;

  // Figma state
  bool _hasFigma = false;
  final TextEditingController _figmaUrlController = TextEditingController();

  late Future<List<Map<String, dynamic>>> _roomsFuture;
  List<Map<String, dynamic>> _allUsers = [];

  final Map<String, Map<String, dynamic>> _updateTypes = {
    'insight': {'label': 'Insight', 'icon': LucideIcons.lightbulb, 'color': Colors.amber},
    'decision': {'label': 'Decision', 'icon': LucideIcons.zap, 'color': AppTheme.primary500},
    'blocker': {'label': 'Blocker', 'icon': LucideIcons.alertTriangle, 'color': Colors.redAccent},
    'shipped': {'label': 'Shipped', 'icon': LucideIcons.rocket, 'color': Colors.greenAccent},
    'open_question': {'label': 'Question', 'icon': LucideIcons.helpCircle, 'color': Colors.lightBlue},
    'spotlight': {'label': 'Spotlight (Observer)', 'icon': LucideIcons.star, 'color': Colors.purpleAccent},
    'rfb': {'label': 'Request for Builder', 'icon': LucideIcons.target, 'color': Colors.cyanAccent},
    'challenge': {'label': 'Daily Challenge', 'icon': LucideIcons.code, 'color': Colors.orangeAccent},
  };

  @override
  void initState() {
    super.initState();
    _selectedRoomId = widget.preselectedRoomId;
    _roomsFuture = _fetchMyRooms();
    _fetchUsers();
    _loadDraft();
  }

  Future<void> _loadDraft() async {
    if (widget.quotedUpdateId != null || widget.parentUpdateId != null) return;
    final prefs = await SharedPreferences.getInstance();
    final draft = prefs.getString('update_draft');
    if (draft != null && draft.isNotEmpty && mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mentionsKey.currentState?.controller?.text = draft;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Draft loaded')));
    }
  }

  @override
  void dispose() {
    _pollQuestionController.dispose();
    for (final controller in _pollOptionControllers) {
      controller.dispose();
    }
    _figmaUrlController.dispose();
    super.dispose();
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
    final remainingSlots = 4 - _selectedMediaList.length;
    if (remainingSlots <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 4 files allowed per update')),
      );
      return;
    }

    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx', 'txt'],
        withData: true,
      );

      if (result == null || result.files.isEmpty) return;

      final filesToAdd = result.files.take(remainingSlots).toList();
      for (final file in filesToAdd) {
        if (file.bytes != null) {
          final fileExt = (file.extension ?? file.name.split('.').last).toLowerCase();
          final isVideo = fileExt == 'mp4' || fileExt == 'mov';
          
          Uint8List displayBytes = file.bytes!;
          if (isVideo && file.path != null) {
            try {
              final thumbBytes = await VideoCompress.getByteThumbnail(
                file.path!,
                quality: 50,
                position: -1,
              );
              if (thumbBytes != null) {
                displayBytes = thumbBytes;
              }
            } catch (e) {
              debugPrint('Thumbnail generation failed: $e');
            }
          }

          setState(() {
            _selectedMediaList.add(file);
            _mediaBytesList.add(file.bytes!);
            _previewBytesList.add(displayBytes);
          });
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking files: $e')),
      );
    }
  }

  void _insertMarkdown(String prefix, [String suffix = '']) {
    final controller = _mentionsKey.currentState?.controller;
    if (controller == null) return;
    
    final text = controller.text;
    final selection = controller.selection;
    
    if (!selection.isValid || selection.isCollapsed) {
      final cursor = selection.isValid ? selection.start : text.length;
      final newText = text.substring(0, cursor) + prefix + suffix + text.substring(cursor);
      controller.text = newText;
      final newCursor = cursor + prefix.length;
      controller.selection = TextSelection.collapsed(offset: newCursor);
    } else {
      final selected = text.substring(selection.start, selection.end);
      final newText = text.substring(0, selection.start) + prefix + selected + suffix + text.substring(selection.end);
      controller.text = newText;
      final newCursor = selection.start + prefix.length + selected.length + suffix.length;
      controller.selection = TextSelection.collapsed(offset: newCursor);
    }
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
    final isObserverType = _selectedUpdateType == 'spotlight' || _selectedUpdateType == 'rfb';
    if (_selectedRoomId == null && !isObserverType) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a room')));
      return;
    }
    
    final markupContent = _mentionsKey.currentState?.controller?.markupText ?? '';
    final content = _mentionsKey.currentState?.controller?.text.trim() ?? '';
    if (content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Update content cannot be empty')));
      return;
    }

    if (_hasPoll) {
      final question = _pollQuestionController.text.trim();
      if (question.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a poll question')));
        return;
      }
      final validOptions = _pollOptionControllers
          .map((c) => c.text.trim())
          .where((t) => t.isNotEmpty)
          .toList();
      if (validOptions.length < 2) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Poll must have at least 2 options')));
        return;
      }
    }

    setState(() => _isLoading = true);

    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      List<String> uploadedUrls = [];
      if (_selectedMediaList.isNotEmpty) {
        setState(() => _isUploadingMedia = true);

        final uploadFutures = _selectedMediaList.asMap().entries.map((entry) async {
          final idx = entry.key;
          final file = entry.value;
          Uint8List bytes = _mediaBytesList[idx];
          final fileExt = (file.extension ?? file.name.split('.').last).toLowerCase();
          
          // Compress images before upload to save bandwidth
          if (fileExt == 'jpg' || fileExt == 'jpeg' || fileExt == 'png') {
            try {
              final compressedBytes = await FlutterImageCompress.compressWithList(
                bytes,
                minWidth: 1080,
                minHeight: 1080,
                quality: 75,
                format: fileExt == 'png' ? CompressFormat.png : CompressFormat.jpeg,
              );
              bytes = compressedBytes;
            } catch (e) {
              debugPrint('Image compression failed, using original bytes: $e');
            }
          } else if ((fileExt == 'mp4' || fileExt == 'mov') && file.path != null) {
            if (mounted) setState(() { _uploadStatus = 'Compressing video...'; _uploadProgress = 0.0; });
            final subscription = VideoCompress.compressProgress$.subscribe((progress) {
              if (mounted) setState(() => _uploadProgress = progress / 100);
            });
            try {
              final MediaInfo? mediaInfo = await VideoCompress.compressVideo(
                file.path!,
                quality: VideoQuality.MediumQuality,
                deleteOrigin: false,
                includeAudio: true,
              );
              if (mediaInfo != null && mediaInfo.file != null) {
                bytes = await mediaInfo.file!.readAsBytes();
              }
            } catch (e) {
              debugPrint('Video compression failed: $e');
            } finally {
              subscription.unsubscribe();
            }
          }
          
          if (mounted) setState(() { _uploadStatus = 'Uploading...'; _uploadProgress = 0.0; });
          
          final fileName = '${DateTime.now().millisecondsSinceEpoch}_${idx}_$userId.$fileExt';
          final filePath = 'updates/$fileName';

          await Supabase.instance.client.storage
              .from('updates_media')
              .uploadBinary(filePath, bytes);

          return Supabase.instance.client.storage
              .from('updates_media')
              .getPublicUrl(filePath);
        }).toList();

        uploadedUrls = await Future.wait(uploadFutures);
      }

      final primaryMediaUrl = uploadedUrls.isNotEmpty ? uploadedUrls.first : null;

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

      final updateId = generateUuid();

      await Supabase.instance.client.from('updates').insert({
        'id': updateId,
        'room_id': _selectedRoomId,
        'author_id': userId,
        'author_name': authorName,
        'update_type': _selectedUpdateType,
        'content': markupContent,
        'needs_feedback': _needsFeedback,
        'media_url': primaryMediaUrl,
        'media_urls': uploadedUrls,
        if (widget.quotedUpdateId != null) 'repost_id': widget.quotedUpdateId,
        if (widget.quotedUpdateId != null) 'is_repost_only': false,
        if (widget.parentUpdateId != null) 'parent_update_id': widget.parentUpdateId,
        if (_hasFigma && _figmaUrlController.text.isNotEmpty) 'figma_url': _figmaUrlController.text.trim(),
      });

      // Insert Poll and Poll Options if created
      if (_hasPoll) {
        final question = _pollQuestionController.text.trim();
        final validOptions = _pollOptionControllers
            .map((c) => c.text.trim())
            .where((t) => t.isNotEmpty)
            .toList();

        final pollExpiresAt = DateTime.now().add(Duration(days: _pollDurationDays)).toIso8601String();
        final pollRes = await Supabase.instance.client.from('polls').insert({
          'update_id': updateId,
          'question': question,
          'expires_at': pollExpiresAt,
        }).select('id').maybeSingle();

        final pollId = pollRes?['id'];
        if (pollId != null) {
          final optionsToInsert = validOptions.map((opt) => {
            'poll_id': pollId,
            'option_text': opt,
          }).toList();

          await Supabase.instance.client.from('poll_options').insert(optionsToInsert);
        }
      }

      // Extract mentioned user IDs from markupText: @[display_name](id)
      final mentionRegExp = RegExp(r'@\[.*?\]\((.*?)\)');
      final Iterable<Match> matches = mentionRegExp.allMatches(markupContent);
      final mentionedUserIds = matches.map((m) => m.group(1)).toSet();

      for (var mentionedId in mentionedUserIds) {
        if (mentionedId != null && mentionedId.isNotEmpty) {
          await Supabase.instance.client.from('mentions').insert({
            'source_type': 'update',
            'source_id': updateId,
            'mentioned_user_id': mentionedId,
            'author_id': userId,
          });
        }
      }
      if (widget.quotedUpdateId == null && widget.parentUpdateId == null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('update_draft');
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
                    opacity: ((scale - 0.8) * 5).clamp(0.0, 1.0), // Fades in quickly, clamp prevents error from easeOutBack overshoot
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
                              child: Icon(LucideIcons.check, color: context.themeColors.primary500, size: 34),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Posted successfully',
                              style: TextStyle(
                                fontSize: 15,
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
          if (widget.quotedUpdateId == null && widget.parentUpdateId == null) {
            SharedPreferences.getInstance().then((prefs) => prefs.remove('update_draft'));
          }
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
                : Text('Post', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold, fontSize: 13)),
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
          
          // Ensure valid default type for observers
          if (rooms.isEmpty && widget.preselectedRoomId == null && _selectedUpdateType != 'spotlight' && _selectedUpdateType != 'rfb') {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _selectedUpdateType = 'spotlight');
            });
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Room Selector (Hidden for pure observers or if preselected)
                if (rooms.isNotEmpty && widget.preselectedRoomId == null) ...[
                  Text('ROOM', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
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
                      style: TextStyle(color: context.themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
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
                ],
                if (rooms.isNotEmpty && widget.preselectedRoomId == null) const SizedBox(height: 32),
                
                // Update Type Selector
                Text('TYPE', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _updateTypes.entries.where((entry) {
                      if (rooms.isEmpty && widget.preselectedRoomId == null) {
                        return entry.key == 'spotlight' || entry.key == 'rfb';
                      }
                      return true;
                    }).map((entry) {
                      final type = entry.key;
                      final data = entry.value;
                      final isSelected = _selectedUpdateType == type;
                      
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedUpdateType = type;
                            if (type == 'challenge') {
                               final controller = _mentionsKey.currentState?.controller;
                               if (controller != null && controller.text.trim().isEmpty) {
                                  controller.text = '🎯 **Challenge Goal**:\n\n'
                                      '📋 **Requirements**:\n- \n- \n\n'
                                      '💡 **Resources / Hints**:\n';
                               }
                            }
                          });
                        },
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
                              Icon(data['icon'], size: 13, color: isSelected ? data['color'] : context.themeColors.textSecondary),
                              const SizedBox(width: 8),
                              Text(
                                data['label'],
                                style: TextStyle(
                                  color: isSelected ? data['color'] : context.themeColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
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
                
                // Quoted Update Preview (if any)
                if (widget.quotedUpdateId != null && widget.quotedUpdateContent != null) ...[
                  Text('QUOTED UPDATE', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: context.themeColors.surfaceHighlight.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.themeColors.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(LucideIcons.quote, size: 13, color: context.themeColors.primary500),
                            const SizedBox(width: 8),
                            Text(
                              widget.quotedUpdateAuthor ?? 'Builder',
                              style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary, fontSize: 11),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.quotedUpdateContent!,
                          style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, height: 1.4),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                ],

                // Content Input
                Text('YOUR THOUGHTS (MARKDOWN SUPPORTED)', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: context.themeColors.surface,
                    border: Border.all(color: context.themeColors.borderSubtle),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Write / Preview Tabs
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: context.themeColors.surfaceHighlight.withOpacity(0.5),
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          border: Border(bottom: BorderSide(color: context.themeColors.borderSubtle)),
                        ),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: () => setState(() => _isPreviewMode = false),
                              child: Text('Write', style: TextStyle(fontSize: 11, fontWeight: _isPreviewMode ? FontWeight.normal : FontWeight.bold, color: _isPreviewMode ? context.themeColors.textTertiary : context.themeColors.textPrimary)),
                            ),
                            const SizedBox(width: 24),
                            GestureDetector(
                              onTap: () => setState(() => _isPreviewMode = true),
                              child: Text('Preview', style: TextStyle(fontSize: 11, fontWeight: _isPreviewMode ? FontWeight.bold : FontWeight.normal, color: _isPreviewMode ? context.themeColors.textPrimary : context.themeColors.textTertiary)),
                            ),
                          ],
                        ),
                      ),
                      // Markdown Formatting Ribbon (only in Write mode)
                      if (!_isPreviewMode)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: context.themeColors.surface,
                            border: Border(bottom: BorderSide(color: context.themeColors.borderSubtle)),
                          ),
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _buildFormatButton(
                                  icon: LucideIcons.bold,
                                  tooltip: 'Bold',
                                  onTap: () => _insertMarkdown('**', '**'),
                                ),
                                _buildFormatButton(
                                  icon: LucideIcons.italic,
                                  tooltip: 'Italic',
                                  onTap: () => _insertMarkdown('*', '*'),
                                ),
                                _buildFormatButton(
                                  icon: LucideIcons.code,
                                  tooltip: 'Inline Code',
                                  onTap: () => _insertMarkdown('`', '`'),
                                ),
                                _buildFormatButton(
                                  icon: LucideIcons.fileCode,
                                  tooltip: 'Code Block',
                                  onTap: () => _insertMarkdown('```\n', '\n```'),
                                ),
                                _buildFormatButton(
                                  icon: LucideIcons.list,
                                  tooltip: 'Bullet List',
                                  onTap: () => _insertMarkdown('- '),
                                ),
                                _buildFormatButton(
                                  icon: LucideIcons.link,
                                  tooltip: 'Link',
                                  onTap: () => _insertMarkdown('[', '](https://)'),
                                ),
                                _buildFormatButton(
                                  icon: LucideIcons.quote,
                                  tooltip: 'Quote',
                                  onTap: () => _insertMarkdown('> '),
                                ),
                              ],
                            ),
                          ),
                        ),
                      if (_isPreviewMode)
                        Container(
                          padding: const EdgeInsets.all(16),
                          constraints: const BoxConstraints(minHeight: 120),
                          child: MarkdownBody(
                            data: _mentionsKey.currentState?.controller?.text ?? '',
                            styleSheet: MarkdownStyleSheet(
                              p: TextStyle(color: context.themeColors.textPrimary, fontSize: 13, height: 1.5),
                            ),
                          ),
                        )
                      else
                        FlutterMentions(
                          key: _mentionsKey,
                          onChanged: (text) {
                            if (widget.quotedUpdateId == null && widget.parentUpdateId == null) {
                              SharedPreferences.getInstance().then((prefs) => prefs.setString('update_draft', text));
                            }
                          },
                        suggestionPosition: SuggestionPosition.Bottom,
                        maxLines: 12,
                        minLines: 4,
                        style: TextStyle(color: context.themeColors.textPrimary, fontSize: 13, height: 1.5),
                        decoration: InputDecoration(
                          hintText: "What's the latest? Share progress, decisions, or code...",
                          hintStyle: TextStyle(color: context.themeColors.textTertiary),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.all(16),
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
                                        Text('@${data['display']}', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11)),
                                      ],
                                    )
                                  ],
                                ),
                              );
                            }
                          )
                        ],
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Media Picker & Thumbnails
                if (_selectedMediaList.isEmpty)
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
                          Text('Attach images (up to 4)', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('JPG, PNG up to 5MB each', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11)),
                        ],
                      ),
                    ),
                  )
                else
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'ATTACHMENTS (${_selectedMediaList.length}/4)',
                            style: TextStyle(
                              color: context.themeColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          if (_selectedMediaList.length < 4 && !_isUploadingMedia)
                            GestureDetector(
                              onTap: _pickMedia,
                              child: Text(
                                '+ Add more',
                                style: TextStyle(
                                  color: context.themeColors.primary500,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 140,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _selectedMediaList.length + (_selectedMediaList.length < 4 ? 1 : 0),
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, index) {
                            if (index == _selectedMediaList.length) {
                              // Add button slot
                              return GestureDetector(
                                onTap: _pickMedia,
                                child: Container(
                                  width: 140,
                                  decoration: BoxDecoration(
                                    color: context.themeColors.surface,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: context.themeColors.borderSubtle,
                                      style: BorderStyle.solid,
                                    ),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(LucideIcons.plus, color: context.themeColors.textSecondary, size: 23),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Add',
                                        style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }

                            final bytes = _previewBytesList[index];
                                  final fileName = _selectedMediaList[index].name.toLowerCase();
                                  final isVideo = fileName.endsWith('.mp4') || fileName.endsWith('.mov');
                                  final isDoc = fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx') || fileName.endsWith('.txt');
                                  
                                  Widget mediaPreview;
                                  if (isDoc) {
                                    mediaPreview = Center(child: Icon(LucideIcons.fileText, size: 40, color: context.themeColors.textSecondary));
                                  } else {
                                    mediaPreview = Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        Image.memory(bytes, fit: BoxFit.cover),
                                        if (isVideo)
                                          Center(
                                            child: Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                              child: const Icon(LucideIcons.play, color: Colors.white, size: 20),
                                            ),
                                          ),
                                      ],
                                    );
                                  }

                                  return Stack(
                                    children: [
                                      Container(
                                        width: 140,
                                        height: 140,
                                        decoration: BoxDecoration(
                                          color: context.themeColors.surfaceHighlight,
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(color: context.themeColors.borderSubtle),
                                        ),
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(16),
                                          child: mediaPreview,
                                        ),
                                      ),
                                if (_isUploadingMedia)
                                  Container(
                                    width: 140,
                                    height: 140,
                                    decoration: BoxDecoration(
                                      color: Colors.black54,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Center(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          CircularProgressIndicator(
                                            value: _uploadProgress > 0 ? _uploadProgress : null,
                                            color: context.themeColors.primary500,
                                            strokeWidth: 2.5,
                                          ),
                                          if (_uploadStatus.isNotEmpty) ...[
                                            const SizedBox(height: 8),
                                            Text(
                                              _uploadStatus,
                                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                              textAlign: TextAlign.center,
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: GestureDetector(
                                    onTap: () {
                                      if (!_isUploadingMedia) {
                                        setState(() {
                                          _selectedMediaList.removeAt(index);
                                          _mediaBytesList.removeAt(index);
                                          _previewBytesList.removeAt(index);
                                        });
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(5),
                                      decoration: const BoxDecoration(
                                        color: Colors.black87,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(LucideIcons.x, color: Colors.white, size: 11),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                  
                const SizedBox(height: 24),

                // Interactive Poll Section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.themeColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _hasPoll 
                          ? context.themeColors.primary500.withOpacity(0.5) 
                          : context.themeColors.borderSubtle,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: _hasPoll 
                                      ? context.themeColors.primary500.withOpacity(0.15) 
                                      : context.themeColors.surfaceHighlight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  LucideIcons.barChart2, 
                                  size: 15, 
                                  color: _hasPoll 
                                      ? context.themeColors.primary500 
                                      : context.themeColors.textSecondary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Community Poll',
                                    style: TextStyle(
                                      color: context.themeColors.textPrimary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                  Text(
                                    'Ask observers to vote on decisions',
                                    style: TextStyle(
                                      color: context.themeColors.textTertiary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Switch(
                            value: _hasPoll,
                            activeColor: context.themeColors.primary500,
                            onChanged: (val) {
                              setState(() => _hasPoll = val);
                            },
                          ),
                        ],
                      ),

                      if (_hasPoll) ...[
                        const SizedBox(height: 16),
                        Divider(height: 1, color: context.themeColors.borderSubtle),
                        const SizedBox(height: 16),

                        // Poll Question Input
                        Text(
                          'POLL QUESTION',
                          style: TextStyle(
                            color: context.themeColors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _pollQuestionController,
                          style: TextStyle(color: context.themeColors.textPrimary, fontSize: 11),
                          decoration: InputDecoration(
                            hintText: 'e.g., Which pricing tier works best?',
                            hintStyle: TextStyle(color: context.themeColors.textTertiary),
                            filled: true,
                            fillColor: context.themeColors.surfaceHighlight,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: context.themeColors.borderSubtle),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: context.themeColors.borderSubtle),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Poll Options
                        Text(
                          'OPTIONS (2–4)',
                          style: TextStyle(
                            color: context.themeColors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                          ),
                        ),
                        const SizedBox(height: 8),

                        ...List.generate(_pollOptionControllers.length, (idx) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _pollOptionControllers[idx],
                                    style: TextStyle(color: context.themeColors.textPrimary, fontSize: 11),
                                    decoration: InputDecoration(
                                      hintText: 'Option ${idx + 1}',
                                      hintStyle: TextStyle(color: context.themeColors.textTertiary),
                                      filled: true,
                                      fillColor: context.themeColors.surfaceHighlight,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: BorderSide(color: context.themeColors.borderSubtle),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: BorderSide(color: context.themeColors.borderSubtle),
                                      ),
                                    ),
                                  ),
                                ),
                                if (_pollOptionControllers.length > 2) ...[
                                  const SizedBox(width: 8),
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _pollOptionControllers[idx].dispose();
                                        _pollOptionControllers.removeAt(idx);
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.redAccent.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(LucideIcons.trash2, color: Colors.redAccent, size: 13),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          );
                        }),

                        if (_pollOptionControllers.length < 4) ...[
                          const SizedBox(height: 4),
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _pollOptionControllers.add(TextEditingController());
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: context.themeColors.surfaceHighlight,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: context.themeColors.borderSubtle),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(LucideIcons.plus, size: 11, color: context.themeColors.primary500),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Add Option',
                                    style: TextStyle(
                                      color: context.themeColors.primary500,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],

                        const SizedBox(height: 16),
                        // Duration Selector
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Poll Duration',
                              style: TextStyle(
                                color: context.themeColors.textSecondary,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            DropdownButton<int>(
                              value: _pollDurationDays,
                              dropdownColor: context.themeColors.surface,
                              underline: const SizedBox.shrink(),
                              style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11),
                              items: const [
                                DropdownMenuItem(value: 1, child: Text('1 Day')),
                                DropdownMenuItem(value: 3, child: Text('3 Days')),
                                DropdownMenuItem(value: 7, child: Text('7 Days')),
                              ],
                              onChanged: (val) {
                                if (val != null) setState(() => _pollDurationDays = val);
                              },
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),

                // Figma Integration Section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.themeColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _hasFigma 
                          ? const Color(0xFFF24E1E).withOpacity(0.5) 
                          : context.themeColors.borderSubtle,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: _hasFigma 
                                      ? const Color(0xFFF24E1E).withOpacity(0.15) 
                                      : context.themeColors.surfaceHighlight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  Icons.brush, 
                                  size: 15, 
                                  color: _hasFigma 
                                      ? const Color(0xFFF24E1E) 
                                      : context.themeColors.textSecondary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Figma Sync',
                                    style: TextStyle(
                                      color: context.themeColors.textPrimary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                  Text(
                                    'Link your design file',
                                    style: TextStyle(
                                      color: context.themeColors.textTertiary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Switch(
                            value: _hasFigma,
                            activeColor: const Color(0xFFF24E1E),
                            onChanged: (val) {
                              setState(() => _hasFigma = val);
                            },
                          ),
                        ],
                      ),
                      if (_hasFigma) ...[
                        const SizedBox(height: 16),
                        Divider(height: 1, color: context.themeColors.borderSubtle),
                        const SizedBox(height: 16),
                        Text(
                          'FIGMA URL',
                          style: TextStyle(
                            color: context.themeColors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _figmaUrlController,
                          style: TextStyle(color: context.themeColors.textPrimary, fontSize: 11),
                          decoration: InputDecoration(
                            hintText: 'https://www.figma.com/file/...',
                            hintStyle: TextStyle(color: context.themeColors.textTertiary),
                            filled: true,
                            fillColor: context.themeColors.surfaceHighlight,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: context.themeColors.borderSubtle),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: context.themeColors.borderSubtle),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 100),
              ],
            ),
          );
    },
      ),
    );
  }

  Widget _buildFormatButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: Tooltip(
        message: tooltip,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Icon(icon, size: 12, color: context.themeColors.textSecondary),
          ),
        ),
      ),
    );
  }
}
