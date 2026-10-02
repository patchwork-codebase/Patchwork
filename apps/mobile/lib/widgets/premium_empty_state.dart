import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';

class PremiumEmptyState extends StatelessWidget {
  final String title;
  final String message;
  final String? lottieUrl;
  final IconData? fallbackIcon;
  final String? buttonText;
  final VoidCallback? onButtonPressed;

  const PremiumEmptyState({
    super.key,
    required this.title,
    required this.message,
    this.lottieUrl,
    this.fallbackIcon,
    this.buttonText,
    this.onButtonPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 48.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animation or Icon
            if (lottieUrl != null)
              SizedBox(
                height: 200,
                width: 200,
                child: Lottie.network(
                  lottieUrl!,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return _buildFallbackIcon(context);
                  },
                ),
              ).animate().fadeIn(duration: 600.ms, curve: Curves.easeOut).scale(begin: const Offset(0.8, 0.8), curve: Curves.easeOutBack)
            else
              _buildFallbackIcon(context).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.8, 0.8), curve: Curves.easeOutBack),
            
            const SizedBox(height: 24),
            
            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: context.themeColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
            
            const SizedBox(height: 12),
            
            // Message
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: context.themeColors.textSecondary,
                height: 1.5,
              ),
            ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),
            
            // Optional Action Button
            if (buttonText != null && onButtonPressed != null) ...[
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  // Add a satisfying haptic feedback when pressed
                  onButtonPressed!();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.themeColors.primary500,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: Text(
                  buttonText!,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackIcon(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: context.themeColors.surfaceHighlight.withOpacity(0.5),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: context.themeColors.primary500.withOpacity(0.1),
            blurRadius: 40,
            spreadRadius: 10,
          )
        ],
      ),
      child: Icon(
        fallbackIcon ?? LucideIcons.inbox,
        size: 64,
        color: context.themeColors.textTertiary,
      ),
    );
  }
}
