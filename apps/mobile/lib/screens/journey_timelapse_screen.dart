import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../widgets/toast_notification.dart';

class JourneyTimelapseScreen extends StatefulWidget {
  final List<dynamic> updates;
  final String roomTitle;

  const JourneyTimelapseScreen({
    super.key,
    required this.updates,
    required this.roomTitle,
  });

  @override
  State<JourneyTimelapseScreen> createState() => _JourneyTimelapseScreenState();
}

class _JourneyTimelapseScreenState extends State<JourneyTimelapseScreen> with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _animationController;
  int _currentIndex = 0;
  bool _isPaused = false;
  
  final Duration _slideDuration = const Duration(seconds: 5);

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _animationController = AnimationController(vsync: this, duration: _slideDuration);
    
    _animationController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _nextSlide();
      }
    });
    
    _startAnimation();
  }
  
  void _startAnimation() {
    _animationController.forward(from: 0.0);
  }

  void _nextSlide() {
    if (_currentIndex < widget.updates.length - 1) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      Navigator.of(context).pop(); 
    }
  }

  void _prevSlide() {
    if (_currentIndex > 0) {
      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.updates.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, elevation: 0),
        body: const Center(child: Text('No updates in this journey.', style: TextStyle(color: Colors.white))),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: GestureDetector(
          onTapDown: (details) {
            final screenWidth = MediaQuery.of(context).size.width;
            if (details.globalPosition.dx < screenWidth / 3) {
              _prevSlide();
            } else {
              _nextSlide();
            }
          },
          onLongPressDown: (_) {
            setState(() => _isPaused = true);
            _animationController.stop();
          },
          onLongPressEnd: (_) {
            setState(() => _isPaused = false);
            _animationController.forward();
          },
          child: Stack(
            children: [
              PageView.builder(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (index) {
                  setState(() => _currentIndex = index);
                  _startAnimation();
                },
                itemCount: widget.updates.length,
                itemBuilder: (context, index) {
                  return _buildSlide(widget.updates[index]);
                },
              ),
              
              Positioned(
                top: 10, left: 10, right: 10,
                child: Column(
                  children: [
                    Row(
                      children: List.generate(widget.updates.length, (index) {
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2.0),
                            child: AnimatedBuilder(
                              animation: _animationController,
                              builder: (context, child) {
                                double progress = 0.0;
                                if (index < _currentIndex) {
                                  progress = 1.0;
                                } else if (index == _currentIndex) {
                                  progress = _animationController.value;
                                }
                                return LinearProgressIndicator(
                                  value: progress,
                                  minHeight: 3,
                                  backgroundColor: Colors.white.withOpacity(0.3),
                                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                                );
                              },
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(LucideIcons.rocket, color: Colors.white, size: 16),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      widget.roomTitle,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                      maxLines: 1, overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      'Build Journey',
                                      style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(LucideIcons.download, color: Colors.white),
                              onPressed: () {
                                final update = widget.updates[_currentIndex];
                                List<String> images = [];
                                if (update['media'] != null) {
                                  if (update['media'] is List) {
                                    images = (update['media'] as List).map((e) => e.toString()).toList();
                                  } else if (update['media'] is String) {
                                    images = [update['media']];
                                  }
                                }
                                if (images.isNotEmpty) {
                                  launchUrl(Uri.parse(images.first));
                                } else {
                                  ToastService.show(
                                    context, 
                                    'No media to download.', 
                                    icon: LucideIcons.imageOff
                                  );
                                }
                              },
                            ),
                            IconButton(
                              icon: const Icon(LucideIcons.x, color: Colors.white),
                              onPressed: () => Navigator.of(context).pop(),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSlide(Map<String, dynamic> update) {
    final type = update['update_type'] ?? 'text';
    final content = update['content'] ?? '';
    final createdAt = update['created_at'] != null ? DateTime.tryParse(update['created_at']) : null;
    final timeString = createdAt != null ? timeago.format(createdAt) : '';
    
    List<String> images = [];
    if (update['media'] != null) {
      if (update['media'] is List) {
        images = (update['media'] as List).map((e) => e.toString()).toList();
      } else if (update['media'] is String) {
        images = [update['media']];
      }
    }
    
    final hasImage = images.isNotEmpty;
    
    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (hasImage) ...[
            Opacity(
              opacity: 0.5,
              child: CachedNetworkImage(
                imageUrl: images.first,
                fit: BoxFit.cover,
                errorWidget: (context, url, error) => const Icon(LucideIcons.imageOff, color: Colors.white24, size: 64),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black.withOpacity(0.6), Colors.transparent, Colors.black.withOpacity(0.8)],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ] else ...[
            Container(color: const Color(0xFF0F0F16)),
            Positioned(
              top: -50, left: -50,
              child: Container(
                width: 300, height: 300,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.purple.withOpacity(0.3)),
              ).animate(onPlay: (controller) => controller.repeat(reverse: true))
               .move(duration: 8.seconds, begin: const Offset(0, 0), end: const Offset(80, 100))
               .scale(duration: 5.seconds, begin: const Offset(1, 1), end: const Offset(1.5, 1.5)),
            ),
            Positioned(
              bottom: -50, right: -50,
              child: Container(
                width: 250, height: 250,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.cyan.withOpacity(0.2)),
              ).animate(onPlay: (controller) => controller.repeat(reverse: true))
               .move(duration: 6.seconds, begin: const Offset(0, 0), end: const Offset(-80, -80))
               .scale(duration: 4.seconds, begin: const Offset(1, 1), end: const Offset(1.4, 1.4)),
            ),
            Positioned(
              top: MediaQuery.of(context).size.height * 0.3, right: 20,
              child: Container(
                width: 200, height: 200,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.amber.withOpacity(0.15)),
              ).animate(onPlay: (controller) => controller.repeat(reverse: true))
               .move(duration: 7.seconds, begin: const Offset(0, 0), end: const Offset(-50, 50))
               .scale(duration: 6.seconds, begin: const Offset(1, 1), end: const Offset(1.2, 1.2)),
            ),
            Positioned.fill(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
                child: Container(color: Colors.black.withOpacity(0.2)),
              ),
            ),
          ],
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 80.0),
            child: Align(
              alignment: Alignment.center,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(32),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(32),
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 30, spreadRadius: -5),
                      ],
                    ),
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (type == 'shipped' || type == 'milestone')
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              margin: const EdgeInsets.only(bottom: 24),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Colors.amber, Colors.orangeAccent]),
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [BoxShadow(color: Colors.amber.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(LucideIcons.flag, size: 14, color: Colors.black),
                                  SizedBox(width: 8),
                                  Text('MILESTONE REACHED', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.5)),
                                ],
                              ),
                            ),
                          if (type == 'decision')
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              margin: const EdgeInsets.only(bottom: 24),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Colors.blueAccent, Colors.cyan]),
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [BoxShadow(color: Colors.blueAccent.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(LucideIcons.gitCommit, size: 14, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text('DECISION LOGGED', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.5)),
                                ],
                              ),
                            ),
                          
                          Text(
                            content,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                              height: 1.3,
                            ),
                          ),
                          
                          const SizedBox(height: 32),
                          Row(
                            children: [
                              Container(
                                width: 8, height: 8,
                                decoration: const BoxDecoration(color: Colors.white54, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                timeString.toUpperCase(),
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.6),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 2.0,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ).animate().slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOut).fadeIn(),
          ),
        ],
      ),
    );
  }
}
