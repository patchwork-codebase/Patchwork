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

      final roomsResponse = await Supabase.instance.client
          .from('rooms')
          .select('id')
          .eq('builder_id', userId)
          .count();

      final updatesResponse = await Supabase.instance.client
          .from('updates')
          .select('id')
          .eq('author_id', userId)
          .count();

      if (mounted) {
        setState(() {
          if (userResponse != null) {
            if (userResponse['name'] != null) _userName = userResponse['name'];
            if (userResponse['avatar'] != null) _avatarUrl = userResponse['avatar'];
          }
          _roomCount = roomsResponse.count ?? 0;
          _updateCount = updatesResponse.count ?? 0;
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

  Widget _buildStatBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: context.themeColors.surfaceHighlight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.themeColors.borderSubtle),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
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
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Text(title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.themeColors.textTertiary, letterSpacing: 1.5)),
          ),
          ...items,
        ],
      ),
    );
  }

  Widget _buildSheetItem(IconData icon, String label, {Color? color, Widget? trailing, VoidCallback? onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 18, color: color ?? context.themeColors.textSecondary),
              const SizedBox(width: 14),
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
    final displayName = _userName;
    final themeMode = ref.watch(themeProvider);

    return Container(
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 6,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(color: context.themeColors.border, borderRadius: BorderRadius.circular(10)),
                ),
              ),

              // User Info Header
              Row(
                children: [
                  Container(
                    width: 56, height: 56,
                    decoration: BoxDecoration(
                      color: context.themeColors.primary500.withOpacity(0.15),
                      shape: BoxShape.circle,
                      border: Border.all(color: context.themeColors.primary500.withOpacity(0.3), width: 2),
                      image: _avatarUrl != null && _avatarUrl!.isNotEmpty
                          ? DecorationImage(
                              image: CachedNetworkImageProvider(_avatarUrl!),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: (_avatarUrl == null || _avatarUrl!.isEmpty)
                        ? Center(child: Text(displayName.isNotEmpty ? displayName[0].toUpperCase() : 'B', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.w900, fontSize: 24)))
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
                          Text(displayName, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: context.themeColors.textPrimary)),
                        const SizedBox(height: 2),
                        Text(email, style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontFamily: 'monospace')),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Stats Row
              Row(
                children: [
                  _buildStatBox('ROOMS', _isLoadingStats ? '-' : '$_roomCount', Colors.lightBlue),
                  const SizedBox(width: 12),
                  _buildStatBox('UPDATES', _isLoadingStats ? '-' : '$_updateCount', Colors.amber),
                  const SizedBox(width: 12),
                  _buildStatBox('REP', '342', context.themeColors.primary500),
                ],
              ),
              const SizedBox(height: 32),

              // Sections
              _buildSheetSection('ACCOUNT', [
                _buildSheetItem(
                  LucideIcons.user, 
                  'My Profile', 
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
                _buildSheetItem(LucideIcons.award, 'Achievements', trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: context.themeColors.primary500.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                  child: Text('2 NEW', style: TextStyle(color: context.themeColors.primary500, fontSize: 10, fontWeight: FontWeight.bold)),
                )),
              ]),
              _buildSheetSection('PRODUCT OPS', [
                _buildSheetItem(LucideIcons.map, 'Roadmap View', color: Colors.indigoAccent),
                _buildSheetItem(LucideIcons.fileText, 'Build Logs'),
              ]),

              Divider(color: context.themeColors.border, height: 32),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Patchwork App v1.0.0', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12, fontWeight: FontWeight.w500)),
                  TextButton(
                    onPressed: () => _handleSignOut(context),
                    child: const Text('Sign out', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
