import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import 'credential_viewer_screen.dart';

class AchievementsScreen extends StatelessWidget {
  const AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock achievements data
    final achievements = [
      {'title': 'Top Builder (Aug)', 'icon': LucideIcons.trophy, 'color': Colors.amber, 'id': 'achv-1'},
      {'title': '10k Views', 'icon': LucideIcons.eye, 'color': Colors.blue, 'id': 'achv-2'},
      {'title': 'Early Adopter', 'icon': LucideIcons.rocket, 'color': Colors.purple, 'id': 'achv-3'},
    ];

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
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.85,
              ),
              itemCount: achievements.length,
              itemBuilder: (context, index) {
                final achv = achievements[index];
                return GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(MaterialPageRoute(
                      builder: (context) => CredentialViewerScreen(credentialId: achv['id'] as String, title: achv['title'] as String),
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
                        Icon(achv['icon'] as IconData, size: 48, color: achv['color'] as Color),
                        const SizedBox(height: 16),
                        Text(
                          achv['title'] as String,
                          style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
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
