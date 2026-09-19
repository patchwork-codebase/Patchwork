import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';

const _builderTracks = [
  {'value': 'product-manager', 'label': 'Product Manager', 'emoji': '\ud83d\udccb', 'desc': 'Define what gets built, align teams, and track milestones.'},
  {'value': 'founder', 'label': 'Founder', 'emoji': '\ud83d\ude80', 'desc': 'Build the company, share traction, and scale operations.'},
];

class ObserverProgressionPanel extends StatefulWidget {
  final Map<String, dynamic>? userProfile;
  final VoidCallback? onRoleUpgraded;
  const ObserverProgressionPanel({super.key, this.userProfile, this.onRoleUpgraded});
  @override
  State<ObserverProgressionPanel> createState() => _ObserverProgressionPanelState();
}

class _ObserverProgressionPanelState extends State<ObserverProgressionPanel> {
  bool _upgrading = false;
  bool _submittingLeader = false;
  String _selectedTrack = '';
  final _linkedinController = TextEditingController();
  final _roleController = TextEditingController();
  final _experienceController = TextEditingController();

  @override
  void dispose() {
    _linkedinController.dispose(); _roleController.dispose(); _experienceController.dispose();
    super.dispose();
  }

  bool get _isBuilder => widget.userProfile?['role'] == 'builder' || widget.userProfile?['role'] == 'admin';
  bool get _isVerifiedExpert => widget.userProfile?['is_verified_expert'] == true;
  int get _reputation => (widget.userProfile?['reputation'] ?? 0) as int;

  (int, String, int, int) get _levelData {
    final rep = _reputation;
    if (rep >= 1000) return (5, 'Sage', rep - 1000, 500);
    if (rep >= 500) return (4, 'Veteran', rep - 500, 500);
    if (rep >= 200) return (3, 'Skilled', rep - 200, 300);
    if (rep >= 50) return (2, 'Rising', rep - 50, 150);
    return (1, 'Newcomer', rep, 50);
  }

  Color _levelColor(int level) {
    switch (level) {
      case 5: return const Color(0xFFFFB800);
      case 4: return const Color(0xFF9B59B6);
      case 3: return const Color(0xFF3498DB);
      case 2: return const Color(0xFF2ECC71);
      default: return Colors.grey;
    }
  }

  String _nextLevelLabel(int level) {
    switch (level) {
      case 1: return 'Rising'; case 2: return 'Skilled'; case 3: return 'Veteran'; case 4: return 'Sage';
      default: return 'Max';
    }
  }

