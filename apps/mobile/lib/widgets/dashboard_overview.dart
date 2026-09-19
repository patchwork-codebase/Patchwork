import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../screens/create_update_screen.dart';
import '../screens/create_room_screen.dart';
import '../screens/room_detail_screen.dart';
import '../screens/notifications_screen.dart';
import 'recent_activity_list.dart';
import 'dashboard_achievements.dart';
import 'feed_update_card.dart';
import 'skeleton_loaders.dart';

class DashboardOverview extends StatefulWidget {
  const DashboardOverview({super.key});

  @override
  State<DashboardOverview> createState() => _DashboardOverviewState();
}

class _DashboardOverviewState extends State<DashboardOverview> {
  List<Map<String, dynamic>> _myRooms = [];
  Map<String, dynamic>? _userProfile;
  Map<String, dynamic>? _workspaceMetrics;
  int _unreadNotifications = 0;
  bool _isLoading = true;
  bool _isLoadingMetrics = false;
  
  final PageController _carouselController = PageController();
  int _currentCarouselIndex = 0;

  // Triage Inbox
  List<Map<String, dynamic>> _triageUpdates = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final profileFuture = Supabase.instance.client
          .from('users')
          .select('name, avatar')
          .eq('id', userId)
          .maybeSingle();
          
      final roomsFuture = Supabase.instance.client
          .from('rooms')
          .select('id, title, tags, update_count, created_at')
          .eq('builder_id', userId)
          .order('created_at', ascending: false);

      final unreadFuture = Supabase.instance.client
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('read', false);

      final recentUpdatesFuture = Supabase.instance.client
          .from('updates')
          .select('created_at')
          .eq('author_id', userId)
          .gte('created_at', DateTime.now().subtract(const Duration(days: 14)).toIso8601String())
          .order('created_at', ascending: false);

      final triageFuture = Supabase.instance.client
          .from('updates')
          .select('*, rooms(title, tags), users(name, avatar, is_verified_expert)')
          .eq('author_id', userId)
          .eq('needs_feedback', true)
          .order('created_at', ascending: false)
          .limit(5);
          
      final results = await Future.wait<dynamic>([
        profileFuture, 
        roomsFuture, 
        unreadFuture, 
        recentUpdatesFuture,
        triageFuture
      ]);
      
