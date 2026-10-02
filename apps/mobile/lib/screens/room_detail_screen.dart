import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../theme.dart';
import '../widgets/feed_update_card.dart';
import 'create_update_screen.dart';
import 'edit_room_screen.dart';
import 'team_management_screen.dart';
import 'public_profile_screen.dart';
import 'journey_timelapse_screen.dart';

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
  bool _isFollowing = false;
  bool _isLoadingFollow = true;
  bool _isGeneratingAiNote = false;
  bool _isTogglingObserve = false;
  
  Map<String, dynamic>? _room;
  List<Map<String, dynamic>> _updates = [];
  List<Map<String, dynamic>> _decisions = [];
  Map<String, dynamic> _analytics = {
    'totalViews': 0,
    'engagements': 0,
    'observerGrowth': 0,
  };
  Map<String, dynamic> _indicators = {
    'reposList': [],
    'hasLinear': false,
    'hasNotion': false,
    'hasFigma': false,
  };

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
                          Text('AI Release Note', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
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
          .select('*, rooms(title, tags), users(name, username, twitter, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert)), polls(*, poll_options(*))')
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
        .select('*, users!builder_id(name, avatar, is_verified_expert)')
        .eq('id', widget.roomId)
        .single();
        
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
        .select('*, rooms(title, tags), users(name, username, twitter, avatar, is_verified_expert, organization_name), original_update:repost_id(*, users(name, username, twitter, avatar, is_verified_expert)), polls(*, poll_options(*))')
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => CreateUpdateScreen(
                preselectedRoomId: widget.roomId,
              ),
            ),
          ).then((value) {
            if (value == true) _refresh();
          });
        },
        backgroundColor: context.themeColors.primary500,
        icon: const Icon(LucideIcons.messageSquare, color: Colors.white),
        label: const Text('Post Update', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
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
    
    // Derived values
    final builderName = builder?['name'] ?? room['builder_name'] ?? 'Builder';
    final builderAvatar = builder?['avatar'];
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
                      style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: -0.5, shadows: [Shadow(color: Colors.black.withOpacity(0.5), blurRadius: 4)])
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
                              child: Icon(LucideIcons.image, color: context.themeColors.primary500, size: 40),
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
                            style: TextStyle(color: context.themeColors.textPrimary, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
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
                                      fontSize: 9.5,
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
                                    size: 10, 
                                    color: isPrivate ? context.themeColors.background : Colors.blueAccent
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    isPrivate ? 'PRIVATE' : 'PUBLIC',
                                    style: TextStyle(
                                      color: isPrivate ? context.themeColors.background : Colors.blueAccent,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5
                                    ),
                                  ),
                                ],
                              ),
                            ),
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
                      style: TextStyle(color: context.themeColors.textSecondary, fontSize: 14, height: 1.5),
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
                              style: TextStyle(color: context.themeColors.primary500, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
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
                          child: builderAvatar == null ? Text(builderName[0].toUpperCase(), style: TextStyle(color: context.themeColors.primary500, fontSize: 12)) : null,
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
                                    style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (isVerified) ...[
                                    const SizedBox(width: 4),
                                    Icon(LucideIcons.checkCircle2, size: 14, color: Colors.blueAccent),
                                  ]
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(LucideIcons.users, size: 12, color: context.themeColors.textTertiary),
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
                              const Text('1 Live Viewer', style: TextStyle(color: Colors.greenAccent, fontSize: 9, fontWeight: FontWeight.bold)),
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
                        child: Text(
                          'No decisions logged yet.',
                          style: TextStyle(color: context.themeColors.textTertiary, fontWeight: FontWeight.w500),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 200),
                        itemCount: decisions.length,
                        itemBuilder: (context, index) {
                          final decision = decisions[index];
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
                                      size: 16,
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
                                          fontSize: 9,
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
                                    fontSize: 16,
                                  ),
                                ),
                                if (decision['description'] != null && decision['description'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    decision['description'],
                                    style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, height: 1.4),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Text(
                                  timeago.format(DateTime.parse(decision['created_at'])),
                                  style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.bold),
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
                              Icon(LucideIcons.barChart3, size: 48, color: context.themeColors.textTertiary),
                              const SizedBox(height: 16),
                              Text(
                                'Room Analytics',
                                style: TextStyle(color: context.themeColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold),
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
                                icon: const Icon(LucideIcons.externalLink, size: 16),
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
                                        icon: const Icon(LucideIcons.sparkles, size: 16),
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
                                      fontSize: 10,
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
                                      child: const Icon(LucideIcons.checkSquare, size: 14, color: Colors.purpleAccent),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            issue['title'] ?? 'Linear Task',
                                            style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                          ),
                                          if (issue['state'] != null)
                                            Text(
                                              issue['state'].toString().toUpperCase(),
                                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 10, fontWeight: FontWeight.w600),
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
                                  Icon(LucideIcons.map, size: 36, color: context.themeColors.textTertiary),
                                  const SizedBox(height: 12),
                                  Text(
                                    'No Roadmap Items Yet',
                                    style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Milestones and tasks linked via Linear or Roadmap appear here.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, height: 1.4),
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
                                  const Icon(LucideIcons.github, size: 16, color: Colors.purpleAccent),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      '${repo['github_owner']}/${repo['github_repo_name']}',
                                      style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ),
                                  Icon(LucideIcons.externalLink, size: 14, color: context.themeColors.textTertiary),
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
                                    const Icon(LucideIcons.fileText, size: 16, color: Colors.blueAccent),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        doc['title'] ?? 'Untitled Document',
                                        style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                    ),
                                    Icon(LucideIcons.externalLink, size: 14, color: context.themeColors.textTertiary),
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
                              icon: const Icon(LucideIcons.externalLink, size: 14),
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
          Text(title, style: TextStyle(color: context.themeColors.textSecondary, fontSize: 14)),
          Row(
            children: [
              Text(value, style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
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
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 12),
        Text(label, style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
      ],
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
        child: Icon(icon, size: 14, color: color ?? context.themeColors.textSecondary),
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
              size: 16,
              color: isActive ? context.themeColors.primary400 : context.themeColors.textTertiary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : context.themeColors.textTertiary,
                fontWeight: FontWeight.bold,
                fontSize: 12,
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
                    fontSize: 10,
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
              fontSize: 10,
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
                    fontSize: 14,
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
                    fontSize: 9,
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
                fontSize: 12,
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
