import 'dart:async';
import 'package:flutter/material.dart';
import 'package:sensors_plus/sensors_plus.dart';

/// A premium wrapper that gently tilts its child in 3D space based on the device's accelerometer.
class ParallaxContainer extends StatefulWidget {
  final Widget child;
  final double maxTilt;
  final Duration smoothingDuration;
  final bool enableShadows;

  const ParallaxContainer({
    super.key,
    required this.child,
    this.maxTilt = 0.05,
    this.smoothingDuration = const Duration(milliseconds: 300),
    this.enableShadows = false,
  });

  @override
  State<ParallaxContainer> createState() => _ParallaxContainerState();
}

class _ParallaxContainerState extends State<ParallaxContainer> {
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;
  double _pitch = 0.0;
  double _yaw = 0.0;

  @override
  void initState() {
    super.initState();
    _initSensors();
  }

  void _initSensors() {
    // We listen to the accelerometer stream.
    // X-axis: tilting left/right
    // Y-axis: tilting forward/backwards
    _accelerometerSubscription = accelerometerEventStream().listen((event) {
      if (!mounted) return;

      // Normalize the values to an expected max range (usually -10 to 10 m/s^2)
      final x = (event.x / 10).clamp(-1.0, 1.0);
      final y = (event.y / 10).clamp(-1.0, 1.0);

      setState(() {
        // Calculate target pitch and yaw.
        // We invert X and Y to get an intuitive tilt effect.
        _yaw = -x * widget.maxTilt;
        _pitch = -y * widget.maxTilt;
      });
    });
  }

  @override
  void dispose() {
    _accelerometerSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: widget.smoothingDuration,
      curve: Curves.easeOutCubic,
      transform: Matrix4.identity()
        ..setEntry(3, 2, 0.0015) // Add perspective
        ..rotateX(_pitch) // Tilt up/down
        ..rotateY(_yaw), // Tilt left/right
      transformAlignment: Alignment.center,
      decoration: widget.enableShadows
          ? BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  offset: Offset(_yaw * -20, _pitch * -20 + 4),
                  blurRadius: 12,
                  spreadRadius: 0,
                ),
              ],
            )
          : null,
      child: widget.child,
    );
  }
}