      if (mounted) {
        setState(() {
          _userProfile = results[0] as Map<String, dynamic>?;
          _myRooms = List<Map<String, dynamic>>.from(results[1] as List);
          _unreadNotifications = (results[2] as List).length;
          _calculateActivity(results[3] as List);
          _triageUpdates = List<Map<String, dynamic>>.from(results[4] as List);
          
          if (_myRooms.isNotEmpty && _activeWorkspaceId == null) {
            _activeWorkspaceId = _myRooms.first['id'];
          }
          _isLoading = false;
        });
        
        if (_activeWorkspaceId != null) {
          _fetchWorkspaceMetrics(_activeWorkspaceId!);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchWorkspaceMetrics(String workspaceId) async {
    if (mounted) setState(() => _isLoadingMetrics = true);
    try {
      final res = await Supabase.instance.client
          .rpc('get_workspace_metrics', params: {'p_workspace_id': workspaceId});
      if (mounted) {
        setState(() {
          _workspaceMetrics = res as Map<String, dynamic>?;
          _isLoadingMetrics = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingMetrics = false);
    }
  }

  int _currentStreak = 0;
  List<int> _weeklyActivity = List.filled(7, 0);
  String? _activeWorkspaceId;
  bool _isStageOpen = false;

  void _calculateActivity(List<dynamic> updates) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    Set<int> activeDays = {};
    List<int> weekly = List.filled(7, 0);

    for (var u in updates) {
      if (u['created_at'] == null) continue;
      final date = DateTime.parse(u['created_at']).toLocal();
      final dayDiff = today.difference(DateTime(date.year, date.month, date.day)).inDays;
      activeDays.add(dayDiff);
      
      if (dayDiff >= 0 && dayDiff < 7) {
        weekly[6 - dayDiff]++; // Index 6 is today, 0 is 6 days ago
      }
    }
    
    // Calculate streak
    int streak = 0;
    if (activeDays.contains(0) || activeDays.contains(1)) {
      int checkDay = activeDays.contains(0) ? 0 : 1;
      while (activeDays.contains(checkDay)) {
        streak++;
        checkDay++;
      }
    }

    _currentStreak = streak;
    _weeklyActivity = weekly;
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  }

  int get _totalUpdates {
    int total = 0;
    for (var room in _myRooms) {
      total += (room['update_count'] as int?) ?? 0;
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.transparent,
        body: BuilderDashboardSkeleton(),
      );
    }

    final userName = _userProfile?['name'] ?? 'Builder';
    final userAvatar = _userProfile?['avatar'];
    final initial = userName.isNotEmpty ? userName.substring(0, 1).toUpperCase() : 'B';
    final firstName = userName.split(' ').first;

    return AnimatedScale(
      scale: _isStageOpen ? 0.93 : 1.0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCirc,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(_isStageOpen ? 32 : 0),
        ),
        clipBehavior: Clip.hardEdge,
        child: Stack(
          children: [
        // Dynamic Glowing Background removed per user request

        ListView(
          padding: EdgeInsets.only(
            top: MediaQuery.of(context).padding.top + 16,
            bottom: 120,
            left: 16,
            right: 16,
          ),
          children: [
            // 1. Contextual Header
            _buildHeader(firstName, userAvatar, initial),
            const SizedBox(height: 24),

            // 2. Bento Grid: Pulse & Actions
            SizedBox(
              height: 140,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Pulse Card (Left)
                  Expanded(
                    flex: 5,
                    child: _buildPulseCard().animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0),
                  ),
                  const SizedBox(width: 12),
                  // Quick Actions (Right Stack)
                  Expanded(
                    flex: 4,
                    child: Column(
                      children: [
                        Expanded(
                          child: _buildActionCard(
                            title: "New Update",
                            icon: LucideIcons.zap,
                            color: Colors.amber,
                            onTap: () {
                              HapticFeedback.lightImpact();
                              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const CreateUpdateScreen())).then((_) => _fetchData());
                            },
                          ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.1, end: 0),
                        ),
                        const SizedBox(height: 12),
                        Expanded(
                          child: _buildActionCard(
                            title: "New Room",
                            icon: LucideIcons.box,
                            color: context.themeColors.primary400,
                            onTap: () {
                              HapticFeedback.lightImpact();
                              Navigator.of(context).push(MaterialPageRoute(builder: (context) => const CreateRoomScreen())).then((_) => _fetchData());
                            },
                          ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.1, end: 0),
                        ),
                      ],
                    ),
                  ),
                ],
              ).animate().fadeIn(duration: 400.ms),
            ),
            const SizedBox(height: 32),

            // 3. Needs Attention Triage
            if (_triageUpdates.isNotEmpty) ...[
              const SizedBox(height: 32),
              _buildSectionHeader('NEEDS ATTENTION'),
              const SizedBox(height: 16),
              _buildTriageInbox(),
            ],

            // 4. Active Workspaces
            if (_myRooms.isNotEmpty) ...[
              const SizedBox(height: 32),
              _buildWorkspaceSelector(),
              const SizedBox(height: 16),
              if (_activeWorkspaceId != null)
                _buildActiveWorkspaceCard(_myRooms.firstWhere((r) => r['id'] == _activeWorkspaceId, orElse: () => _myRooms.first))
                    .animate(key: ValueKey(_activeWorkspaceId))
                    .fadeIn(duration: 400.ms)
                    .slideY(begin: 0.05, end: 0),
            ] else ...[
              const SizedBox(height: 32),
              _buildEmptyState(),
            ],
            // Workspace Insights Carousel
            const SizedBox(height: 32),
            _buildSectionHeader('WORKSPACE INSIGHTS').animate().fadeIn(delay: 450.ms),
            const SizedBox(height: 16),
            SizedBox(
              height: 420, // Fixed height for carousel items
              child: PageView(
                controller: _carouselController,
                onPageChanged: (index) {
                  setState(() => _currentCarouselIndex = index);
                  HapticFeedback.selectionClick();
                },
                children: [
                  _buildObserverReactionsCard().animate().fadeIn(delay: 500.ms).slideX(begin: 0.1, end: 0),
                  _buildTopObserversCard().animate().fadeIn(delay: 600.ms).slideX(begin: 0.1, end: 0),
                  _buildLinkedDocsCard().animate().fadeIn(delay: 700.ms).slideX(begin: 0.1, end: 0),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(3, (index) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentCarouselIndex == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentCarouselIndex == index ? context.themeColors.primary500 : context.themeColors.borderSubtle,
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),

            const SizedBox(height: 32),

            // 4. Activity Pulse
            Text('LATEST PULSE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.themeColors.textSecondary, letterSpacing: 1.5))
                .animate().fadeIn(delay: 600.ms),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: context.themeColors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.themeColors.borderSubtle),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: RecentActivityList(
                  userId: Supabase.instance.client.auth.currentUser!.id,
                  activeRoomId: _myRooms.isNotEmpty ? _myRooms.first['id'] : null,
                  activeRoomTitle: _myRooms.isNotEmpty ? _myRooms.first['title'] : null,
                ),
              ),
            ).animate().fadeIn(delay: 700.ms).slideY(begin: 0.05, end: 0),
            
            const SizedBox(height: 24),
            DashboardAchievements(userId: Supabase.instance.client.auth.currentUser!.id).animate().fadeIn(delay: 800.ms),
          ],
        ),
      ],
    ),
    ),
    );
  }

  Widget _buildHeader(String firstName, String? userAvatar, String initial) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: context.themeColors.surfaceHighlight,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: context.themeColors.borderSubtle),
                image: userAvatar != null && userAvatar.isNotEmpty
                    ? DecorationImage(image: NetworkImage(userAvatar), fit: BoxFit.cover)
                    : null,
              ),
              child: userAvatar == null || userAvatar.isEmpty
                  ? Center(child: Text(initial, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: context.themeColors.textPrimary)))
                  : null,
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$_greeting,',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: context.themeColors.textSecondary),
                ),
                Text(
                  firstName,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary, letterSpacing: -0.5),
                ),
              ],
            ),
          ],
        ),
        GestureDetector(
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsScreen())).then((_) => _fetchData());
          },
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(LucideIcons.bell, size: 20, color: context.themeColors.textPrimary),
                if (_unreadNotifications > 0)
                  Positioned(
                    top: 10,
                    right: 12,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                    ).animate(onPlay: (c) => c.repeat(reverse: true)).fade(begin: 0.5, end: 1),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPulseCard() {
    // Find the max value for scaling the sparkline
    final maxUpdates = _weeklyActivity.isEmpty ? 1 : _weeklyActivity.reduce((a, b) => a > b ? a : b);
    final scale = maxUpdates > 0 ? maxUpdates : 1;

    return Container(
      height: 140,
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.deepOrangeAccent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(LucideIcons.flame, color: Colors.deepOrangeAccent, size: 20),
                ),
                // Mini Sparkline
                SizedBox(
                  height: 24,
                  width: 60,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(7, (index) {
                      final val = _weeklyActivity[index];
                      final heightRatio = val / scale;
                      return Container(
                        width: 4,
                        height: 4 + (20 * heightRatio),
                        decoration: BoxDecoration(
                          color: index == 6 ? Colors.deepOrangeAccent : context.themeColors.borderSubtle,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '$_currentStreak',
                          style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary, height: 1.0, letterSpacing: -1),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'DAY',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'CURRENT STREAK',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.deepOrangeAccent, letterSpacing: 1.0),
                    ),
                  ],
                ),
                // Trend Indicator
                Row(
                  children: [
                    Icon(LucideIcons.trendingUp, size: 14, color: Colors.green),
                    const SizedBox(width: 4),
                    Text('+12%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({required String title, required IconData icon, required Color color, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: context.themeColors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: context.themeColors.borderSubtle),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 16),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: context.themeColors.textPrimary),
                ),
              ),
              Icon(LucideIcons.arrowRight, size: 16, color: color.withOpacity(0.7)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: context.themeColors.textSecondary, letterSpacing: 1.5),
    );
  }

  Widget _buildTriageInbox() {
    return Column(
      children: _triageUpdates.map((update) {
        final updateId = update['id'];
        final title = update['rooms']?['title'] ?? 'Room';
        final content = update['content'] ?? '';
        
        return Dismissible(
          key: Key(updateId),
          direction: DismissDirection.endToStart,
          onDismissed: (direction) {
            setState(() {
              _triageUpdates.removeWhere((u) => u['id'] == updateId);
            });
            Supabase.instance.client
                .from('updates')
                .update({'needs_feedback': false})
                .eq('id', updateId);
          },
          background: Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.green,
              borderRadius: BorderRadius.circular(16),
            ),
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 24),
            child: const Icon(LucideIcons.checkCircle2, color: Colors.white),
          ),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.amber.withOpacity(0.5), width: 2),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.messageSquare, color: Colors.amber, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        content,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: context.themeColors.textPrimary),
                      ),
                    ],
                  ),
                ),
                Icon(LucideIcons.chevronRight, color: context.themeColors.textTertiary, size: 20),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildActiveWorkspaceCard(Map<String, dynamic> room) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(LucideIcons.box, color: context.themeColors.primary400, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            room['title'] ?? 'Untitled Project',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: context.themeColors.primary500.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'VIEW ROOM',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: context.themeColors.primary400, letterSpacing: 0.5),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() => _isStageOpen = true);
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (context) => _buildStageOverlay('Decision Log', room),
                            ).whenComplete(() {
                              if (mounted) setState(() => _isStageOpen = false);
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              border: Border(bottom: BorderSide(color: context.themeColors.primary500, width: 2)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.gitCommit, size: 14, color: context.themeColors.primary500),
                                const SizedBox(width: 8),
                                Text('Decision Log', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() => _isStageOpen = true);
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (context) => _buildStageOverlay('Milestones', room),
                            ).whenComplete(() {
                              if (mounted) setState(() => _isStageOpen = false);
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              border: Border(bottom: BorderSide(color: context.themeColors.borderSubtle, width: 2)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.target, size: 14, color: context.themeColors.textSecondary),
                                const SizedBox(width: 8),
                                Text('Milestones', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: context.themeColors.primary500.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('${room['update_count'] ?? 0}', style: TextStyle(color: context.themeColors.primary500, fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 8),
                          Text('decisions logged', style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary)),
                        ],
                      ),
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          Navigator.of(context).push(MaterialPageRoute(
                            builder: (context) => CreateUpdateScreen(
                              preselectedRoomId: room['id'],
                              preselectedRoomTitle: room['title'],
                            )
                          )).then((_) => _fetchData());
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: context.themeColors.primary500,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              const Icon(LucideIcons.plus, color: Colors.white, size: 14),
                              const SizedBox(width: 4),
                              const Text('Log decision', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
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
    );
  }

  Widget _buildStageOverlay(String title, Map<String, dynamic> room) {
    final type = title == 'Decision Log' ? 'decision' : 'shipped';
    final future = Supabase.instance.client
        .from('updates')
        .select('*, rooms(title, tags), users(name, avatar, is_verified_expert, organization_name)')
        .eq('room_id', room['id'])
        .eq('update_type', type)
        .order('created_at', ascending: false);

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: context.themeColors.background.withOpacity(0.9),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border(top: BorderSide(color: context.themeColors.borderSubtle)),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: context.themeColors.borderSubtle,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary),
                    ),
                    IconButton(
                      icon: Icon(LucideIcons.x, color: context.themeColors.textSecondary),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: FutureBuilder(
                    future: future,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
                      }
                      final updates = snapshot.data as List<dynamic>? ?? [];
                      if (updates.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(title == 'Decision Log' ? LucideIcons.gitCommit : LucideIcons.target, size: 48, color: context.themeColors.textTertiary),
                              const SizedBox(height: 16),
                              Text('No $title found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                              const SizedBox(height: 8),
                              Text('Data for ${room['title']} will appear here.', style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary)),
                              const SizedBox(height: 24),
                              ElevatedButton(
                                onPressed: () {
                                   Navigator.of(context).pop();
                                   Navigator.of(context).push(MaterialPageRoute(builder: (context) => RoomDetailScreen(roomId: room['id'], title: room['title'] ?? 'Untitled')));
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: context.themeColors.primary500,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                ),
                                child: const Text('Open Full Room', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        );
                      }
                      
                      return ListView.builder(
                        itemCount: updates.length,
                        itemBuilder: (context, index) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: FeedUpdateCard(update: updates[index] as Map<String, dynamic>),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWorkspaceSelector() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: _myRooms.map((room) {
          final isActive = room['id'] == _activeWorkspaceId;
          return GestureDetector(
            onTap: () {
              if (_activeWorkspaceId != room['id']) {
                HapticFeedback.selectionClick();
              }
              setState(() {
                _activeWorkspaceId = room['id'];
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isActive ? context.themeColors.primary500 : context.themeColors.surfaceHighlight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isActive ? context.themeColors.primary500 : context.themeColors.borderSubtle),
              ),
              child: Text(
                room['title'] ?? 'Untitled',
                style: TextStyle(
                  color: isActive ? Colors.white : context.themeColors.textSecondary,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                  fontSize: 13,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildObserverReactionsCard() {
    if (_isLoadingMetrics) return const Center(child: CircularProgressIndicator());
    
    final metrics = _workspaceMetrics?['reactions'] ?? {};
    final sharpCount = (metrics['sharp_count'] ?? 0) as int;
    final tellMeMoreCount = (metrics['tell_me_more_count'] ?? 0) as int;
    final pushbackCount = (metrics['pushback_count'] ?? 0) as int;
    final total = sharpCount + tellMeMoreCount + pushbackCount;
    final updatesCount = (metrics['updates_count'] ?? 0) as int;

    final sharpPct = total > 0 ? ((sharpCount / total) * 100).round() : 0;
    final tellMeMorePct = total > 0 ? ((tellMeMoreCount / total) * 100).round() : 0;
    final pushbackPct = total > 0 ? ((pushbackCount / total) * 100).round() : 0;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('OBSERVER REACTIONS'),
          const SizedBox(height: 4),
          Text('$total total · $updatesCount updates', style: TextStyle(fontFamily: 'monospace', fontSize: 12, color: context.themeColors.textSecondary)),
          const SizedBox(height: 24),
          if (total == 0)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Column(
                  children: [
                    Text('✨', style: TextStyle(fontSize: 24)),
                    const SizedBox(height: 8),
                    Text('No reactions yet', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                    Text('Post updates to gather feedback.', style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary)),
                  ],
                ),
              ),
            )
          else ...[
            _buildReactionBar('✦ This is sharp', sharpCount, sharpPct, const Color(0xFF10B981)),
            const SizedBox(height: 16),
            _buildReactionBar('? Tell me more', tellMeMoreCount, tellMeMorePct, context.themeColors.primary400),
            const SizedBox(height: 16),
            _buildReactionBar('! Push back', pushbackCount, pushbackPct, Colors.amber),
            
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.themeColors.primary500.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.themeColors.primary500.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('AI INSIGHT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: context.themeColors.primary500, letterSpacing: 1.0)),
                  const SizedBox(height: 8),
                  RichText(
                    text: TextSpan(
                      style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary, height: 1.5),
                      children: [
                        const TextSpan(text: 'Your problem-framing updates get '),
                        TextSpan(text: '2x more reactions', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                        const TextSpan(text: ' than feature announcements. Post the problem before the solution.'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildReactionBar(String label, int count, int pct, Color color) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
            Text('$count · $pct%', style: TextStyle(fontFamily: 'monospace', fontSize: 12, color: context.themeColors.textSecondary)),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          height: 6,
          width: double.infinity,
          decoration: BoxDecoration(
            color: context.themeColors.surfaceHighlight,
            borderRadius: BorderRadius.circular(3),
          ),
          alignment: Alignment.centerLeft,
          child: FractionallySizedBox(
            widthFactor: (pct / 100).clamp(0.0, 1.0),
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTopObserversCard() {
    if (_isLoadingMetrics) return const Center(child: CircularProgressIndicator());
    
    final observers = (_workspaceMetrics?['top_observers'] as List?) ?? [];

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('TOP OBSERVERS'),
          const SizedBox(height: 4),
          Text('${observers.length} observers', style: TextStyle(fontFamily: 'monospace', fontSize: 12, color: context.themeColors.textSecondary)),
          const SizedBox(height: 24),
          
          if (observers.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Column(
                  children: [
                    Icon(LucideIcons.users, size: 24, color: context.themeColors.textSecondary),
                    const SizedBox(height: 8),
                    Text('No observers yet', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                  ],
                ),
              ),
            )
          else
            ...observers.map((obs) {
              final name = obs['name'] as String? ?? 'Observer';
              final initial = name.isNotEmpty ? name[0].toUpperCase() : 'O';
              
              String finalAvatarUrl = obs['avatar']?.toString() ?? '';
              if (finalAvatarUrl.isEmpty || !finalAvatarUrl.startsWith('http')) {
                final seed = obs['id']?.toString() ?? name;
                finalAvatarUrl = 'https://api.dicebear.com/9.x/micah/png?seed=${Uri.encodeComponent(seed)}&backgroundColor=transparent';
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: context.themeColors.primary500.withOpacity(0.2),
                      ),
                      child: ClipOval(
                        child: CachedNetworkImage(
                          imageUrl: finalAvatarUrl,
                          fit: BoxFit.cover,
                          placeholder: (c, url) => Container(color: context.themeColors.surfaceHighlight),
                          errorWidget: (c, e, s) => Center(
                            child: Text(initial, style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                          Text('${obs['role'] ?? 'Observer'} · ${obs['city'] ?? 'Unknown'}', style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: context.themeColors.textSecondary)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(text: '${obs['interaction_count'] ?? 0} ', style: TextStyle(fontFamily: 'monospace', fontSize: 13, fontWeight: FontWeight.bold, color: context.themeColors.primary400)),
                          TextSpan(text: 'interactions', style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: context.themeColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    );
  }

  Widget _buildLinkedDocsCard() {
    if (_isLoadingMetrics) return const Center(child: CircularProgressIndicator());
    
    final activeDocs = (_workspaceMetrics?['linked_docs'] as List?) ?? [];

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.link, color: context.themeColors.textTertiary, size: 20),
              const SizedBox(width: 12),
              Text('Linked Docs', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 14, fontWeight: FontWeight.bold)),
              const Spacer(),
              if (activeDocs.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: context.themeColors.primary500.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text('${activeDocs.length} Connected', style: TextStyle(color: context.themeColors.primary500, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 24),
          if (activeDocs.isEmpty)
            Center(
              child: Column(
                children: [
                  Icon(LucideIcons.fileText, size: 32, color: context.themeColors.textTertiary.withOpacity(0.5)),
                  const SizedBox(height: 12),
                  Text('No docs linked', style: TextStyle(color: context.themeColors.textSecondary, fontWeight: FontWeight.bold)),
                ],
              ),
            )
          else
            ...activeDocs.map((doc) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Icon(LucideIcons.fileText, size: 16, color: context.themeColors.textSecondary),
                  const SizedBox(width: 8),
                  Expanded(child: Text(doc['title'] ?? 'Untitled Doc', style: TextStyle(fontSize: 14, color: context.themeColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis)),
                ],
              ),
            )).toList(),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      child: Column(
        children: [
          Icon(LucideIcons.layers, size: 48, color: context.themeColors.textTertiary),
          const SizedBox(height: 16),
          Text(
            "Your workspace is empty",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: context.themeColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            "Start building your first project room.",
            style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (context) => const CreateRoomScreen())).then((_) => _fetchData()),
            style: ElevatedButton.styleFrom(
              backgroundColor: context.themeColors.primary500,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 0,
            ),
            child: const Text('Initialize Workspace', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