  Future<void> _handleUpgradeToBuilder() async {
    if (_selectedTrack.isEmpty) return;
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    setState(() => _upgrading = true);
    try {
      await Supabase.instance.client.from('users').update({'role': 'builder', 'domain': _selectedTrack, 'signup_completed_at': DateTime.now().toIso8601String()}).eq('id', userId);
      await Supabase.instance.client.auth.updateUser(UserAttributes(data: {'role': 'builder'}));
      if (mounted) {
        HapticFeedback.heavyImpact();
        Navigator.of(context).pop();
        widget.onRoleUpgraded?.call();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('You are now a Builder! ($_selectedTrack)', style: const TextStyle(fontWeight: FontWeight.bold)), backgroundColor: const Color(0xFF6C5CE7), behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
    } finally { if (mounted) setState(() => _upgrading = false); }
  }

  Future<void> _handleSubmitLeader() async {
    if (_linkedinController.text.trim().isEmpty || _experienceController.text.trim().isEmpty) return;
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    setState(() => _submittingLeader = true);
    try {
      await Supabase.instance.client.from('expert_applications').insert({
        'user_id': userId, 'status': 'pending', 'verification_level': 'leader',
        'linkedin_url': _linkedinController.text.trim(),
        'headline': _roleController.text.trim().isNotEmpty ? _roleController.text.trim() : 'Leader Verification Candidate',
        'bio': _experienceController.text.trim(),
        'reason': 'Applied for Leader Verification badge from the observer progression hub.',
        'submitted_at': DateTime.now().toIso8601String(), 'updated_at': DateTime.now().toIso8601String(),
      });
      if (mounted) {
        HapticFeedback.heavyImpact();
        Navigator.of(context).pop();
        _linkedinController.clear(); _roleController.clear(); _experienceController.clear();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Leader application submitted! We\'ll review soon.', style: TextStyle(fontWeight: FontWeight.bold)), backgroundColor: Colors.amber.shade700, behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
    } finally { if (mounted) setState(() => _submittingLeader = false); }
  }

  void _showBuilderModal() {
    setState(() => _selectedTrack = '');
    showModalBottomSheet(
      context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
      builder: (ctx) => _BuilderUpgradeSheet(
        selectedTrack: _selectedTrack, upgrading: _upgrading,
        onTrackSelected: (t) => setState(() => _selectedTrack = t),
        onUpgrade: _handleUpgradeToBuilder, onCancel: () => Navigator.of(ctx).pop(),
        primaryColor: context.themeColors.primary500,
      ),
    );
  }

  void _showLeaderModal() {
    showModalBottomSheet(
      context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: _LeaderVerificationSheet(
          linkedinController: _linkedinController, roleController: _roleController, experienceController: _experienceController,
          submitting: _submittingLeader, onSubmit: _handleSubmitLeader, onCancel: () => Navigator.of(ctx).pop(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final (level, levelLabel, xpIn, xpFor) = _levelData;
    final progress = xpFor > 0 ? (xpIn / xpFor).clamp(0.0, 1.0) : 1.0;
    final levelColor = _levelColor(level);

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
        child: Row(children: [
          Text('PROGRESSION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: context.themeColors.textTertiary)),
          const SizedBox(width: 12),
          Expanded(child: Divider(color: context.themeColors.borderSubtle, height: 1)),
        ]),
      ),
      // XP Level Card
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [levelColor.withOpacity(0.15), levelColor.withOpacity(0.05)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: levelColor.withOpacity(0.3)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(color: levelColor.withOpacity(0.2), shape: BoxShape.circle, border: Border.all(color: levelColor.withOpacity(0.4), width: 2)),
              child: Center(child: Text('L$level', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: levelColor))),
            ),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(levelLabel, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary)),
              Text('Observer \u00b7 $_reputation REP', style: TextStyle(fontSize: 12, fontFamily: 'monospace', color: levelColor, fontWeight: FontWeight.bold)),
            ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: levelColor.withOpacity(0.15), borderRadius: BorderRadius.circular(20), border: Border.all(color: levelColor.withOpacity(0.3))),
              child: Text('LVL $level', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: levelColor)),
            ),
          ]),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(value: progress, minHeight: 8, backgroundColor: levelColor.withOpacity(0.15), valueColor: AlwaysStoppedAnimation<Color>(levelColor)),
          ).animate().scaleX(begin: 0, end: 1, alignment: Alignment.centerLeft, duration: 800.ms, curve: Curves.easeOut),
          const SizedBox(height: 6),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('$xpIn / $xpFor XP', style: TextStyle(fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: levelColor)),
            if (level < 5) Text('${xpFor - xpIn} XP to ${_nextLevelLabel(level)}', style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary)),
          ]),
        ]),
      ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),

      const SizedBox(height: 16),

      // Progression Pathways Card
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: context.themeColors.borderSubtle)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(LucideIcons.sparkles, size: 16, color: context.themeColors.primary500),
            const SizedBox(width: 8),
            Text('PROGRESSION PATHWAYS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, fontFamily: 'monospace', color: context.themeColors.textSecondary)),
          ]),
          const SizedBox(height: 16),
          if (!_isBuilder) ...[
            _PathwayRow(icon: LucideIcons.hammer, iconBg: context.themeColors.primary500.withOpacity(0.1), iconColor: context.themeColors.primary500, title: 'Become a Builder', subtitle: 'Create rooms & log build progress', buttonLabel: 'Upgrade', buttonColor: context.themeColors.primary500, onTap: _showBuilderModal),
            Divider(height: 24, color: context.themeColors.borderSubtle),
          ],
          if (!_isVerifiedExpert) ...[
            _PathwayRow(icon: LucideIcons.shieldCheck, iconBg: Colors.green.withOpacity(0.1), iconColor: Colors.green.shade600, title: 'Apply as an Expert', subtitle: 'Mentor builders & write reviews', buttonLabel: 'Apply', buttonColor: Colors.green.shade600, onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Expert application coming soon!'), backgroundColor: Colors.green.shade700, behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))))),
            Divider(height: 24, color: context.themeColors.borderSubtle),
            _PathwayRow(icon: LucideIcons.award, iconBg: Colors.amber.withOpacity(0.1), iconColor: Colors.amber.shade700, title: 'Request Leader Badge', subtitle: 'For directors, PMs & founders', buttonLabel: 'Request', buttonColor: Colors.amber.shade700, onTap: _showLeaderModal),
          ],
          if (_isBuilder && _isVerifiedExpert) ...[
            Center(child: Column(children: [
              Icon(LucideIcons.checkCircle2, color: Colors.green.shade600, size: 32),
              const SizedBox(height: 8),
              Text('All pathways complete!', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
              Text('You are a verified expert builder.', style: TextStyle(fontSize: 12, color: context.themeColors.textSecondary)),
            ])),
          ],
        ]),
      ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.1, end: 0),

      const SizedBox(height: 16),

      // Milestones Card
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: context.themeColors.borderSubtle)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(LucideIcons.trophy, size: 16, color: Colors.amber.shade600),
            const SizedBox(width: 8),
            Text('MILESTONES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, fontFamily: 'monospace', color: context.themeColors.textSecondary)),
          ]),
          const SizedBox(height: 16),
          ..._buildMilestones(context),
        ]),
      ).animate().fadeIn(delay: 300.ms, duration: 400.ms).slideY(begin: 0.1, end: 0),

      const SizedBox(height: 100),
    ]);
  }

  List<Widget> _buildMilestones(BuildContext context) {
    final rep = _reputation;
    final milestones = [
      {'icon': LucideIcons.eye, 'label': 'First Follow', 'desc': 'Follow your first room', 'done': rep >= 1},
      {'icon': LucideIcons.flame, 'label': 'Taste Signal', 'desc': 'Submit your first reaction', 'done': rep >= 5},
      {'icon': LucideIcons.messageSquare, 'label': 'Sharp Observer', 'desc': 'Submit 10 reactions', 'done': rep >= 20},
      {'icon': LucideIcons.star, 'label': 'Rising Critic', 'desc': 'Reach 50 REP', 'done': rep >= 50},
      {'icon': LucideIcons.award, 'label': 'Veteran Observer', 'desc': 'Reach 200 REP', 'done': rep >= 200},
      {'icon': LucideIcons.sparkles, 'label': 'Sage', 'desc': 'Reach 1000 REP', 'done': rep >= 1000},
    ];
    return milestones.asMap().entries.map((e) {
      final i = e.key; final m = e.value; final isDone = m['done'] as bool;
      return Padding(
        padding: EdgeInsets.only(bottom: i < milestones.length - 1 ? 12 : 0),
        child: Row(children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: 36, height: 36,
            decoration: BoxDecoration(color: isDone ? Colors.amber.withOpacity(0.15) : context.themeColors.surfaceHighlight, borderRadius: BorderRadius.circular(10), border: Border.all(color: isDone ? Colors.amber.withOpacity(0.4) : context.themeColors.borderSubtle)),
            child: Icon(m['icon'] as IconData, size: 16, color: isDone ? Colors.amber.shade600 : context.themeColors.textTertiary),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(m['label'] as String, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isDone ? context.themeColors.textPrimary : context.themeColors.textSecondary)),
            Text(m['desc'] as String, style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary)),
          ])),
          if (isDone)
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.green.withOpacity(0.3))), child: Text('\u2713 Done', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green.shade600)))
          else
            Icon(LucideIcons.lock, size: 14, color: context.themeColors.textTertiary),
        ]),
      );
    }).toList();
  }
}

