import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../theme.dart';
import '../widgets/feed_update_card.dart';
import 'create_update_screen.dart';
import 'create_simulation_screen.dart';
import 'edit_room_screen.dart';
import 'team_management_screen.dart';
import 'journey_timelapse_screen.dart';
import '../widgets/toast_notification.dart';

class RoomDetailScreen extends StatefulWidget {
  final String roomId;
  final String title;

  const RoomDetailScreen({
    super.key,
    required this.roomId,
    required this.title,
  });

  @override
  State<RoomDetailScreen> createState() => _RoomDetailScreenState();
}

class _RoomDetailScreenState extends State<RoomDetailScreen> with SingleTickerProviderStateMixin {
  late Future<Map<String, dynamic>> _roomDataFuture;
  bool _isObserving = false;
  bool _isGeneratingAiNote = false;
  bool _isTogglingObserve = false;

  Future<void> _generateReleaseNote(BuildContext context) async {
    setState(() => _isGeneratingAiNote = true);
    try {
      final res = await Supabase.instance.client.functions.invoke(
        'generate-release-notes',
        body: {'room_id': widget.roomId},
      );
      
      final note = res.data['releaseNote'] as String?;
      if (note != null && mounted) {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: context.themeColors.surface,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
          builder: (context) => DraggableScrollableSheet(
            initialChildSize: 0.8,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) => Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.sparkles, color: Colors.purpleAccent),
                          const SizedBox(width: 8),
                          Text('AI Release Note', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 17, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      IconButton(
                        icon: Icon(LucideIcons.copy, color: context.themeColors.textSecondary),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: note));
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied to clipboard!')));
                        },
                      )
                    ],
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: SingleChildScrollView(
                      controller: scrollController,
                      child: MarkdownBody(
                        data: note,
                        styleSheet: MarkdownStyleSheet(
                          p: TextStyle(color: context.themeColors.textSecondary),
                          h1: TextStyle(color: context.themeColors.textPrimary),
                          h2: TextStyle(color: context.themeColors.textPrimary),
                          h3: TextStyle(color: context.themeColors.textPrimary),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to generate note: $e')));
      }
    } finally {
      if (mounted) setState(() => _isGeneratingAiNote = false);
    }
  }

  int _observersCount = 0;
  
  late TabController _tabController;
  
  List<Map<String, dynamic>> _updatesList = [];
  bool _isLoadingMoreUpdates = false;
  bool _hasMoreUpdates = true;
  final int _pageSize = 20;
  final ScrollController _updatesScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _updatesScrollController.addListener(() {
      if (_updatesScrollController.position.pixels >= _updatesScrollController.position.maxScrollExtent - 200) {
        _fetchMoreUpdates();
      }
    });
    _roomDataFuture = _fetchRoomData();
  }
  
  Future<void> _fetchMoreUpdates() async {
    if (_isLoadingMoreUpdates || !_hasMoreUpdates) return;
    setState(() => _isLoadingMoreUpdates = true);
    try {
      final updatesResponse = await Supabase.instance.client
          .from('updates')
          .select('*, rooms(title, tags), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
          .eq('room_id', widget.roomId)
          .order('created_at', ascending: false)
          .range(_updatesList.length, _updatesList.length + _pageSize - 1);
      final newUpdates = List<Map<String, dynamic>>.from(updatesResponse);
      if (mounted) {
        setState(() {
          _updatesList.addAll(newUpdates);
          if (newUpdates.length < _pageSize) _hasMoreUpdates = false;
          _isLoadingMoreUpdates = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingMoreUpdates = false);
    }
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _updatesScrollController.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _fetchRoomData() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;

    // Fetch room details including author
    final roomResponse = await Supabase.instance.client
        .from('rooms')
        .select('*, users!builder_id(name, avatar, is_verified_expert, organization_logo_url)')
        .eq('id', widget.roomId)
        .maybeSingle();

    if (roomResponse == null) {
      throw Exception('This room is unavailable. It may have been deleted or you may not have access.');
    }
        
    // Also try to get observers count
    try {
      final observersRes = await Supabase.instance.client
          .from('room_observers')
          .select('id')
          .eq('room_id', widget.roomId);
      _observersCount = (observersRes as List).length;
    } catch (_) {}
    
    // Fetch updates for this room
    final updatesResponse = await Supabase.instance.client
        .from('updates')
        .select('*, rooms(title, tags), users(name, username, twitter, avatar, is_verified_expert, organization_name, organization_logo_url), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert, organization_logo_url)), polls(*, poll_options(*))')
        .eq('room_id', widget.roomId)
        .order('created_at', ascending: false)
        .range(0, _pageSize - 1);
        
    _updatesList = List<Map<String, dynamic>>.from(updatesResponse);
    _hasMoreUpdates = _updatesList.length == _pageSize;

    // Check if observing
    if (userId != null) {
      try {
        final observeRes = await Supabase.instance.client
            .from('room_observers')
            .select('id')
            .eq('room_id', widget.roomId)
            .eq('observer_id', userId)
            .maybeSingle();
        if (mounted) {
          setState(() {
            _isObserving = observeRes != null;
          });
        }
      } catch (_) {}
    }

    // Fetch basic indicators for Workspace tab
    List<Map<String, dynamic>> linkedDocs = [];
    List<Map<String, dynamic>> linkedRepos = [];
    int decisionsCount = 0;
    
    try {
      final docsRes = await Supabase.instance.client.from('room_notion_docs').select('id, title, url').eq('room_id', widget.roomId);
      linkedDocs = List<Map<String, dynamic>>.from(docsRes);
    } catch (_) {}
    try {
      final reposRes = await Supabase.instance.client.from('repositories').select('id, github_repo_name, github_owner').eq('linked_room_id', widget.roomId);
      linkedRepos = List<Map<String, dynamic>>.from(reposRes);
    } catch (_) {}
    List<Map<String, dynamic>> decisions = [];
    try {
      final decRes = await Supabase.instance.client
          .from('room_decisions')
          .select('*')
          .eq('room_id', widget.roomId)
          .order('created_at', ascending: false);
      decisions = List<Map<String, dynamic>>.from(decRes);
      decisionsCount = decisions.length;
    } catch (_) {}

    List<Map<String, dynamic>> roadmapItems = [];
    try {
      final rmRes = await Supabase.instance.client
          .from('roadmap_items')
          .select('*')
          .eq('room_id', widget.roomId)
          .order('created_at', ascending: false);
      roadmapItems = List<Map<String, dynamic>>.from(rmRes);
    } catch (_) {}

    List<Map<String, dynamic>> linearIssues = [];
    try {
      final linearRes = await Supabase.instance.client
          .from('linear_issues')
          .select('*')
          .eq('room_id', widget.roomId)
          .order('updated_at', ascending: false);
      linearIssues = List<Map<String, dynamic>>.from(linearRes);
    } catch (_) {}

    int totalViews = 0;
    try {
      final viewsRes = await Supabase.instance.client.from('updates').select('view_count').eq('room_id', widget.roomId);
      for (var u in (viewsRes as List)) {
        totalViews += (u['view_count'] as int?) ?? 0;
      }
    } catch(_) {}

    int totalEngagements = 0;
    try {
      final reactRes = await Supabase.instance.client.from('reactions').select('id').eq('room_id', widget.roomId);
      totalEngagements = (reactRes as List).length;
    } catch (_) {}

    return {
      'room': roomResponse,
      'updates': List<Map<String, dynamic>>.from(updatesResponse),
      'decisions': decisions,
      'roadmapItems': roadmapItems,
      'linearIssues': linearIssues,
      'indicators': {
        'docs': linkedDocs.length,
        'repos': linkedRepos.length,
        'decisions': decisionsCount,
        'docsList': linkedDocs,
        'reposList': linkedRepos,
      },
      'analytics': {
        'totalViews': totalViews,
        'engagements': totalEngagements,
        'observerGrowth': _observersCount,
      }
    };
  }

  Future<void> _toggleObserve() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _isTogglingObserve = true);
    
    try {
      if (_isObserving) {
        await Supabase.instance.client
            .from('room_observers')
            .delete()
            .eq('room_id', widget.roomId)
            .eq('observer_id', userId);
      } else {
        await Supabase.instance.client
            .from('room_observers')
            .insert({
              'room_id': widget.roomId,
              'observer_id': userId,
            });
      }
      setState(() => _isObserving = !_isObserving);
      _refresh(); // refresh to get new observer count
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isTogglingObserve = false);
    }
  }

  void _refresh() {
    setState(() {
      _roomDataFuture = _fetchRoomData();
    });
  }

  Widget _buildTypeChip(String label, String value, String selected, ValueChanged<String> onSelect, {IconData? icon}) {
    final isSelected = value == selected;
    return GestureDetector(
      onTap: () => onSelect(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? context.themeColors.primary500 : context.themeColors.surfaceHighlight,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? context.themeColors.primary500 : context.themeColors.borderSubtle,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 12, color: isSelected ? Colors.white : context.themeColors.textSecondary),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? Colors.white : context.themeColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showLogDecisionSheet(BuildContext context) async {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final linkController = TextEditingController();
    String selectedType = 'decision';
    bool isSaving = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 16,
              ),
              decoration: BoxDecoration(
                color: context.themeColors.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: context.themeColors.borderSubtle),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: context.themeColors.borderSubtle,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: context.themeColors.primary500.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(LucideIcons.gitCommit, size: 18, color: context.themeColors.primary500),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              'Log Room Decision',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: context.themeColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.x, size: 18),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'STATUS / OUTCOME',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary),
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildTypeChip('Decision', 'decision', selectedType, (val) => setSheetState(() => selectedType = val), icon: LucideIcons.gitCommit),
                          const SizedBox(width: 8),
                          _buildTypeChip('Shipped', 'shipped', selectedType, (val) => setSheetState(() => selectedType = val), icon: LucideIcons.send),
                          const SizedBox(width: 8),
                          _buildTypeChip('Blocker', 'blocker', selectedType, (val) => setSheetState(() => selectedType = val), icon: LucideIcons.alertTriangle),
                          const SizedBox(width: 8),
                          _buildTypeChip('Scrapped', 'scrapped', selectedType, (val) => setSheetState(() => selectedType = val), icon: LucideIcons.trash2),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: titleController,
                      style: TextStyle(color: context.themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        labelText: 'Decision Title',
                        hintText: 'e.g. Choose Postgres RLS over custom auth gateway',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descriptionController,
                      maxLines: 3,
                      style: TextStyle(color: context.themeColors.textPrimary, fontSize: 12),
                      decoration: InputDecoration(
                        labelText: 'Rationale & Trade-Offs (Optional)',
                        hintText: 'Why was this chosen? What alternatives were rejected?',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: linkController,
                      style: TextStyle(color: context.themeColors.textPrimary, fontSize: 12),
                      decoration: InputDecoration(
                        labelText: 'External Link / PR (Optional)',
                        hintText: 'https://github.com/... or Notion link',
                        prefixIcon: const Icon(LucideIcons.link, size: 16),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton(
                        onPressed: isSaving ? null : () async {
                          final title = titleController.text.trim();
                          if (title.isEmpty) {
                            ToastService.show(context, 'Please enter a decision title', isError: true);
                            return;
                          }
                          final userId = Supabase.instance.client.auth.currentUser?.id;
                          if (userId == null) return;

                          setSheetState(() => isSaving = true);
                          try {
                            await Supabase.instance.client.from('room_decisions').insert({
                              'room_id': widget.roomId,
                              'builder_id': userId,
                              'type': selectedType,
                              'title': title,
                              'description': descriptionController.text.trim(),
                              'external_link': linkController.text.trim().isNotEmpty ? linkController.text.trim() : null,
                            });
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                            }
                            if (mounted) {
                              _refresh();
                              ToastService.show(context, 'Decision logged (+25 Rep)');
                            }
                          } catch (e) {
                            if (mounted) {
                              setSheetState(() => isSaving = false);
                              ToastService.show(context, 'Failed to log decision: $e', isError: true);
                            }
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.themeColors.primary500,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: isSaving
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Save Decision', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      body: FutureBuilder<Map<String, dynamic>>(
        future: _roomDataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
          }
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.redAccent)),
                  ElevatedButton(onPressed: _refresh, child: const Text("Retry"))
                ]
              )
            );
          }

          final data = snapshot.data!;
          final room = data['room'] as Map<String, dynamic>;
          final updates = data['updates'] as List<Map<String, dynamic>>;
          final decisions = data['decisions'] as List<Map<String, dynamic>>;
          final roadmapItems = (data['roadmapItems'] as List<Map<String, dynamic>>?) ?? [];
          final linearIssues = (data['linearIssues'] as List<Map<String, dynamic>>?) ?? [];
          final indicators = data['indicators'] as Map<String, dynamic>;
          final analytics = data['analytics'] as Map<String, dynamic>;
          
          return _buildContent(room, updates, decisions, roadmapItems, linearIssues, indicators, analytics);
        },
      ),
    );
  }
  
  Widget _buildContent(
    Map<String, dynamic> room, 
    List<Map<String, dynamic>> updates, 
    List<Map<String, dynamic>> decisions, 
    List<Map<String, dynamic>> roadmapItems,
    List<Map<String, dynamic>> linearIssues,
    Map<String, dynamic> indicators, 
    Map<String, dynamic> analytics
  ) {
    final description = room['description'] ?? 'No description provided.';
    final tags = List<String>.from(room['tags'] ?? []);
    final coverImage = room['cover_image'] ?? room['cover_image_url'];
    final builder = room['users'] as Map<String, dynamic>?;
    final isPrivate = room['is_private'] == true;
    final primaryLink = room['primary_link'] as String?;
    final projectStage = room['project_stage'] as String? ?? 'Ideation';
    
    // Derived values
    final builderName = builder?['name'] ?? room['builder_name'] ?? 'Builder';
    final String rawAvatar = builder?['avatar']?.toString() ?? '';
    final builderAvatar = rawAvatar.trim().isNotEmpty ? rawAvatar : null;
    final isVerified = builder?['is_verified_expert'] == true;
    
    final createdStr = room['created_at'];
    final createdDate = createdStr != null ? DateTime.tryParse(createdStr) : null;
    final lastUpdateStr = room['last_update_at'];
    final lastUpdateDate = lastUpdateStr != null ? DateTime.tryParse(lastUpdateStr) : null;
    final effectiveActivityDate = lastUpdateDate ?? createdDate ?? DateTime.now();
    final daysInactive = DateTime.now().difference(effectiveActivityDate).inDays;

    String activityLabel;
    Color activityColor;
    Color activityBg;
    bool showActivityDot = false;

    if (daysInactive <= 7) {
      activityLabel = 'ACTIVE';
      activityColor = const Color(0xFF10B981); // Emerald
      activityBg = const Color(0xFF10B981).withOpacity(0.12);
      showActivityDot = true;
    } else if (daysInactive <= 21) {
      activityLabel = 'PACED';
      activityColor = const Color(0xFF38BDF8); // Sky blue
      activityBg = const Color(0xFF38BDF8).withOpacity(0.12);
    } else {
      activityLabel = 'PAUSED';
      activityColor = context.themeColors.textTertiary;
      activityBg = Colors.white.withOpacity(0.04);
    }
    
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final isOwner = room['builder_id'] == currentUserId;

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: coverImage != null ? 300.0 : 120.0, // Taller immersive cover
              floating: false,
              pinned: true,
              backgroundColor: Colors.transparent, // Let glassmorphism show through
              elevation: 0,
              iconTheme: IconThemeData(color: context.themeColors.textPrimary),
              flexibleSpace: ClipRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                  child: FlexibleSpaceBar(
                    titlePadding: const EdgeInsets.only(left: 48, bottom: 16),
                    title: Text(
                      widget.title, 
                      style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: -0.5, shadows: [Shadow(color: Colors.black.withOpacity(0.5), blurRadius: 4)])
                    ),
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (coverImage != null)
                          Image.network(
                            coverImage,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              color: context.themeColors.primary500.withOpacity(0.1),
                              child: Icon(LucideIcons.image, color: context.themeColors.primary500, size: 34),
                            ),
                          )
                        else
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [context.themeColors.primary500.withOpacity(0.2), context.themeColors.background],
                              )
                            ),
                          ),
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.black.withOpacity(0.3),
                                Colors.transparent,
                                context.themeColors.background,
                              ],
                              stops: const [0.0, 0.5, 1.0],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title and Badges row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            widget.title,
                            style: TextStyle(color: context.themeColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    // Badges and Actions Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Badges
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: activityBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: activityColor.withOpacity(0.25)),
                              ),
                              child: Row(
                                children: [
                                  if (showActivityDot)
                                    Container(
                                      margin: const EdgeInsets.only(right: 5),
                                      width: 5,
                                      height: 5,
                                      decoration: BoxDecoration(
                                        color: activityColor,
                                        shape: BoxShape.circle,
                                        boxShadow: [BoxShadow(color: activityColor.withOpacity(0.6), blurRadius: 3, spreadRadius: 0.5)],
                                      ),
                                    ),
                                  Text(
                                    activityLabel,
                                    style: TextStyle(
                                      color: activityColor,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.6,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                              decoration: BoxDecoration(
                                color: isPrivate ? context.themeColors.textPrimary.withOpacity(0.9) : Colors.blueAccent.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isPrivate ? Colors.transparent : Colors.blueAccent.withOpacity(0.2),
                                )
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isPrivate ? LucideIcons.lock : LucideIcons.globe, 
                                    size: 8, 
                                    color: isPrivate ? context.themeColors.background : Colors.blueAccent
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    isPrivate ? 'PRIVATE' : 'PUBLIC',
                                    style: TextStyle(
                                      color: isPrivate ? context.themeColors.background : Colors.blueAccent,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            _buildStageBadge(projectStage),
                          ],
                        ),
                        const SizedBox(width: 12),
                        // Action Buttons
                        Flexible(
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (updates.isNotEmpty)
                                  _buildActionButton(
                                    icon: LucideIcons.play,
                                    color: Colors.amber,
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) {
                                            final milestones = updates.where((u) => u['update_type'] == 'shipped').toList();
                                            final decisionItems = decisions.map((d) => {
                                              'id': d['id'],
                                              'content': (d['title'] ?? '') + (d['description'] != null && d['description'].toString().isNotEmpty ? '\n\n${d['description']}' : ''),
                                              'created_at': d['created_at'],
                                              'update_type': 'decision',
                                              'media': [], 
                                            }).toList();
                                            
                                            final journeyItems = [...milestones, ...decisionItems]..sort((a, b) {
                                              final dateA = DateTime.tryParse(a['created_at'] ?? '') ?? DateTime.now();
                                              final dateB = DateTime.tryParse(b['created_at'] ?? '') ?? DateTime.now();
                                              return dateA.compareTo(dateB);
                                            });

                                            return JourneyTimelapseScreen(
                                              updates: journeyItems,
                                              roomTitle: widget.title,
                                            );
                                          },
                                        ),
                                      );
                                    },
                                  ),
                                if (primaryLink != null)
                                  _buildActionButton(
                                    icon: LucideIcons.externalLink, 
                                    onTap: () => launchUrl(Uri.parse(primaryLink.startsWith('http') ? primaryLink : 'https://$primaryLink')),
                                  ),
                                _buildActionButton(
                                  icon: LucideIcons.share2, 
                                  onTap: () {
                                    Share.share('Check out ${widget.title} on Patchwork: https://www.joinpatchwork.xyz/room/${widget.roomId}');
                                  },
                                ),
                                if (isOwner) ...[
                                  _buildActionButton(
                                    icon: LucideIcons.edit2, 
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(builder: (context) => EditRoomScreen(initialRoomData: room)),
                                      ).then((value) {
                                        if (value == true) _refresh();
                                      });
                                    },
                                  ),
                                  _buildActionButton(
                                    icon: LucideIcons.users, 
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(builder: (context) => TeamManagementScreen(roomId: widget.roomId, roomTitle: widget.title)),
                                      );
                                    },
                                  ),
                                  if (isPrivate)
                                    _buildActionButton(
                                      icon: LucideIcons.lock, 
                                      onTap: () {
                                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Room settings available on web!')));
                                      },
                                    ),
                                ]
                              ],
                            ),
                          ),
                        )
                      ],
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Description
                    Text(
                      description,
                      style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                    
                    // Tags Scrollable Row
                    if (tags.isNotEmpty)
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: tags.map((t) => Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: context.themeColors.primary500.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: context.themeColors.primary500.withOpacity(0.2)),
                            ),
                            child: Text(
                              t.toUpperCase(),
                              style: TextStyle(color: context.themeColors.primary500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                            ),
                          )).toList(),
                        ),
                      ),
                      
                    const SizedBox(height: 24),
                    Divider(color: context.themeColors.borderSubtle),
                    const SizedBox(height: 16),
                    
                    // Author & Meta Info Row
                    Row(
                      children: [
                        // Avatar
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: context.themeColors.primary500.withOpacity(0.2),
                          backgroundImage: builderAvatar != null ? NetworkImage(builderAvatar) : null,
                          child: builderAvatar == null ? Text(builderName[0].toUpperCase(), style: TextStyle(color: context.themeColors.primary500, fontSize: 11)) : null,
                        ),
                        const SizedBox(width: 12),
                        // Name & Verified
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    builderName,
                                    style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (isVerified) ...[
                                    const SizedBox(width: 4),
                                    Icon(LucideIcons.checkCircle2, size: 11, color: Colors.blueAccent),
                                  ]
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(LucideIcons.users, size: 10, color: context.themeColors.textTertiary),
                                  const SizedBox(width: 4),
                                  Text('$_observersCount', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600)),
                                  const SizedBox(width: 12),
                                  if (createdDate != null)
                                    Text(timeago.format(createdDate), style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11)),
                                ],
                              )
                            ],
                          ),
                        ),
                        
                        // Live Viewer Badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.greenAccent.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.greenAccent.withOpacity(0.2)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(color: Colors.greenAccent, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 6),
                              const Text('1 Live Viewer', style: TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            
            // Tab Content
            SliverFillRemaining(
              hasScrollBody: true,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _updatesList.isEmpty 
                    ? Center(
                        child: Text(
                          'No updates in this room yet.',
                          style: TextStyle(color: context.themeColors.textTertiary, fontWeight: FontWeight.w500),
                        ),
                      )
                    : ListView.builder(
                        controller: _updatesScrollController,
                        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 200),
                        itemCount: _updatesList.length + (_isLoadingMoreUpdates ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == _updatesList.length) {
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: CircularProgressIndicator(color: context.themeColors.primary500),
                              ),
                            );
                          }
                          return FeedUpdateCard(heroTagPrefix: "room_", update: _updatesList[index]);
                        },
                      )
                  ,
                  decisions.isEmpty 
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.gitCommit, size: 36, color: context.themeColors.textTertiary),
                              const SizedBox(height: 12),
                              Text(
                                'No decisions logged yet.',
                                style: TextStyle(color: context.themeColors.textTertiary, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Track technical & product choices with full context.',
                                style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11),
                              ),
                              if (isOwner) ...[
                                const SizedBox(height: 20),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    ElevatedButton.icon(
                                      onPressed: () => _showLogDecisionSheet(context),
                                      icon: const Icon(LucideIcons.plus, size: 14),
                                      label: const Text('Log Decision'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: context.themeColors.primary500,
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    OutlinedButton.icon(
                                      onPressed: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) => CreateSimulationScreen(
                                              preselectedRoomId: widget.roomId,
                                              preselectedRoomTitle: widget.title,
                                            ),
                                          ),
                                        );
                                      },
                                      icon: const Icon(LucideIcons.zap, size: 14, color: Colors.amber),
                                      label: const Text('Post Challenge', style: TextStyle(color: Colors.amber)),
                                      style: OutlinedButton.styleFrom(
                                        side: BorderSide(color: Colors.amber.withOpacity(0.4)),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 200),
                        itemCount: decisions.length + 1,
                        itemBuilder: (context, index) {
                          if (index == 0) {
                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: context.themeColors.surfaceHighlight.withOpacity(0.5),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: context.themeColors.borderSubtle),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Room Decision Ledger',
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.bold,
                                            color: context.themeColors.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${decisions.length} strategic decisions documented.',
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            color: context.themeColors.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (isOwner) ...[
                                    ElevatedButton.icon(
                                      onPressed: () => _showLogDecisionSheet(context),
                                      icon: const Icon(LucideIcons.plus, size: 12),
                                      label: const Text('Log Decision', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: context.themeColors.primary500,
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        minimumSize: Size.zero,
                                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    OutlinedButton.icon(
                                      onPressed: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) => CreateSimulationScreen(
                                              preselectedRoomId: widget.roomId,
                                              preselectedRoomTitle: widget.title,
                                            ),
                                          ),
                                        );
                                      },
                                      icon: const Icon(LucideIcons.zap, size: 12, color: Colors.amber),
                                      label: const Text('Challenge', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber)),
                                      style: OutlinedButton.styleFrom(
                                        side: BorderSide(color: Colors.amber.withOpacity(0.35)),
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                        minimumSize: Size.zero,
                                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          }

                          final decision = decisions[index - 1];
                          final status = decision['status'] ?? 'logged';
                          final isShipped = status == 'shipped';
                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: context.themeColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: context.themeColors.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      isShipped ? LucideIcons.checkCircle : LucideIcons.gitCommit,
                                      size: 13,
                                      color: isShipped ? Colors.greenAccent : context.themeColors.primary500,
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isShipped ? Colors.greenAccent.withOpacity(0.1) : context.themeColors.primary500.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        status.toUpperCase(),
                                        style: TextStyle(
                                          color: isShipped ? Colors.greenAccent : context.themeColors.primary400,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  decision['title'] ?? '',
                                  style: TextStyle(
                                    color: context.themeColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                if (decision['description'] != null && decision['description'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    decision['description'],
                                    style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, height: 1.4),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      timeago.format(DateTime.parse(decision['created_at'])),
                                      style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                    if (isOwner)
                                      InkWell(
                                        onTap: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (context) => CreateSimulationScreen(
                                                preselectedRoomId: widget.roomId,
                                                preselectedRoomTitle: widget.title,
                                                initialTitle: decision['title']?.toString() ?? '',
                                                initialPrompt: decision['description']?.toString() ?? '',
                                              ),
                                            ),
                                          );
                                        },
                                        borderRadius: BorderRadius.circular(8),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.amber.withOpacity(0.12),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: Colors.amber.withOpacity(0.35)),
                                          ),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(LucideIcons.zap, size: 11, color: Colors.amber),
                                              SizedBox(width: 4),
                                              Text(
                                                'Challenge',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.amber,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      )
                  ,
                  SingleChildScrollView(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.barChart3, size: 40, color: context.themeColors.textTertiary),
                              const SizedBox(height: 16),
                              Text(
                                'Room Analytics',
                                style: TextStyle(color: context.themeColors.textPrimary, fontSize: 17, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 24),
                              _buildAnalyticsCard(context, 'Total Views', analytics['totalViews'].toString(), '+12%', true),
                              const SizedBox(height: 12),
                              _buildAnalyticsCard(context, 'Engagements', analytics['engagements'].toString(), '+5%', true),
                              const SizedBox(height: 12),
                              _buildAnalyticsCard(context, 'Observer Growth', analytics['observerGrowth'].toString(), '-2%', false),
                              const SizedBox(height: 24),
                              ElevatedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Detailed analytics available on web.')));
                                },
                                icon: const Icon(LucideIcons.externalLink, size: 13),
                                label: const Text('View Full Report'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: context.themeColors.primary500.withOpacity(0.1),
                                  foregroundColor: context.themeColors.primary400,
                                  elevation: 0,
                                ),
                              ),
                              if (isOwner) ...[
                                const SizedBox(height: 16),
                                _isGeneratingAiNote
                                    ? const CircularProgressIndicator()
                                    : ElevatedButton.icon(
                                        onPressed: () => _generateReleaseNote(context),
                                        icon: const Icon(LucideIcons.sparkles, size: 13),
                                        label: const Text('Generate Release Note'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.purpleAccent.withOpacity(0.1),
                                          foregroundColor: Colors.purpleAccent,
                                          elevation: 0,
                                        ),
                                      ),
                              ]
                            ],
                          ),
                        ),
                      ),
                    )
                  ,
                  (() {
                    final plannedItems = roadmapItems.where((i) => i['status'] == 'planned').toList();
                    final inProgressItems = roadmapItems.where((i) => i['status'] == 'in_progress').toList();
                    final shippedItems = roadmapItems.where((i) => i['status'] == 'completed' || i['status'] == 'shipped').toList();

                    return SingleChildScrollView(
                      padding: const EdgeInsets.only(left: 16, right: 16, top: 20, bottom: 200),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Roadmap Section Header
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'ROADMAP & MILESTONES',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.5,
                                  color: context.themeColors.textTertiary,
                                ),
                              ),
                              if (roadmapItems.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: context.themeColors.primary500.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    '${roadmapItems.length} items',
                                    style: TextStyle(
                                      color: context.themeColors.primary400,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // If we have roadmap items or Linear issues
                          if (roadmapItems.isNotEmpty || linearIssues.isNotEmpty) ...[
                            // Stage 1: In Progress
                            if (inProgressItems.isNotEmpty) ...[
                              _buildRoadmapStageHeader('IN PROGRESS', inProgressItems.length, Colors.amber),
                              const SizedBox(height: 8),
                              ...inProgressItems.map((item) => _buildRoadmapItemCard(item, Colors.amber)),
                              const SizedBox(height: 16),
                            ],

                            // Stage 2: Planned
                            if (plannedItems.isNotEmpty) ...[
                              _buildRoadmapStageHeader('PLANNED', plannedItems.length, Colors.blueAccent),
                              const SizedBox(height: 8),
                              ...plannedItems.map((item) => _buildRoadmapItemCard(item, Colors.blueAccent)),
                              const SizedBox(height: 16),
                            ],

                            // Stage 3: Shipped
                            if (shippedItems.isNotEmpty) ...[
                              _buildRoadmapStageHeader('SHIPPED', shippedItems.length, Colors.greenAccent),
                              const SizedBox(height: 8),
                              ...shippedItems.map((item) => _buildRoadmapItemCard(item, Colors.greenAccent)),
                              const SizedBox(height: 16),
                            ],

                            // Linear Issues Integration List if present
                            if (linearIssues.isNotEmpty) ...[
                              _buildRoadmapStageHeader('LINEAR ISSUES', linearIssues.length, Colors.purpleAccent),
                              const SizedBox(height: 8),
                              ...linearIssues.map((issue) => Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: context.themeColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: context.themeColors.borderSubtle),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: Colors.purpleAccent.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(LucideIcons.checkSquare, size: 11, color: Colors.purpleAccent),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            issue['title'] ?? 'Linear Task',
                                            style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11),
                                          ),
                                          if (issue['state'] != null)
                                            Text(
                                              issue['state'].toString().toUpperCase(),
                                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              )),
                              const SizedBox(height: 16),
                            ],
                          ] else ...[
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: context.themeColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: context.themeColors.borderSubtle),
                              ),
                              child: Column(
                                children: [
                                  Icon(LucideIcons.map, size: 30, color: context.themeColors.textTertiary),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No Roadmap Items Yet',
                                    style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Milestones and tasks linked via Linear or Roadmap appear here.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, height: 1.4),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
                          ],

                          // Integrations Section
                          Text(
                            'WORKSPACE & INTEGRATIONS',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.5,
                              color: context.themeColors.textTertiary,
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Repositories
                          if (indicators['reposList'].isNotEmpty) ...[
                            ...((indicators['reposList'] as List).map((repo) => Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: context.themeColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: context.themeColors.borderSubtle),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.code, size: 13, color: Colors.purpleAccent),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      '${repo['github_owner']}/${repo['github_repo_name']}',
                                      style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11),
                                    ),
                                  ),
                                  Icon(LucideIcons.externalLink, size: 11, color: context.themeColors.textTertiary),
                                ],
                              ),
                            ))),
                            const SizedBox(height: 8),
                          ],

                          // Notion Docs
                          if (indicators['docsList'].isNotEmpty) ...[
                            ...((indicators['docsList'] as List).map((doc) => GestureDetector(
                              onTap: () {
                                if (doc['url'] != null) launchUrl(Uri.parse(doc['url']), mode: LaunchMode.externalApplication);
                              },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: context.themeColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: context.themeColors.borderSubtle),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(LucideIcons.fileText, size: 13, color: Colors.blueAccent),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        doc['title'] ?? 'Untitled Document',
                                        style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11),
                                      ),
                                    ),
                                    Icon(LucideIcons.externalLink, size: 11, color: context.themeColors.textTertiary),
                                  ],
                                ),
                              ),
                            ))),
                            const SizedBox(height: 8),
                          ],

                          const SizedBox(height: 12),
                          Center(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                launchUrl(Uri.parse('https://joinpatchwork.xyz/dashboard'), mode: LaunchMode.externalApplication);
                              },
                              icon: const Icon(LucideIcons.externalLink, size: 11),
                              label: const Text('Manage Webhooks & Integrations'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: context.themeColors.primary400,
                                side: BorderSide(color: context.themeColors.primary500.withOpacity(0.3)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  })(),
                ],
              ),
            )
          ],
        ),
        
        // Custom Floating Bottom Navigation Bar (Matches Web App)
        Positioned(
          bottom: 32,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
              decoration: BoxDecoration(
                color: context.themeColors.background,
                borderRadius: BorderRadius.circular(100),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.1),
                    blurRadius: 1,
                    spreadRadius: 1,
                  )
                ]
              ),
              child: AnimatedBuilder(
                animation: _tabController,
                builder: (context, _) {
                  return SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildFloatingTab(
                          index: 0,
                          icon: LucideIcons.messageCircle,
                          label: 'Updates',
                          count: updates.length,
                        ),
                        const SizedBox(width: 4),
                        _buildFloatingTab(
                          index: 1,
                          icon: LucideIcons.gitCommit,
                          label: 'Decisions',
                          count: decisions.length,
                        ),
                        const SizedBox(width: 4),
                        _buildFloatingTab(
                          index: 2,
                          icon: LucideIcons.layoutDashboard,
                          label: 'Overview',
                        ),
                        const SizedBox(width: 4),
                        _buildFloatingTab(
                          index: 3,
                          icon: LucideIcons.layers,
                          label: 'Workspace',
                        ),
                      ],
                    ),
                  );
                }
              ),
            ),
          ),
        ),
        
        // Floating Action Button
        if (isOwner)
          Positioned(
            bottom: 90, // Moved up to avoid overlapping the bottom navigation bar
            right: 24,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(color: context.themeColors.primary500.withOpacity(0.4), blurRadius: 16, offset: const Offset(0, 4)),
                ],
              ),
              child: FloatingActionButton.extended(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (context) => CreateUpdateScreen(preselectedRoomId: widget.roomId, preselectedRoomTitle: widget.title)),
                  ).then((_) => _refresh());
                },
                backgroundColor: context.themeColors.primary500,
                foregroundColor: Colors.white,
                icon: const Icon(LucideIcons.plus),
                label: const Text('Share Update', style: TextStyle(fontWeight: FontWeight.bold)),
                elevation: 0,
              ),
            ),
          ),
      ],
    );
  }
  
  Widget _buildAnalyticsCard(BuildContext context, String title, String value, String change, bool isPositive) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11)),
          Row(
            children: [
              Text(value, style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: (isPositive ? Colors.green : Colors.red).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  change,
                  style: TextStyle(color: isPositive ? Colors.green : Colors.red, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildIndicatorRow(IconData icon, String label, Color color) {
    return Row(
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 12),
        Text(label, style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
      ],
    );
  }
  
  Widget _buildStageBadge(String stage) {
    const stageData = {
      'Ideation':    {'icon': LucideIcons.lightbulb,    'color': 0xFFF59E0B},
      'Prototyping': {'icon': LucideIcons.hammer,       'color': 0xFF8B5CF6},
      'Beta':        {'icon': LucideIcons.flaskConical, 'color': 0xFF3B82F6},
      'Launched':    {'icon': LucideIcons.rocket,       'color': 0xFF10B981},
    };
    final entry = stageData[stage] ?? stageData['Ideation']!;
    final color = Color(entry['color'] as int);
    final icon = entry['icon'] as IconData;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 9, color: color),
          const SizedBox(width: 4),
          Text(
            stage.toUpperCase(),
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({required IconData icon, required VoidCallback onTap, Color? color}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(left: 8),
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: color != null ? color.withOpacity(0.1) : Colors.white.withOpacity(0.05),
          border: Border.all(color: color != null ? color.withOpacity(0.3) : Colors.white.withOpacity(0.1)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 11, color: color ?? context.themeColors.textSecondary),
      ),
    );
  }
  Widget _buildFloatingTab({required int index, required IconData icon, required String label, int? count}) {
    final isActive = _tabController.index == index;
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        _tabController.animateTo(index);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? Colors.white.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: isActive ? Colors.white.withOpacity(0.15) : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 13,
              color: isActive ? context.themeColors.primary400 : context.themeColors.textTertiary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : context.themeColors.textTertiary,
                fontWeight: FontWeight.bold,
                fontSize: 11,
              ),
            ),
            if (count != null) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isActive ? context.themeColors.primary500.withOpacity(0.2) : Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    color: isActive ? context.themeColors.primary400 : context.themeColors.textTertiary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRoadmapStageHeader(String title, int count, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: color,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '$count',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRoadmapItemCard(Map<String, dynamic> item, Color accentColor) {
    final title = item['title'] ?? 'Milestone';
    final description = item['description'] as String?;
    final priority = item['priority'] as String? ?? 'medium';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    color: context.themeColors.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  priority.toUpperCase(),
                  style: TextStyle(
                    color: accentColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (description != null && description.trim().isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              description,
              style: TextStyle(
                color: context.themeColors.textSecondary,
                fontSize: 11,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}
