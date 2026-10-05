import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:any_link_preview/any_link_preview.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';

class RichLinkPreviewCard extends StatelessWidget {
  final String url;

  const RichLinkPreviewCard({super.key, required this.url});

  void _launchUrl() async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } catch (e) {
      debugPrint('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!AnyLinkPreview.isValidLink(url)) {
      return const SizedBox.shrink();
    }

    return GestureDetector(
      onTap: _launchUrl,
      child: Container(
        margin: const EdgeInsets.only(top: 8, bottom: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.themeColors.borderSubtle),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        clipBehavior: Clip.hardEdge,
        child: AnyLinkPreview.builder(
          link: url,
          itemBuilder: (context, metadata, imageProvider, svgPicture) {
            return _buildCustomPreview(context, metadata, imageProvider);
          },
          errorWidget: Container(
            color: context.themeColors.surfaceHighlight,
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(LucideIcons.link, color: context.themeColors.textSecondary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    url,
                    style: TextStyle(color: context.themeColors.textSecondary, fontSize: 10),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          placeholderWidget: Container(
            height: 150,
            color: context.themeColors.surfaceHighlight,
            child: Center(child: CircularProgressIndicator(color: context.themeColors.primary500)),
          ),
        ),
      ),
    );
  }

  Widget _buildCustomPreview(BuildContext context, Metadata metadata, ImageProvider? imageProvider) {
    return Container(
      width: double.infinity,
      color: context.themeColors.surface,
      child: Stack(
        children: [
          // Background Image
          if (imageProvider != null)
            Image(
              image: imageProvider,
              width: double.infinity,
              height: 220,
              fit: BoxFit.cover,
            )
          else
            Container(
              width: double.infinity,
              height: 120,
              color: context.themeColors.surfaceHighlight,
              child: Icon(LucideIcons.image, size: 40, color: context.themeColors.textTertiary),
            ),
          
          // Glassmorphic overlay at the bottom
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: ClipRRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.2),
                        Colors.black.withOpacity(0.85),
                      ],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(LucideIcons.globe, size: 8, color: Colors.white),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              _getDomain(url),
                              style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white70),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        metadata.title ?? _getDomain(url),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.2,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (metadata.desc != null && metadata.desc!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          metadata.desc!,
                          style: const TextStyle(
                            fontSize: 10,
                            color: Colors.white70,
                            height: 1.3,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getDomain(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.host.replaceFirst('www.', '');
    } catch (e) {
      return url;
    }
  }
}
