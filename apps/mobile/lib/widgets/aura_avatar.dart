import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'dart:ui';

class AuraAvatar extends StatelessWidget {
  final String? avatarUrl;
  final String initials;
  final String? role; // 'builder' or 'observer'
  final double size;

  const AuraAvatar({
    super.key,
    required this.avatarUrl,
    required this.initials,
    this.role,
    this.size = 48.0,
  });

  @override
  Widget build(BuildContext context) {
    final isBuilder = role?.toLowerCase() == 'builder';
    final isObserver = role?.toLowerCase() == 'observer';

    // Define gradients based on role
    Gradient borderGradient;
    if (isBuilder) {
      // "Lagos Sunrise" - Vibrant Ankara-inspired Afrobeats vibe
      borderGradient = const LinearGradient(
        colors: [Color(0xFFFFD700), Color(0xFFFF5722), Color(0xFFE91E63), Color(0xFF9C27B0)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (isObserver) {
      // "Afro-Futurism" - Neon Tech vibe
      borderGradient = const LinearGradient(
        colors: [Color(0xFF00E5FF), Color(0xFF7C4DFF), Color(0xFF1DE9B6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else {
      borderGradient = LinearGradient(
        colors: [context.themeColors.borderSubtle, context.themeColors.borderSubtle],
      );
    }

    Widget avatarCore = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: context.themeColors.surfaceHighlight,
      ),
      child: ClipOval(
        child: avatarUrl != null && avatarUrl!.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: avatarUrl!,
                fit: BoxFit.cover,
                placeholder: (c, url) => Container(color: context.themeColors.surfaceHighlight),
                errorWidget: (c, e, s) => _buildInitials(context),
              )
            : _buildInitials(context),
      ),
    );

    if (!isBuilder && !isObserver) {
      return Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: context.themeColors.borderSubtle, width: 2),
        ),
        child: avatarCore,
      );
    }

    return Stack(
      alignment: Alignment.center,
      children: [
        // The glowing aura background
        Container(
          width: size + 6,
          height: size + 6,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: borderGradient,
            boxShadow: [
              BoxShadow(
                color: (isBuilder ? const Color(0xFFFF5722) : const Color(0xFF00E5FF)).withOpacity(0.4),
                blurRadius: 12,
                spreadRadius: 2,
              ),
            ],
          ),
        ).animate(
          onPlay: (controller) => controller.repeat(reverse: true),
        ).scale(
          begin: const Offset(0.92, 0.92),
          end: const Offset(1.08, 1.08),
          duration: isBuilder ? 1200.ms : 2500.ms,
          curve: Curves.easeInOutSine, // Rhythmic breathing
        ).fade(
          begin: 0.6,
          end: 1.0,
          duration: isBuilder ? 1200.ms : 2500.ms,
        ),
        
        // A black inner border to separate aura from avatar
        Container(
          width: size + 4,
          height: size + 4,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: context.themeColors.background,
          ),
        ),

        // The actual avatar
        avatarCore.animate().scale(
          duration: 600.ms,
          curve: Curves.elasticOut, // African drum bounce effect on load
        ),
      ],
    );
  }

  Widget _buildInitials(BuildContext context) {
    return Center(
      child: Text(
        initials.isNotEmpty ? initials.substring(0, 1).toUpperCase() : '?',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: size * 0.4,
          color: context.themeColors.textPrimary,
        ),
      ),
    );
  }
}
