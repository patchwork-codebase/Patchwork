import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme.dart';
import 'parallax_container.dart';

class BentoProfileHeader extends StatelessWidget {
  final Map<String, dynamic> profile;
  final int projectsCount;
  final int followerCount;
  final bool isOwnProfile;
  final bool isFollowing;
  final bool isTogglingFollow;
  final VoidCallback? onToggleFollow;
  final VoidCallback? onEditProfile;
  final Function(String?, String) onLaunchUrl;

  const BentoProfileHeader({
    super.key,
    required this.profile,
    required this.projectsCount,
    required this.followerCount,
    required this.isOwnProfile,
    this.isFollowing = false,
    this.isTogglingFollow = false,
    this.onToggleFollow,
    this.onEditProfile,
    required this.onLaunchUrl,
  });

  @override
  Widget build(BuildContext context) {
    final name = profile['name'] ?? 'Unknown Builder';
    final bio = profile['bio'] ?? 'Building better products that solve real problems.';
    final role = profile['role'] ?? 'Builder';
    final avatarUrl = profile['avatar']?.toString();
    final initial = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?';

    final twitter = profile['twitter']?.toString();
    final github = profile['github_url']?.toString();
    final website = profile['website']?.toString();
    final linkedin = profile['linkedin_url']?.toString();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Top Row: Avatar/Bio + Stats
          SizedBox(
            height: 180,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Main Identity Box
                Expanded(
                  flex: 5,
                  child: _BentoBox(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: context.themeColors.primary500,
                                image: avatarUrl != null && avatarUrl.isNotEmpty
                                    ? DecorationImage(
                                        image: CachedNetworkImageProvider(avatarUrl),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: avatarUrl == null || avatarUrl.isEmpty
                                  ? Center(child: Text(initial, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)))
                                  : null,
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: context.themeColors.primary500.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                role,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: context.themeColors.primary500,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          name,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: context.themeColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        Expanded(
                          child: Text(
                            bio,
                            style: TextStyle(
                              fontSize: 13,
                              color: context.themeColors.textSecondary,
                              height: 1.4,
                            ),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Stats Column
                Expanded(
                  flex: 3,
                  child: Column(
                    children: [
                      Expanded(
                        child: _BentoBox(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                projectsCount.toString(),
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: context.themeColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Projects',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: context.themeColors.textTertiary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: _BentoBox(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                followerCount.toString(),
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: context.themeColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Followers',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: context.themeColors.textTertiary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
          
          const SizedBox(height: 12),
          
          // Bottom Row: Actions & Socials
          SizedBox(
            height: 64,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Primary Action Button (Follow / Edit)
                Expanded(
                  flex: 4,
                  child: isOwnProfile
                      ? _BentoButton(
                          onTap: onEditProfile,
                          color: context.themeColors.surfaceHighlight,
                          child: Text(
                            'Edit Profile',
                            style: TextStyle(
                              color: context.themeColors.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        )
                      : _BentoButton(
                          onTap: onToggleFollow,
                          color: isFollowing ? context.themeColors.surfaceHighlight : context.themeColors.primary500,
                          child: isTogglingFollow
                              ? SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: isFollowing ? context.themeColors.textPrimary : Colors.white,
                                  ),
                                )
                              : Text(
                                  isFollowing ? 'Following' : 'Follow',
                                  style: TextStyle(
                                    color: isFollowing ? context.themeColors.textPrimary : Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                ),
                if (twitter != null && twitter.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  _BentoButton(
                    onTap: () => onLaunchUrl(twitter, 'https://twitter.com/'),
                    color: const Color(0xFF1DA1F2).withOpacity(0.15),
                    child: const Icon(LucideIcons.twitter, color: Color(0xFF1DA1F2), size: 22),
                  ),
                ],
                if (github != null && github.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  _BentoButton(
                    onTap: () => onLaunchUrl(github, ''),
                    color: Colors.white.withOpacity(0.1),
                    child: const Icon(LucideIcons.github, color: Colors.white, size: 22),
                  ),
                ],
                if (linkedin != null && linkedin.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  _BentoButton(
                    onTap: () => onLaunchUrl(linkedin, ''),
                    color: const Color(0xFF0077B5).withOpacity(0.15),
                    child: const Icon(LucideIcons.linkedin, color: Color(0xFF0077B5), size: 22),
                  ),
                ],
                if (website != null && website.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  _BentoButton(
                    onTap: () => onLaunchUrl(website, ''),
                    color: context.themeColors.surfaceHighlight,
                    child: Icon(LucideIcons.globe, color: context.themeColors.textPrimary, size: 22),
                  ),
                ],
              ],
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 100.ms).slideY(begin: 0.2, curve: Curves.easeOutCubic),
        ],
      ),
    );
  }
}

class _BentoBox extends StatelessWidget {
  final Widget child;

  const _BentoBox({required this.child});

  @override
  Widget build(BuildContext context) {
    return ParallaxContainer(
      maxTilt: 0.08,
      enableShadows: true,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.themeColors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: context.themeColors.borderSubtle, width: 1.5),
        ),
        child: child,
      ),
    );
  }
}

class _BentoButton extends StatelessWidget {
  final Widget child;
  final Color color;
  final VoidCallback? onTap;

  const _BentoButton({required this.child, required this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    return ParallaxContainer(
      maxTilt: 0.12,
      enableShadows: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.05), width: 1.5),
          ),
          child: Center(child: child),
        ),
      ),
    );
  }
}
