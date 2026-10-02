import 'package:flutter/material.dart';

class PremiumPageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  PremiumPageRoute({required this.page})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            // A smooth, premium transition combining fade and scale (simulating depth)
            var curve = Curves.easeOutQuart;
            var fadeTween = Tween(begin: 0.0, end: 1.0).chain(CurveTween(curve: curve));
            var scaleTween = Tween(begin: 0.96, end: 1.0).chain(CurveTween(curve: curve));
            
            return FadeTransition(
              opacity: animation.drive(fadeTween),
              child: ScaleTransition(
                scale: animation.drive(scaleTween),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
          reverseTransitionDuration: const Duration(milliseconds: 300),
        );
}

// A bottom-up sliding route for modals/sheets
class PremiumModalRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  PremiumModalRoute({required this.page})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            var curve = Curves.easeOutExpo;
            var slideTween = Tween(begin: const Offset(0, 0.1), end: Offset.zero).chain(CurveTween(curve: curve));
            var fadeTween = Tween(begin: 0.0, end: 1.0).chain(CurveTween(curve: curve));
            
            return FadeTransition(
              opacity: animation.drive(fadeTween),
              child: SlideTransition(
                position: animation.drive(slideTween),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 400),
          reverseTransitionDuration: const Duration(milliseconds: 300),
        );
}
