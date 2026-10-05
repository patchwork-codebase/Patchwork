import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'reset_password_screen.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String email;
  final bool isReset;

  const VerifyEmailScreen({
    super.key,
    required this.email,
    this.isReset = false,
  });

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  // Fix #3 — Resend with 30s cooldown
  bool _isResending = false;
  bool _resendSuccess = false;
  int _cooldownSeconds = 0;
  String _resendError = '';

  // OTP Verification
  final _otpController = TextEditingController();
  bool _isVerifying = false;
  String _verifyError = '';

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleResend() async {
    if (_cooldownSeconds > 0 || _isResending) return;

    setState(() {
      _isResending = true;
      _resendError = '';
      _resendSuccess = false;
    });

    try {
      await Supabase.instance.client.auth.resetPasswordForEmail(widget.email);

      if (mounted) {
        setState(() {
          _resendSuccess = true;
          _cooldownSeconds = 30;
        });
        _startCooldown();
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() => _resendError = e.message);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _resendError = 'An unexpected error occurred.');
      }
    } finally {
      if (mounted) setState(() => _isResending = false);
    }
  }

  Future<void> _handleVerifyOTP() async {
    final code = _otpController.text.trim();
    if (code.isEmpty || code.length < 6) {
      setState(() => _verifyError = 'Please enter the valid code');
      return;
    }

    setState(() {
      _isVerifying = true;
      _verifyError = '';
    });

    try {
      await Supabase.instance.client.auth.verifyOTP(
        type: OtpType.recovery,
        email: widget.email,
        token: code,
      );

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const ResetPasswordScreen()),
        );
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() => _verifyError = e.message);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _verifyError = 'An unexpected error occurred.');
      }
    } finally {
      if (mounted) {
        setState(() => _isVerifying = false);
      }
    }
  }

  void _startCooldown() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() => _cooldownSeconds--);
      return _cooldownSeconds > 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final canResend = _cooldownSeconds == 0 && !_isResending;

    return Scaffold(
      // Fix #4 — respect dark mode
      backgroundColor: context.themeColors.background,
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
                    color: context.themeColors.surface,
                    borderRadius: BorderRadius.circular(32),
                    border: Border.all(color: context.themeColors.borderSubtle),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 40,
                        offset: const Offset(0, 20),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Animated icon
                      Center(
                        child: Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: context.themeColors.primary500.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(LucideIcons.mailCheck, size: 36, color: context.themeColors.primary500),
                        ).animate()
                          .scale(begin: const Offset(0.7, 0.7), end: const Offset(1.0, 1.0), duration: 400.ms, curve: Curves.elasticOut),
                      ),
                      const SizedBox(height: 24),

                      Text(
                        widget.isReset ? 'Check your email' : 'Verify your email',
                        style: Theme.of(context).textTheme.displayMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),

                      Text(
                        widget.isReset
                            ? 'We\'ve sent a recovery code to'
                            : 'We\'ve sent a verification link to',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 14, height: 1.5),
                      ),
                      const SizedBox(height: 6),

                      // Fix #9 — email shown in a selectable widget so user can copy it
                      SelectableText(
                        widget.email,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: context.themeColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Didn\'t receive it? Check your spam folder.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: context.themeColors.textTertiary),
                      ),
                      const SizedBox(height: 32),

                      if (widget.isReset) ...[
                        if (_verifyError.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.red.shade200),
                            ),
                            child: Row(
                              children: [
                                const Icon(LucideIcons.alertCircle, color: Colors.red, size: 16),
                                const SizedBox(width: 8),
                                Expanded(child: Text(_verifyError, style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w600))),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        TextField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          maxLength: 8,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 6,
                            color: context.themeColors.textPrimary,
                          ),
                          decoration: InputDecoration(
                            hintText: '00000000',
                            counterText: '',
                            hintStyle: TextStyle(
                              letterSpacing: 6,
                              color: context.themeColors.textTertiary.withOpacity(0.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _isVerifying ? null : _handleVerifyOTP,
                          child: _isVerifying
                              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Text('Verify Code'),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Resend success / error feedback
                      if (_resendSuccess) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: Row(
                            children: const [
                              Icon(LucideIcons.checkCircle2, color: Colors.green, size: 16),
                              SizedBox(width: 8),
                              Expanded(child: Text('Email resent!', style: TextStyle(color: Colors.green, fontSize: 13, fontWeight: FontWeight.w600))),
                            ],
                          ),
                        ).animate().fadeIn(duration: 300.ms),
                        const SizedBox(height: 16),
                      ],
                      if (_resendError.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(LucideIcons.alertCircle, color: Colors.red, size: 16),
                              const SizedBox(width: 8),
                              Expanded(child: Text(_resendError, style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w600))),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Primary action
                      ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (context) => const LoginScreen()),
                            (route) => false,
                          );
                        },
                        child: const Text('Back to Login'),
                      ),
                      const SizedBox(height: 16),

                      // Fix #3 — Resend with cooldown
                      if (widget.isReset)
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 300),
                          child: _isResending
                              ? const SizedBox(
                                  height: 44,
                                  child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))),
                                )
                              : OutlinedButton.icon(
                                  key: ValueKey(_cooldownSeconds),
                                  onPressed: canResend ? _handleResend : null,
                                  icon: Icon(
                                    _cooldownSeconds > 0 ? LucideIcons.timer : LucideIcons.refreshCw,
                                    size: 16,
                                    color: canResend ? context.themeColors.primary500 : context.themeColors.textTertiary,
                                  ),
                                  label: Text(
                                    _cooldownSeconds > 0
                                        ? 'Resend in ${_cooldownSeconds}s'
                                        : 'Resend email',
                                    style: TextStyle(
                                      color: canResend ? context.themeColors.primary500 : context.themeColors.textTertiary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    side: BorderSide(
                                      color: canResend
                                          ? context.themeColors.primary500.withOpacity(0.4)
                                          : context.themeColors.borderSubtle,
                                    ),
                                    backgroundColor: Colors.transparent,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
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
