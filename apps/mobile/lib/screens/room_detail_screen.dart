import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../theme.dart';
import '../widgets/feed_update_card.dart';
import 'create_update_screen.dart';
import 'edit_room_screen.dart';
import 'team_management_screen.dart';
import 'public_profile_screen.dart';

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
  bool _isTogglingObserve = false;
  int _observersCount = 0;
  
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _roomDataFuture = _fetchRoomData();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
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
        .select('*, rooms(title, tags), users(name, avatar, is_verified_expert, organization_name)')
        .eq('room_id', widget.roomId)
        .order('created_at', ascending: false);

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
    try {
      final decRes = await Supabase.instance.client.from('room_decisions').select('id').eq('room_id', widget.roomId);
      decisionsCount += (decRes as List).length;
    } catch (_) {}

    int totalViews = 0;
    for (var u in updatesResponse) {
      totalViews += (u['view_count'] as int?) ?? 0;
    }

    int totalEngagements = 0;
    try {
      final reactRes = await Supabase.instance.client.from('reactions').select('id').eq('room_id', widget.roomId);
      totalEngagements = (reactRes as List).length;
    } catch (_) {}

    return {
      'room': roomResponse,
      'updates': List<Map<String, dynamic>>.from(updatesResponse),
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
          final indicators = data['indicators'] as Map<String, dynamic>;
          final analytics = data['analytics'] as Map<String, dynamic>;
          
          return _buildContent(room, updates, indicators, analytics);
        },
      ),
    );
  }
  
  Widget _buildContent(Map<String, dynamic> room, List<Map<String, dynamic>> updates, Map<String, dynamic> indicators, Map<String, dynamic> analytics) {
    final description = room['description'] ?? 'No description provided.';
    final tags = List<String>.from(room['tags'] ?? []);
    final coverImage = room['cover_image'] ?? room['cover_image_url'];
    final builder = room['users'] as Map<String, dynamic>?;
    final isPrivate = room['is_private'] == true;
    final status = room['status'] ?? 'active';
    final primaryLink = room['primary_link'] as String?;
    
    // Derived values
    final builderName = builder?['name'] ?? room['builder_name'] ?? 'Builder';
    final builderAvatar = builder?['avatar'];
    final isVerified = builder?['is_verified_expert'] == true;
    
    final createdStr = room['created_at'];
    final createdDate = createdStr != null ? DateTime.tryParse(createdStr) : null;
    
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final isOwner = room['builder_id'] == currentUserId;

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: coverImage != null ? 240.0 : 120.0,
              floating: false,
              pinned: true,
              backgroundColor: context.themeColors.background,
              elevation: 0,
              iconTheme: IconThemeData(color: context.themeColors.textPrimary),
              title: Text(
                widget.title, 
                style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)
              ),
              flexibleSpace: coverImage != null ? FlexibleSpaceBar(
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(
                      coverImage,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: context.themeColors.primary500.withOpacity(0.1),
                        child: Icon(LucideIcons.image, color: context.themeColors.primary500, size: 40),
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withOpacity(0.4),
                            Colors.transparent,
                            context.themeColors.background,
                          ],
                          stops: const [0.0, 0.5, 1.0],
                        ),
                      ),
                    ),
                  ],
                ),
              ) : null,
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
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                              decoration: BoxDecoration(
                                color: status == 'active' 
                                  ? Colors.greenAccent.withOpacity(0.1) 
                                  : Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: status == 'active' 
                                    ? Colors.greenAccent.withOpacity(0.2)
                                    : Colors.white.withOpacity(0.1),
                                )
                              ),
                              child: Row(
                                children: [
                                  if (status == 'active')
                                    Container(
                                      margin: const EdgeInsets.only(right: 4),
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: Colors.greenAccent,
                                        shape: BoxShape.circle,
                                        boxShadow: [BoxShadow(color: Colors.greenAccent, blurRadius: 4)],
                                      ),
                                    ),
                                  Text(
                                    status.toUpperCase(),
                                    style: TextStyle(
                                      color: status == 'active' ? Colors.greenAccent : context.themeColors.textSecondary,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5
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
                        
                        // Action Buttons
                        Row(
                          children: [
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
              child: AnimatedBuilder(
                animation: _tabController,
                builder: (context, _) {
                  if (_tabController.index == 0) {
                    return updates.isEmpty 
                      ? Center(
                          child: Text(
                            'No updates in this room yet.',
                            style: TextStyle(color: context.themeColors.textTertiary, fontWeight: FontWeight.w500),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 200),
                          itemCount: updates.length,
                          itemBuilder: (context, index) {
                            return FeedUpdateCard(update: updates[index]);
                          },
                        );
                  } else if (_tabController.index == 1) {
                    return SingleChildScrollView(
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
                            ],
                          ),
                        ),
                      ),
                    );
                  } else {
                    return SingleChildScrollView(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.map, size: 48, color: context.themeColors.textTertiary),
                              const SizedBox(height: 16),
                              Text(
                                'Roadmap & Workspace',
                                style: TextStyle(color: context.themeColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 24),
                              // Repositories
                              if (indicators['reposList'].isNotEmpty) ...[
                                Row(
                                  children: [
                                    Icon(LucideIcons.github, size: 16, color: context.themeColors.textSecondary),
                                    const SizedBox(width: 8),
                                    Text('GitHub Repositories', style: TextStyle(color: context.themeColors.textSecondary, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                ...((indicators['reposList'] as List).map((repo) => Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.02),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text('${repo['github_owner']}/${repo['github_repo_name']}', style: TextStyle(color: context.themeColors.textPrimary)),
                                      ),
                                      Icon(LucideIcons.externalLink, size: 14, color: context.themeColors.textTertiary),
                                    ],
                                  ),
                                ))).toList(),
                                const SizedBox(height: 24),
                              ],

                              // Notion Docs
                              if (indicators['docsList'].isNotEmpty) ...[
                                Row(
                                  children: [
                                    Icon(LucideIcons.fileText, size: 16, color: Colors.blueAccent),
                                    const SizedBox(width: 8),
                                    Text('Notion Documents', style: TextStyle(color: context.themeColors.textSecondary, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                ...((indicators['docsList'] as List).map((doc) => GestureDetector(
                                  onTap: () {
                                    if (doc['url'] != null) launchUrl(Uri.parse(doc['url']), mode: LaunchMode.externalApplication);
                                  },
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.02),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Colors.white.withOpacity(0.05)),
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Text(doc['title'] ?? 'Untitled Document', style: TextStyle(color: context.themeColors.textPrimary)),
                                        ),
                                        Icon(LucideIcons.externalLink, size: 14, color: context.themeColors.textTertiary),
                                      ],
                                    ),
                                  ),
                                ))).toList(),
                                const SizedBox(height: 24),
                              ],
                              
                              // Indicators
                              if (indicators['docs'] > 0 || indicators['repos'] > 0 || indicators['decisions'] > 0)
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.05),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                                  ),
                                  child: Column(
                                    children: [
                                      if (indicators['docs'] > 0)
                                        _buildIndicatorRow(LucideIcons.fileText, '${indicators['docs']} Linked Docs', Colors.blue),
                                      if (indicators['docs'] > 0 && indicators['repos'] > 0) const SizedBox(height: 12),
                                      if (indicators['repos'] > 0)
                                        _buildIndicatorRow(LucideIcons.github, '${indicators['repos']} Repositories', Colors.purple),
                                      if ((indicators['docs'] > 0 || indicators['repos'] > 0) && indicators['decisions'] > 0) const SizedBox(height: 12),
                                      if (indicators['decisions'] > 0)
                                        _buildIndicatorRow(LucideIcons.gitCommit, '${indicators['decisions']} Decisions Logged', Colors.orange),
                                    ],
                                  ),
                                ),
                              
                              const SizedBox(height: 12),
                              ElevatedButton.icon(
                                onPressed: () {
                                  launchUrl(Uri.parse('https://joinpatchwork.xyz/dashboard'), mode: LaunchMode.externalApplication);
                                },
                                icon: const Icon(LucideIcons.settings, size: 16),
                                label: const Text('Manage Integrations on Web'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: context.themeColors.primary500.withOpacity(0.2),
                                  foregroundColor: context.themeColors.primary400,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              )
                            ],
                          ),
                        ),
                      ),
                    );
                  }
                }
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
                color: const Color(0xFF14161E), // Dark slate/black color
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
                  return Row(
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
                        icon: LucideIcons.layoutDashboard,
                        label: 'Overview',
                      ),
                      const SizedBox(width: 4),
                      _buildFloatingTab(
                        index: 2,
                        icon: LucideIcons.layers,
                        label: 'Workspace',
                      ),
                    ],
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
  
  Widget _buildActionButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(left: 8),
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 14, color: context.themeColors.textSecondary),
      ),
    );
  }
  Widget _buildFloatingTab({required int index, required IconData icon, required String label, int? count}) {
    final isActive = _tabController.index == index;
    return GestureDetector(
      onTap: () {
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
}
