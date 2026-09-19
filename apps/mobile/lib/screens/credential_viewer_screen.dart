import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';

class CredentialViewerScreen extends StatelessWidget {
  final String credentialId;
  final String title;

  const CredentialViewerScreen({super.key, required this.credentialId, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Credential Viewer', style: TextStyle(color: context.themeColors.textPrimary)),
        backgroundColor: context.themeColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120, height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.05),
                  border: Border.all(color: Colors.white.withOpacity(0.1), width: 2),
                ),
                child: Icon(LucideIcons.checkCircle, size: 64, color: Colors.greenAccent),
              ),
              const SizedBox(height: 32),
              Text(
                title,
                style: TextStyle(color: context.themeColors.textPrimary, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: Colors.greenAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Text('Verified by Patchwork', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
              const SizedBox(height: 32),
              Text(
                'This credential mathematically proves the user\'s participation and impact in the highlighted domain.',
                textAlign: TextAlign.center,
                style: TextStyle(color: context.themeColors.textSecondary, fontSize: 14, height: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
