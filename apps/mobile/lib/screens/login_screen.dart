import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import '../widgets/toast_notification.dart';
import 'home_screen.dart';
import 'onboarding_screen.dart'; // We will create this next
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLogin = true;
  bool _isLoading = false;
  bool _showPassword = false;
  String _error = '';

  // Form
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _fNameController = TextEditingController();
  final _lNameController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fNameController.dispose();
    _lNameController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    setState(() => _error = message);
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      await Supabase.instance.client.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
      }
    } on AuthException catch (e) {
      _showError(e.message);
    } catch (e) {
      _showError('An unexpected error occurred.');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleSignup() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      final name = '${_fNameController.text.trim()} ${_lNameController.text.trim()}'.trim();
      
      final authRes = await Supabase.instance.client.auth.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        data: {
          'name': name.isEmpty ? 'Anonymous Builder' : name,
          'role': 'builder', // Default role; will be updated in onboarding
        },
      );
      
      // Ensure the database trigger has completed creating the public.users record
      final user = authRes.user;
      if (user != null) {
        for (int i = 0; i < 5; i++) {
          final res = await Supabase.instance.client
              .from('users')
              .select('id')
              .eq('id', user.id)
              .maybeSingle();
          if (res != null) break;
          await Future.delayed(const Duration(milliseconds: 1000));
        }
      }

      if (mounted) {
        ToastService.show(context, 'Account created successfully!');
      }

      // On success, go to onboarding (ignoring email confirmation for MVP ease, similar to web if it's disabled)
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const OnboardingScreen()),
        );
      }
    } on AuthException catch (e) {
      _showError(e.message);
    } catch (e) {
      _showError('An unexpected error occurred.');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

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
    if (strength <= 1) { text = 'Too weak'; color = Colors.red; }
    else if (strength == 2) { text = 'Could be stronger'; color = Colors.red; }
    else if (strength == 3) { text = 'Good'; color = Colors.amber; }
    else { text = 'Strong'; color = Colors.green; }

    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: List.generate(5, (index) {
              int level = index + 1;
              Color bgColor = AppTheme.slate200;
              if (strength >= level) {
                if (strength <= 2) bgColor = Colors.red;
                else if (strength <= 3) bgColor = Colors.amber;
                else bgColor = Colors.green;
              }
              return Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  height: 6,
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 6),
          Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final bool canSubmitSignup = _fNameController.text.isNotEmpty && 
                                 _emailController.text.isNotEmpty && 
                                 _passwordController.text.length >= 8;

    return Scaffold(
      backgroundColor: context.themeColors.background,
      body: Stack(
        children: [

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Mobile Logo
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [context.themeColors.primary500, context.themeColors.primary400],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: context.themeColors.primary500.withOpacity(0.3),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(LucideIcons.hammer, color: Colors.white, size: 18),
                        ),
                        const SizedBox(width: 12),
                        Text('patch·work', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary, letterSpacing: -0.5)),
                      ],
                    ),
                    const SizedBox(height: 40),

                    // Form Card
                    Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 400),
                      padding: const EdgeInsets.all(24),
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
                          // Header
                          Text(
                            _isLogin ? 'Welcome back' : 'Create account',
                            style: Theme.of(context).textTheme.displayMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _isLogin ? 'Sign in to your Patchwork account' : 'Join the founding cohort. Takes 30 seconds.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 14),
                          ),
                          const SizedBox(height: 32),

                          // Error Banner
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
                                  const Icon(LucideIcons.alertCircle, color: Colors.red, size: 16),
                                  const SizedBox(width: 8),
                                  Expanded(child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w600))),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
                          ],

                          // Form Fields
                          if (!_isLogin) ...[
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _fNameController,
                                    decoration: const InputDecoration(hintText: 'First name', prefixIcon: Icon(LucideIcons.user, size: 18, color: AppTheme.slate400)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextField(
                                    controller: _lNameController,
                                    decoration: const InputDecoration(hintText: 'Last name'),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                          ],

                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(hintText: 'Email address', prefixIcon: Icon(LucideIcons.mail, size: 18, color: AppTheme.slate400)),
                          ),
                          const SizedBox(height: 16),

                          TextField(
                            controller: _passwordController,
                            obscureText: !_showPassword,
                            onChanged: (_) => setState(() {}),
                            decoration: InputDecoration(
                              hintText: _isLogin ? 'Password' : 'Password (min 8 characters)',
                              prefixIcon: const Icon(LucideIcons.lock, size: 18, color: AppTheme.slate400),
                              suffixIcon: IconButton(
                                icon: Icon(_showPassword ? LucideIcons.eyeOff : LucideIcons.eye, size: 18, color: AppTheme.slate400),
                                onPressed: () => setState(() => _showPassword = !_showPassword),
                              ),
                            ),
                          ),
                          
                          if (!_isLogin) _buildPasswordStrengthIndicator(),

                          if (_isLogin)
                            Align(
                              alignment: Alignment.centerRight,
                              child: Padding(
                                padding: const EdgeInsets.only(top: 8.0, bottom: 8.0),
                                child: TextButton(
                                  onPressed: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(builder: (context) => const ForgotPasswordScreen()),
                                    );
                                  },
                                  style: TextButton.styleFrom(
                                    padding: EdgeInsets.zero,
                                    minimumSize: const Size(0, 0),
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: Text('Forgot password?', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.w700, fontSize: 13)),
                                ),
                              ),
                            )
                          else
                            const SizedBox(height: 24),

                          ElevatedButton(
                            onPressed: _isLoading ? () {} : (_isLogin ? _handleLogin : (canSubmitSignup ? _handleSignup : null)),
                            child: _isLoading 
                              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(_isLogin ? 'Sign in' : 'Create account — free'),
                                    const SizedBox(width: 8),
                                    const Icon(LucideIcons.arrowRight, size: 16),
                                  ],
                                ),
                          ),
                          const SizedBox(height: 32),

                          // Social Auth (Visual placeholder)
                          Row(
                            children: [
                              Expanded(child: Divider(color: context.themeColors.borderSubtle)),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                child: Text('OR CONTINUE WITH', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary, letterSpacing: 1.2)),
                              ),
                              Expanded(child: Divider(color: context.themeColors.borderSubtle)),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {},
                                  icon: const Icon(LucideIcons.chrome, size: 18, color: Color(0xFF4285F4)),
                                  label: Text('Google', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    side: BorderSide(color: context.themeColors.borderSubtle),
                                    backgroundColor: Colors.transparent,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {},
                                  icon: const Icon(LucideIcons.linkedin, size: 18, color: Color(0xFF0A66C2)),
                                  label: Text('LinkedIn', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    side: BorderSide(color: context.themeColors.borderSubtle),
                                    backgroundColor: Colors.transparent,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),

                          // Switcher
                          Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: context.themeColors.surfaceHighlight.withOpacity(0.5),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: TextButton(
                                onPressed: () => setState(() {
                                  _isLogin = !_isLogin;
                                  _error = '';
                                }),
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: const Size(0, 0),
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: RichText(
                                  text: TextSpan(
                                    text: _isLogin ? 'No account? ' : 'Already have an account? ',
                                    style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontFamily: 'Inter'),
                                    children: [
                                      TextSpan(
                                        text: _isLogin ? "Create one — it's free" : 'Sign in',
                                        style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.w700),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 48),
                    // Legal footer
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Privacy Policy', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text('·', style: TextStyle(color: context.themeColors.textTertiary)),
                        ),
                        Text('Terms of Service', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
