import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String? buttonText;
  final VoidCallback? onButtonTap;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.buttonText,
    this.onButtonTap,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Floating Icon
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.themeColors.surfaceHighlight,
                shape: BoxShape.circle,
                border: Border.all(color: context.themeColors.borderSubtle),
              ),
              child: Icon(
                icon,
                size: 48,
                color: context.themeColors.textTertiary,
              ),
            )
            .animate(onPlay: (controller) => controller.repeat(reverse: true))
            .moveY(begin: -5, end: 5, duration: 2.seconds, curve: Curves.easeInOut),
            
            const SizedBox(height: 24),
            
            // Title
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: context.themeColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
            
            const SizedBox(height: 12),
            
            // Description
            Text(
              description,
              style: TextStyle(
                fontSize: 14,
                color: context.themeColors.textSecondary,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0),
            
            // Optional Action Button
            if (buttonText != null && onButtonTap != null) ...[
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: onButtonTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.themeColors.primary500,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  buttonText!,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ).animate().fadeIn(delay: 400.ms).scale(begin: const Offset(0.9, 0.9)),
            ],
          ],
        ),
      ),
    );
  }
}
