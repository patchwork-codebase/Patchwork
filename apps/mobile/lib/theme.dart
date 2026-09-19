import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors extends ThemeExtension<AppColors> {
  final Color primary400;
  final Color primary500;
  final Color primary600;
  final Color background;
  final Color surface;
  final Color surfaceHighlight;
  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color border;
  final Color borderSubtle;

  const AppColors({
    required this.primary400,
    required this.primary500,
    required this.primary600,
    required this.background,
    required this.surface,
    required this.surfaceHighlight,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.border,
    required this.borderSubtle,
  });

  @override
  ThemeExtension<AppColors> copyWith({
    Color? primary400,
    Color? primary500,
    Color? primary600,
    Color? background,
    Color? surface,
    Color? surfaceHighlight,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? border,
    Color? borderSubtle,
  }) {
    return AppColors(
      primary400: primary400 ?? this.primary400,
      primary500: primary500 ?? this.primary500,
      primary600: primary600 ?? this.primary600,
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceHighlight: surfaceHighlight ?? this.surfaceHighlight,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      border: border ?? this.border,
      borderSubtle: borderSubtle ?? this.borderSubtle,
    );
  }

  @override
  ThemeExtension<AppColors> lerp(covariant ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      primary400: Color.lerp(primary400, other.primary400, t)!,
      primary500: Color.lerp(primary500, other.primary500, t)!,
      primary600: Color.lerp(primary600, other.primary600, t)!,
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceHighlight: Color.lerp(surfaceHighlight, other.surfaceHighlight, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
    );
  }

  static const dark = AppColors(
    primary400: Color(0xFFFF7A4D),
    primary500: Color(0xFFFF5B22),
    primary600: Color(0xFFE54A15),
    background: Color(0xFF101012),
    surface: Color(0xFF141416),
    surfaceHighlight: Color(0xFF1A1A1E),
    textPrimary: Color(0xFFFFFFFF),
    textSecondary: Color(0xFFA0A0A5),
    textTertiary: Color(0xFF707075),
    border: Color(0xFF242428),
    borderSubtle: Color(0xFF1A1A1E),
  );

  static const light = AppColors(
    primary400: Color(0xFFFF5B22),
    primary500: Color(0xFFE54A15), // Deepened orange for better contrast on white
    primary600: Color(0xFFCC3F0D),
    background: Color(0xFFF9FAFB),
    surface: Color(0xFFFFFFFF),
    surfaceHighlight: Color(0xFFF3F4F6),
    textPrimary: Color(0xFF111827),
    textSecondary: Color(0xFF4B5563),
    textTertiary: Color(0xFF9CA3AF),
    border: Color(0xFFE5E7EB),
    borderSubtle: Color(0xFFF3F4F6),
  );
}

extension AppThemeExtension on BuildContext {
  AppColors get themeColors => Theme.of(this).extension<AppColors>() ?? AppColors.dark;
}

class AppTheme {
  // Legacy statics for places where context isn't available (e.g. initializers)
  static const Color primary400 = Color(0xFFFF7A4D);
  static const Color primary500 = Color(0xFFFF5B22);
  static const Color primary600 = Color(0xFFE54A15);
  static const Color background = Color(0xFF101012);
  static const Color surface = Color(0xFF141416);
  static const Color surfaceHighlight = Color(0xFF1A1A1E);
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFA0A0A5);
  static const Color textTertiary = Color(0xFF707075);
  static const Color border = Color(0xFF242428);
  static const Color borderSubtle = Color(0xFF1A1A1E);
  
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate900 = Color(0xFF0F172A);

  static ThemeData get darkTheme => _buildTheme(Brightness.dark, AppColors.dark);
  static ThemeData get lightTheme => _buildTheme(Brightness.light, AppColors.light);

  static ThemeData _buildTheme(Brightness brightness, AppColors colors) {
    final isDark = brightness == Brightness.dark;
    final base = isDark ? ThemeData.dark() : ThemeData.light();
    final bodyTextTheme = GoogleFonts.interTextTheme(base.textTheme);
    final displayTextTheme = GoogleFonts.outfitTextTheme(base.textTheme);
    
    return ThemeData(
      brightness: brightness,
      primaryColor: colors.primary500,
      scaffoldBackgroundColor: colors.background,
      extensions: [colors],
      textTheme: bodyTextTheme.copyWith(
        displayLarge: displayTextTheme.displayLarge?.copyWith(color: colors.textPrimary, fontWeight: FontWeight.w800, fontSize: 36, letterSpacing: -1.5),
        displayMedium: displayTextTheme.displayMedium?.copyWith(color: colors.textPrimary, fontWeight: FontWeight.w800, fontSize: 26, letterSpacing: -1),
        titleLarge: displayTextTheme.titleLarge?.copyWith(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 20, letterSpacing: -0.5),
        bodyLarge: bodyTextTheme.bodyLarge?.copyWith(color: colors.textPrimary, fontSize: 15, height: 1.5),
        bodyMedium: bodyTextTheme.bodyMedium?.copyWith(color: colors.textSecondary, fontSize: 14, fontWeight: FontWeight.w500, height: 1.5),
      ),
      colorScheme: ColorScheme.fromSeed(
        seedColor: colors.primary500,
        brightness: brightness,
        surface: colors.surface,
        onSurface: colors.textPrimary,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surfaceHighlight,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.primary500, width: 2),
        ),
        hintStyle: TextStyle(color: colors.textTertiary, fontSize: 15),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colors.primary500,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
          elevation: 0,
        ),
      ),
    );
  }
}
