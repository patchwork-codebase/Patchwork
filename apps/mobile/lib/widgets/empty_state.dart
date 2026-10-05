import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lottie/lottie.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String? buttonText;
  final VoidCallback? onButtonTap;
  final String? lottieUrl;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.buttonText,
    this.onButtonTap,
    this.lottieUrl,
  });

  @override
  Widget build(BuildContext context) {
    // Attempt to automatically map standard icons to premium Lottie animations
    String? resolvedLottieUrl = lottieUrl;
    
    if (resolvedLottieUrl == null) {
      if (icon == LucideIcons.ghost) {
        resolvedLottieUrl = 'https://lottie.host/3e6804a6-4bba-4a25-a1c6-a6fcadfbcc23/8u31YhD9sJ.json'; // Empty ghost/box
      } else if (icon == LucideIcons.messageCircle || icon == LucideIcons.messageSquare) {
        resolvedLottieUrl = 'https://lottie.host/81b22e11-cf0b-4bd0-8356-073ed713cd10/8QyV35F1zJ.json'; // Messages
      } else if (icon == LucideIcons.bell) {
        resolvedLottieUrl = 'https://lottie.host/a9807212-0046-4dc4-b76b-31bf7a8e8013/YkGvwPZgQo.json'; // Notifications
      } else if (icon == LucideIcons.search) {
        resolvedLottieUrl = 'https://lottie.host/80eebaa6-2780-4dcd-bf92-2ad70bcf4e98/G1wXFp0k0c.json'; // Search
      }
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 48.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animation or Icon
            if (resolvedLottieUrl != null)
              SizedBox(
                height: 180,
                width: 180,
                child: Lottie.network(
                  resolvedLottieUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return _buildFallbackIcon(context);
                  },
                ),
              ).animate().fadeIn(duration: 600.ms, curve: Curves.easeOut).scale(begin: const Offset(0.8, 0.8), curve: Curves.easeOutBack)
            else
              _buildFallbackIcon(context),
            
            const SizedBox(height: 24),
            
            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: context.themeColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
            
            const SizedBox(height: 12),
            
            // Description
            Text(
              description,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: context.themeColors.textSecondary,
                height: 1.5,
              ),
            ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),
            
            // Optional Action Button
            if (buttonText != null && onButtonTap != null) ...[
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: onButtonTap,
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
                    fontSize: 12,
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
      padding: const EdgeInsets.all(28),
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
        icon,
        size: 47,
        color: context.themeColors.textTertiary,
      ),
    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
     .moveY(begin: -8, end: 8, duration: 2.seconds, curve: Curves.easeInOut);
  }
}
