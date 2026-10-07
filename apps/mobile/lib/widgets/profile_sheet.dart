import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../screens/welcome_screen.dart';
import '../screens/edit_profile_screen.dart';
import '../screens/profile_screen.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/services.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/coming_soon_dialog.dart';

class ProfileSheet extends ConsumerStatefulWidget {
  const ProfileSheet({super.key});

  @override
  ConsumerState<ProfileSheet> createState() => _ProfileSheetState();
}

class _ProfileSheetState extends ConsumerState<ProfileSheet> {
  int _roomCount = 0;
  int _updateCount = 0; // For Builders
  int _followedRoomsCount = 0; // For Observers
  int _reactionsCount = 0; // For Observers
  int _reputation = 0;
  String _userName = '';
  String? _avatarUrl;
  String _role = 'builder';
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    final user = Supabase.instance.client.auth.currentUser;
    final cachedProfile = ref.read(userProfileProvider).valueOrNull;

    if (cachedProfile != null) {
      if (cachedProfile['name'] != null && cachedProfile['name'].toString().trim().isNotEmpty) {
        _userName = cachedProfile['name'];
      }
      final cAvatar = cachedProfile['avatar']?.toString();
      if (cAvatar != null && cAvatar.isNotEmpty && !cAvatar.contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg')) {
        _avatarUrl = cAvatar;
      }
    }

    if (user != null && user.userMetadata != null) {
      if (_userName.isEmpty) {
        if (user.userMetadata!['name'] != null) {
          _userName = user.userMetadata!['name'];
        } else if (user.userMetadata!['full_name'] != null) {
          _userName = user.userMetadata!['full_name'];
        }
      }
      if (_avatarUrl == null || _avatarUrl!.isEmpty) {
        final metaAvatar = user.userMetadata!['avatar'] ?? user.userMetadata!['avatar_url'];
        if (metaAvatar != null && !metaAvatar.toString().contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg')) {
          _avatarUrl = metaAvatar.toString();
        }
      }
    }

    // Default fallback if user has the known cartoon bug
    if (_avatarUrl != null && _avatarUrl!.contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg')) {
      _avatarUrl = 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg';
    } else if (_avatarUrl == null && user?.email == 'akinrodoluseun12@gmail.com') {
      _avatarUrl = 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg';
    }

    if (_userName.isEmpty) {
      _userName = 'Builder';
    }
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final userResponse = await Supabase.instance.client
          .from('users')
          .select('name, avatar, role, reputation')
          .eq('id', userId)
          .maybeSingle();

      final role = userResponse?['role'] ?? 'builder';
      
      int rCount = 0;
      int uCount = 0;
      int fCount = 0;
      int rxCount = 0;

      if (role == 'observer') {
        final followedRes = await Supabase.instance.client.from('room_observers').select('room_id').eq('observer_id', userId);
        final rxRes = await Supabase.instance.client.from('reactions').select('id').eq('observer_id', userId);
        fCount = followedRes.length;
        rxCount = rxRes.length;
      } else {
        final roomsResponse = await Supabase.instance.client.from('rooms').select('id').eq('builder_id', userId);
        final updatesResponse = await Supabase.instance.client.from('updates').select('id').eq('author_id', userId);
        rCount = roomsResponse.length;
        uCount = updatesResponse.length;
      }

      if (mounted) {
        setState(() {
          if (userResponse != null) {
            if (userResponse['name'] != null && userResponse['name'].toString().trim().isNotEmpty) {
              _userName = userResponse['name'];
            }
            final rawAvatar = userResponse['avatar']?.toString();
            if (rawAvatar != null && rawAvatar.isNotEmpty) {
              if (rawAvatar.contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg')) {
                // Buggy cartoon avatar detected. Heal to real photo immediately!
                final healed = (_avatarUrl != null && !_avatarUrl!.contains('1791234378920'))
                    ? _avatarUrl!
                    : 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg';
                _avatarUrl = healed;
                Supabase.instance.client.from('users').update({'avatar': healed}).eq('id', userId);
                Supabase.instance.client.auth.updateUser(UserAttributes(data: {'avatar': healed, 'avatar_url': healed}));
                ref.invalidate(userProfileProvider);
              } else {
                _avatarUrl = rawAvatar;
              }
            } else if (_avatarUrl != null && _avatarUrl!.isNotEmpty) {
              Supabase.instance.client.from('users').update({'avatar': _avatarUrl}).eq('id', userId);
              ref.invalidate(userProfileProvider);
            }
            _role = role;
            _reputation = userResponse['reputation'] ?? 0;
          }
          _roomCount = rCount;
          _updateCount = uCount;
          _followedRoomsCount = fCount;
          _reactionsCount = rxCount;
          _isLoadingStats = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingStats = false);
    }
  }

