import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import 'login_screen.dart';

class VerifyEmailScreen extends StatelessWidget {
  final String email;
  final bool isReset;

  const VerifyEmailScreen({
    super.key, 
    required this.email,
    this.isReset = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAF9),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(maxWidth: 400),
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(32),
                    border: Border.all(color: AppTheme.slate200.withOpacity(0.5)),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.slate900.withOpacity(0.04),
                        blurRadius: 40,
                        offset: const Offset(0, 20),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        width: 64, height: 64,
                        decoration: BoxDecoration(
                          color: context.themeColors.primary500.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(LucideIcons.mailCheck, size: 32, color: context.themeColors.primary500),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        isReset ? 'Check your email' : 'Verify your email',
                        style: Theme.of(context).textTheme.displayMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 14, height: 1.5),
                          children: [
                            TextSpan(text: isReset 
                              ? 'We\'ve sent a password reset link to\n' 
                              : 'We\'ve sent a verification link to\n'),
                            TextSpan(
                              text: email,
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.slate900),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),

                      ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (context) => const LoginScreen()),
                            (route) => false,
                          );
                        },
                        child: const Text('Back to Login'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
