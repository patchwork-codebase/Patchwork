import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../screens/create_update_screen.dart';
import '../screens/create_room_screen.dart';
import '../screens/room_detail_screen.dart';
import '../screens/notifications_screen.dart';
import 'recent_activity_list.dart';
import 'dashboard_achievements.dart';
import 'feed_update_card.dart';
import 'skeleton_loaders.dart';
import '../utils/page_routes.dart';

class DashboardOverview extends ConsumerStatefulWidget {
  const DashboardOverview({super.key});

  @override
  ConsumerState<DashboardOverview> createState() => _DashboardOverviewState();
}

class _DashboardOverviewState extends ConsumerState<DashboardOverview> {
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
    // Riverpod providers will automatically fetch data when watched in build()
  }

  Future<void> _fetchData() async {
    // Phase 3: Invalidate Riverpod providers to force a refresh globally
    ref.invalidate(myRoomsProvider);
    ref.invalidate(userProfileProvider);
    ref.invalidate(unreadNotificationsProvider);
    ref.invalidate(recentUpdatesActivityProvider);
    ref.invalidate(triageUpdatesProvider);
    ref.invalidate(workspaceMetricsProvider);
  }

  Future<void> _fetchWorkspaceMetrics(String workspaceId) async {
    // Obsolete - handled by workspaceMetricsProvider
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
    // Wire Riverpod to Legacy State
    final myRoomsAsync = ref.watch(myRoomsProvider);
    final userProfileAsync = ref.watch(userProfileProvider);
    final triageAsync = ref.watch(triageUpdatesProvider);
    final unreadAsync = ref.watch(unreadNotificationsProvider);
    final metricsAsync = ref.watch(workspaceMetricsProvider);
    final recentUpdatesAsync = ref.watch(recentUpdatesActivityProvider);

    _myRooms = myRoomsAsync.valueOrNull ?? _myRooms;
    _userProfile = userProfileAsync.valueOrNull ?? _userProfile;
    _triageUpdates = triageAsync.valueOrNull ?? _triageUpdates;
    _unreadNotifications = unreadAsync.valueOrNull ?? _unreadNotifications;
    _workspaceMetrics = metricsAsync.valueOrNull ?? _workspaceMetrics;
    
    _isLoading = myRoomsAsync.isLoading || userProfileAsync.isLoading;
    _isLoadingMetrics = metricsAsync.isLoading;

    if (_myRooms.isNotEmpty && _activeWorkspaceId == null) {
      Future.microtask(() => ref.read(activeWorkspaceIdProvider.notifier).state = _myRooms.first['id']);
      _activeWorkspaceId = _myRooms.first['id'];
    } else {
      _activeWorkspaceId = ref.watch(activeWorkspaceIdProvider) ?? _activeWorkspaceId;
    }

    // Trigger activity calculation if updates loaded
    if (recentUpdatesAsync.hasValue && recentUpdatesAsync.value != null && _currentStreak == 0) {
      _calculateActivity(recentUpdatesAsync.value!);
    }

    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.transparent,
        body: BuilderDashboardSkeleton(),
      );
    }

    final currentUser = Supabase.instance.client.auth.currentUser;
    String userName = _userProfile?['name'] ?? currentUser?.userMetadata?['name'] ?? currentUser?.userMetadata?['full_name'] ?? '';
    
    if (userName.trim().isEmpty || userName == 'Anonymous Builder') userName = 'Builder';
    final userAvatar = _userProfile?['avatar'];
    final initial = userName.substring(0, 1).toUpperCase();
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

            // 2. Pulse Card & Actions
            _buildPulseCard().animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 64,
                    child: _buildActionCard(
                      title: "New Update",
                      icon: LucideIcons.zap,
                      color: context.themeColors.primary500,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).push(PremiumPageRoute(page: const CreateUpdateScreen())).then((_) => _fetchData());
                      },
                    ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.1, end: 0),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 64,
                    child: _buildActionCard(
                      title: "New Room",
                      icon: LucideIcons.box,
                      color: context.themeColors.textPrimary,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).push(PremiumPageRoute(page: const CreateRoomScreen())).then((_) => _fetchData());
                      },
                    ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.1, end: 0),
                  ),
                ),
              ],
            ).animate().fadeIn(duration: 400.ms),
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
              _buildSectionHeader('YOUR WORKSPACE'),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Pick up where you left off',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: context.themeColors.textPrimary),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: context.themeColors.surface,
                      shape: BoxShape.circle,
                      border: Border.all(color: context.themeColors.borderSubtle),
                    ),
                    child: Icon(LucideIcons.arrowRight, size: 16, color: context.themeColors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 16),
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
            Navigator.push(context, PremiumPageRoute(page: const NotificationsScreen())).then((_) => _fetchData());
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
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: context.themeColors.surfaceHighlight.withOpacity(0.5),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      child: Stack(
        children: [
          // Graphic on the right
          Positioned(
            right: -20,
            top: -20,
            child: SizedBox(
              width: 180,
              height: 180,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: context.themeColors.primary500.withOpacity(0.05), width: 1),
                    ),
                  ),
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: context.themeColors.primary500.withOpacity(0.1), width: 1),
                    ),
                  ),
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: context.themeColors.primary500.withOpacity(0.2), width: 1),
                    ),
                  ),
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: context.themeColors.primary500,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: context.themeColors.primary500.withOpacity(0.3),
                          blurRadius: 12,
                        ),
                      ]
                    ),
                    child: Icon(LucideIcons.zap, color: context.themeColors.surface, size: 20),
                  ),
                ],
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'YOUR MOMENTUM',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: context.themeColors.textTertiary,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      '$_currentStreak',
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.w900,
                        color: context.themeColors.textPrimary,
                        height: 1.0,
                        letterSpacing: -2,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('DAY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary)),
                        Text('STREAK', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  "You're building consistently. Keep the signal\nalive.",
                  style: TextStyle(fontSize: 12, color: context.themeColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 24),
                Divider(color: context.themeColors.borderSubtle),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(7, (index) {
                    final now = DateTime.now();
                    final date = now.subtract(Duration(days: 6 - index));
                    final dayLabel = DateFormat('E').format(date)[0];
                    final val = _weeklyActivity[index];
                    final isToday = index == 6; 

                    Widget circle;
                    if (isToday) {
                      circle = Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: context.themeColors.primary500, width: 2),
                        ),
                        child: Center(
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: context.themeColors.primary500,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      );
                    } else if (val > 0) {
                      circle = Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: context.themeColors.primary500.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(LucideIcons.check, size: 12, color: context.themeColors.primary500),
                      );
                    } else {
                      circle = Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: context.themeColors.borderSubtle),
                        ),
                      );
                    }
                    
                    return Column(
                      children: [
                        circle,
                        const SizedBox(height: 8),
                        Text(
                          dayLabel,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isToday ? context.themeColors.primary500 : context.themeColors.textTertiary),
                        ),
                      ],
                    );
                  }),
                ),
              ],
            ),
          ),
        ],
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
    final isDecisionLog = title == 'Decision Log';
    final future = isDecisionLog
        ? Supabase.instance.client
            .from('room_decisions')
            .select('*')
            .eq('room_id', room['id'])
            .order('created_at', ascending: false)
        : Supabase.instance.client
            .from('updates')
            .select('*, rooms(title, tags), users(name, avatar, is_verified_expert, organization_name, organization_logo_url)')
            .eq('room_id', room['id'])
            .eq('update_type', 'shipped')
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
                                   Navigator.of(context).push(PremiumPageRoute(page: RoomDetailScreen(roomId: room['id'], title: room['title'] ?? 'Untitled')));
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
                          if (isDecisionLog) {
                            final decision = updates[index] as Map<String, dynamic>;
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
                          }
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: FeedUpdateCard(heroTagPrefix: "dash_", update: updates[index] as Map<String, dynamic>),
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
      physics: const BouncingScrollPhysics(),
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
                _isLoadingMetrics = true;
              });
              // Update Riverpod provider to trigger metric fetches
              ref.read(activeWorkspaceIdProvider.notifier).state = room['id'];
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isActive ? context.themeColors.textPrimary : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isActive ? context.themeColors.textPrimary : context.themeColors.borderSubtle),
              ),
              child: Text(
                room['title'] ?? 'Untitled',
                style: TextStyle(
                  color: isActive ? context.themeColors.surface : context.themeColors.textSecondary,
                  fontWeight: FontWeight.bold,
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
    
    final reactionsCount = (_workspaceMetrics?['reactions_count'] ?? 0) as int;
    final topObservers = (_workspaceMetrics?['top_observers'] as List?) ?? [];

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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSectionHeader('OBSERVER REACTIONS'),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('+10% this week', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '$reactionsCount',
            style: TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.w900,
              color: context.themeColors.textPrimary,
              height: 1.0,
            ),
          ),
          const Spacer(),
          // Vertical Bar Chart (using weekly activity as visual proxy)
          SizedBox(
            height: 100,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(7, (index) {
                final isHighlight = index == 5; // Emulate the highlighted red bar
                // Mock heights for visual effect similar to screenshot
                final heights = [30.0, 40.0, 30.0, 60.0, 50.0, 90.0, 70.0];
                return Container(
                  width: 32,
                  height: heights[index],
                  decoration: BoxDecoration(
                    color: isHighlight ? const Color(0xFFFF5733) : context.themeColors.textPrimary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 16),
          // Avatars and footer text
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              SizedBox(
                width: 80,
                height: 32,
                child: Stack(
                  children: List.generate(
                    topObservers.length > 3 ? 3 : topObservers.length, 
                    (index) {
                      final obs = topObservers[index];
                      final initial = (obs['name']?.toString() ?? 'O')[0].toUpperCase();
                      final avatar = obs['avatar']?.toString() ?? '';
                      return Positioned(
                        left: index * 20.0,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: context.themeColors.surface, width: 2),
                            color: Colors.primaries[index % Colors.primaries.length].withOpacity(0.2),
                          ),
                          child: ClipOval(
                            child: avatar.startsWith('http') 
                                ? CachedNetworkImage(imageUrl: avatar, fit: BoxFit.cover)
                                : Center(child: Text(initial, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                          ),
                        ),
                      );
                    }
                  ),
                ),
              ),
              Text(
                'Your latest update is getting noticed.',
                style: TextStyle(fontSize: 10, color: context.themeColors.textSecondary),
              ),
            ],
          ),
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
            onPressed: () => Navigator.of(context).push(PremiumPageRoute(page: const CreateRoomScreen())).then((_) => _fetchData()),
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
