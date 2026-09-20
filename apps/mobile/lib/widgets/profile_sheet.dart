import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import '../screens/login_screen.dart';
import '../screens/edit_profile_screen.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme.dart';
import '../screens/login_screen.dart';
import '../screens/edit_profile_screen.dart';
import '../providers/theme_provider.dart';

class ProfileSheet extends ConsumerStatefulWidget {
  const ProfileSheet({super.key});

  @override
  ConsumerState<ProfileSheet> createState() => _ProfileSheetState();
}

class _ProfileSheetState extends ConsumerState<ProfileSheet> {
  int _roomCount = 0;
  int _updateCount = 0;
  String _userName = '';
  String? _avatarUrl;
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    final user = Supabase.instance.client.auth.currentUser;
    if (user != null && user.userMetadata != null) {
      if (user.userMetadata!['name'] != null) {
        _userName = user.userMetadata!['name'];
      } else if (user.userMetadata!['full_name'] != null) {
        _userName = user.userMetadata!['full_name'];
      }
      if (user.userMetadata!['avatar'] != null) {
        _avatarUrl = user.userMetadata!['avatar'];
      } else if (user.userMetadata!['avatar_url'] != null) {
        _avatarUrl = user.userMetadata!['avatar_url'];
      }
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
          .select('name, avatar')
          .eq('id', userId)
          .maybeSingle();

      final List<dynamic> roomsResponse = await Supabase.instance.client
          .from('rooms')
          .select('id')
          .eq('builder_id', userId);

      final List<dynamic> updatesResponse = await Supabase.instance.client
          .from('updates')
          .select('id')
          .eq('author_id', userId);

      if (mounted) {
        setState(() {
          if (userResponse != null) {
            if (userResponse['name'] != null && userResponse['name'].toString().trim().isNotEmpty) {
              _userName = userResponse['name'];
            }
            if (userResponse['avatar'] != null) _avatarUrl = userResponse['avatar'];
          }
          _roomCount = roomsResponse.length;
          _updateCount = updatesResponse.length;
          _isLoadingStats = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingStats = false);
    }
  }

  Future<void> _handleSignOut(BuildContext context) async {
    Navigator.of(context).pop(); // close bottom sheet
    await Supabase.instance.client.auth.signOut();
    if (context.mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
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
            Icon(icon, size: 20, color: color.withOpacity(0.8)),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(color: context.themeColors.textPrimary, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
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
            child: Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.themeColors.textTertiary, letterSpacing: 1.5)),
          ),
          Container(
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight.withOpacity(0.4),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.themeColors.borderSubtle.withOpacity(0.5)),
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
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (color ?? context.themeColors.textSecondary).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 16, color: color ?? context.themeColors.textSecondary),
              ),
              const SizedBox(width: 16),
              Expanded(child: Text(label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: context.themeColors.textPrimary))),
              if (trailing != null) trailing else Icon(LucideIcons.chevronRight, size: 16, color: context.themeColors.textTertiary),
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
                Row(
                  children: [
                    Container(
                      width: 64, height: 64,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [context.themeColors.primary500, context.themeColors.primary400],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: context.themeColors.primary500.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(3.0),
                        child: Container(
                          decoration: BoxDecoration(
                            color: context.themeColors.surface,
                            shape: BoxShape.circle,
                            image: _avatarUrl != null && _avatarUrl!.isNotEmpty
                                ? DecorationImage(
                                    image: CachedNetworkImageProvider(_avatarUrl!),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                          child: (_avatarUrl == null || _avatarUrl!.isEmpty)
                              ? Center(child: Text(displayName.isNotEmpty ? displayName[0].toUpperCase() : 'B', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 24)))
                              : null,
                        ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_isLoadingStats && displayName == 'Builder')
                            Container(width: 120, height: 24, decoration: BoxDecoration(color: context.themeColors.borderSubtle, borderRadius: BorderRadius.circular(4)))
                          else
                            Text(displayName, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: context.themeColors.textPrimary, letterSpacing: -0.5)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: context.themeColors.surfaceHighlight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(email, style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Stats Row
                Row(
                  children: [
                    _buildStatBox('ROOMS', _isLoadingStats ? '-' : '$_roomCount', Colors.lightBlue, LucideIcons.layoutGrid),
                    const SizedBox(width: 12),
                    _buildStatBox('UPDATES', _isLoadingStats ? '-' : '$_updateCount', Colors.amber, LucideIcons.zap),
                    const SizedBox(width: 12),
                    _buildStatBox('REP', '342', context.themeColors.primary500, LucideIcons.medal),
                  ],
                ),
                const SizedBox(height: 32),

                // Sections
                _buildSheetSection('ACCOUNT', [
                  _buildSheetItem(
                    LucideIcons.user, 
                    'My Profile', 
                    color: Colors.blueAccent,
                    onTap: () {
                      Navigator.of(context).push(MaterialPageRoute(builder: (context) => const EditProfileScreen())).then((shouldRefresh) {
                        if (shouldRefresh == true) {
                          _fetchStats();
                        }
                      });
                    }
                  ),
                  _buildSheetItem(
                    themeMode == ThemeMode.light ? LucideIcons.moon : LucideIcons.sun,
                    'Appearance',
                    color: Colors.deepPurpleAccent,
                    trailing: DropdownButtonHideUnderline(
                      child: DropdownButton<ThemeMode>(
                        value: themeMode,
                        icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppTheme.textTertiary),
                        dropdownColor: context.themeColors.surfaceHighlight,
                        style: TextStyle(color: context.themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
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
                  _buildSheetItem(LucideIcons.award, 'Achievements', color: Colors.orangeAccent, trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: context.themeColors.primary500, borderRadius: BorderRadius.circular(12)),
                    child: const Text('2 NEW', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  )),
                ]),
                _buildSheetSection('PRODUCT OPS', [
                  _buildSheetItem(LucideIcons.map, 'Roadmap View', color: Colors.indigoAccent),
                  _buildSheetItem(LucideIcons.fileText, 'Build Logs', color: Colors.teal),
                ]),

                const SizedBox(height: 16),
                
                // Footer
                InkWell(
                  onTap: () => _handleSignOut(context),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                    ),
                    child: const Center(
                      child: Text('Sign out', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w800, fontSize: 15)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: Text('Patchwork App v1.0.0', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600)),
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
