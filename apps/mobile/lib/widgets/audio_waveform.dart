import 'dart:math' as math;
import 'package:flutter/material.dart';

class AudioWaveform extends StatefulWidget {
  final bool isRecording;
  final bool isPlaying;
  final double height;
  final double width;
  final Color color;
  final List<double>? staticSamples; // For playback of existing audio

  const AudioWaveform({
    super.key,
    this.isRecording = false,
    this.isPlaying = false,
    this.height = 40,
    this.width = double.infinity,
    required this.color,
    this.staticSamples,
  });

  @override
  State<AudioWaveform> createState() => _AudioWaveformState();
}

class _AudioWaveformState extends State<AudioWaveform> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final math.Random _random = math.Random();
  final List<double> _samples = List.filled(40, 0.1);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    )..addListener(() {
        if (widget.isRecording || widget.isPlaying) {
          setState(() {
            _updateSamples();
          });
        }
      });
      
    if (widget.isRecording || widget.isPlaying) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(AudioWaveform oldWidget) {
    super.didUpdateWidget(oldWidget);
    if ((widget.isRecording || widget.isPlaying) && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.isRecording && !widget.isPlaying && _controller.isAnimating) {
      _controller.stop();
      if (!widget.isPlaying && widget.staticSamples == null) {
        // Reset to flat when stopped recording
        for (int i = 0; i < _samples.length; i++) {
          _samples[i] = 0.1;
        }
      }
    }
  }

  void _updateSamples() {
    // Shift samples left
    for (int i = 0; i < _samples.length - 1; i++) {
      _samples[i] = _samples[i + 1];
    }
    // Add new random sample at the end based on "volume"
    double newSample = 0.1 + _random.nextDouble() * 0.9;
    
    // Smooth it slightly with the previous sample
    _samples[_samples.length - 1] = (_samples[_samples.length - 2] + newSample) / 2;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      width: widget.width,
      child: CustomPaint(
        painter: WaveformPainter(
          samples: widget.staticSamples ?? _samples,
          color: widget.color,
          animationValue: widget.isRecording ? _controller.value : 1.0,
        ),
      ),
    );
  }
}

class WaveformPainter extends CustomPainter {
  final List<double> samples;
  final Color color;
  final double animationValue;

  WaveformPainter({
    required this.samples,
    required this.color,
    required this.animationValue,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (samples.isEmpty) return;

    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final double spacing = size.width / samples.length;
    final double centerY = size.height / 2;

    for (int i = 0; i < samples.length; i++) {
      final x = i * spacing;
      // Animate the amplitude slightly for a pulsing effect
      final amplitude = samples[i] * (size.height / 2) * (0.8 + 0.2 * animationValue);
      
      canvas.drawLine(
        Offset(x, centerY - amplitude),
        Offset(x, centerY + amplitude),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant WaveformPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue || 
           oldDelegate.samples != samples;
  }
}
