import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import 'home_screen.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:path/path.dart' as p;

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 0;
  bool _isLoading = false;

  // Form State
  String _userRole = 'builder';
  List<String> _selectedPills = [];
  File? _avatarFile;
  
  // Demographics
  final _countryController = TextEditingController();
  final _cityController = TextEditingController();
  String _gender = 'prefer-not-to-say';

  final List<String> _builderDomains = [
    'Product Management', 'Engineering', 'Design', 
    'Marketing', 'Founder', 'Sales', 'Data Science', 'Other'
  ];

  final List<String> _observerInterests = [
    'Startups', 'Fintech', 'AI/ML', 'SaaS', 'Web3',
    'E-commerce', 'Healthtech', 'Edtech', 'Creator Economy'
  ];

  @override
  void dispose() {
    _countryController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() {
        _avatarFile = File(picked.path);
      });
    }
  }

  Future<void> _handleComplete() async {
    setState(() => _isLoading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) throw Exception('No user found.');

      String? avatarUrl;
      if (_avatarFile != null) {
        final ext = p.extension(_avatarFile!.path);
        final path = '${user.id}/avatar-${DateTime.now().millisecondsSinceEpoch}$ext';
        await Supabase.instance.client.storage.from('avatars').upload(path, _avatarFile!);
        avatarUrl = Supabase.instance.client.storage.from('avatars').getPublicUrl(path);
      }

      final updates = {
        'role': _userRole,
        'gender': _gender,
        'city': _cityController.text.trim().isNotEmpty ? '${_cityController.text.trim()}, ${_countryController.text.trim()}' : '',
        'signup_completed_at': DateTime.now().toIso8601String(),
      };

      if (avatarUrl != null) {
        updates['avatar'] = avatarUrl;
      }

      if (_userRole == 'builder') {
        updates['domain'] = _selectedPills.isNotEmpty ? _selectedPills.first : 'product-manager';
      } else {
        updates['interests'] = _selectedPills.join(', ');
      }

      await Supabase.instance.client.from('users').update(updates).eq('id', user.id);
      
      // Fire off welcome email asynchronously
      try {
        final email = user.email;
        final metadata = user.userMetadata;
        final name = metadata?['name'] ?? metadata?['full_name'] ?? user.email?.split('@')[0] ?? 'Builder';
        
        if (email != null) {
          Supabase.instance.client.functions.invoke('send-welcome-email', body: {
            'userId': user.id,
            'email': email,
            'name': name,
            'role': _userRole,
          }).catchError((e) => print('Error sending welcome email: $e'));
        }
      } catch (e) {
        print('Error preparing welcome email: $e');
      }

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const HomeScreen(isFirstTime: true)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save profile: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildStep0() {
    return Column(
      key: const ValueKey(0),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Welcome to Patchwork', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 24, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text('How do you plan to use the platform?', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 14), textAlign: TextAlign.center),
        const SizedBox(height: 32),
        
        // Builder Option
        GestureDetector(
          onTap: () => setState(() => _userRole = 'builder'),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: _userRole == 'builder' ? context.themeColors.primary500.withOpacity(0.1) : context.themeColors.surfaceHighlight.withOpacity(0.3),
              border: Border.all(color: _userRole == 'builder' ? context.themeColors.primary400 : context.themeColors.borderSubtle, width: _userRole == 'builder' ? 2 : 1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: _userRole == 'builder' ? context.themeColors.primary400 : context.themeColors.surfaceHighlight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(LucideIcons.hammer, size: 20, color: _userRole == 'builder' ? Colors.white : context.themeColors.textTertiary),
                ),
                const SizedBox(height: 12),
                Text('Builder', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('I want to share my work and build in public.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // Observer Option
        GestureDetector(
          onTap: () => setState(() => _userRole = 'observer'),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: _userRole == 'observer' ? context.themeColors.primary500.withOpacity(0.1) : context.themeColors.surfaceHighlight.withOpacity(0.3),
              border: Border.all(color: _userRole == 'observer' ? context.themeColors.primary400 : context.themeColors.borderSubtle, width: _userRole == 'observer' ? 2 : 1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: _userRole == 'observer' ? context.themeColors.primary400 : context.themeColors.surfaceHighlight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(LucideIcons.eye, size: 20, color: _userRole == 'observer' ? Colors.white : context.themeColors.textTertiary),
                ),
                const SizedBox(height: 12),
                Text('Observer', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('I want to discover and follow other builders.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
        ),

        const Spacer(),
        ElevatedButton(
          onPressed: () {
            setState(() {
              _step = 1;
              _selectedPills.clear(); // reset pills on role change
            });
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: context.themeColors.primary500,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [Text('Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)), SizedBox(width: 8), Icon(LucideIcons.arrowRight, size: 18)],
          ),
        ),
      ],
    );
  }

  Widget _buildStep1() {
    final items = _userRole == 'builder' ? _builderDomains : _observerInterests;
    final isMulti = _userRole == 'observer';

    return Column(
      key: const ValueKey(1),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(_userRole == 'builder' ? 'What do you build?' : 'What are you tracking?', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 24, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text(_userRole == 'builder' ? 'Select your primary domain.' : 'Select up to 3 topics you are interested in.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 14), textAlign: TextAlign.center),
        const SizedBox(height: 24),

        Expanded(
          child: SingleChildScrollView(
            child: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: items.map((item) {
                final isSelected = _selectedPills.contains(item);
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedPills.remove(item);
                      } else {
                        if (isMulti) {
                          if (_selectedPills.length < 3) _selectedPills.add(item);
                        } else {
                          _selectedPills = [item];
                        }
                      }
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeOutBack,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected ? context.themeColors.primary500 : context.themeColors.surfaceHighlight.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: isSelected ? context.themeColors.primary400 : context.themeColors.borderSubtle,
                        width: isSelected ? 2 : 1,
                      ),
                      boxShadow: isSelected ? [
                        BoxShadow(color: context.themeColors.primary500.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))
                      ] : [],
                    ),
                    child: Text(
                      item,
                      style: TextStyle(
                        color: isSelected ? Colors.white : context.themeColors.textPrimary,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              flex: 1,
              child: TextButton(
                onPressed: () => setState(() => _step = 0),
                style: TextButton.styleFrom(
                  foregroundColor: context.themeColors.textPrimary,
                  backgroundColor: context.themeColors.surfaceHighlight,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Back', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _selectedPills.isNotEmpty ? () => setState(() => _step = 2) : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.themeColors.primary500,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [Text('Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)), SizedBox(width: 8), Icon(LucideIcons.arrowRight, size: 18)],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      key: const ValueKey(2),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Add a Photo', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 24, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text('Put a face to the name. Builders with avatars get 3x more engagement.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 14), textAlign: TextAlign.center),
        const SizedBox(height: 48),

        Center(
          child: GestureDetector(
            onTap: _pickAvatar,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 120, height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: context.themeColors.surfaceHighlight,
                    border: Border.all(color: context.themeColors.borderSubtle, width: 2),
                    image: _avatarFile != null 
                      ? DecorationImage(image: FileImage(_avatarFile!), fit: BoxFit.cover)
                      : null,
                  ),
                  child: _avatarFile == null 
                    ? Icon(LucideIcons.user, size: 48, color: context.themeColors.textTertiary)
                    : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: context.themeColors.primary500,
                      shape: BoxShape.circle,
                      border: Border.all(color: context.themeColors.background, width: 3),
                    ),
                    child: const Icon(LucideIcons.camera, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
          ),
        ),

        const Spacer(),
        Row(
          children: [
            Expanded(
              flex: 1,
              child: TextButton(
                onPressed: () => setState(() => _step = 1),
                style: TextButton.styleFrom(
                  foregroundColor: context.themeColors.textPrimary,
                  backgroundColor: context.themeColors.surfaceHighlight,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Back', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleComplete,
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.themeColors.primary500,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isLoading 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [Text(_avatarFile == null ? 'Skip for now' : 'Complete Setup', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)), const SizedBox(width: 8), const Icon(LucideIcons.check, size: 18)],
                    ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background, 
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Progress Line
              Row(
                children: List.generate(3, (index) {
                  return Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 400),
                      curve: Curves.easeInOut,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 4,
                      decoration: BoxDecoration(
                        color: _step >= index ? context.themeColors.primary500 : context.themeColors.surfaceHighlight,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 48),

              // Animated step content
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 400),
                  switchInCurve: Curves.easeOutCubic,
                  switchOutCurve: Curves.easeInCubic,
                  transitionBuilder: (child, animation) {
                    return SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.1, 0),
                        end: Offset.zero,
                      ).animate(animation),
                      child: FadeTransition(
                        opacity: animation,
                        child: child,
                      ),
                    );
                  },
                  child: _step == 0 
                    ? _buildStep0()
                    : (_step == 1 ? _buildStep1() : _buildStep2()),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
