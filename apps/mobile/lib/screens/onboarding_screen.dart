import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';
import 'home_screen.dart';

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
  String _builderType = 'product-manager';
  String _interests = '';
  
  // Simplified Location & Demographics for MVP
  final _countryController = TextEditingController();
  final _cityController = TextEditingController();
  String _gender = 'prefer-not-to-say';

  @override
  void dispose() {
    _countryController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _handleComplete() async {
    setState(() => _isLoading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) throw Exception('No user found.');

      final updates = {
        'role': _userRole,
        'gender': _gender,
        'city': _cityController.text.trim().isNotEmpty ? '${_cityController.text.trim()}, ${_countryController.text.trim()}' : '',
        'signup_completed_at': DateTime.now().toIso8601String(),
      };

      if (_userRole == 'builder') {
        updates['domain'] = _builderType;
      } else {
        updates['interests'] = _interests; // In full app this is an array, passing string for simplicity
      }

      await Supabase.instance.client.from('users').update(updates).eq('id', user.id);
      
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const HomeScreen()),
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
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('Welcome to Patchwork', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text('How do you plan to use the platform?', style: TextStyle(color: AppTheme.slate400, fontSize: 14), textAlign: TextAlign.center),
        const SizedBox(height: 24),
        
        // Builder Option
        GestureDetector(
          onTap: () => setState(() => _userRole = 'builder'),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: _userRole == 'builder' ? context.themeColors.primary500.withOpacity(0.1) : Colors.white.withOpacity(0.02),
              border: Border.all(color: _userRole == 'builder' ? context.themeColors.primary400 : Colors.white.withOpacity(0.08)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: _userRole == 'builder' ? context.themeColors.primary400 : Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(LucideIcons.hammer, size: 20, color: _userRole == 'builder' ? Colors.white : AppTheme.slate400),
                ),
                const SizedBox(height: 12),
                const Text('Builder', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('I want to share my work and build in public.', style: TextStyle(color: AppTheme.slate400, fontSize: 12)),
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
              color: _userRole == 'observer' ? context.themeColors.primary500.withOpacity(0.1) : Colors.white.withOpacity(0.02),
              border: Border.all(color: _userRole == 'observer' ? context.themeColors.primary400 : Colors.white.withOpacity(0.08)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: _userRole == 'observer' ? context.themeColors.primary400 : Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(LucideIcons.eye, size: 20, color: _userRole == 'observer' ? Colors.white : AppTheme.slate400),
                ),
                const SizedBox(height: 12),
                const Text('Observer', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('I want to discover and follow other builders.', style: TextStyle(color: AppTheme.slate400, fontSize: 12)),
              ],
            ),
          ),
        ),

        const Spacer(),
        ElevatedButton(
          onPressed: () => setState(() => _step = 1),
          style: ElevatedButton.styleFrom(
            backgroundColor: context.themeColors.primary500,
            foregroundColor: Colors.white,
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [Text('Continue'), SizedBox(width: 8), Icon(LucideIcons.arrowRight, size: 16)],
          ),
        ),
      ],
    );
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(_userRole == 'builder' ? 'What do you build?' : 'What are you tracking?', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text(_userRole == 'builder' ? 'Set your primary domain so we can match you with the right observers.' : 'Tell us what domains you are interested in observing.', style: TextStyle(color: AppTheme.slate400, fontSize: 14), textAlign: TextAlign.center),
        const SizedBox(height: 24),

        if (_userRole == 'builder') ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _builderType,
                dropdownColor: const Color(0xFF15131C),
                icon: const Icon(LucideIcons.chevronDown, color: Colors.white),
                style: const TextStyle(color: Colors.white, fontSize: 14),
                isExpanded: true,
                items: const [
                  DropdownMenuItem(value: 'product-manager', child: Text('📋 Product Manager')),
                  DropdownMenuItem(value: 'founder', child: Text('🚀 Founder')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _builderType = val);
                },
              ),
            ),
          ),
        ] else ...[
          TextField(
            onChanged: (val) => setState(() => _interests = val),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'e.g. Product Design, Fintech, Growth...',
              hintStyle: TextStyle(color: AppTheme.slate500),
              filled: true,
              fillColor: Colors.white.withOpacity(0.04),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
            ),
            maxLines: 3,
          ),
        ],

        const Spacer(),
        Row(
          children: [
            Expanded(
              flex: 1,
              child: TextButton(
                onPressed: () => setState(() => _step = 0),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: Colors.white.withOpacity(0.05),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Back'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: (_userRole == 'builder' || _interests.isNotEmpty) ? () => setState(() => _step = 2) : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.themeColors.primary500,
                  foregroundColor: Colors.white,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [Text('Continue'), SizedBox(width: 8), Icon(LucideIcons.arrowRight, size: 16)],
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
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('Where are you based?', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text('Add your location to connect with local builders. (Optional)', style: TextStyle(color: AppTheme.slate400, fontSize: 14), textAlign: TextAlign.center),
        const SizedBox(height: 24),

        TextField(
          controller: _countryController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Country',
            hintStyle: TextStyle(color: AppTheme.slate500),
            filled: true,
            fillColor: Colors.white.withOpacity(0.04),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _cityController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'City',
            hintStyle: TextStyle(color: AppTheme.slate500),
            filled: true,
            fillColor: Colors.white.withOpacity(0.04),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.04),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _gender,
              dropdownColor: const Color(0xFF15131C),
              icon: const Icon(LucideIcons.chevronDown, color: Colors.white),
              style: const TextStyle(color: Colors.white, fontSize: 14),
              isExpanded: true,
              items: const [
                DropdownMenuItem(value: 'prefer-not-to-say', child: Text('Gender (Optional)')),
                DropdownMenuItem(value: 'male', child: Text('Male')),
                DropdownMenuItem(value: 'female', child: Text('Female')),
                DropdownMenuItem(value: 'non-binary', child: Text('Non-binary')),
              ],
              onChanged: (val) {
                if (val != null) setState(() => _gender = val);
              },
            ),
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
                  foregroundColor: Colors.white,
                  backgroundColor: Colors.white.withOpacity(0.05),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Back'),
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
                ),
                child: _isLoading 
                  ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [Text('Complete Setup'), SizedBox(width: 8), Icon(LucideIcons.check, size: 16)],
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
      backgroundColor: const Color(0xFF0E0C16), // Dark bg like web app
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Progress dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (index) {
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    height: 6,
                    width: _step >= index ? 32 : 16,
                    decoration: BoxDecoration(
                      color: _step >= index ? context.themeColors.primary400 : Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 48),

              // Animated step content
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
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
