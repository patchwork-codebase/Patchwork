import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'achievements_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final Future<Map<String, dynamic>?> _profileFuture;

  @override
  void initState() {
    super.initState();
    _profileFuture = _fetchProfile();
  }

  Future<Map<String, dynamic>?> _fetchProfile() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return null;

    final response = await Supabase.instance.client
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
    return response;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Profile', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.logOut, color: context.themeColors.textSecondary, size: 20),
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _profileFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final profile = snapshot.data;
          if (profile == null) {
            return const Center(child: Text('Failed to load profile.'));
          }

          final name = profile['name'] ?? 'Unknown Builder';
          final email = profile['email'] ?? '';
          final bio = profile['bio'] ?? 'No bio provided.';
          final role = profile['role'] ?? 'Builder';
          final city = profile['city'] ?? '';
          final domain = profile['domain'] ?? '';

          return Stack(
            children: [
              // Studio Lighting Gradient
              Positioned(
                top: -100,
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
              SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Avatar
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: context.themeColors.primary500.withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: context.themeColors.primary500.withOpacity(0.3), width: 2),
                        boxShadow: [
                          BoxShadow(color: context.themeColors.primary500.withOpacity(0.2), blurRadius: 20, spreadRadius: 5),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          name.substring(0, 1).toUpperCase(),
                          style: TextStyle(color: context.themeColors.primary400, fontSize: 40, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    
                    // Name & Email
                    Text(
                      name,
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary, letterSpacing: -0.5),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      email,
                      style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary, fontWeight: FontWeight.w500),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Stat Cards
                    Row(
                      children: [
                        Expanded(child: _buildStatCard('ROLE', role.toString().toUpperCase(), LucideIcons.user)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildStatCard('DOMAIN', domain.isEmpty ? 'N/A' : domain.toUpperCase(), LucideIcons.briefcase)),
                      ],
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Buttons
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (context) => const AchievementsScreen()));
                      },
                      icon: const Icon(LucideIcons.trophy, size: 18),
                      label: const Text('View Achievements & PoW'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.themeColors.primary500.withOpacity(0.15),
                        foregroundColor: context.themeColors.primary400,
                        elevation: 0,
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // Bio Section
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(LucideIcons.userCircle, size: 18, color: context.themeColors.textTertiary),
                              SizedBox(width: 8),
                              Text(
                                'ABOUT ME',
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: context.themeColors.textTertiary, letterSpacing: 1.5),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            bio,
                            style: TextStyle(fontSize: 15, height: 1.6, color: context.themeColors.textSecondary),
                          ),
                          if (city.isNotEmpty) ...[
                            const SizedBox(height: 24),
                            Row(
                              children: [
                                Icon(LucideIcons.mapPin, color: context.themeColors.primary400, size: 16),
                                const SizedBox(width: 8),
                                Text(
                                  city,
                                  style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          Icon(icon, color: context.themeColors.primary400, size: 24),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: context.themeColors.textPrimary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary, letterSpacing: 1.5),
          ),
        ],
      ),
    );
  }
}
