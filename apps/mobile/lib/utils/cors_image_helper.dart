import 'package:flutter/foundation.dart';

/// Wraps network image URLs with a CORS-compliant proxy when running on Flutter Web,
/// preventing browser CanvasKit from blocking domains like image2url.com.
String safeImageUrl(String? url) {
  if (url == null || url.trim().isEmpty) return '';
  final trimmed = url.trim();
  if (kIsWeb) {
    final uri = Uri.tryParse(trimmed);
    if (uri != null && uri.host.isNotEmpty) {
      if (uri.host.contains('image2url.com')) {
        return 'https://wsrv.nl/?url=${Uri.encodeComponent(trimmed)}';
      }
    }
  }
  return trimmed;
}