// ── Pathway Row ──────────────────────────────────────────────────────────────
class _PathwayRow extends StatelessWidget {
  final IconData icon; final Color iconBg; final Color iconColor;
  final String title; final String subtitle; final String buttonLabel; final Color buttonColor; final VoidCallback onTap;
  const _PathwayRow({required this.icon, required this.iconBg, required this.iconColor, required this.title, required this.subtitle, required this.buttonLabel, required this.buttonColor, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(width: 36, height: 36, decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 18, color: iconColor)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
        Text(subtitle, style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary)),
      ])),
      const SizedBox(width: 8),
      GestureDetector(
        onTap: onTap,
        child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: buttonColor, borderRadius: BorderRadius.circular(8)), child: Text(buttonLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white))),
      ),
    ]);
  }
}

// ── Builder Upgrade Sheet ────────────────────────────────────────────────────
class _BuilderUpgradeSheet extends StatefulWidget {
  final String selectedTrack; final bool upgrading; final ValueChanged<String> onTrackSelected;
  final VoidCallback onUpgrade; final VoidCallback onCancel; final Color primaryColor;
  const _BuilderUpgradeSheet({required this.selectedTrack, required this.upgrading, required this.onTrackSelected, required this.onUpgrade, required this.onCancel, required this.primaryColor});
  @override
  State<_BuilderUpgradeSheet> createState() => _BuilderUpgradeSheetState();
}

