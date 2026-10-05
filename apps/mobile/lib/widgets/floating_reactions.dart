import 'dart:math' as math;
import 'package:flutter/material.dart';

class FloatingReactions extends StatefulWidget {
  final Widget child;
  const FloatingReactions({super.key, required this.child});

  static FloatingReactionsState of(BuildContext context) {
    return context.findAncestorStateOfType<FloatingReactionsState>()!;
  }

  @override
  FloatingReactionsState createState() => FloatingReactionsState();
}

class FloatingReactionsState extends State<FloatingReactions> with TickerProviderStateMixin {
  final List<_ReactionInstance> _reactions = [];
  final math.Random _random = math.Random();

  void triggerBurst(String emoji, Offset origin) {
    // Generate 5-8 particles for a burst
    final count = 5 + _random.nextInt(4);
    for (int i = 0; i < count; i++) {
      _addReaction(emoji, origin);
    }
  }

  void _addReaction(String emoji, Offset origin) {
    final controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 1500 + _random.nextInt(1000)),
    );

    final instance = _ReactionInstance(
      emoji: emoji,
      origin: origin,
      controller: controller,
      xOffset: (_random.nextDouble() - 0.5) * 100, // Horizontal spread
      rotation: (_random.nextDouble() - 0.5) * 1.5, // Slight rotation
      scale: 0.8 + _random.nextDouble() * 0.8, // Random size
    );

    setState(() {
      _reactions.add(instance);
    });

    controller.forward().then((_) {
      if (mounted) {
        setState(() {
          _reactions.remove(instance);
        });
        controller.dispose();
      }
    });
  }

  @override
  void dispose() {
    for (var r in _reactions) {
      r.controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        ..._reactions.map((r) {
          return AnimatedBuilder(
            animation: r.controller,
            builder: (context, child) {
              final progress = r.controller.value;
              final curve = Curves.easeOutCubic.transform(progress);
              
              // Move upwards and slightly drift horizontally
              final y = r.origin.dy - (curve * 300);
              final x = r.origin.dx + (r.xOffset * math.sin(progress * math.pi));
              
              // Fade out near the end
              final opacity = progress > 0.7 ? 1.0 - ((progress - 0.7) / 0.3) : 1.0;

              return Positioned(
                left: x,
                top: y,
                child: Opacity(
                  opacity: opacity,
                  child: Transform.rotate(
                    angle: r.rotation * progress,
                    child: Transform.scale(
                      scale: r.scale * (0.5 + (0.5 * Curves.elasticOut.transform(progress > 0.2 ? 1.0 : progress * 5))),
                      child: Text(
                        r.emoji,
                        style: const TextStyle(fontSize: 23),
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        }).toList(),
      ],
    );
  }
}

class _ReactionInstance {
  final String emoji;
  final Offset origin;
  final AnimationController controller;
  final double xOffset;
  final double rotation;
  final double scale;

  _ReactionInstance({
    required this.emoji,
    required this.origin,
    required this.controller,
    required this.xOffset,
    required this.rotation,
    required this.scale,
  });
}
