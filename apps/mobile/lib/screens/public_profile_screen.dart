import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'room_detail_screen.dart';

class PublicProfileScreen extends StatefulWidget {
  final String userId;

  const PublicProfileScreen({super.key, required this.userId});

  @override
  State<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends State<PublicProfileScreen> {
  late final Future<Map<String, dynamic>?> _profileFuture;
  late final Future<List<Map<String, dynamic>>> _roomsFuture;

  @override
  void initState() {
    super.initState();
    _profileFuture = _fetchProfile();
    _roomsFuture = _fetchRooms();
  }

  Future<Map<String, dynamic>?> _fetchProfile() async {
    return await Supabase.instance.client
        .from('users')
        .select('*')
        .eq('id', widget.userId)
        .maybeSingle();
  }

  Future<List<Map<String, dynamic>>> _fetchRooms() async {
    return await Supabase.instance.client
        .from('rooms')
        .select('*')
        .eq('builder_id', widget.userId)
        .eq('status', 'active')
        .order('created_at', ascending: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Builder Profile', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
      ),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _profileFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
          }
          if (snapshot.hasError || snapshot.data == null) {
            return const Center(child: Text('Failed to load profile.', style: TextStyle(color: Colors.redAccent)));
          }

          final profile = snapshot.data!;
          final name = profile['name'] ?? 'Unknown Builder';
          final email = profile['email'] ?? '';
          final bio = profile['bio'] ?? 'No bio provided.';
          final role = profile['role'] ?? 'Builder';
          final city = profile['city'] ?? '';
          final domain = profile['domain'] ?? '';
          final avatar = profile['avatar']?.toString();

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
                    Hero(
                      tag: 'avatar-${widget.userId}',
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: context.themeColors.primary500.withOpacity(0.15),
                          shape: BoxShape.circle,
                          border: Border.all(color: context.themeColors.primary500.withOpacity(0.3), width: 2),
                          boxShadow: [
                            BoxShadow(color: context.themeColors.primary500.withOpacity(0.2), blurRadius: 20, spreadRadius: 5),
                          ],
                          image: avatar != null && avatar.isNotEmpty
                              ? DecorationImage(image: NetworkImage(avatar), fit: BoxFit.cover)
                              : null,
                        ),
                        child: (avatar == null || avatar.isEmpty)
                            ? Center(
                                child: Text(
                                  name.substring(0, 1).toUpperCase(),
                                  style: TextStyle(color: context.themeColors.primary400, fontSize: 40, fontWeight: FontWeight.bold),
                                ),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 20),
                    
                    // Name & Email
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          name,
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary, letterSpacing: -0.5),
                        ),
                        if (profile['is_verified_expert'] == true) ...[
                          const SizedBox(width: 6),
                          Icon(LucideIcons.badgeCheck, color: context.themeColors.primary500, size: 20),
                        ],
                      ],
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
                                'ABOUT',
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

                    const SizedBox(height: 32),
                    
                    // Rooms Header
                    Row(
                      children: [
                        Icon(LucideIcons.layoutGrid, size: 18, color: context.themeColors.textTertiary),
                        SizedBox(width: 8),
                        Text(
                          'ROOMS BUILT',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: context.themeColors.textTertiary, letterSpacing: 1.5),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Rooms List
                    FutureBuilder<List<Map<String, dynamic>>>(
                      future: _roomsFuture,
                      builder: (context, roomsSnapshot) {
                        if (roomsSnapshot.connectionState == ConnectionState.waiting) {
                          return Center(child: CircularProgressIndicator(color: context.themeColors.primary500));
                        }
                        if (roomsSnapshot.hasError) {
                          return const Center(child: Text('Failed to load rooms.', style: TextStyle(color: Colors.redAccent)));
                        }

                        final rooms = roomsSnapshot.data ?? [];
                        if (rooms.isEmpty) {
                          return Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 32),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.02),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: Colors.white.withOpacity(0.05)),
                            ),
                            child: Column(
                              children: [
                                Icon(LucideIcons.packageOpen, color: context.themeColors.textTertiary, size: 32),
                                SizedBox(height: 12),
                                Text('No rooms built yet.', style: TextStyle(color: context.themeColors.textSecondary)),
                              ],
                            ),
                          );
                        }

                        return ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: rooms.length,
                          itemBuilder: (context, index) {
                            final room = rooms[index];
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(context, MaterialPageRoute(
                                  builder: (context) => RoomDetailScreen(roomId: room['id'], title: room['title'] ?? 'Untitled'),
                                ));
                              },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                padding: const EdgeInsets.all(20),
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
                                    Text(room['title'] ?? 'Untitled', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: context.themeColors.textPrimary)),
                                    const SizedBox(height: 8),
                                    Text(
                                      room['description'] ?? 'No description',
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(fontSize: 14, color: context.themeColors.textSecondary, height: 1.5),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn(duration: 300.ms, delay: (index * 50).ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOutQuad),
                            );
                          },
                        );
                      },
                    ),

                    const SizedBox(height: 48), // Padding
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