class _BuilderUpgradeSheetState extends State<_BuilderUpgradeSheet> {
  late String _local = widget.selectedTrack;
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(28))),
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 20), decoration: BoxDecoration(color: context.themeColors.borderSubtle, borderRadius: BorderRadius.circular(2)))),
        Row(children: [Icon(LucideIcons.hammer, size: 20, color: widget.primaryColor), const SizedBox(width: 10), Text('Upgrade to Builder', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary))]),
        const SizedBox(height: 6),
        Text('Select your builder track to activate your Builder Dashboard.', style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary)),
        const SizedBox(height: 20),
        ..._builderTracks.map((track) {
          final isSelected = _local == track['value'];
          return GestureDetector(
            onTap: () { setState(() => _local = track['value']!); widget.onTrackSelected(track['value']!); },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isSelected ? widget.primaryColor.withOpacity(0.08) : context.themeColors.surfaceHighlight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isSelected ? widget.primaryColor.withOpacity(0.5) : context.themeColors.borderSubtle, width: isSelected ? 2 : 1),
                boxShadow: isSelected ? [BoxShadow(color: widget.primaryColor.withOpacity(0.15), blurRadius: 12, offset: const Offset(0, 4))] : null,
              ),
              child: Row(children: [
                Text(track['emoji']!, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(track['label']!, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                  const SizedBox(height: 3),
                  Text(track['desc']!, style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary)),
                ])),
                if (isSelected) Icon(LucideIcons.checkCircle2, color: widget.primaryColor, size: 20),
              ]),
            ),
          );
        }),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: widget.onCancel, style: OutlinedButton.styleFrom(foregroundColor: context.themeColors.textSecondary, side: BorderSide(color: context.themeColors.borderSubtle), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 14)), child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)))),
          const SizedBox(width: 12),
          Expanded(flex: 2, child: ElevatedButton.icon(
            onPressed: (_local.isEmpty || widget.upgrading) ? null : widget.onUpgrade,
            icon: widget.upgrading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(LucideIcons.check, size: 16),
            label: Text(widget.upgrading ? 'Upgrading...' : 'Activate Builder Status', style: const TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(backgroundColor: widget.primaryColor, foregroundColor: Colors.white, disabledBackgroundColor: widget.primaryColor.withOpacity(0.4), elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 14)),
          )),
        ]),
      ]),
    );
  }
}

