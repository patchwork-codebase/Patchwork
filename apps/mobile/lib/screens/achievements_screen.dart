import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import 'credential_viewer_screen.dart';
import '../widgets/skeleton_loaders.dart';

class AchievementsScreen extends StatefulWidget {
  final String userId;
  const AchievementsScreen({super.key, required this.userId});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _achievements = [];

  @override
  void initState() {
    super.initState();
    _fetchAchievements();
  }

  Future<void> _fetchAchievements() async {
    try {
      final res = await Supabase.instance.client
          .from('user_badges')
          .select('id, badges!inner(id, title, description, icon_name, color_theme, badge_type)')
          .eq('user_id', widget.userId)
          .eq('badges.badge_type', 'achievement')
          .order('issued_at', ascending: false);

      if (mounted) {
        setState(() {
          _achievements = List<Map<String, dynamic>>.from(res);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching achievements: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  IconData _getIconData(String? iconName) {
    if (iconName == null) return LucideIcons.award;
    switch (iconName.toLowerCase()) {
      case 'rocket': return LucideIcons.rocket;
      case 'shipped!': return LucideIcons.truck;
      case 'star': return LucideIcons.star;
      case 'fire': return LucideIcons.flame;
      case 'crown': return LucideIcons.crown;
      case 'shield': return LucideIcons.shield;
      case 'zap': return LucideIcons.zap;
      case 'heart': return LucideIcons.heart;
      case 'trophy': return LucideIcons.trophy;
      case 'eye': return LucideIcons.eye;
      default: return LucideIcons.medal;
    }
  }

  Color _getColor(String? colorName, BuildContext context) {
    if (colorName == null) return context.themeColors.primary500;
    switch (colorName.toLowerCase()) {
      case 'emerald': return Colors.teal;
      case 'rose': return Colors.pink;
      case 'amber': return Colors.amber;
      case 'blue': return Colors.blue;
      case 'purple': return Colors.purple;
      case 'indigo': return Colors.indigo;
      case 'orange': return Colors.orange;
      default: return context.themeColors.primary500;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Achievements & PoW', style: TextStyle(color: context.themeColors.textPrimary)),
        backgroundColor: context.themeColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [Colors.purple.withOpacity(0.2), context.themeColors.primary500.withOpacity(0.2)]),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.purple.withOpacity(0.1)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), shape: BoxShape.circle),
                    child: Icon(LucideIcons.medal, size: 32, color: Colors.purpleAccent),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Proof of Work', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Verified credentials backing your experience.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13)),
                      ],
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 32),
            Text('Your Credentials', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_achievements.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    children: [
                      Icon(LucideIcons.ghost, size: 48, color: context.themeColors.textTertiary),
                      const SizedBox(height: 16),
                      Text("No achievements yet", style: TextStyle(color: context.themeColors.textSecondary)),
                    ],
                  ),
                ),
              )
            else
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.85,
                ),
                itemCount: _achievements.length,
                itemBuilder: (context, index) {
                  final userBadge = _achievements[index];
                  final badge = userBadge['badges'] as Map<String, dynamic>;
                  
                  final iconData = _getIconData(badge['icon_name']?.toString());
                  final colorData = _getColor(badge['color_theme']?.toString(), context);
                  
                  return GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(MaterialPageRoute(
                        builder: (context) => CredentialViewerScreen(
                          credentialId: userBadge['id'] as String, 
                          title: badge['title'] as String
                        ),
                      ));
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(iconData, size: 48, color: colorData),
                          const SizedBox(height: 16),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8.0),
                            child: Text(
                              badge['title'] as String? ?? 'Achievement',
                              style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
