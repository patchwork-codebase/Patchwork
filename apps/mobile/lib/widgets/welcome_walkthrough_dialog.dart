import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';

class WelcomeWalkthroughDialog extends StatefulWidget {
  const WelcomeWalkthroughDialog({super.key});

  @override
  State<WelcomeWalkthroughDialog> createState() => _WelcomeWalkthroughDialogState();
}

class _WelcomeWalkthroughDialogState extends State<WelcomeWalkthroughDialog> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _slides = [
    {
      'icon': LucideIcons.hammer,
      'title': 'Welcome to Patchwork',
      'description': 'The best place to build in public and follow the journey of world-class creators.',
      'color': const Color(0xFFF97316),
    },
    {
      'icon': LucideIcons.layoutGrid,
      'title': 'Your Builder Room',
      'description': 'Create a Room for your product. Post updates, gather feedback, and show your process.',
      'color': const Color(0xFF3B82F6),
    },
    {
      'icon': LucideIcons.zap,
      'title': 'Earn Reputation',
      'description': 'Engage with other builders, give insightful feedback, and earn reputation points to stand out.',
      'color': const Color(0xFF10B981),
    },
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxWidth: 400),
        decoration: BoxDecoration(
          color: const Color(0xFF15131C),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.5),
              blurRadius: 32,
              offset: const Offset(0, 16),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Carousel
            SizedBox(
              height: 280,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemCount: _slides.length,
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: slide['color'].withOpacity(0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(slide['icon'], size: 32, color: slide['color']),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          slide['title'],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          slide['description'],
                          style: TextStyle(
                            color: AppTheme.slate400,
                            fontSize: 14,
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            
            // Footer (Dots + Button)
            Padding(
              padding: const EdgeInsets.only(left: 32, right: 32, bottom: 32),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: List.generate(
                      _slides.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.only(right: 6),
                        height: 6,
                        width: _currentPage == index ? 24 : 6,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? context.themeColors.primary500
                              : Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: _nextPage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: context.themeColors.primary500,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_currentPage == _slides.length - 1 ? 'Get Started' : 'Next'),
                        if (_currentPage < _slides.length - 1) ...[
                          const SizedBox(width: 8),
                          const Icon(LucideIcons.arrowRight, size: 16),
                        ]
                      ],
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
}
