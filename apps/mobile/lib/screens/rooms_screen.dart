import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';
import 'room_detail_screen.dart';
import 'create_room_screen.dart';
import '../widgets/brand_icon.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/toast_notification.dart';
import '../services/cache_service.dart';

class RoomsScreen extends StatefulWidget {
  const RoomsScreen({super.key});

  @override
  State<RoomsScreen> createState() => _RoomsScreenState();
}
class _RoomsScreenState extends State<RoomsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _myRooms = [];
  List<Map<String, dynamic>> _observedRooms = [];
  bool _isLoadingMyRooms = true;
  bool _isLoadingObservedRooms = true;
  Map<String, dynamic>? _currentUserProfile;
  String _selectedActivityFilter = 'ALL';

  final Map<String, Map<String, Color>> _tagPalette = {
    'product': {'bg': const Color(0xFFE5F1FF), 'color': const Color(0xFF0066FF)},
    'engineering': {'bg': const Color(0xFFF3E8FF), 'color': const Color(0xFF9333EA)},
    'design': {'bg': const Color(0xFFFFE4E6), 'color': const Color(0xFFE11D48)},
    'marketing': {'bg': const Color(0xFFDCFCE7), 'color': const Color(0xFF16A34A)},
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadFromCache();
    _fetchMyRooms();
    _fetchObservedRooms();
    _fetchCurrentUserProfile();
  }

  Future<void> _loadFromCache() async {
    try {
      final cachedMyRooms = await CacheService().getJson('${CacheService.keyRooms}_my');
      if (cachedMyRooms != null && cachedMyRooms is List && _myRooms.isEmpty) {
        if (mounted) setState(() {
          _myRooms = List<Map<String, dynamic>>.from(cachedMyRooms);
          _isLoadingMyRooms = false;
        });
      }

      final cachedObserved = await CacheService().getJson('${CacheService.keyRooms}_observed');
      if (cachedObserved != null && cachedObserved is List && _observedRooms.isEmpty) {
        if (mounted) setState(() {
          _observedRooms = List<Map<String, dynamic>>.from(cachedObserved);
          _isLoadingObservedRooms = false;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchCurrentUserProfile() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final profile = await Supabase.instance.client
          .from('users')
          .select('name, avatar')
          .eq('id', userId)
          .maybeSingle();
      if (mounted) {
        setState(() {
          _currentUserProfile = profile;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchMyRooms() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      if (mounted) setState(() => _isLoadingMyRooms = false);
      return;
    }
    
    try {
      final response = await Supabase.instance.client
          .from('rooms')
          .select('id, title, description, created_at, last_update_at, tags, update_count, project_stage, primary_link, room_observers(users(avatar, name))')
          .eq('builder_id', userId)
          .order('created_at', ascending: false);
          
      if (mounted) {
        setState(() {
          _myRooms = List<Map<String, dynamic>>.from(response);
          _isLoadingMyRooms = false;
        });
        CacheService().saveJson('${CacheService.keyRooms}_my', _myRooms);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingMyRooms = false);
    }
  }

  Future<void> _fetchObservedRooms() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      if (mounted) setState(() => _isLoadingObservedRooms = false);
      return;
    }
    
    try {
      final response = await Supabase.instance.client
          .from('room_observers')
          .select('rooms(id, title, description, created_at, last_update_at, tags, update_count, project_stage, primary_link, room_observers(users(avatar, name)))')
          .eq('observer_id', userId);
          
      final mapped = (response as List).map((row) {
        final room = row['rooms'];
        if (room is List) return room.isNotEmpty ? room.first as Map<String, dynamic> : null;
        return room as Map<String, dynamic>?;
      }).where((r) => r != null).cast<Map<String, dynamic>>().toList();
      
      if (mounted) {
        setState(() {
          _observedRooms = mapped;
          _isLoadingObservedRooms = false;
        });
        CacheService().saveJson('${CacheService.keyRooms}_observed', _observedRooms);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingObservedRooms = false);
    }
  }

  void _openFigma(BuildContext context, Map<String, dynamic> room) {
    final primary = room['primary_link']?.toString() ?? '';
    final roomTitle = room['title'] ?? 'this room';
    if (primary.contains('figma.com')) {
      HapticFeedback.lightImpact();
      launchUrl(Uri.parse(primary), mode: LaunchMode.externalApplication);
    } else {
      HapticFeedback.selectionClick();
      ToastService.show(context, 'No Figma link configured for "$roomTitle"');
    }
  }

  void _openNotion(BuildContext context, Map<String, dynamic> room) {
    final primary = room['primary_link']?.toString() ?? '';
    final roomTitle = room['title'] ?? 'this room';
    if (primary.contains('notion.site') || primary.contains('notion.so')) {
      HapticFeedback.lightImpact();
      launchUrl(Uri.parse(primary), mode: LaunchMode.externalApplication);
    } else {
      HapticFeedback.selectionClick();
      ToastService.show(context, 'No Notion docs configured for "$roomTitle"');
    }
  }

  void _openGithub(BuildContext context, Map<String, dynamic> room) {
    final primary = room['primary_link']?.toString() ?? '';
    final roomTitle = room['title'] ?? 'this room';
    if (primary.contains('github.com')) {
      HapticFeedback.lightImpact();
      launchUrl(Uri.parse(primary), mode: LaunchMode.externalApplication);
    } else {
      HapticFeedback.selectionClick();
      ToastService.show(context, 'No GitHub repo configured for "$roomTitle"');
    }
  }

  Map<String, dynamic> _getTagStyle(String tag) {
    return _tagPalette[tag.toLowerCase()] ?? {'bg': AppTheme.slate500, 'color': AppTheme.slate400};
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Rooms', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: context.themeColors.primary500.withOpacity(0.3)),
                  boxShadow: [
                    BoxShadow(color: context.themeColors.primary500.withOpacity(0.2), blurRadius: 8)
                  ],
                ),
                labelColor: context.themeColors.textPrimary,
                unselectedLabelColor: context.themeColors.textSecondary,
                labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'My Rooms'),
                  Tab(text: 'Observed Rooms'),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          // Studio Lighting Gradient
          Positioned(
            top: -150,
            left: 0,
            right: 0,
            child: Container(
              height: 400,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    context.themeColors.primary500.withOpacity(0.12),
                    Colors.purple.withOpacity(0.05),
                    Colors.transparent,
                  ],
                  radius: 0.8,
                ),
              ),
            ),
          ),
          TabBarView(
            controller: _tabController,
            children: [
              _buildRoomsTab(_myRooms, _isLoadingMyRooms, _fetchMyRooms),
              _buildRoomsTab(_observedRooms, _isLoadingObservedRooms, _fetchObservedRooms),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRoomsTab(List<Map<String, dynamic>> rooms, bool isLoading, Future<void> Function() onRefresh) {
    if (isLoading && rooms.isEmpty) {
      return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: context.themeColors.primary500,
      backgroundColor: context.themeColors.surfaceHighlight,
      child: _buildRoomList(rooms),
    );
  }

  Widget _buildRoomList(List<Map<String, dynamic>> rooms) {
    final filteredRooms = rooms.where((r) {
      if (_selectedActivityFilter == 'ALL') return true;

      final createdAt = DateTime.tryParse(r['created_at'] ?? '') ?? DateTime.now();
      final lastUpdateAt = r['last_update_at'] != null 
          ? DateTime.tryParse(r['last_update_at']) 
          : null;
      final effectiveDate = lastUpdateAt ?? createdAt;
      final daysInactive = DateTime.now().difference(effectiveDate).inDays;

      if (_selectedActivityFilter == 'ACTIVE') {
        return daysInactive <= 7;
      } else if (_selectedActivityFilter == 'PACED') {
        return daysInactive > 7 && daysInactive <= 21;
      } else if (_selectedActivityFilter == 'PAUSED') {
        return daysInactive > 21;
      }
      return true;
    }).toList();

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      children: [
        // Header Texts
        Text('My Rooms', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary, letterSpacing: -1)),
        const SizedBox(height: 8),
        Text('Manage your active build rooms and feature rollouts', style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary)),
        const SizedBox(height: 24),
        
        // Create Room Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const CreateRoomScreen()),
              ).then((_) {
                _fetchMyRooms();
                _fetchObservedRooms();
              });
            },
            icon: const Icon(LucideIcons.plus, size: 13),
            label: const Text('Create Room'),
            style: ElevatedButton.styleFrom(
              backgroundColor: context.themeColors.primary500,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Activity Status Filter Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip('ALL', 'All Rooms', null),
              const SizedBox(width: 8),
              _buildFilterChip('ACTIVE', 'Active (≤7d)', const Color(0xFF10B981)),
              const SizedBox(width: 8),
              _buildFilterChip('PACED', 'Paced (8-21d)', const Color(0xFF38BDF8)),
              const SizedBox(width: 8),
              _buildFilterChip('PAUSED', 'Paused (>21d)', context.themeColors.textTertiary),
            ],
          ),
        ),
        const SizedBox(height: 24),

        if (filteredRooms.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Text(
                'No ${_selectedActivityFilter == 'ALL' ? '' : _selectedActivityFilter.toLowerCase() + ' '}rooms found.',
                style: TextStyle(color: context.themeColors.textTertiary),
              ),
            ),
          ),

        ...filteredRooms.asMap().entries.map((entry) {
          final index = entry.key;
          final room = entry.value;
          
          final title = room['title'] ?? 'Untitled Room';
          final description = room['description'] ?? 'No description';
          final tags = List<String>.from(room['tags'] ?? []);
          final tag = tags.isNotEmpty ? tags.first : 'product';
          final projectStage = room['project_stage'] as String? ?? 'Ideation';

          final createdAt = DateTime.tryParse(room['created_at'] ?? '') ?? DateTime.now();
          final lastUpdateAt = room['last_update_at'] != null 
              ? DateTime.tryParse(room['last_update_at']) 
              : null;
          final daysActive = DateTime.now().difference(createdAt).inDays;
          final updateCount = room['update_count'] ?? 0;
          
          final observers = room['room_observers'] as List<dynamic>? ?? [];
          final displayObservers = observers.take(3).map((o) => o['users'] as Map<String, dynamic>? ?? {}).toList();
          final totalObservers = observers.length;

          return GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => RoomDetailScreen(roomId: room['id'], title: title),
                ),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.themeColors.surface, // Solid clean surface color
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.themeColors.borderSubtle),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Tags
                  Text(title, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: context.themeColors.textPrimary)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _buildPill(tag.toUpperCase(), context.themeColors.primary500, context.themeColors.primary500.withOpacity(0.15)),
                      const SizedBox(width: 8),
                      _buildActivityPill(lastUpdateAt, createdAt),
                      const SizedBox(width: 8),
                      _buildStagePill(projectStage),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Description
                  Text(
                    description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary, height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  
                  // Meta Info
                  Row(
                    children: [
                      Text('Day $daysActive', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(' • ', style: TextStyle(color: context.themeColors.textTertiary)),
                      Text('$updateCount updates', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(' • ', style: TextStyle(color: context.themeColors.textTertiary)),
                      // Avatar pile
                      if (displayObservers.isNotEmpty)
                        SizedBox(
                          width: (displayObservers.length * 16.0) + 8.0,
                          height: 24,
                          child: Stack(
                            children: List.generate(displayObservers.length, (i) {
                              final obsUser = displayObservers[i];
                              final obsName = obsUser['name'] as String? ?? 'U';
                              final initial = obsName.isNotEmpty ? obsName[0].toUpperCase() : 'U';
                              return Positioned(
                                left: i * 14.0,
                                child: _buildAvatarStackItem(
                                  Colors.primaries[i % Colors.primaries.length],
                                  obsUser['avatar'] as String?,
                                  initial,
                                ),
                              );
                            }),
                          ),
                        ),
                      if (totalObservers > displayObservers.length) ...[
                        Text(' +${totalObservers - displayObservers.length}', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                      if (totalObservers > 0)
                        Text(' • ', style: TextStyle(color: context.themeColors.textTertiary)),
                      Text(timeago.format(createdAt, locale: 'en_short') + ' ago', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Footer Row (Icons + View Room)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Builder(
                        builder: (ctx) {
                          final primaryLink = room['primary_link']?.toString() ?? '';
                          final hasFigma = primaryLink.contains('figma.com');
                          final hasNotion = primaryLink.contains('notion.');
                          final hasGithub = primaryLink.contains('github.com');

                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.03),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white.withOpacity(0.07)),
                            ),
                            child: Row(
                              children: [
                                Tooltip(
                                  message: hasFigma ? 'Open Figma Design' : 'No Figma linked',
                                  child: GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () => _openFigma(context, room),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                      child: BrandIcon.figma(
                                        size: 11.5,
                                        color: hasFigma ? const Color(0xFFF24E1E) : context.themeColors.textSecondary.withOpacity(0.6),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Tooltip(
                                  message: hasNotion ? 'Open Notion Docs' : 'No Notion linked',
                                  child: GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () => _openNotion(context, room),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                      child: BrandIcon.notion(
                                        size: 11.5,
                                        color: hasNotion ? Colors.white : context.themeColors.textSecondary.withOpacity(0.6),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Tooltip(
                                  message: hasGithub ? 'Open GitHub Repo' : 'No GitHub linked',
                                  child: GestureDetector(
                                    behavior: HitTestBehavior.opaque,
                                    onTap: () => _openGithub(context, room),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                      child: BrandIcon.github(
                                        size: 11.5,
                                        color: hasGithub ? const Color(0xFF10B981) : context.themeColors.textSecondary.withOpacity(0.6),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: context.themeColors.primary500.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.themeColors.primary500.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            Text('View Room', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold, fontSize: 11)),
                            SizedBox(width: 6),
                            Icon(LucideIcons.arrowRight, size: 11, color: context.themeColors.primary500),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(duration: 300.ms, delay: (index * 50).ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOutQuad);
      }).toList(),
      ],
    );
  }

  Widget _buildPill(String text, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: textColor.withOpacity(0.3)),
      ),
      child: Text(text, style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5)),
    );
  }

  Widget _buildStagePill(String stage) {
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
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 9, color: color),
          const SizedBox(width: 4),
          Text(
            stage.toUpperCase(),
            style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityPill(DateTime? lastUpdateAt, DateTime createdAt) {
    final effectiveDate = lastUpdateAt ?? createdAt;
    final daysInactive = DateTime.now().difference(effectiveDate).inDays;

    String label;
    Color textColor;
    Color bgColor;
    bool showDot = false;

    if (daysInactive <= 7) {
      label = 'ACTIVE';
      textColor = const Color(0xFF10B981); // Emerald
      bgColor = const Color(0xFF10B981).withOpacity(0.12);
      showDot = true;
    } else if (daysInactive <= 21) {
      label = 'PACED';
      textColor = const Color(0xFF38BDF8); // Sky blue
      bgColor = const Color(0xFF38BDF8).withOpacity(0.12);
    } else {
      label = 'PAUSED';
      textColor = context.themeColors.textTertiary;
      bgColor = Colors.white.withOpacity(0.04);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: textColor.withOpacity(0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 5,
              height: 5,
              margin: const EdgeInsets.only(right: 5),
              decoration: BoxDecoration(
                color: textColor,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: textColor.withOpacity(0.6),
                    blurRadius: 3,
                    spreadRadius: 0.5,
                  ),
                ],
              ),
            ),
          ],
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w900,
              fontSize: 11,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label, Color? dotColor) {
    final isSelected = _selectedActivityFilter == filterKey;
    final primaryColor = context.themeColors.primary500;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _selectedActivityFilter = filterKey;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? primaryColor.withOpacity(0.15) 
              : context.themeColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected 
                ? primaryColor.withOpacity(0.5) 
                : context.themeColors.borderSubtle,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (dotColor != null) ...[
              Container(
                width: 6,
                height: 6,
                margin: const EdgeInsets.only(right: 6),
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              ),
            ],
            Text(
              label,
              style: TextStyle(
                color: isSelected 
                    ? (context.themeColors.textPrimary) 
                    : context.themeColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarStackItem(Color fallbackColor, String? avatarUrl, String label) {
    return Container(
      width: 24, height: 24,
      decoration: BoxDecoration(
        color: fallbackColor.withOpacity(0.2),
        shape: BoxShape.circle,
        border: Border.all(color: context.themeColors.background, width: 2),
        image: avatarUrl != null && avatarUrl.isNotEmpty
            ? DecorationImage(
                image: NetworkImage(avatarUrl),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: avatarUrl == null || avatarUrl.isEmpty
          ? Center(child: Text(label, style: TextStyle(color: fallbackColor, fontSize: 11, fontWeight: FontWeight.bold)))
          : null,
    );
  }
}
