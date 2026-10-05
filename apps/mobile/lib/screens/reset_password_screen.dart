import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import 'home_screen.dart';
import 'login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _confirmFocusNode = FocusNode();
  bool _isLoading = false;
  bool _showPassword = false;
  bool _showConfirm = false;
  bool _isSuccess = false;
  String _error = '';

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    _confirmFocusNode.dispose();
    super.dispose();
  }

  void _showError(String message) {
    setState(() => _error = message);
  }

  // Fix #2 — password strength calculation (mirrors login_screen.dart)
  int _calculatePasswordStrength(String pass) {
    if (pass.isEmpty) return 0;
    int score = 0;
    if (pass.length >= 8) score++;
    if (RegExp(r'[A-Z]').hasMatch(pass)) score++;
    if (RegExp(r'[a-z]').hasMatch(pass)) score++;
    if (RegExp(r'[0-9]').hasMatch(pass)) score++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(pass)) score++;
    return score;
  }

  Widget _buildPasswordStrengthIndicator() {
    if (_passwordController.text.isEmpty) return const SizedBox.shrink();
    final strength = _calculatePasswordStrength(_passwordController.text);

    String text = '';
    Color color = Colors.transparent;
    if (strength <= 1) {
      text = 'Too weak';
      color = Colors.red;
    } else if (strength == 2) {
      text = 'Could be stronger';
      color = Colors.orange;
    } else if (strength == 3) {
      text = 'Good';
      color = Colors.amber;
    } else {
      text = 'Strong ✓';
      color = Colors.green;
    }

    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: List.generate(5, (index) {
              int level = index + 1;
              Color bgColor = context.themeColors.borderSubtle;
              if (strength >= level) {
                if (strength <= 2) bgColor = Colors.red;
                else if (strength <= 3) bgColor = Colors.amber;
                else bgColor = Colors.green;
              }
              return Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  height: 5,
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 6),
          Text(text,
              style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  // Fix #1 — confirm passwords match check
  Widget _buildConfirmStatus() {
    if (_confirmController.text.isEmpty) return const SizedBox.shrink();
    final matches = _passwordController.text == _confirmController.text;
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          Icon(
            matches ? LucideIcons.checkCircle2 : LucideIcons.xCircle,
            size: 11,
            color: matches ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 6),
          Text(
            matches ? 'Passwords match' : 'Passwords do not match',
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: matches ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleUpdatePassword() async {
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (password.length < 8) {
      _showError('Password must be at least 8 characters');
      return;
    }

    // Fix #1 — validate passwords match
    if (password != confirm) {
      _showError('Passwords do not match');
      return;
    }

    // Fix #2 — reject weak passwords
    if (_calculatePasswordStrength(password) <= 1) {
      _showError('Your password is too weak. Add uppercase letters, numbers, or symbols.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      await Supabase.instance.client.auth.updateUser(
        UserAttributes(password: password),
      );

      if (mounted) {
        setState(() => _isSuccess = true);
        // Auto-navigate to home after 2 seconds
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const HomeScreen()),
            (route) => false,
          );
        }
      }
    } on AuthException catch (e) {
      // Session expired — redirect to login
      if (e.statusCode == '401' || e.message.toLowerCase().contains('session')) {
        _showError('Your reset link has expired. Please request a new one.');
        if (mounted) {
          await Future.delayed(const Duration(seconds: 2));
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const LoginScreen()),
            (route) => false,
          );
        }
      } else {
        _showError(e.message);
      }
    } catch (e) {
      _showError('An unexpected error occurred.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  child: _isSuccess
                      // Success state
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Center(
                              child: Container(
                                width: 72,
                                height: 72,
                                decoration: BoxDecoration(
                                  color: Colors.green.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(LucideIcons.checkCircle2, size: 30, color: Colors.green),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Text(
                              'Password Updated!',
                              style: Theme.of(context).textTheme.displayMedium,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Your password has been successfully changed. Redirecting you to home...',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            const LinearProgressIndicator(),
                          ],
                        )
                      // Form state
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Icon(LucideIcons.lock, size: 40, color: context.themeColors.primary500),
                            const SizedBox(height: 24),
                            Text(
                              'Update Password',
                              style: Theme.of(context).textTheme.displayMedium,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Choose a strong new password for your account.',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 32),

                            if (_error.isNotEmpty) ...[
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.red.shade200),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(LucideIcons.alertCircle, color: Colors.red, size: 13),
                                    const SizedBox(width: 8),
                                    Expanded(child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.w600))),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                            ],

                            // New password field
                            TextField(
                              controller: _passwordController,
                              obscureText: !_showPassword,
                              textInputAction: TextInputAction.next,
                              onSubmitted: (_) => _confirmFocusNode.requestFocus(),
                              // Fix #5 — triggers strength indicator rebuild
                              onChanged: (_) => setState(() {}),
                              style: TextStyle(color: context.themeColors.textPrimary),
                              decoration: InputDecoration(
                                hintText: 'New password',
                                prefixIcon: Icon(LucideIcons.lock, size: 15, color: context.themeColors.textTertiary),
                                suffixIcon: IconButton(
                                  icon: Icon(_showPassword ? LucideIcons.eyeOff : LucideIcons.eye, size: 15, color: context.themeColors.textTertiary),
                                  onPressed: () => setState(() => _showPassword = !_showPassword),
                                ),
                              ),
                            ),

                            // Fix #2 — password strength bar
                            _buildPasswordStrengthIndicator(),
                            const SizedBox(height: 16),

                            // Fix #1 — confirm password field
                            TextField(
                              controller: _confirmController,
                              focusNode: _confirmFocusNode,
                              obscureText: !_showConfirm,
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) => _handleUpdatePassword(),
                              onChanged: (_) => setState(() {}),
                              style: TextStyle(color: context.themeColors.textPrimary),
                              decoration: InputDecoration(
                                hintText: 'Confirm new password',
                                prefixIcon: Icon(LucideIcons.lock, size: 15, color: context.themeColors.textTertiary),
                                suffixIcon: IconButton(
                                  icon: Icon(_showConfirm ? LucideIcons.eyeOff : LucideIcons.eye, size: 15, color: context.themeColors.textTertiary),
                                  onPressed: () => setState(() => _showConfirm = !_showConfirm),
                                ),
                              ),
                            ),

                            // Fix #1 — match status indicator
                            _buildConfirmStatus(),
                            const SizedBox(height: 24),

                            ElevatedButton(
                              onPressed: _isLoading ? null : _handleUpdatePassword,
                              child: _isLoading
                                  ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('Update Password'),
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
