import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme.dart';
import 'login_screen.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < 3) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      _finish();
    }
  }

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_welcome', true);
    if (!mounted) return;
    
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? context.themeColors.background : AppTheme.slate50;
    final textColor = context.themeColors.textPrimary;
    final buttonColor = isDark ? Colors.white : const Color(0xFF111827); // Dark black/white
    final buttonTextColor = isDark ? Colors.black : Colors.white;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentPage < 3)
                    Row(
                      children: [
                        // Logo Icon
                        Container(
                          width: 28, height: 28,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [context.themeColors.primary500, context.themeColors.primary400],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: context.themeColors.primary500.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(LucideIcons.hammer, color: Colors.white, size: 11),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'patch·work',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: textColor,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    )
                  else
                    const SizedBox(), // Empty on last page as per design

                  if (_currentPage < 3)
                    TextButton(
                      onPressed: _finish,
                      style: TextButton.styleFrom(
                        foregroundColor: context.themeColors.textSecondary,
                        textStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                      ),
                      child: const Text('Skip'),
                    ),
                ],
              ),
            ),
            
            // Page Content
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                physics: const BouncingScrollPhysics(),
                children: [
                  _buildPage1(context),
                  _buildPage2(context),
                  _buildPage3(context),
                  _buildPage4(context),
                ],
              ),
            ),

            // Bottom Navigation Area
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Page Indicators
                  if (_currentPage < 3)
                    Row(
                      children: List.generate(3, (index) {
                        final isActive = _currentPage == index;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.only(right: 6),
                          height: 8,
                          width: isActive ? 24 : 8,
                          decoration: BoxDecoration(
                            color: isActive 
                              ? (_currentPage == 0 ? const Color(0xFFFF7A4D) : _currentPage == 1 ? const Color(0xFF5A79FF) : const Color(0xFF10B981)) 
                              : context.themeColors.border,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    )
                  else
                    const SizedBox(),

                  // Next Button
                  GestureDetector(
                    onTap: _nextPage,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      padding: EdgeInsets.symmetric(
                        horizontal: _currentPage == 3 ? 32 : 24, 
                        vertical: 16
                      ),
                      decoration: BoxDecoration(
                        color: buttonColor,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: buttonColor.withOpacity(0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ]
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _currentPage == 2 ? 'Get started' : _currentPage == 3 ? 'Explore Patchwork' : 'Continue',
                            style: TextStyle(
                              color: buttonTextColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(LucideIcons.arrowRight, color: buttonTextColor, size: 15),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------
  // PAGE 1: Build in public
  // ---------------------------------------------------------
  Widget _buildPage1(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? context.themeColors.surface : Colors.white;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  // Background Circle
                  Container(
                    width: 280,
                    height: 280,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFFF7A4D).withOpacity(0.15),
                    ),
                  ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
                  
                  // Main Card
                  Transform.rotate(
                    angle: -0.05,
                    child: Container(
                      width: 240,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: context.themeColors.border, width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFF7A4D).withOpacity(isDark ? 0.2 : 0.4),
                            blurRadius: 0,
                            offset: const Offset(8, 8),
                          )
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('STUDIO UPDATE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text('LIVE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text('A better way to share\nprogress.', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: context.themeColors.textPrimary, height: 1.2)),
                          const SizedBox(height: 16),
                          // Placeholder lines
                          Container(height: 4, width: double.infinity, color: context.themeColors.border, margin: const EdgeInsets.only(bottom: 6)),
                          Container(height: 4, width: 180, color: context.themeColors.border, margin: const EdgeInsets.only(bottom: 6)),
                          Container(height: 4, width: 140, color: context.themeColors.border),
                          const SizedBox(height: 24),
                          // Bottom row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              SizedBox(
                                width: 80,
                                height: 24,
                                child: Stack(
                                  children: [
                                    _buildAvatarBadge('AR', const Color(0xFFFFD1C1), 0),
                                    _buildAvatarBadge('MK', const Color(0xFFC1D4FF), 16),
                                    _buildAvatarBadge('+8', const Color(0xFFD1D1D1), 32),
                                  ],
                                ),
                              ),
                              Icon(LucideIcons.barChart2, color: const Color(0xFFFF7A4D), size: 17),
                            ],
                          ),
                        ],
                      ),
                    ).animate().fade(delay: 200.ms).slideY(begin: 0.1, end: 0, duration: 500.ms, curve: Curves.easeOutQuad),
                  ),

                  // Floating Element 1 (Build Log)
                  Positioned(
                    left: -40,
                    bottom: 20,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('BUILD LOG', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
                          const SizedBox(height: 4),
                          Text('Day 14', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                        ],
                      ),
                    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                     .moveY(begin: -4, end: 4, duration: 2000.ms, curve: Curves.easeInOutSine),
                  ),

                  // Floating Element 2 (Views)
                  Positioned(
                    right: -20,
                    bottom: -20,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: const Color(0xFFFF7A4D), borderRadius: BorderRadius.circular(8)),
                            child: const Icon(LucideIcons.arrowUpRight, color: Colors.white, size: 13),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('24 new\nviews', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary, height: 1.1)),
                            ],
                          ),
                          const SizedBox(width: 12),
                          Text('People are\nfollowing along', style: TextStyle(fontSize: 8, color: context.themeColors.textTertiary)),
                        ],
                      ),
                    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                     .moveY(begin: 4, end: -4, duration: 2300.ms, curve: Curves.easeInOutSine),
                  ),
                ],
              ),
            ),
          ),
          
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CREATE OPENLY',
                  style: TextStyle(
                    color: const Color(0xFFFF7A4D),
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                    fontSize: 10,
                  ),
                ).animate().fade(delay: 300.ms).slideX(begin: -0.1),
                const SizedBox(height: 12),
                Text(
                  'Build in public.',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w800,
                    color: context.themeColors.textPrimary,
                    letterSpacing: -1,
                    height: 1.1,
                  ),
                ).animate().fade(delay: 400.ms).slideX(begin: -0.1),
                const SizedBox(height: 16),
                Text(
                  'Share the process, not just the polished result. Turn every small win into momentum.',
                  style: TextStyle(
                    fontSize: 13,
                    color: context.themeColors.textSecondary,
                    height: 1.5,
                  ),
                ).animate().fade(delay: 500.ms).slideX(begin: -0.1),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // PAGE 2: Show what you make
  // ---------------------------------------------------------
  Widget _buildPage2(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? context.themeColors.surface : Colors.white;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  // Background Shape
                  Container(
                    width: 280,
                    height: 280,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(140),
                        bottomRight: Radius.circular(140),
                      ),
                      color: const Color(0xFF5A79FF).withOpacity(0.15),
                    ),
                  ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
                  
                  // Main Browser Card
                  Transform.rotate(
                    angle: 0.02,
                    child: Container(
                      width: 260,
                      height: 180,
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: context.themeColors.border, width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF5A79FF).withOpacity(isDark ? 0.3 : 0.6),
                            blurRadius: 0,
                            offset: const Offset(-6, 8),
                          )
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Browser Header
                          Padding(
                            padding: const EdgeInsets.all(10.0),
                            child: Row(
                              children: [
                                Row(
                                  children: [
                                    Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF5A79FF), shape: BoxShape.circle)),
                                    const SizedBox(width: 4),
                                    Container(width: 6, height: 6, decoration: BoxDecoration(color: context.themeColors.border, shape: BoxShape.circle)),
                                    const SizedBox(width: 4),
                                    Container(width: 6, height: 6, decoration: BoxDecoration(color: context.themeColors.border, shape: BoxShape.circle)),
                                  ],
                                ),
                                const Spacer(),
                                Text('Case study - Draft', style: TextStyle(fontSize: 8, color: context.themeColors.textSecondary)),
                              ],
                            ),
                          ),
                          Container(height: 1, color: context.themeColors.border),
                          // Body
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Row(
                                children: [
                                  // Sidebar
                                  Column(
                                    children: [
                                      Container(width: 12, height: 12, decoration: BoxDecoration(color: const Color(0xFF5A79FF), borderRadius: BorderRadius.circular(3))),
                                      const SizedBox(height: 8),
                                      Container(width: 12, height: 12, decoration: BoxDecoration(border: Border.all(color: context.themeColors.border), borderRadius: BorderRadius.circular(3))),
                                      const SizedBox(height: 8),
                                      Container(width: 12, height: 12, decoration: BoxDecoration(border: Border.all(color: context.themeColors.border), borderRadius: BorderRadius.circular(3))),
                                    ],
                                  ),
                                  const SizedBox(width: 16),
                                  // Content
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                          decoration: BoxDecoration(color: const Color(0xFF5A79FF).withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                                          child: const Text('IN PROGRESS', style: TextStyle(fontSize: 7, fontWeight: FontWeight.bold, color: Color(0xFF5A79FF))),
                                        ),
                                        const SizedBox(height: 12),
                                        Container(height: 8, width: 140, decoration: BoxDecoration(color: isDark ? Colors.white : Colors.black87, borderRadius: BorderRadius.circular(4))),
                                        const SizedBox(height: 6),
                                        Container(height: 8, width: 80, decoration: BoxDecoration(color: isDark ? Colors.white : Colors.black87, borderRadius: BorderRadius.circular(4))),
                                        const SizedBox(height: 12),
                                        Container(height: 3, width: double.infinity, color: context.themeColors.border),
                                        const SizedBox(height: 4),
                                        Container(height: 3, width: 120, color: context.themeColors.border),
                                        const Spacer(),
                                        Row(
                                          children: [
                                            Expanded(child: Container(height: 40, decoration: BoxDecoration(color: const Color(0xFF5A79FF).withOpacity(0.2), borderRadius: BorderRadius.circular(6)))),
                                            const SizedBox(width: 8),
                                            Expanded(child: Container(height: 40, decoration: BoxDecoration(color: const Color(0xFFFF7A4D).withOpacity(0.2), borderRadius: BorderRadius.circular(6)))),
                                          ],
                                        )
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          )
                        ],
                      ),
                    ).animate().fade(delay: 200.ms).slideY(begin: 0.1, end: 0, duration: 500.ms, curve: Curves.easeOutQuad),
                  ),

                  // Floating Element 1 (Figma Sync)
                  Positioned(
                    left: -30,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))
                        ],
                      ),
                      child: Row(
                        children: [
                          // Fake Figma Logo
                          SizedBox(
                            width: 14,
                            height: 20,
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Container(width: 7, height: 7, decoration: const BoxDecoration(color: Color(0xFFF24E1E), borderRadius: BorderRadius.only(topLeft: Radius.circular(3), bottomLeft: Radius.circular(3)))),
                                    Container(width: 7, height: 7, decoration: const BoxDecoration(color: Color(0xFFFF7262), borderRadius: BorderRadius.only(topRight: Radius.circular(3), bottomRight: Radius.circular(3)))),
                                  ],
                                ),
                                Row(
                                  children: [
                                    Container(width: 7, height: 7, decoration: const BoxDecoration(color: Color(0xFFA259FF), borderRadius: BorderRadius.only(topLeft: Radius.circular(3), bottomLeft: Radius.circular(3)))),
                                    Container(width: 7, height: 7, decoration: const BoxDecoration(color: Color(0xFF1ABCFE), shape: BoxShape.circle)),
                                  ],
                                ),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: Container(width: 7, height: 6, decoration: const BoxDecoration(color: Color(0xFF0ACF83), borderRadius: BorderRadius.only(bottomLeft: Radius.circular(3), bottomRight: Radius.circular(3), topLeft: Radius.circular(3)))),
                                )
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text('Synced with Figma', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: context.themeColors.textPrimary)),
                        ],
                      ),
                    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                     .moveY(begin: 3, end: -3, duration: 2100.ms, curve: Curves.easeInOutSine),
                  ),

                  // Floating Element 2 (Comment)
                  Positioned(
                    right: -10,
                    bottom: 40,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 24, height: 24,
                            decoration: const BoxDecoration(color: Color(0xFFC1D4FF), shape: BoxShape.circle),
                            alignment: Alignment.center,
                            child: const Text('MJ', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF5A79FF))),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Love this direction', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                              Text('Just now', style: TextStyle(fontSize: 8, color: context.themeColors.textTertiary)),
                            ],
                          )
                        ],
                      ),
                    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                     .moveY(begin: -3, end: 3, duration: 1900.ms, curve: Curves.easeInOutSine),
                  ),
                ],
              ),
            ),
          ),
          
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'YOUR WORK, CONNECTED',
                  style: TextStyle(
                    color: const Color(0xFF5A79FF),
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                    fontSize: 10,
                  ),
                ).animate().fade(delay: 300.ms).slideX(begin: -0.1),
                const SizedBox(height: 12),
                Text(
                  'Show what you\nmake.',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w800,
                    color: context.themeColors.textPrimary,
                    letterSpacing: -1,
                    height: 1.1,
                  ),
                ).animate().fade(delay: 400.ms).slideX(begin: -0.1),
                const SizedBox(height: 16),
                Text(
                  'Bring your Figma files, notes, and progress together in one beautifully simple space.',
                  style: TextStyle(
                    fontSize: 13,
                    color: context.themeColors.textSecondary,
                    height: 1.5,
                  ),
                ).animate().fade(delay: 500.ms).slideX(begin: -0.1),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // PAGE 3: Find your people
  // ---------------------------------------------------------
  Widget _buildPage3(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? context.themeColors.surface : Colors.white;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  // Background Blob
                  Container(
                    width: 260,
                    height: 320,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(130),
                      color: const Color(0xFF10B981).withOpacity(0.15),
                    ),
                  ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
                  
                  // Orbital Rings
                  Container(
                    width: 240, height: 240,
                    decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3), width: 1)),
                  ),
                  Transform.rotate(
                    angle: 0.5,
                    child: Container(
                      width: 200, height: 280,
                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(100), border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3), width: 1)),
                    ),
                  ),
                  
                  // Main Center Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 16, offset: const Offset(0, 8))
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 56, height: 56,
                          decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(16)),
                          alignment: Alignment.center,
                          child: const Text('AN', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(height: 12),
                        Text('You', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                        const SizedBox(height: 4),
                        Text('Building in public', style: TextStyle(fontSize: 8, color: context.themeColors.textTertiary)),
                      ],
                    ),
                  ).animate().fade(delay: 200.ms).scale(duration: 500.ms, curve: Curves.easeOutBack),

                  // Floating Avatars
                  Positioned(
                    top: 20, right: -10,
                    child: _buildConnectionNode('JL', const Color(0xFFFFD1C1))
                      .animate(onPlay: (controller) => controller.repeat(reverse: true))
                      .moveY(begin: 3, end: -3, duration: 1800.ms, curve: Curves.easeInOutSine),
                  ),
                  Positioned(
                    bottom: 40, left: -20,
                    child: _buildConnectionNode('SK', const Color(0xFFC1D4FF))
                      .animate(onPlay: (controller) => controller.repeat(reverse: true))
                      .moveY(begin: -4, end: 4, duration: 2200.ms, curve: Curves.easeInOutSine),
                  ),
                  Positioned(
                    bottom: 20, right: 10,
                    child: _buildConnectionNode('OM', const Color(0xFFE5D1FF))
                      .animate(onPlay: (controller) => controller.repeat(reverse: true))
                      .moveY(begin: 4, end: -4, duration: 2500.ms, curve: Curves.easeInOutSine),
                  ),
                  
                  // New connections pill
                  Positioned(
                    top: 10, left: -10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isDark ? context.themeColors.surfaceHighlight : const Color(0xFF111827),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 4))
                        ]
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                            child: const Text('3', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 8),
                          const Text('new connections', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                     .moveX(begin: -2, end: 2, duration: 2000.ms, curve: Curves.easeInOutSine),
                  ),
                ],
              ),
            ),
          ),
          
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'BETTER, TOGETHER',
                  style: TextStyle(
                    color: const Color(0xFF10B981),
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                    fontSize: 10,
                  ),
                ).animate().fade(delay: 300.ms).slideX(begin: -0.1),
                const SizedBox(height: 12),
                Text(
                  'Find your people.',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w800,
                    color: context.themeColors.textPrimary,
                    letterSpacing: -1,
                    height: 1.1,
                  ),
                ).animate().fade(delay: 400.ms).slideX(begin: -0.1),
                const SizedBox(height: 16),
                Text(
                  'Meet thoughtful builders, exchange real feedback, and grow alongside your community.',
                  style: TextStyle(
                    fontSize: 13,
                    color: context.themeColors.textSecondary,
                    height: 1.5,
                  ),
                ).animate().fade(delay: 500.ms).slideX(begin: -0.1),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // PAGE 4: Welcome
  // ---------------------------------------------------------
  Widget _buildPage4(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            flex: 1,
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  // Shadow offset box
                  Positioned(
                    bottom: -8, right: -8,
                    child: Container(
                      width: 120, height: 120,
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.3),
                        borderRadius: BorderRadius.circular(32),
                      ),
                    ).animate().scale(delay: 200.ms, duration: 400.ms, curve: Curves.easeOutBack),
                  ),
                  // Main Icon box
                  Container(
                    width: 120, height: 120,
                    decoration: BoxDecoration(
                      color: isDark ? context.themeColors.surfaceHighlight : const Color(0xFF111827),
                      borderRadius: BorderRadius.circular(32),
                    ),
                    alignment: Alignment.center,
                    child: const Text('PW', style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: -2)),
                  ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
                ],
              ),
            ),
          ),
          
          Expanded(
            flex: 1,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  'YOU\'RE ALL SET',
                  style: TextStyle(
                    color: const Color(0xFFFF7A4D),
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                    fontSize: 10,
                  ),
                ).animate().fade(delay: 300.ms).slideY(begin: 0.2),
                const SizedBox(height: 16),
                Text(
                  'Welcome to\nPatchwork.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 37,
                    fontWeight: FontWeight.w800,
                    color: context.themeColors.textPrimary,
                    letterSpacing: -1,
                    height: 1.1,
                  ),
                ).animate().fade(delay: 400.ms).slideY(begin: 0.2),
                const SizedBox(height: 20),
                Text(
                  'Your next idea deserves to be seen. Let\'s start building.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: context.themeColors.textSecondary,
                    height: 1.5,
                  ),
                ).animate().fade(delay: 500.ms).slideY(begin: 0.2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Helpers
  Widget _buildAvatarBadge(String text, Color bgColor, double leftOffset) {
    return Positioned(
      left: leftOffset,
      child: Container(
        width: 24, height: 24,
        decoration: BoxDecoration(
          color: bgColor,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 1.5),
        ),
        alignment: Alignment.center,
        child: Text(text, style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.black.withOpacity(0.7))),
      ),
    );
  }

  Widget _buildConnectionNode(String text, Color bgColor) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 52, height: 52,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 4))
            ],
          ),
          alignment: Alignment.center,
          child: Text(text, style: TextStyle(color: Colors.black87, fontSize: 11, fontWeight: FontWeight.bold)),
        ),
        Positioned(
          bottom: -2, right: -2,
          child: Container(
            width: 12, height: 12,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
          ),
        ),
      ],
    );
  }
}
