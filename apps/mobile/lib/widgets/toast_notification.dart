import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'dart:ui';
import '../theme.dart';

class ToastService {
  static void show(
    BuildContext context, 
    String message, 
    {bool isError = false, IconData? icon}
  ) {
    final overlay = Overlay.of(context);
    late OverlayEntry overlayEntry;
    
    overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 16,
        left: 16,
        right: 16,
        child: Material(
          color: Colors.transparent,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isError 
                      ? Colors.red.withOpacity(0.15)
                      : context.themeColors.surfaceHighlight.withOpacity(0.7),
                  border: Border.all(
                    color: isError 
                        ? Colors.red.withOpacity(0.3)
                        : context.themeColors.borderSubtle.withOpacity(0.5),
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(
                      icon ?? (isError ? LucideIcons.alertCircle : LucideIcons.checkCircle),
                      color: isError ? Colors.redAccent : context.themeColors.primary500,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        message,
                        style: TextStyle(
                          color: context.themeColors.textPrimary,
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .animate(
            onComplete: (controller) => Future.delayed(
              const Duration(seconds: 3), 
              () {
                if (overlayEntry.mounted) {
                  controller.reverse().then((_) => overlayEntry.remove());
                }
              }
            )
          )
          .slideY(begin: -1.0, end: 0, duration: 400.ms, curve: Curves.easeOutBack)
          .fadeIn(duration: 400.ms),
        ),
      ),
    );

    overlay.insert(overlayEntry);
  }
}
