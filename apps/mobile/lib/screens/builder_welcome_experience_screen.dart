import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import '../utils/user_identity_formatter.dart';
import 'home_screen.dart';

class BuilderWelcomeExperienceScreen extends StatefulWidget {
  final Map<String, dynamic> userProfile;
  final VoidCallback? onComplete;

  const BuilderWelcomeExperienceScreen({
    super.key,
    required this.userProfile,
    this.onComplete,
  });

  @override
  State<BuilderWelcomeExperienceScreen> createState() => _BuilderWelcomeExperienceScreenState();
}

class _BuilderWelcomeExperienceScreenState extends State<BuilderWelcomeExperienceScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  String? _selectedDecision; // 'A' or 'B'
  bool _isCompleting = false;

  late final String _specialisation;
  late final String _seniority;
  late final String _company;
  late final String _name;
  late final String _tier;
  late final Map<String, dynamic> _scenario;

  @override
  void initState() {
    super.initState();
    _specialisation = widget.userProfile['specialisation']?.toString() ?? 'Fintech Product Manager';
    _seniority = widget.userProfile['seniority']?.toString() ?? 'Senior Product Manager';
    _company = widget.userProfile['company_name']?.toString() ?? widget.userProfile['organization_name']?.toString() ?? '';
    _name = widget.userProfile['name']?.toString() ?? 'Builder';
    _tier = UserIdentityFormatter.getSeniorityTier(_seniority);
    _scenario = UserIdentityFormatter.getSimulationScenario(_tier);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    HapticFeedback.lightImpact();
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _finishWelcome();
    }
  }

  Future<void> _finishWelcome() async {
    setState(() => _isCompleting = true);
    HapticFeedback.mediumImpact();

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        // Record simulation completion & grant +50 welcome reputation
        final currentRep = (widget.userProfile['reputation'] as int?) ?? 0;
        await Supabase.instance.client.from('users').update({
          'simulation_onboarding_completed': true,
          'simulation_tier': _tier,
          'reputation': currentRep + 50,
        }).eq('id', user.id);
      }
    } catch (e) {
      debugPrint('Error updating simulation completion: $e');
    }

    if (mounted) {
      if (widget.onComplete != null) {
        widget.onComplete!();
      } else {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeScreen(isFirstTime: true)),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final identityString = UserIdentityFormatter.formatPmIdentity(
      specialisation: _specialisation,
      seniority: _seniority,
      company: _company,
      includeCompany: true,
    );

    return Scaffold(
      backgroundColor: context.themeColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Progress Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                children: [
                  for (int i = 0; i < 3; i++)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        height: 3,
                        decoration: BoxDecoration(
                          color: _currentPage >= i ? context.themeColors.primary500 : context.themeColors.surfaceHighlight,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  const SizedBox(width: 14),
                  GestureDetector(
                    onTap: _finishWelcome,
                    child: Text(
                      'Skip',
                      style: TextStyle(
                        color: context.themeColors.textTertiary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Page View
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const BouncingScrollPhysics(),
                onPageChanged: (idx) => setState(() => _currentPage = idx),
                children: [
                  _buildSlide1World(),
                  _buildSlide2Decision(),
                  _buildSlide3Reputation(identityString),
                ],
              ),
            ),

            // Bottom Navigation Bar
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Row(
                children: [
                  if (_currentPage > 0) ...[
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: context.themeColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: context.themeColors.borderSubtle),
                        ),
                        child: Icon(LucideIcons.arrowLeft, size: 18, color: context.themeColors.textPrimary),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isCompleting ? null : _nextPage,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.themeColors.primary500,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: _isCompleting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  _currentPage == 0
                                      ? 'Review Decision Options'
                                      : (_currentPage == 1 ? 'Lock in Decision' : 'Enter Dashboard'),
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                                ),
                                const SizedBox(width: 8),
                                Icon(
                                  _currentPage == 2 ? LucideIcons.check : LucideIcons.arrowRight,
                                  size: 16,
                                ),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Slide 1: Executive Case Briefing
  Widget _buildSlide1World() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Track Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.fileText, size: 13, color: context.themeColors.primary400),
                const SizedBox(width: 6),
                Text(
                  'CASE BRIEFING · ${_scenario['tierLabel']}'.toUpperCase(),
                  style: TextStyle(
                    color: context.themeColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),
          Text(
            'The Strategic Challenge',
            style: TextStyle(
              color: context.themeColors.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Welcome, $_name. This simulation models real cross-functional dilemmas calibrated for your background in $_specialisation.',
            style: TextStyle(
              color: context.themeColors.textSecondary,
              fontSize: 13,
              height: 1.4,
            ),
          ),

          const SizedBox(height: 24),

          // Executive Case File Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'SIMULATION FILE #01',
                      style: TextStyle(
                        color: context.themeColors.textTertiary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: context.themeColors.primary500.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'ACTIVE SPRINT',
                        style: TextStyle(
                          color: context.themeColors.primary400,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  _scenario['missionTitle'] as String,
                  style: TextStyle(
                    color: context.themeColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  _scenario['context'] as String,
                  style: TextStyle(
                    color: context.themeColors.textSecondary,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 16),

                // Stakeholder Perspective Callout
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: context.themeColors.surfaceHighlight.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(12),
                    border: Border(left: BorderSide(color: context.themeColors.primary500, width: 3)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(LucideIcons.messageSquareQuote, size: 16, color: context.themeColors.primary400),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _scenario['stakeholder'] as String,
                          style: TextStyle(
                            color: context.themeColors.textPrimary,
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.info, size: 16, color: context.themeColors.textSecondary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Your decisions establish a verifiable proof-of-work record on your public builder profile.',
                    style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, height: 1.3),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Slide 2: Strategic Decision Point
  Widget _buildSlide2Decision() {
    final optA = _scenario['optionA'] as Map<String, dynamic>;
    final optB = _scenario['optionB'] as Map<String, dynamic>;
    final activeOption = _selectedDecision == 'A' ? optA : (_selectedDecision == 'B' ? optB : null);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Text(
              'DECISION POINT',
              style: TextStyle(
                color: context.themeColors.textSecondary,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Choose Your Direction',
            style: TextStyle(
              color: context.themeColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Evaluate the trade-offs and select the approach you would execute.',
            style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 20),

          // Decision Card A
          _buildDecisionCard(
            keyId: 'A',
            title: optA['title'] as String,
            description: optA['desc'] as String,
            isSelected: _selectedDecision == 'A',
          ),
          const SizedBox(height: 10),

          // Decision Card B
          _buildDecisionCard(
            keyId: 'B',
            title: optB['title'] as String,
            description: optB['desc'] as String,
            isSelected: _selectedDecision == 'B',
          ),

          const SizedBox(height: 18),

          // Projected Impact Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: activeOption != null ? context.themeColors.primary500.withOpacity(0.4) : context.themeColors.borderSubtle,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'PROJECTED IMPACT METRICS',
                      style: TextStyle(
                        color: context.themeColors.textTertiary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                    if (activeOption != null)
                      Text(
                        'ESTIMATED DELTA',
                        style: TextStyle(
                          color: context.themeColors.primary400,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 14),
                _buildMeterBar('Stakeholder Alignment', activeOption != null ? (activeOption['trustDelta'] as int) : 0, const Color(0xFF3B82F6)),
                const SizedBox(height: 10),
                _buildMeterBar('Team Delivery Velocity', activeOption != null ? (activeOption['velocityDelta'] as int) : 0, const Color(0xFF10B981)),
                const SizedBox(height: 10),
                _buildMeterBar('Projected ARR Impact', activeOption != null ? (activeOption['arrDelta'] as int) : 0, const Color(0xFFF59E0B)),
                if (activeOption != null) ...[
                  const SizedBox(height: 14),
                  Divider(color: context.themeColors.borderSubtle),
                  const SizedBox(height: 8),
                  Text(
                    activeOption['outcome'] as String,
                    style: TextStyle(
                      color: context.themeColors.textPrimary,
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDecisionCard({
    required String keyId,
    required String title,
    required String description,
    required bool isSelected,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _selectedDecision = keyId);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? context.themeColors.surfaceHighlight.withOpacity(0.8) : context.themeColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? context.themeColors.primary500 : context.themeColors.borderSubtle,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? context.themeColors.primary500 : context.themeColors.surfaceHighlight,
              ),
              child: Center(
                child: Text(
                  keyId,
                  style: TextStyle(
                    color: isSelected ? Colors.white : context.themeColors.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: context.themeColors.textPrimary,
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMeterBar(String label, int delta, Color color) {
    final absVal = (50 + delta).clamp(10, 100);
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11)),
            Text(
              delta == 0 ? 'Baseline' : (delta > 0 ? '+$delta%' : '$delta%'),
              style: TextStyle(
                color: delta >= 0 ? color : const Color(0xFFEF4444),
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: Container(
            height: 5,
            color: context.themeColors.surfaceHighlight,
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: (MediaQuery.of(context).size.width - 80) * (absVal / 100),
                  color: color,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Slide 3: Verified Builder Credential
  Widget _buildSlide3Reputation(String identityString) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 16),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: context.themeColors.primary500.withOpacity(0.15),
              border: Border.all(color: context.themeColors.primary500.withOpacity(0.4)),
            ),
            child: Icon(LucideIcons.shieldCheck, size: 28, color: context.themeColors.primary400),
          ),

          const SizedBox(height: 20),
          Text(
            'Builder Credential Live',
            style: TextStyle(
              color: context.themeColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),
          Text(
            'Your strategic decision has been logged. You are ready to explore simulations and engage with the Patchwork builder network.',
            style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, height: 1.5),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 28),

          // Refined Minimalist Identity Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.themeColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: context.themeColors.primary500,
                      ),
                      child: Center(
                        child: Text(
                          _name.isNotEmpty ? _name.substring(0, 1).toUpperCase() : 'B',
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _name,
                            style: TextStyle(
                              color: context.themeColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            identityString,
                            style: TextStyle(
                              color: context.themeColors.primary400,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Divider(color: context.themeColors.borderSubtle),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildStatCol('STARTING REP', '50 REP', LucideIcons.zap, context.themeColors.primary400),
                    _buildStatCol('TRACK', _scenario['tierLabel'] as String, LucideIcons.award, context.themeColors.textPrimary),
                    _buildStatCol('STATUS', 'Verified PM', LucideIcons.checkCircle2, const Color(0xFF10B981)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Quiet Confirmation Notice
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.check, size: 16, color: Color(0xFF10B981)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Welcome Reward: +50 Reputation Points credited to your profile.',
                    style: TextStyle(color: context.themeColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCol(String title, String val, IconData icon, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.6)),
        const SizedBox(height: 4),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(val, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700)),
          ],
        ),
      ],
    );
  }
}
