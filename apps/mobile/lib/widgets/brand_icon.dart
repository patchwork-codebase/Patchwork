import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Pixel-perfect, zero-dependency official brand vector icons that render
/// natively across Web, iOS, Android, and Desktop without missing-glyph or font loading bugs.
class BrandIcon {
  // Official X (Twitter) mark
  static const String _xSvg = '''
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
</svg>
''';

  // Official GitHub Octocat silhouette
  static const String _githubSvg = '''
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
</svg>
''';

  // Official LinkedIn "in" symbol
  static const String _linkedinSvg = '''
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
</svg>
''';

  // Crisp Website / Portfolio Globe
  static const String _globeSvg = '''
<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="2" y1="12" x2="22" y2="12"/>
  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
</svg>
''';

  // Official Figma Mark
  static const String _figmaSvg = '''
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zm7-3.5h3.5a3.5 3.5 0 1 1 0 7H12V2zm-7 10.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5zm7 0a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0zm-7 7A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 0 1-7 0z"/>
</svg>
''';

  // Official Notion 'N' Mark
  static const String _notionSvg = '''
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.246-.84c1.167-.093 1.354.373.98 1.12l-2.614 4.013v10.362c0 .933-.56 1.493-1.68 1.586l-10.873.747c-.84.093-1.307-.28-1.307-.933V6.262c0-.933.467-1.493 1.82-2.054zm1.96 2.52v12.23l9.055-.653V6.075l-9.055.653zm1.68 1.773l1.867-.14 3.454 5.974V7.94l1.68-.093v7.373l-1.96.14-3.454-5.973v5.88l-1.587.093V8.5z"/>
</svg>
''';

  // Official Full-Color Google "G"
  static const String _googleSvg = '''
<svg viewBox="0 0 24 24" width="24" height="24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
</svg>
''';

  static Widget x({double size = 16, Color color = Colors.white}) {
    return SvgPicture.string(
      _xSvg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }

  static Widget figma({double size = 16, Color color = Colors.white}) {
    return SvgPicture.string(
      _figmaSvg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }

  static Widget notion({double size = 16, Color color = Colors.white}) {
    return SvgPicture.string(
      _notionSvg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }

  static Widget github({double size = 16, Color color = Colors.white}) {
    return SvgPicture.string(
      _githubSvg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }

  static Widget linkedin({double size = 16, Color color = const Color(0xFF0A66C2)}) {
    return SvgPicture.string(
      _linkedinSvg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }

  static Widget globe({double size = 16, Color color = Colors.white}) {
    return SvgPicture.string(
      _globeSvg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }

  static Widget google({double size = 16}) {
    return SvgPicture.string(
      _googleSvg,
      width: size,
      height: size,
    );
  }
}