// ── Leader Verification Sheet ────────────────────────────────────────────────
class _LeaderVerificationSheet extends StatelessWidget {
  final TextEditingController linkedinController; final TextEditingController roleController; final TextEditingController experienceController;
  final bool submitting; final VoidCallback onSubmit; final VoidCallback onCancel;
  const _LeaderVerificationSheet({required this.linkedinController, required this.roleController, required this.experienceController, required this.submitting, required this.onSubmit, required this.onCancel});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: context.themeColors.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(28))),
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
      child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 20), decoration: BoxDecoration(color: context.themeColors.borderSubtle, borderRadius: BorderRadius.circular(2)))),
        Row(children: [Icon(LucideIcons.award, size: 20, color: Colors.amber.shade600), const SizedBox(width: 10), Text('Leader Verification', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: context.themeColors.textPrimary))]),
        const SizedBox(height: 6),
        Text('Apply for credentialed status within the Patchwork ecosystem.', style: TextStyle(fontSize: 13, color: context.themeColors.textSecondary)),
        const SizedBox(height: 24),
        _FieldLabel('LinkedIn Profile URL', required: true),
        _InputField(controller: linkedinController, hint: 'https://linkedin.com/in/username', icon: LucideIcons.link2),
        const SizedBox(height: 16),
        _FieldLabel('Current Leadership Role / Company'),
        _InputField(controller: roleController, hint: 'e.g. CPO at Paystack / Product Director', icon: LucideIcons.briefcase),
        const SizedBox(height: 16),
        _FieldLabel('Experience Summary', required: true),
        Container(
          decoration: BoxDecoration(color: context.themeColors.surfaceHighlight, borderRadius: BorderRadius.circular(14), border: Border.all(color: context.themeColors.borderSubtle)),
          child: TextField(controller: experienceController, maxLines: 4, style: TextStyle(fontSize: 14, color: context.themeColors.textPrimary), decoration: InputDecoration(hintText: 'Briefly state your leadership achievements, previous roles, and verification credentials...', hintStyle: TextStyle(fontSize: 13, color: context.themeColors.textTertiary), contentPadding: const EdgeInsets.all(14), border: InputBorder.none)),
        ),
        const SizedBox(height: 24),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: onCancel, style: OutlinedButton.styleFrom(foregroundColor: context.themeColors.textSecondary, side: BorderSide(color: context.themeColors.borderSubtle), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 14)), child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)))),
          const SizedBox(width: 12),
          Expanded(flex: 2, child: ElevatedButton.icon(
            onPressed: submitting ? null : onSubmit,
            icon: submitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(LucideIcons.check, size: 16),
            label: Text(submitting ? 'Submitting...' : 'Submit Application', style: const TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.amber.shade600, foregroundColor: Colors.white, disabledBackgroundColor: Colors.amber.withOpacity(0.4), elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 14)),
          )),
        ]),
      ])),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text; final bool required;
  const _FieldLabel(this.text, {this.required = false});
  @override
  Widget build(BuildContext context) {
    return Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [
      Text(text.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: context.themeColors.textSecondary)),
      if (required) const Text(' *', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
    ]));
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller; final String hint; final IconData icon;
  const _InputField({required this.controller, required this.hint, required this.icon});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: context.themeColors.surfaceHighlight, borderRadius: BorderRadius.circular(14), border: Border.all(color: context.themeColors.borderSubtle)),
      child: Row(children: [
        Padding(padding: const EdgeInsets.only(left: 14), child: Icon(icon, size: 16, color: context.themeColors.textTertiary)),
        Expanded(child: TextField(controller: controller, style: TextStyle(fontSize: 14, color: context.themeColors.textPrimary), decoration: InputDecoration(hintText: hint, hintStyle: TextStyle(fontSize: 13, color: context.themeColors.textTertiary), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14), border: InputBorder.none))),
      ]),
    );
  }
}