  Future<void> _handleSignOut(BuildContext context) async {
    HapticFeedback.lightImpact();
    final navigator = Navigator.of(context, rootNavigator: true);
    await Supabase.instance.client.auth.signOut();
    navigator.pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const WelcomeScreen()),
      (route) => false,
    );
  }

  Widget _buildStatBox(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: context.themeColors.surfaceHighlight.withOpacity(0.5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.themeColors.borderSubtle),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 17, color: color.withOpacity(0.8)),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(color: context.themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
          ],
        ),
      ),
    );
  }

  Widget _buildSheetSection(String title, List<Widget> items) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 12, bottom: 8),
            child: Text(title, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: context.themeColors.textTertiary, letterSpacing: 1.5)),
          ),
          Container(
            decoration: const BoxDecoration(
              color: Colors.transparent,
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: items.asMap().entries.map((entry) {
                final int index = entry.key;
                final Widget item = entry.value;
                return Column(
                  children: [
                    item,
                    if (index < items.length - 1)
                      Divider(height: 1, thickness: 1, color: context.themeColors.borderSubtle.withOpacity(0.3), indent: 48),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSheetItem(IconData icon, String label, {Color? color, Widget? trailing, VoidCallback? onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Row(
            children: [
              Icon(icon, size: 13, color: context.themeColors.textSecondary),
              const SizedBox(width: 16),
              Expanded(child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: context.themeColors.textPrimary))),
              if (trailing != null) trailing else Icon(LucideIcons.chevronRight, size: 13, color: context.themeColors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email ?? 'user@example.com';
    String displayName = _userName;
    if (displayName.trim().isEmpty) displayName = 'Builder';
    final themeMode = ref.watch(themeProvider);

    return Container(
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          )
        ],
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 5,
                    margin: const EdgeInsets.only(bottom: 24),
                    decoration: BoxDecoration(color: context.themeColors.borderSubtle, borderRadius: BorderRadius.circular(10)),
                  ),
                ),

                // User Info Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.themeColors.surfaceHighlight.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48, height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: context.themeColors.surface,
                          image: _avatarUrl != null && _avatarUrl!.isNotEmpty
                              ? DecorationImage(
                                  image: CachedNetworkImageProvider(_avatarUrl!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: (_avatarUrl == null || _avatarUrl!.isEmpty)
                            ? Center(child: Text(displayName.isNotEmpty ? displayName[0].toUpperCase() : 'B', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 17)))
                            : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_isLoadingStats && displayName == 'Builder')
                              Container(width: 120, height: 24, decoration: BoxDecoration(color: context.themeColors.borderSubtle, borderRadius: BorderRadius.circular(4)))
                            else
                              Text(displayName, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: context.themeColors.textPrimary)),
                            const SizedBox(height: 4),
                            Text(email, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 10, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Sections
                _buildSheetSection('ACCOUNT', [
                  _buildSheetItem(
                    LucideIcons.user, 
                    'View Profile', 
                    onTap: () {
                      Navigator.of(context).push(MaterialPageRoute(builder: (context) => const ProfileScreen())).then((_) {
                        ref.invalidate(userProfileProvider);
                        _fetchStats();
                      });
                    }
                  ),
                  _buildSheetItem(
                    LucideIcons.edit3, 
                    'Edit Profile', 
                    onTap: () {
                      Navigator.of(context).push(MaterialPageRoute(builder: (context) => const EditProfileScreen())).then((shouldRefresh) {
                        if (shouldRefresh == true) {
                          ref.invalidate(userProfileProvider);
                          _fetchStats();
                        }
                      });
                    }
                  ),
                  _buildSheetItem(
                    themeMode == ThemeMode.light ? LucideIcons.moon : LucideIcons.sun,
                    'Appearance',
                    trailing: DropdownButtonHideUnderline(
                      child: DropdownButton<ThemeMode>(
                        value: themeMode,
                        icon: const Icon(LucideIcons.chevronDown, size: 13, color: AppTheme.textTertiary),
                        dropdownColor: context.themeColors.surfaceHighlight,
                        style: TextStyle(color: context.themeColors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                        items: const [
                          DropdownMenuItem(value: ThemeMode.system, child: Text('System')),
                          DropdownMenuItem(value: ThemeMode.dark, child: Text('Dark')),
                          DropdownMenuItem(value: ThemeMode.light, child: Text('Light')),
                        ],
                        onChanged: (mode) {
                          if (mode != null) {
                            ref.read(themeProvider.notifier).setTheme(mode);
                          }
                        },
                      ),
                    ),
                  ),
                  _buildSheetItem(LucideIcons.award, 'Achievements'),
                ]),
                
                _buildSheetSection('PRODUCT OPS', [
                  _buildSheetItem(LucideIcons.map, 'Roadmap View', onTap: () {
                    showDialog(context: context, builder: (_) => const ComingSoonDialog(featureName: 'Roadmap View'));
                  }),
                  _buildSheetItem(LucideIcons.fileText, 'Build Logs', onTap: () {
                    showDialog(context: context, builder: (_) => const ComingSoonDialog(featureName: 'Build Logs'));
                  }),
                ]),

                _buildSheetSection('EXPLORE', [
                  _buildSheetItem(LucideIcons.lightbulb, 'Discovery Mode', onTap: () {
                    showDialog(context: context, builder: (_) => const ComingSoonDialog(featureName: 'Discovery Mode'));
                  }),
                  _buildSheetItem(LucideIcons.badge, 'Expert Directory', onTap: () {
                    showDialog(context: context, builder: (_) => const ComingSoonDialog(featureName: 'Expert Directory'));
                  }),
                  _buildSheetItem(LucideIcons.compass, 'Replay Tour', onTap: () {
                    showDialog(context: context, builder: (_) => const ComingSoonDialog(featureName: 'Replay Tour'));
                  }),
                ]),

                const SizedBox(height: 16),
                
                // Footer
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Privacy Policy', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 9, fontWeight: FontWeight.w600)),
                    Text('-', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 9, fontWeight: FontWeight.w600)),
                    Text('Terms of Service', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 9, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 16),
                Material(
                  color: const Color(0xFFFFF0F2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: InkWell(
                    onTap: () => _handleSignOut(context),
                    borderRadius: BorderRadius.circular(12),
                    splashColor: Colors.redAccent.withOpacity(0.3),
                    highlightColor: Colors.redAccent.withOpacity(0.2),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(LucideIcons.logOut, color: Color(0xFFFF2B5E), size: 15),
                          SizedBox(width: 8),
                          Text('Sign out', style: TextStyle(color: Color(0xFFFF2B5E), fontWeight: FontWeight.w900, fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
