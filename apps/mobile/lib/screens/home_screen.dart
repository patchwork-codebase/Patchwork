import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import 'feed_screen.dart';
import 'rooms_screen.dart';
import 'explore_screen.dart';
import 'observer_dashboard_screen.dart';
import 'messages_screen.dart';
import '../widgets/dashboard_overview.dart';
import '../widgets/profile_sheet.dart';
import '../services/notification_service.dart';
import 'package:app_links/app_links.dart';
import '../widgets/toast_notification.dart';
import 'room_detail_screen.dart';
import 'update_thread_screen.dart';
import 'dart:async';
import '../widgets/welcome_walkthrough_dialog.dart';
import '../services/gamification_service.dart';

class HomeScreen extends StatefulWidget {
  final bool isFirstTime;

  const HomeScreen({super.key, this.isFirstTime = false});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  bool _profileMenuOpen = false;
  late final RealtimeChannel _updatesChannel;
  Map<String, dynamic>? _userProfile;
  late final AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;
  bool _isNavBarVisible = true;
  int _unreadMessagesCount = 0;

  bool get _isObserver => _userProfile?['role'] == 'observer';

  List<Widget> get _screens {
    if (_isObserver) {
      return [
        ObserverDashboardScreen(userProfile: _userProfile),
        const FeedScreen(),
        const MessagesScreen(),
        const ExploreScreen(),
      ];
    } else {
      return [
        const DashboardOverview(),
        const FeedScreen(),
        const RoomsScreen(),
        const MessagesScreen(),
        const ExploreScreen(),
      ];
    }
  }

