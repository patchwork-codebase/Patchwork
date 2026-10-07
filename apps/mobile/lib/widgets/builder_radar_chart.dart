import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme.dart';

class RadarAxisData {
  final String label;
  final String key;
  final double value; // 0 to 100
  final IconData? icon;

  const RadarAxisData({
    required this.label,
    required this.key,
    required this.value,
    this.icon,
  });
}

class BuilderRadarChart extends StatefulWidget {
  final List<RadarAxisData> axes;
  final double size;
  final Color? accentColor;

  const BuilderRadarChart({
    super.key,
    required this.axes,
    this.size = 240,
    this.accentColor,
  });

  @override
  State<BuilderRadarChart> createState() => _BuilderRadarChartState();
}

class _BuilderRadarChartState extends State<BuilderRadarChart> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _animation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
    _animController.forward();
  }

  @override
  void didUpdateWidget(covariant BuilderRadarChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.axes != widget.axes) {
      _animController.forward(from: 0.0);
    }
  }


  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final effectiveColor = widget.accentColor ?? context.themeColors.primary500;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _RadarChartPainter(
            axes: widget.axes,
            progress: _animation.value,
            accentColor: effectiveColor,
            gridColor: context.themeColors.borderSubtle,
            labelColor: context.themeColors.textSecondary,
          ),
        );
      },
    );
  }
}

class _RadarChartPainter extends CustomPainter {
  final List<RadarAxisData> axes;
  final double progress;
  final Color accentColor;
  final Color gridColor;
  final Color labelColor;

  _RadarChartPainter({
    required this.axes,
    required this.progress,
    required this.accentColor,
    required this.gridColor,
    required this.labelColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (axes.isEmpty) return;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) / 2) - 40; // margin for text labels
    final count = axes.length;
    final angleStep = (2 * math.pi) / count;

    // 1. Draw concentric background webs (25%, 50%, 75%, 100%)
    final gridPaint = Paint()
      ..color = gridColor.withOpacity(0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final ringSteps = [0.25, 0.5, 0.75, 1.0];
    for (final step in ringSteps) {
      final path = Path();
      for (int i = 0; i < count; i++) {
        final angle = (i * angleStep) - (math.pi / 2);
        final r = radius * step;
        final x = center.dx + (r * math.cos(angle));
        final y = center.dy + (r * math.sin(angle));
        if (i == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      path.close();
      canvas.drawPath(path, gridPaint);
    }

    // 2. Draw axis lines radiating from center
    final axisPaint = Paint()
      ..color = gridColor.withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (int i = 0; i < count; i++) {
      final angle = (i * angleStep) - (math.pi / 2);
      final x = center.dx + (radius * math.cos(angle));
      final y = center.dy + (radius * math.sin(angle));
      canvas.drawLine(center, Offset(x, y), axisPaint);
    }

    // 3. Draw polygon data shape
    final dataPath = Path();
    final points = <Offset>[];

    for (int i = 0; i < count; i++) {
      final angle = (i * angleStep) - (math.pi / 2);
      // Normalized clamped value (0.1 to 1.0)
      final rawVal = (axes[i].value.clamp(10.0, 100.0) / 100.0);
      final animatedVal = rawVal * progress;
      final r = radius * animatedVal;
      final x = center.dx + (r * math.cos(angle));
      final y = center.dy + (r * math.sin(angle));
      final point = Offset(x, y);
      points.add(point);

      if (i == 0) {
        dataPath.moveTo(x, y);
      } else {
        dataPath.lineTo(x, y);
      }
    }
    dataPath.close();

    // Fill data area with translucent gradient
    final fillPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          accentColor.withOpacity(0.45 * progress),
          accentColor.withOpacity(0.12 * progress),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.fill;
    canvas.drawPath(dataPath, fillPaint);

    // Stroke data boundary
    final strokePaint = Paint()
      ..color = accentColor.withOpacity(0.9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(dataPath, strokePaint);

    // Vertex points & values
    final vertexPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final vertexRingPaint = Paint()
      ..color = accentColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    for (final point in points) {
      canvas.drawCircle(point, 3.5, vertexPaint);
      canvas.drawCircle(point, 4.5, vertexRingPaint);
    }

    // 4. Draw Axis Labels
    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );

    for (int i = 0; i < count; i++) {
      final angle = (i * angleStep) - (math.pi / 2);
      final labelR = radius + 22;
      final x = center.dx + (labelR * math.cos(angle));
      final y = center.dy + (labelR * math.sin(angle));

      final axis = axes[i];
      final valInt = axis.value.round();

      textPainter.text = TextSpan(
        children: [
          TextSpan(
            text: '${axis.label}\n',
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.bold,
              color: labelColor,
              height: 1.1,
            ),
          ),
          TextSpan(
            text: '$valInt',
            style: TextStyle(
              fontSize: 9.0,
              fontWeight: FontWeight.w900,
              color: accentColor,
            ),
          ),
        ],
      );

      textPainter.layout();
      final textOffset = Offset(
        x - (textPainter.width / 2),
        y - (textPainter.height / 2),
      );
      textPainter.paint(canvas, textOffset);
    }
  }

  @override
  bool shouldRepaint(covariant _RadarChartPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.axes != axes ||
        oldDelegate.accentColor != accentColor;
  }
}
