import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import 'home_screen.dart';
import 'builder_welcome_experience_screen.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 0; // 0: Role Selection, 1: Role Specific Flow
  int _builderSubStep = 0; // 0: Domain, 1: Seniority, 2: Workplace
  bool _isLoading = false;

  // Role State
  String _userRole = 'builder';
  final List<String> _selectedObserverPills = [];
  File? _avatarFile;

  // Builder PM State
  final _nameController = TextEditingController();
  String _selectedSpecialisation = 'Fintech Product Manager';
  final _customSpecialisationController = TextEditingController();
  String _selectedSeniority = 'Senior Product Manager';
  String _careerStatus = 'Currently working';
  final _companyController = TextEditingController();

  // Demographics
  final _countryController = TextEditingController();
  final _cityController = TextEditingController();
  final String _gender = 'prefer-not-to-say';

  @override
  void initState() {
    super.initState();
    final user = Supabase.instance.client.auth.currentUser;
    final metaName = user?.userMetadata?['name']?.toString().trim() ??
        user?.userMetadata?['full_name']?.toString().trim() ??
        user?.email?.split('@')[0].trim() ?? '';
    if (metaName.isNotEmpty && metaName.toLowerCase() != 'unknown builder') {
      _nameController.text = metaName[0].toUpperCase() + metaName.substring(1);
    } else {
      _nameController.text = 'Product Builder';
    }

    _nameController.addListener(_onFieldChanged);
    _companyController.addListener(_onFieldChanged);
    _customSpecialisationController.addListener(_onFieldChanged);
  }

  void _onFieldChanged() {
    setState(() {});
  }

  @override
  void dispose() {
    _nameController.removeListener(_onFieldChanged);
    _nameController.dispose();
    _companyController.removeListener(_onFieldChanged);
    _customSpecialisationController.removeListener(_onFieldChanged);
    _customSpecialisationController.dispose();
    _companyController.dispose();
    _countryController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  // ─────────────────────────────────────────────────────────────
  // Domain Configuration (Full untruncated senior PM verticals)
  // ─────────────────────────────────────────────────────────────
  final List<Map<String, dynamic>> _domainConfigs = [
    {
      'title': 'Fintech',
      'dbValue': 'Fintech Product Manager',
      'icon': LucideIcons.creditCard,
      'desc': 'Banking, credit, lending, wealth management & decentralized finance',
    },
    {
      'title': 'AI & Machine Learning',
      'dbValue': 'AI Product Manager',
      'icon': LucideIcons.bot,
      'desc': 'Foundation models, autonomous agents, neural architectures & LLM tooling',
    },
    {
      'title': 'SaaS & Developer Tools',
      'dbValue': 'SaaS Product Manager',
      'icon': LucideIcons.cloud,
      'desc': 'Cloud software, developer platforms, SDKs & enterprise APIs',
    },
    {
      'title': 'Payments & Infrastructure',
      'dbValue': 'Payments Product Manager',
      'icon': LucideIcons.zap,
      'desc': 'Checkout funnels, card rails, settlement engines & global ledgers',
    },
    {
      'title': 'E-Commerce & Marketplaces',
      'dbValue': 'E-commerce Product Manager',
      'icon': LucideIcons.shoppingBag,
      'desc': 'Multi-sided marketplaces, catalog search, fulfillment & DTC retail',
    },
    {
      'title': 'HealthTech',
      'dbValue': 'Health Product Manager',
      'icon': LucideIcons.activity,
      'desc': 'Clinical workflows, EHR integrations, telemedicine & digital health',
    },
    {
      'title': 'Consumer Apps',
      'dbValue': 'Consumer Product Manager',
      'icon': LucideIcons.smartphone,
      'desc': 'Social networks, creator tools, mobile experiences & viral mechanics',
    },
    {
      'title': 'B2B Enterprise',
      'dbValue': 'B2B Product Manager',
      'icon': LucideIcons.building,
      'desc': 'High-ACV workflow software, security compliance & enterprise administration',
    },
    {
      'title': 'Growth & Product-Led Growth',
      'dbValue': 'Growth Product Manager',
      'icon': LucideIcons.trendingUp,
      'desc': 'Acquisition loops, self-serve conversion, onboarding funnels & retention',
    },
    {
      'title': 'Other Domain',
      'dbValue': 'Other',
      'icon': LucideIcons.compass,
      'desc': 'Specialized vertical or emerging category (specify in next field)',
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // Seniority & Tier Data
  // ─────────────────────────────────────────────────────────────
  final List<Map<String, dynamic>> _tierGroups = [
    {
      'key': 'foundational',
      'name': 'Foundational Track',
      'badge': 'Tier 1',
      'desc': 'Sprint execution, backlog ownership & qualitative customer interviews',
      'roles': [
        'Associate Product Manager',
        'Product Manager',
      ],
    },
    {
      'key': 'practical',
      'name': 'Practical Track',
      'badge': 'Tier 2',
      'desc': 'Cross-functional alignment, technical trade-offs & roadmap delivery',
      'roles': [
        'Senior Product Manager',
        'Lead Product Manager',
      ],
    },
    {
      'key': 'strategic',
      'name': 'Strategic Track',
      'badge': 'Tier 3',
      'desc': 'Multi-squad architecture, high-impact business bets & IC leadership',
      'roles': [
        'Principal Product Manager',
        'Senior Product Lead',
        'Head of Product',
      ],
    },
    {
      'key': 'executive',
      'name': 'Executive Track',
      'badge': 'Tier 4',
      'desc': 'Portfolio strategy, executive alignment, capital allocation & org scaling',
      'roles': [
        'Director of Product',
        'VP Product',
        'Chief Product Officer',
        'Founder / Product Founder',
      ],
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // Career Statuses & Popular Companies
  // ─────────────────────────────────────────────────────────────
  final List<Map<String, dynamic>> _careerStatusConfigs = [
    {
      'title': 'Currently working',
      'icon': LucideIcons.briefcase,
      'desc': 'Employed full-time at a company, startup, or scale-up',
    },
    {
      'title': 'Building independently',
      'icon': LucideIcons.sparkles,
      'desc': 'Founder, indie hacker, or bootstrapping a new venture',
    },
    {
      'title': 'Seeking a new role',
      'icon': LucideIcons.search,
      'desc': 'Actively exploring and interviewing for product roles',
    },
    {
      'title': 'Open to opportunities',
      'icon': LucideIcons.eye,
      'desc': 'Settled in current role, but quietly receptive to exceptional offers',
    },
  ];

  final List<String> _popularCompanies = [
    'Stripe',
    'Revolut',
    'Monzo',
    'Linear',
    'Figma',
    'Google',
    'Meta',
    'OpenAI',
    'Spotify',
    'Shopify',
    'Nubank',
    'Paystack',
    'Flutterwave',
  ];

  final List<String> _observerInterests = [
    'Startups',
    'Fintech',
    'AI/ML',
    'SaaS',
    'Web3',
    'E-commerce',
    'Healthtech',
    'Edtech',
    'Creator Economy',
  ];

  // ─────────────────────────────────────────────────────────────
  // Avatar & Image Upload
  // ─────────────────────────────────────────────────────────────
  Future<void> _pickAvatar() async {
    HapticFeedback.lightImpact();
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() {
        _avatarFile = File(picked.path);
      });
    }
  }

  Future<String?> _uploadAvatar(String userId) async {
    if (_avatarFile == null) return null;
    final fileName = _avatarFile!.path;
    final dotIndex = fileName.lastIndexOf('.');
    final ext = dotIndex != -1 ? fileName.substring(dotIndex) : '.jpg';
    final path = '$userId/avatar-${DateTime.now().millisecondsSinceEpoch}$ext';
    await Supabase.instance.client.storage.from('avatars').upload(path, _avatarFile!);
    return Supabase.instance.client.storage.from('avatars').getPublicUrl(path);
  }

  Future<void> _triggerWelcomeEmail(User user) async {
    try {
      final email = user.email;
      final metadata = user.userMetadata;
      final name = metadata?['name'] ?? metadata?['full_name'] ?? user.email?.split('@')[0] ?? 'Builder';

      if (email != null) {
        // Record welcome email intent in welcome_emails_log
        try {
          await Supabase.instance.client.from('welcome_emails_log').upsert({
            'user_id': user.id,
            'email': email,
            'status': 'pending',
          }, onConflict: 'user_id');
        } catch (_) {}

        // Edge function invocations on Flutter Web trigger strict browser preflight CORS failures
        // if headers like apikey or x-client-info are not explicitly allowed by the cloud gateway.
        if (!kIsWeb) {
          await Supabase.instance.client.functions.invoke('send-welcome-email', body: {
            'userId': user.id,
            'email': email,
            'name': name,
            'role': _userRole,
          });
        }
      }
    } catch (_) {
      // Non-critical background task
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Complete Handlers
  // ─────────────────────────────────────────────────────────────
  Future<void> _handleBuilderComplete() async {
    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) throw Exception('No user session found.');

      final avatarUrl = await _uploadAvatar(user.id);
      final finalSpec = _selectedSpecialisation == 'Other'
          ? (_customSpecialisationController.text.trim().isNotEmpty ? _customSpecialisationController.text.trim() : 'Other')
          : _selectedSpecialisation;

      final company = _careerStatus == 'Currently working' ? _companyController.text.trim() : '';

      final currentUserName = _nameController.text.trim().isNotEmpty
          ? _nameController.text.trim()
          : (user.userMetadata?['name']?.toString().trim() ??
             user.userMetadata?['full_name']?.toString().trim() ??
             user.email?.split('@')[0].trim() ??
             'Product Builder');

      final formattedName = (currentUserName.isNotEmpty && currentUserName.toLowerCase() != 'unknown builder')
          ? (currentUserName[0].toUpperCase() + currentUserName.substring(1))
          : 'Product Builder';

      final updates = <String, dynamic>{
        'name': formattedName,
        'role': 'builder',
        'domain': 'Product Management',
        'specialisation': finalSpec,
        'seniority': _selectedSeniority,
        'pm_level': _selectedSeniority,
        'career_status': _careerStatus,
        'company_name': company,
        'organization_name': company,
        'gender': _gender,
        'city': _cityController.text.trim().isNotEmpty ? '${_cityController.text.trim()}, ${_countryController.text.trim()}' : '',
        'signup_completed_at': DateTime.now().toIso8601String(),
      };

      if (avatarUrl != null) {
        updates['avatar'] = avatarUrl;
      }

      await Supabase.instance.client.from('users').update(updates).eq('id', user.id);
      try {
        await Supabase.instance.client.auth.updateUser(UserAttributes(data: {'name': formattedName}));
      } catch (_) {}
      _triggerWelcomeEmail(user);

      final profileRes = await Supabase.instance.client.from('users').select('*').eq('id', user.id).maybeSingle();

      if (mounted) {
        final profile = profileRes ?? updates;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => BuilderWelcomeExperienceScreen(
              userProfile: Map<String, dynamic>.from(profile),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save profile: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleObserverComplete() async {
    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) throw Exception('No user found.');

      final avatarUrl = await _uploadAvatar(user.id);

      final currentUserName = user.userMetadata?['name']?.toString().trim() ??
          user.userMetadata?['full_name']?.toString().trim() ??
          user.email?.split('@')[0].trim() ??
          'Observer';
      final formattedName = (currentUserName.isNotEmpty && currentUserName.toLowerCase() != 'unknown builder')
          ? (currentUserName[0].toUpperCase() + currentUserName.substring(1))
          : 'Observer';

      final updates = <String, dynamic>{
        'name': formattedName,
        'role': 'observer',
        'gender': _gender,
        'city': _cityController.text.trim().isNotEmpty ? '${_cityController.text.trim()}, ${_countryController.text.trim()}' : '',
        'signup_completed_at': DateTime.now().toIso8601String(),
        'interests': _selectedObserverPills,
      };

      if (avatarUrl != null) updates['avatar'] = avatarUrl;

      await Supabase.instance.client.from('users').update(updates).eq('id', user.id);
      try {
        await Supabase.instance.client.auth.updateUser(UserAttributes(data: {'name': formattedName}));
      } catch (_) {}
      _triggerWelcomeEmail(user);

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
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 0: Role Selection (Builder vs Observer)
  // ─────────────────────────────────────────────────────────────
  Widget _buildStep0() {
    return Column(
      key: const ValueKey(0),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 12),
        Text(
          'Welcome to Patchwork',
          style: TextStyle(
            color: context.themeColors.textPrimary,
            fontSize: 26,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.6,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Select your platform mode to tailor your simulation scenarios and workspace.',
          style: TextStyle(
            color: context.themeColors.textSecondary,
            fontSize: 14,
            height: 1.4,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 36),

        // Builder Option Card
        GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() => _userRole = 'builder');
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: _userRole == 'builder'
                  ? context.themeColors.surfaceHighlight.withOpacity(0.7)
                  : context.themeColors.surface,
              border: Border.all(
                color: _userRole == 'builder' ? context.themeColors.primary500 : context.themeColors.borderSubtle,
                width: _userRole == 'builder' ? 1.5 : 1,
              ),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _userRole == 'builder'
                        ? context.themeColors.primary500.withOpacity(0.15)
                        : context.themeColors.surfaceHighlight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    LucideIcons.hammer,
                    size: 20,
                    color: _userRole == 'builder' ? context.themeColors.primary400 : context.themeColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Builder',
                            style: TextStyle(
                              color: context.themeColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: context.themeColors.surfaceHighlight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Simulation Track',
                              style: TextStyle(
                                color: context.themeColors.textTertiary,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Calibrate your PM identity, solve interactive simulation trade-offs, and establish a verifiable track record.',
                        style: TextStyle(
                          color: context.themeColors.textSecondary,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _userRole == 'builder' ? context.themeColors.primary500 : Colors.transparent,
                    border: Border.all(
                      color: _userRole == 'builder' ? context.themeColors.primary500 : context.themeColors.border,
                      width: 1.5,
                    ),
                  ),
                  child: _userRole == 'builder'
                      ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                      : null,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Observer Option Card
        GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() => _userRole = 'observer');
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: _userRole == 'observer'
                  ? context.themeColors.surfaceHighlight.withOpacity(0.7)
                  : context.themeColors.surface,
              border: Border.all(
                color: _userRole == 'observer' ? context.themeColors.primary500 : context.themeColors.borderSubtle,
                width: _userRole == 'observer' ? 1.5 : 1,
              ),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _userRole == 'observer'
                        ? context.themeColors.primary500.withOpacity(0.15)
                        : context.themeColors.surfaceHighlight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    LucideIcons.eye,
                    size: 20,
                    color: _userRole == 'observer' ? context.themeColors.primary400 : context.themeColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Observer',
                            style: TextStyle(
                              color: context.themeColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: context.themeColors.surfaceHighlight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Discovery Track',
                              style: TextStyle(
                                color: context.themeColors.textTertiary,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Discover and evaluate emerging product talent, live roadmaps, and high-velocity engineering teams.',
                        style: TextStyle(
                          color: context.themeColors.textSecondary,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _userRole == 'observer' ? context.themeColors.primary500 : Colors.transparent,
                    border: Border.all(
                      color: _userRole == 'observer' ? context.themeColors.primary500 : context.themeColors.border,
                      width: 1.5,
                    ),
                  ),
                  child: _userRole == 'observer'
                      ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                      : null,
                ),
              ],
            ),
          ),
        ),

        const Spacer(),
        ElevatedButton(
          onPressed: () {
            HapticFeedback.lightImpact();
            setState(() => _step = 1);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: context.themeColors.primary500,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 0,
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Continue', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              SizedBox(width: 8),
              Icon(LucideIcons.arrowRight, size: 16),
            ],
          ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUB-STEP 0: Product Domain / Specialisation
  // ─────────────────────────────────────────────────────────────
  Widget _buildSubStep0Domain() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'What is your product domain?',
          style: TextStyle(
            color: context.themeColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'We calibrate your simulations, case studies, and recommendations to your vertical.',
          style: TextStyle(
            color: context.themeColors.textSecondary,
            fontSize: 13,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),

        Expanded(
          child: ListView.separated(
            physics: const BouncingScrollPhysics(),
            itemCount: _domainConfigs.length + (_selectedSpecialisation == 'Other' ? 1 : 0),
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, idx) {
              if (idx == _domainConfigs.length) {
                // Custom Domain Input
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.themeColors.surfaceHighlight.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.themeColors.borderSubtle),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SPECIFY YOUR DOMAIN',
                        style: TextStyle(
                          color: context.themeColors.textTertiary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _customSpecialisationController,
                        style: TextStyle(color: context.themeColors.textPrimary, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'e.g. ClimateTech, EdTech, DevTools, Gaming',
                          hintStyle: TextStyle(color: context.themeColors.textTertiary, fontSize: 13),
                          filled: true,
                          fillColor: context.themeColors.background,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: context.themeColors.borderSubtle),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: context.themeColors.borderSubtle),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: context.themeColors.primary500),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }

              final item = _domainConfigs[idx];
              final isSelected = _selectedSpecialisation == item['dbValue'];

              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedSpecialisation = item['dbValue'] as String);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? context.themeColors.surfaceHighlight.withOpacity(0.7)
                        : context.themeColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? context.themeColors.primary500 : context.themeColors.borderSubtle,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? context.themeColors.primary500.withOpacity(0.15)
                              : context.themeColors.surfaceHighlight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          item['icon'] as IconData,
                          size: 18,
                          color: isSelected ? context.themeColors.primary400 : context.themeColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['title'] as String,
                              style: TextStyle(
                                color: context.themeColors.textPrimary,
                                fontSize: 14,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              item['desc'] as String,
                              style: TextStyle(
                                color: context.themeColors.textSecondary,
                                fontSize: 12,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isSelected ? context.themeColors.primary500 : Colors.transparent,
                          border: Border.all(
                            color: isSelected ? context.themeColors.primary500 : context.themeColors.border,
                            width: 1.5,
                          ),
                        ),
                        child: isSelected
                            ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                            : null,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUB-STEP 1: PM Seniority & Simulation Tier
  // ─────────────────────────────────────────────────────────────
  Widget _buildSubStep1Seniority() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'What is your experience level?',
          style: TextStyle(
            color: context.themeColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Calibrates the scope, stakeholders, and business trade-offs in your simulations.',
          style: TextStyle(
            color: context.themeColors.textSecondary,
            fontSize: 13,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),

        Expanded(
          child: ListView.separated(
            physics: const BouncingScrollPhysics(),
            itemCount: _tierGroups.length,
            separatorBuilder: (_, __) => const SizedBox(height: 20),
            itemBuilder: (context, groupIdx) {
              final group = _tierGroups[groupIdx];
              final roles = group['roles'] as List<String>;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Track Section Header
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          (group['name'] as String).toUpperCase(),
                          style: TextStyle(
                            color: context.themeColors.textTertiary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: context.themeColors.surfaceHighlight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            group['badge'] as String,
                            style: TextStyle(
                              color: context.themeColors.textSecondary,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Role Cards under this track
                  ...roles.map((role) {
                    final isSelected = _selectedSeniority == role;

                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _selectedSeniority = role;
                        });
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? context.themeColors.surfaceHighlight.withOpacity(0.7)
                              : context.themeColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? context.themeColors.primary500 : context.themeColors.borderSubtle,
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    role,
                                    style: TextStyle(
                                      color: context.themeColors.textPrimary,
                                      fontSize: 14,
                                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    group['desc'] as String,
                                    style: TextStyle(
                                      color: context.themeColors.textSecondary,
                                      fontSize: 12,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isSelected ? context.themeColors.primary500 : Colors.transparent,
                                border: Border.all(
                                  color: isSelected ? context.themeColors.primary500 : context.themeColors.border,
                                  width: 1.5,
                                ),
                              ),
                              child: isSelected
                                  ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                                  : null,
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUB-STEP 2: Workplace & Career Status
  // ─────────────────────────────────────────────────────────────
  Widget _buildSubStep2Workplace() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Where are you building?',
          style: TextStyle(
            color: context.themeColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Set up your professional context and public builder profile.',
          style: TextStyle(
            color: context.themeColors.textSecondary,
            fontSize: 13,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),

        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile & Name Block
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: context.themeColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.themeColors.borderSubtle),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: _pickAvatar,
                        child: Stack(
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: context.themeColors.surfaceHighlight,
                                border: Border.all(color: context.themeColors.border, width: 1.5),
                                image: _avatarFile != null
                                    ? DecorationImage(image: FileImage(_avatarFile!), fit: BoxFit.cover)
                                    : null,
                              ),
                              child: _avatarFile == null
                                  ? Icon(LucideIcons.user, size: 26, color: context.themeColors.textSecondary)
                                  : null,
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(5),
                                decoration: BoxDecoration(
                                  color: context.themeColors.primary500,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: context.themeColors.background, width: 2),
                                ),
                                child: const Icon(LucideIcons.camera, color: Colors.white, size: 10),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'FULL NAME',
                              style: TextStyle(
                                color: context.themeColors.textTertiary,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _nameController,
                              style: TextStyle(color: context.themeColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                hintText: 'Your full name',
                                hintStyle: TextStyle(color: context.themeColors.textTertiary, fontSize: 13),
                                isDense: true,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                filled: true,
                                fillColor: context.themeColors.background,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.borderSubtle)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.borderSubtle)),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.primary500)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Current Status Block
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 8),
                  child: Text(
                    'CURRENT STATUS',
                    style: TextStyle(
                      color: context.themeColors.textTertiary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                ..._careerStatusConfigs.map((status) {
                  final isSelected = _careerStatus == status['title'];

                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _careerStatus = status['title'] as String);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? context.themeColors.surfaceHighlight.withOpacity(0.7)
                            : context.themeColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? context.themeColors.primary500 : context.themeColors.borderSubtle,
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? context.themeColors.primary500.withOpacity(0.15)
                                  : context.themeColors.surfaceHighlight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              status['icon'] as IconData,
                              size: 16,
                              color: isSelected ? context.themeColors.primary400 : context.themeColors.textSecondary,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  status['title'] as String,
                                  style: TextStyle(
                                    color: context.themeColors.textPrimary,
                                    fontSize: 14,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  status['desc'] as String,
                                  style: TextStyle(
                                    color: context.themeColors.textSecondary,
                                    fontSize: 12,
                                    height: 1.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSelected ? context.themeColors.primary500 : Colors.transparent,
                              border: Border.all(
                                color: isSelected ? context.themeColors.primary500 : context.themeColors.border,
                                width: 1.5,
                              ),
                            ),
                            child: isSelected
                                ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                                : null,
                          ),
                        ],
                      ),
                    ),
                  );
                }),

                if (_careerStatus == 'Currently working') ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: context.themeColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.themeColors.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'COMPANY OR ORGANIZATION',
                          style: TextStyle(
                            color: context.themeColors.textTertiary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _companyController,
                          style: TextStyle(color: context.themeColors.textPrimary, fontSize: 14),
                          decoration: InputDecoration(
                            prefixIcon: Icon(LucideIcons.building, size: 16, color: context.themeColors.textSecondary),
                            suffixIcon: _companyController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(LucideIcons.x, size: 14),
                                    onPressed: () => _companyController.clear(),
                                  )
                                : null,
                            hintText: 'e.g. Stripe, Linear, Figma',
                            hintStyle: TextStyle(color: context.themeColors.textTertiary, fontSize: 13),
                            filled: true,
                            fillColor: context.themeColors.background,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.themeColors.borderSubtle)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.themeColors.borderSubtle)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.themeColors.primary500)),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Quick select:',
                          style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: _popularCompanies.map((c) {
                            final isChosen = _companyController.text.trim().toLowerCase() == c.toLowerCase();
                            return GestureDetector(
                              onTap: () {
                                HapticFeedback.selectionClick();
                                setState(() => _companyController.text = c);
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isChosen
                                      ? context.themeColors.primary500.withOpacity(0.15)
                                      : context.themeColors.surfaceHighlight,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isChosen ? context.themeColors.primary500 : context.themeColors.borderSubtle,
                                  ),
                                ),
                                child: Text(
                                  c,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: isChosen ? FontWeight.w700 : FontWeight.w500,
                                    color: isChosen ? context.themeColors.primary400 : context.themeColors.textSecondary,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 1 (BUILDER): Unified PM Identity Studio Layout
  // ─────────────────────────────────────────────────────────────
  Widget _buildStep1BuilderIdentity() {
    return Column(
      key: const ValueKey('builder_identity_flow'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Clean Minimalist Top Navigation Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                if (_builderSubStep > 0) {
                  setState(() => _builderSubStep--);
                } else {
                  setState(() => _step = 0);
                }
              },
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: context.themeColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: context.themeColors.borderSubtle),
                ),
                child: Icon(LucideIcons.arrowLeft, size: 16, color: context.themeColors.textPrimary),
              ),
            ),
            Row(
              children: List.generate(3, (i) {
                final isCompleted = _builderSubStep > i;
                final isCurrent = _builderSubStep == i;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: isCurrent ? 28 : 10,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? context.themeColors.primary500
                        : (isCompleted ? context.themeColors.primary500.withOpacity(0.4) : context.themeColors.surfaceHighlight),
                    borderRadius: BorderRadius.circular(2),
                  ),
                );
              }),
            ),
            Text(
              '${_builderSubStep + 1} of 3',
              style: TextStyle(
                color: context.themeColors.textTertiary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),

        const SizedBox(height: 20),

        // Sub-step Content with smooth slide/fade transitions
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) {
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.04, 0),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                ),
              );
            },
            child: KeyedSubtree(
              key: ValueKey(_builderSubStep),
              child: _builderSubStep == 0
                  ? _buildSubStep0Domain()
                  : (_builderSubStep == 1 ? _buildSubStep1Seniority() : _buildSubStep2Workplace()),
            ),
          ),
        ),

        // Clean, High-Contrast Bottom Action Button
        const SizedBox(height: 14),
        ElevatedButton(
          onPressed: _isLoading
              ? null
              : () {
                  HapticFeedback.lightImpact();
                  if (_builderSubStep < 2) {
                    setState(() => _builderSubStep++);
                  } else {
                    _handleBuilderComplete();
                  }
                },
          style: ElevatedButton.styleFrom(
            backgroundColor: context.themeColors.primary500,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 0,
          ),
          child: _isLoading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _builderSubStep < 2 ? 'Continue' : 'Complete Profile',
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    const SizedBox(width: 8),
                    const Icon(LucideIcons.arrowRight, size: 16),
                  ],
                ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // OBSERVER STEP 1: Topics Selection
  // ─────────────────────────────────────────────────────────────
  Widget _buildStep1ObserverTopics() {
    return Column(
      key: const ValueKey('observer_topics'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('What are you tracking?', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 22, fontWeight: FontWeight.w900), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text('Select up to 3 topics you are interested in exploring.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12), textAlign: TextAlign.center),
        const SizedBox(height: 24),

        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _observerInterests.map((item) {
                final isSelected = _selectedObserverPills.contains(item);
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() {
                      if (isSelected) {
                        _selectedObserverPills.remove(item);
                      } else {
                        if (_selectedObserverPills.length < 3) _selectedObserverPills.add(item);
                      }
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected ? context.themeColors.primary500 : context.themeColors.surfaceHighlight.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(20),
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
                        fontSize: 13,
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
                onPressed: () {
                  HapticFeedback.lightImpact();
                  setState(() => _step = 0);
                },
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
                onPressed: _selectedObserverPills.isNotEmpty ? () {
                  HapticFeedback.lightImpact();
                  setState(() => _step = 2);
                } : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.themeColors.primary500,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [Text('Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)), SizedBox(width: 8), Icon(LucideIcons.arrowRight, size: 15)],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // OBSERVER STEP 2: Photo Setup
  // ─────────────────────────────────────────────────────────────
  Widget _buildStep2ObserverPhoto() {
    return Column(
      key: const ValueKey('observer_photo'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Add a Photo', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 22, fontWeight: FontWeight.w900), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text('Put a face to the name. Profiles with avatars get 3x more engagement.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12), textAlign: TextAlign.center),
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
                      ? Icon(LucideIcons.user, size: 40, color: context.themeColors.textTertiary)
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
                    child: const Icon(LucideIcons.camera, color: Colors.white, size: 17),
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
                onPressed: () {
                  HapticFeedback.lightImpact();
                  setState(() => _step = 1);
                },
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
                onPressed: _isLoading ? null : _handleObserverComplete,
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
                        children: [
                          Text(_avatarFile == null ? 'Skip for now' : 'Complete Setup', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(width: 8),
                          const Icon(LucideIcons.check, size: 15),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────────
  // BUILD SCAFFOLD
  // ─────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final totalSteps = _userRole == 'builder' ? 2 : 3;

    return Scaffold(
      backgroundColor: context.themeColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Column(
            children: [
              // Overall Progress Bar
              Row(
                children: List.generate(totalSteps, (index) {
                  return Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      height: 4,
                      decoration: BoxDecoration(
                        color: _step >= index ? context.themeColors.primary500 : context.themeColors.surfaceHighlight,
                        borderRadius: BorderRadius.circular(2),
                        boxShadow: _step >= index
                            ? [
                                BoxShadow(
                                  color: context.themeColors.primary500.withOpacity(0.4),
                                  blurRadius: 4,
                                ),
                              ]
                            : [],
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),

              // Animated Main Step Content
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  switchInCurve: Curves.easeOutCubic,
                  switchOutCurve: Curves.easeInCubic,
                  transitionBuilder: (child, animation) {
                    return SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.06, 0),
                        end: Offset.zero,
                      ).animate(animation),
                      child: FadeTransition(opacity: animation, child: child),
                    );
                  },
                  child: _step == 0
                      ? _buildStep0()
                      : (_userRole == 'builder'
                          ? _buildStep1BuilderIdentity()
                          : (_step == 1 ? _buildStep1ObserverTopics() : _buildStep2ObserverPhoto())),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