  @override
  void initState() {
    super.initState();
    _setupNotifications();
    _fetchUserProfile();
    _fetchUnreadMessages();
    _initDeepLinks();
    
    // Start Gamification Engine Listener
    GamificationService().startListening(context);
    
    if (widget.isFirstTime) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showWelcomeWalkthrough();
      });
    }
  }

  void _showWelcomeWalkthrough() {
    ToastService.show(context, 'Welcome to Patchwork! 🎉');
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const WelcomeWalkthroughDialog(),
    );
  }

  void _initDeepLinks() {
    _appLinks = AppLinks();
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) async {
      if (!mounted) return;
      if (uri.pathSegments.isNotEmpty) {
        if (uri.pathSegments.first == 'room' && uri.pathSegments.length > 1) {
          final roomId = uri.pathSegments[1];
          Navigator.of(context).push(MaterialPageRoute(
            builder: (context) => RoomDetailScreen(roomId: roomId, title: 'Room Details'),
          ));
        } else if (uri.pathSegments.first == 'update' && uri.pathSegments.length > 1) {
           final updateId = uri.pathSegments[1];
           // Fetch update details
           try {
             final update = await Supabase.instance.client
                .from('updates')
                .select('*, rooms(title, tags), users(name, avatar, is_verified_expert, organization_name, organization_logo_url)')
                .eq('id', updateId)
                .single();
             if (mounted) {
               Navigator.of(context).push(MaterialPageRoute(
                 builder: (context) => UpdateThreadScreen(update: update),
               ));
             }
           } catch (e) {
             if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load update from link.')));
           }
        }
      }
    });
  }

  Future<void> _fetchUserProfile() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final profile = await Supabase.instance.client
          .from('users')
          .select('name, avatar, role, reputation, domain')
          .eq('id', userId)
          .maybeSingle();

      if (mounted) {
        setState(() {
          _userProfile = profile;
        });
      }
    } catch (e) {
      // Ignore errors for nav bar profile pic
    }
  }

  Future<void> _fetchUnreadMessages() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final res = await Supabase.instance.client
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('read', false)
          .eq('type', 'new_message');
      if (mounted) setState(() => _unreadMessagesCount = (res as List).length);
    } catch (_) {}
  }

  void _setupNotifications() {
    _updatesChannel = Supabase.instance.client.channel('public:updates');
    _updatesChannel.onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'updates',
      callback: (payload) {
        final newRecord = payload.newRecord;
        if (newRecord.isNotEmpty) {
          // Verify we aren't the author
          final currentUserId = Supabase.instance.client.auth.currentUser?.id;
          if (newRecord['author_id'] != currentUserId) {
            NotificationService().showLocalNotification(
              title: 'New Update in Patchwork',
              body: 'Someone posted a new update. Check it out!',
            );
          }
        }
      },
    ).subscribe();
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    Supabase.instance.client.removeChannel(_updatesChannel);
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_selectedIndex != index) {
      HapticFeedback.selectionClick();
    }
    setState(() {
      _selectedIndex = index;
    });
  }

  void _openProfileBottomSheet() {
    setState(() => _profileMenuOpen = true);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const ProfileSheet(),
    ).then((_) {
      if (mounted) setState(() => _profileMenuOpen = false);
    });
  }

  Widget _buildNavItem(int index, IconData icon, String label, {bool showBadge = false}) {
    final isActive = _selectedIndex == index;
    final itemColor = isActive ? context.themeColors.primary500 : context.themeColors.textPrimary.withOpacity(0.85);

    return Expanded(
      child: GestureDetector(
        onTap: () => _onItemTapped(index),
        behavior: HitTestBehavior.opaque,
        child: Container(
          height: 60,
          margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
          child: AnimatedScale(
            scale: isActive ? 1.1 : 1.0,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutBack,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(icon, color: itemColor, size: 20),
                    if (showBadge)
                      Positioned(
                        top: -2,
                        right: -2,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: Colors.redAccent,
                            shape: BoxShape.circle,
                            border: Border.all(color: context.themeColors.surface, width: 1.5),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: itemColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    String userName = _userProfile?['name'] ?? '';
    if (userName.trim().isEmpty) userName = 'Builder';
    final userAvatar = _userProfile?['avatar'];
    final initial = userName.substring(0, 1).toUpperCase();

    return Scaffold(
      extendBody: true, // IMPORTANT for glassmorphism nav bar
      body: NotificationListener<UserScrollNotification>(
        onNotification: (notification) {
          if (notification.direction == ScrollDirection.forward) {
            if (!_isNavBarVisible) setState(() => _isNavBarVisible = true);
          } else if (notification.direction == ScrollDirection.reverse) {
            if (_isNavBarVisible) setState(() => _isNavBarVisible = false);
          }
          return false;
        },
        child: IndexedStack(
          index: _selectedIndex,
          children: _screens,
        ),
      ),
      bottomNavigationBar: AnimatedSlide(
        offset: _isNavBarVisible ? Offset.zero : const Offset(0, 1.5),
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                height: 64,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: context.themeColors.textPrimary.withOpacity(0.05), // Extremely transparent frost tint
                  border: Border.all(color: context.themeColors.textPrimary.withOpacity(0.15), width: 0.5),
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 4)),
                  ],
                ),
            child: Row(
              children: [
                _buildNavItem(0, LucideIcons.home, 'Home'),
                if (_isObserver) ...[
                  _buildNavItem(1, LucideIcons.activity, 'Feed'),
                  _buildNavItem(2, LucideIcons.messageCircle, 'Messages', showBadge: _unreadMessagesCount > 0),
                  _buildNavItem(3, LucideIcons.compass, 'Explore'),
                ] else ...[
                  _buildNavItem(1, LucideIcons.activity, 'Feed'),
                  _buildNavItem(2, LucideIcons.hammer, 'Rooms'),
                  _buildNavItem(3, LucideIcons.messageCircle, 'Messages', showBadge: _unreadMessagesCount > 0),
                  _buildNavItem(4, LucideIcons.compass, 'Explore'),
                ],
                // Profile Avatar Button
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _openProfileBottomSheet();
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      height: 60,
                      margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          AnimatedScale(
                            scale: _profileMenuOpen ? 1.1 : 1.0,
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOutBack,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 24, height: 24,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: _profileMenuOpen ? context.themeColors.primary500 : context.themeColors.textPrimary.withOpacity(0.85), width: _profileMenuOpen ? 1.5 : 1),
                                    color: Colors.transparent,
                                    image: userAvatar != null && userAvatar.isNotEmpty
                                        ? DecorationImage(
                                            image: NetworkImage(userAvatar),
                                            fit: BoxFit.cover,
                                          )
                                        : null,
                                  ),
                                  child: userAvatar == null || userAvatar.isEmpty
                                      ? Center(child: Text(initial, style: TextStyle(color: _profileMenuOpen ? context.themeColors.primary500 : context.themeColors.textPrimary.withOpacity(0.85), fontSize: 8, fontWeight: FontWeight.bold)))
                                      : null,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Profile',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                    color: _profileMenuOpen ? context.themeColors.primary500 : context.themeColors.textPrimary.withOpacity(0.85),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        ),
        ),
      ),
      ),
    );
  }
}
