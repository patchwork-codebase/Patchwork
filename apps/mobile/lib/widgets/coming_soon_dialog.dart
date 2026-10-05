import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';

class ComingSoonDialog extends StatelessWidget {
  final String featureName;

  const ComingSoonDialog({super.key, required this.featureName});

  @override
  Widget build(BuildContext context) {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
      child: Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: context.themeColors.surface,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: context.themeColors.borderSubtle, width: 2),
            boxShadow: [
              BoxShadow(
                color: context.themeColors.primary500.withOpacity(0.2),
                blurRadius: 40,
                spreadRadius: -10,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon Container with glow
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: context.themeColors.primary500.withOpacity(0.1),
                  border: Border.all(color: context.themeColors.primary500.withOpacity(0.3), width: 2),
                ),
                child: Center(
                  child: Icon(
                    LucideIcons.rocket,
                    size: 36,
                    color: context.themeColors.primary500,
                  ).animate(onPlay: (controller) => controller.repeat(reverse: true)).moveY(begin: -4, end: 4, duration: 1000.ms, curve: Curves.easeInOut),
                ),
              ).animate().scale(delay: 200.ms, duration: 400.ms, curve: Curves.easeOutBack),
              const SizedBox(height: 24),
              Text(
                featureName.toUpperCase(),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: context.themeColors.textTertiary,
                  letterSpacing: 1.5,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 300.ms),
              const SizedBox(height: 8),
              Text(
                'Chief, we are making progress!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: context.themeColors.textPrimary,
                  height: 1.2,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),
              const SizedBox(height: 12),
              Text(
                'Our builders are hard at work. We would ship this out soon.',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: context.themeColors.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.2),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.themeColors.primary500,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Got it, Chief',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ).animate().fadeIn(delay: 600.ms).scale(begin: const Offset(0.9, 0.9)),
            ],
          ),
        ),
      ).animate().fadeIn(duration: 300.ms).scale(begin: const Offset(0.95, 0.95), curve: Curves.easeOutQuad),
    );
  }
}
