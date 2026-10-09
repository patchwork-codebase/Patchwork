import 'dart:math';
import 'package:flutter/material.dart';

class SparkleEffect extends StatefulWidget {
  final Widget child;
  final bool isTriggered;
  final VoidCallback? onAnimationComplete;

  const SparkleEffect({
    super.key,
    required this.child,
    required this.isTriggered,
    this.onAnimationComplete,
  });

  @override
  State<SparkleEffect> createState() => _SparkleEffectState();
}

class _SparkleEffectState extends State<SparkleEffect> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    
    if (widget.isTriggered) {
      _controller.forward();
    }
    
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onAnimationComplete?.call();
        _controller.reset();
      }
    });
  }

  @override
  void didUpdateWidget(SparkleEffect oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isTriggered && !oldWidget.isTriggered) {
      _controller.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        // Sparks Layer
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            if (_controller.value == 0 || _controller.value == 1) {
              return const SizedBox.shrink();
            }
            return CustomPaint(
              size: const Size(40, 40),
              painter: _SparklePainter(progress: _controller.value),
            );
          },
        ),
        
        // Child Layer with bouncy scale effect
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            double scale = 1.0;
            if (_controller.value > 0 && _controller.value < 0.5) {
              // Scale down slightly then pop up
              scale = 1.0 - (_controller.value * 0.2); 
            } else if (_controller.value >= 0.5) {
              // Pop effect
              final elasticProgress = Curves.elasticOut.transform((_controller.value - 0.5) * 2);
              scale = 0.9 + (elasticProgress * 0.1);
            }
            return Transform.scale(
              scale: scale,
              child: widget.child,
            );
          },
        ),
      ],
    );
  }
}

class _SparklePainter extends CustomPainter {
  final double progress;

  _SparklePainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()..style = PaintingStyle.fill;
    
    final int particleCount = 7;
    final double maxRadius = 35.0;
    
    // As progress goes from 0 to 1, particles expand outward and fade
    final double currentRadius = maxRadius * Curves.easeOutQuad.transform(progress);
    
    // Opacity fades out in the second half of the animation
    final double opacity = progress < 0.5 ? 1.0 : 1.0 - ((progress - 0.5) * 2);

    for (int i = 0; i < particleCount; i++) {
      // Calculate angle for each particle
      final double angle = (i * 2 * pi) / particleCount;
      
      // Calculate position
      final double x = center.dx + currentRadius * cos(angle);
      final double y = center.dy + currentRadius * sin(angle);
      
      // Alternate colors for a vibrant look
      paint.color = (i % 2 == 0 ? Colors.orangeAccent : Colors.pinkAccent).withOpacity(opacity);
      
      // Draw inner and outer particles
      // Main particle
      final double particleSize = 3.0 * (1 - progress);
      canvas.drawCircle(Offset(x, y), particleSize, paint);
      
      // Secondary smaller particle trailing behind slightly
      final double trailRadius = currentRadius * 0.7;
      final double trailX = center.dx + trailRadius * cos(angle + 0.2);
      final double trailY = center.dy + trailRadius * sin(angle + 0.2);
      paint.color = (i % 2 == 0 ? Colors.pinkAccent : Colors.amberAccent).withOpacity(opacity * 0.6);
      canvas.drawCircle(Offset(trailX, trailY), particleSize * 0.6, paint);
    }
    
    // Central ring burst
    if (progress < 0.4) {
      final ringPaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0 * (1 - (progress / 0.4))
        ..color = Colors.pinkAccent.withOpacity(1 - (progress / 0.4));
      canvas.drawCircle(center, 15.0 * (progress / 0.4), ringPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _SparklePainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
