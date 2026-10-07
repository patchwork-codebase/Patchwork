import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import '../widgets/toast_notification.dart';

class CreateSimulationScreen extends StatefulWidget {
  final String? preselectedRoomId;
  final String? preselectedRoomTitle;
  final String? initialTitle;
  final String? initialPrompt;

  const CreateSimulationScreen({
    super.key,
    this.preselectedRoomId,
    this.preselectedRoomTitle,
    this.initialTitle,
    this.initialPrompt,
  });

  @override
  State<CreateSimulationScreen> createState() => _CreateSimulationScreenState();
}

class _CreateSimulationScreenState extends State<CreateSimulationScreen> {
  final _titleController = TextEditingController();
  final _promptController = TextEditingController();
  final _creatorRationaleController = TextEditingController();
  final _seniorTipController = TextEditingController();

  String _category = 'Product Strategy';
  String _seniorityTarget = 'Strategic PM';
  String? _selectedRoomId;
  List<Map<String, dynamic>> _userRooms = [];
  bool _isPublishing = false;

  // Options state
  final List<Map<String, dynamic>> _options = [
    {
      'id': 'opt_a',
      'title': TextEditingController(text: ''),
      'description': TextEditingController(text: ''),
      'stakeholder_persona': TextEditingController(text: ''),
      'stakeholder_critique': TextEditingController(text: ''),
      'trust': 15,
      'velocity': 10,
      'revenue': 20,
      'risk': -10,
    },
    {
      'id': 'opt_b',
      'title': TextEditingController(text: ''),
      'description': TextEditingController(text: ''),
      'stakeholder_persona': TextEditingController(text: ''),
      'stakeholder_critique': TextEditingController(text: ''),
      'trust': 25,
      'velocity': -15,
      'revenue': 10,
      'risk': 15,
    },
  ];

  final List<String> _categories = [
    'Product Strategy',
    'Fintech & Risk',
    'Technical Debt & Arch',
    'Growth & Pricing',
    'Cross-Functional Alignment',
    'Customer & Churn',
  ];

  final List<String> _seniorityLevels = [
    'Foundational (APM)',
    'Practical (Mid PM)',
    'Strategic PM',
    'Executive / Founder',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialTitle != null && widget.initialTitle!.isNotEmpty) {
      _titleController.text = widget.initialTitle!;
    }
    if (widget.initialPrompt != null && widget.initialPrompt!.isNotEmpty) {
      _promptController.text = widget.initialPrompt!;
    }
    _selectedRoomId = widget.preselectedRoomId;
    _fetchUserRooms();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _promptController.dispose();
    _creatorRationaleController.dispose();
    _seniorTipController.dispose();
    for (final opt in _options) {
      (opt['title'] as TextEditingController).dispose();
      (opt['description'] as TextEditingController).dispose();
      (opt['stakeholder_persona'] as TextEditingController?)?.dispose();
      (opt['stakeholder_critique'] as TextEditingController?)?.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchUserRooms() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final res = await Supabase.instance.client
          .from('rooms')
          .select('id, title')
          .eq('builder_id', userId);

      final list = List<Map<String, dynamic>>.from(res);
      if (mounted) {
        setState(() {
          _userRooms = list;
          _selectedRoomId = widget.preselectedRoomId ?? (list.isNotEmpty ? list.first['id'] : null);
        });
      }
    } catch (_) {}
  }

  void _applyTemplate(int index) {
    HapticFeedback.lightImpact();
    if (index == 0) {
      // Latency vs Security
      _titleController.text = 'Checkout Latency Spike vs Anti-Fraud Defense';
      _category = 'Fintech & Risk';
      _seniorityTarget = 'Strategic PM';
      _promptController.text =
          'A new real-time risk model cut fraud by 40%, but added 350ms to mobile checkout latency. Top enterprise merchants report a 2.5% drop in transaction conversion and demand an immediate rollback. The security team insists keeping it live to block an active credential stuffing attack.';
      
      _options[0]['title'].text = 'Rollback model immediately to restore merchant conversion';
      _options[0]['description'].text = 'Prioritize checkout conversion rate today; patch bot filters asynchronously out-of-band.';
      _options[0]['stakeholder_persona'].text = 'Chief Information Security Officer (CISO)';
      _options[0]['stakeholder_critique'].text = 'Rolling back the model during an active credential stuffing attack leaves payment gateways defenseless against card testing rings. Who covers the chargeback liability?';
      _options[0]['trust'] = 15; _options[0]['velocity'] = 20; _options[0]['revenue'] = 25; _options[0]['risk'] = -30;

      _options[1]['title'].text = 'Keep model live; whitelist top enterprise accounts with conditional fast-pathing';
      _options[1]['description'].text = 'Isolate known trusted users from latency overhead while maintaining active shield for untrusted traffic.';
      _options[1]['stakeholder_persona'].text = 'Head of Enterprise Merchant Success';
      _options[1]['stakeholder_critique'].text = 'Fast-pathing sounds great, but who defines the criteria for "trusted"? If a high-volume merchant gets throttled by mistake, they escalate straight to our CEO.';
      _options[1]['trust'] = 25; _options[1]['velocity'] = 10; _options[1]['revenue'] = 15; _options[1]['risk'] = 15;

      _creatorRationaleController.text =
          'Moving verification to an async pre-capture stage or conditional fast-pathing protects transaction velocity without leaving the infrastructure vulnerable. Never treat security and conversion as a zero-sum trade-off.';
      _seniorTipController.text = 'Great PMs deconstruct latency bottlenecks into synchronous vs asynchronous lifecycle moments.';
    } else if (index == 1) {
      // Tech Debt vs Feature Sprint
      _titleController.text = '6-Week Refactor vs Committed Enterprise Deal Feature';
      _category = 'Technical Debt & Arch';
      _seniorityTarget = 'Practical (Mid PM)';
      _promptController.text =
          'Engineering alerts that our core message pipeline will hit memory saturation in 3 months without a 6-week architecture refactor. Concurrently, sales is closing a \$250K ACV contract that requires building custom SSO and auditing by the end of next month.';

      _options[0]['title'].text = 'Pause all feature work for a 6-week refactor sprint';
      _options[0]['description'].text = 'Protect system stability; push the sales delivery date by 4 weeks and accept churn risk.';
      _options[0]['stakeholder_persona'].text = 'VP of Global Sales';
      _options[0]['stakeholder_critique'].text = 'Pushing the delivery date by a month kills our Q3 enterprise quota and this prospect will sign with our competitor by Friday. Can engineering guarantee 0 unexpected downtime?';
      _options[0]['trust'] = -10; _options[0]['velocity'] = -25; _options[0]['revenue'] = -15; _options[0]['risk'] = 35;

      _options[1]['title'].text = 'Build custom SSO on isolated microservice; schedule refactor in parallel';
      _options[1]['description'].text = 'Split team: 70% refactor pipeline, 30% spin up standalone SSO service.';
      _options[1]['stakeholder_persona'].text = 'Principal Infrastructure Architect';
      _options[1]['stakeholder_critique'].text = 'Spinning up a one-off microservice while memory is already saturating creates another unmonitored dependency we have to support on-call. What is the fallback if the pipeline crashes?';
      _options[1]['trust'] = 20; _options[1]['velocity'] = 15; _options[1]['revenue'] = 30; _options[1]['risk'] = 10;

      _creatorRationaleController.text =
          'Isolating enterprise features outside of saturated monolithic infrastructure prevents compound technical debt while securing critical enterprise runway.';
      _seniorTipController.text = 'Never stop revenue completely for refactoring unless downtime is actively occurring.';
    } else if (index == 2) {
      // Sunset Legacy Reporting
      _titleController.text = 'Killing Legacy CSV Export Loved by 2% Power Users';
      _category = 'Customer & Churn';
      _seniorityTarget = 'Strategic PM';
      _promptController.text =
          'Our v1 CSV export consumes 60% of worker compute and blocks the release of our new real-time analytics pipeline. The 2% of users who rely on it generate 18% of total ARR and have threatened to churn if removed.';

      _options[0]['title'].text = 'Sunset with 60-day notice and dedicated migration support';
      _options[0]['description'].text = 'Draw a firm boundary to unblock the entire product roadmap, investing high-touch human support to retain ARR.';
      _options[0]['stakeholder_persona'].text = 'Director of Key Accounts';
      _options[0]['stakeholder_critique'].text = 'These 2% power users generate nearly a fifth of our ARR and have founder-level relationships. A 60-day notice will immediately trigger aggressive churn conversations.';
      _options[0]['trust'] = -10; _options[0]['velocity'] = 30; _options[0]['revenue'] = -5; _options[0]['risk'] = 10;

      _options[1]['title'].text = 'Keep feature active as an isolated paid add-on (\$500/mo legacy tier)';
      _options[1]['description'].text = 'Align compute costs directly with customer value. Filters out casual usage while funding dedicated infrastructure.';
      _options[1]['stakeholder_persona'].text = 'Lead Backend Engineer';
      _options[1]['stakeholder_critique'].text = 'Charging \$500/mo does not fix the compute lockup blocking our real-time streaming pipeline. My team is still stuck maintaining two divergent schemas.';
      _options[1]['trust'] = 15; _options[1]['velocity'] = 15; _options[1]['revenue'] = 20; _options[1]['risk'] = 5;

      _creatorRationaleController.text =
          'A legacy maintenance fee turns an expensive technical burden into an economically viable tier. It gives power users choice without forcing platform velocity to crawl.';
      _seniorTipController.text = 'When power users defend legacy workflows, price the complexity honestly before building workarounds.';
    } else if (index == 3) {
      // Pricing Grandfathering vs Margin
      _titleController.text = 'Pricing Grandfathering vs 50% Compute Surge';
      _category = 'Growth & Pricing';
      _seniorityTarget = 'Strategic PM';
      _promptController.text =
          'Our AI inference costs jumped 50%, putting free & grandfathered \$29/mo starter accounts into negative gross margins. Sales fears a community backlash if we force migrations to the new \$79/mo plan.';

      _options[0]['title'].text = 'Grandfather existing accounts indefinitely; apply pricing only to new signups';
      _options[0]['description'].text = 'Protect brand goodwill and word-of-mouth; absorb margin degradation as customer acquisition cost.';
      _options[0]['stakeholder_persona'].text = 'Chief Financial Officer (CFO)';
      _options[0]['stakeholder_critique'].text = 'If inference volume surges with our upcoming agent features, we are subsidizing legacy power users at a direct cash loss every month. How does the unit economics work?';
      _options[0]['trust'] = 30; _options[0]['velocity'] = 10; _options[0]['revenue'] = -20; _options[0]['risk'] = 25;

      _options[1]['title'].text = 'Introduce fair-use token caps on legacy plans; offer 40% upgrade discount';
      _options[1]['description'].text = 'Set hard limits on variable compute overhead. Give power users a clean transition path with subsidized first-year pricing.';
      _options[1]['stakeholder_persona'].text = 'Head of Community & Growth';
      _options[1]['stakeholder_critique'].text = 'Enforcing caps on early advocates will be seen as a bait-and-switch. Our viral Twitter word-of-mouth and public trust will take a direct hit.';
      _options[1]['trust'] = 10; _options[1]['velocity'] = 20; _options[1]['revenue'] = 25; _options[1]['risk'] = 5;

      _creatorRationaleController.text =
          'Never subsidize variable compute indefinitely under the illusion of goodwill. Enforcing fair-use limits protects solvency while respecting early believers.';
      _seniorTipController.text = 'Grandfather feature sets, never variable operational costs.';
    } else if (index == 4) {
      // AI Hallucination vs Customer Trust
      _titleController.text = 'AI Hallucination in Regulated Healthcare Workflow';
      _category = 'Cross-Functional Alignment';
      _seniorityTarget = 'Executive / Founder';
      _promptController.text =
          'Our new AI summarizer returned an inaccurate clinical compliance citation to a Tier-1 healthcare customer. Legal insists on pulling the feature immediately. Growth argues that 98% of users love it and weekly retention jumped 30%.';

      _options[0]['title'].text = 'Pull feature offline immediately until accuracy hits 99.9%';
      _options[0]['description'].text = 'Protect brand reputation and avoid enterprise litigation risk at all costs.';
      _options[0]['stakeholder_persona'].text = 'VP of Product Growth';
      _options[0]['stakeholder_critique'].text = 'Pulling the feature destroys our 30% weekly retention boost and surrenders the category to competitors who do not yank features over a single citation hiccup.';
      _options[0]['trust'] = 20; _options[0]['velocity'] = -30; _options[0]['revenue'] = -15; _options[0]['risk'] = -25;

      _options[1]['title'].text = 'Keep feature active with one-click source verification and doctor confirmation flow';
      _options[1]['description'].text = 'Retain high utility while adding human-in-the-loop validation for all regulated outputs.';
      _options[1]['stakeholder_persona'].text = 'General Counsel & Compliance Officer';
      _options[1]['stakeholder_critique'].text = 'Doctors click through confirmation dialogs without reading them. If a physician signs off on a hallucinated citation, our company is still named as primary defendant.';
      _options[1]['trust'] = 25; _options[1]['velocity'] = 15; _options[1]['revenue'] = 20; _options[1]['risk'] = 10;

      _creatorRationaleController.text =
          'In regulated environments, trust is asymmetrical. Turning black-box generation into verified citations keeps the product competitive without exposing users to catastrophic liability.';
      _seniorTipController.text = 'Never ship generative AI in high-stakes workflows without instant 1-click citation grounding.';
    }
    setState(() {});
  }

  void _addOption() {
    if (_options.length >= 4) return;
    HapticFeedback.lightImpact();
    setState(() {
      final nextChar = String.fromCharCode('a'.codeUnitAt(0) + _options.length);
      _options.add({
        'id': 'opt_$nextChar',
        'title': TextEditingController(text: ''),
        'description': TextEditingController(text: ''),
        'stakeholder_persona': TextEditingController(text: ''),
        'stakeholder_critique': TextEditingController(text: ''),
        'trust': 10,
        'velocity': 10,
        'revenue': 10,
        'risk': 0,
      });
    });
  }

  Future<void> _publishSimulation() async {
    final title = _titleController.text.trim();
    final prompt = _promptController.text.trim();

    if (title.isEmpty) {
      ToastService.show(context, 'Please enter a challenge title', isError: true);
      return;
    }
    if (prompt.isEmpty) {
      ToastService.show(context, 'Please describe the scenario context', isError: true);
      return;
    }

    for (int i = 0; i < _options.length; i++) {
      final t = (_options[i]['title'] as TextEditingController).text.trim();
      if (t.isEmpty) {
        ToastService.show(context, 'Please provide a title for Option ${String.fromCharCode(65 + i)}', isError: true);
        return;
      }
    }

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    if (_selectedRoomId == null && _userRooms.isEmpty) {
      ToastService.show(context, 'You need at least one Build Room to publish a challenge', isError: true);
      return;
    }

    final roomId = _selectedRoomId ?? _userRooms.first['id'];

    HapticFeedback.heavyImpact();
    setState(() => _isPublishing = true);

    try {
      final optionsPayload = _options.map((opt) {
        return {
          'id': opt['id'],
          'title': (opt['title'] as TextEditingController).text.trim(),
          'description': (opt['description'] as TextEditingController).text.trim(),
          'stakeholder_persona': (opt['stakeholder_persona'] as TextEditingController?)?.text.trim() ?? '',
          'stakeholder_critique': (opt['stakeholder_critique'] as TextEditingController?)?.text.trim() ?? '',
          'impact_metrics': {
            'trust': opt['trust'],
            'velocity': opt['velocity'],
            'revenue': opt['revenue'],
            'risk': opt['risk'],
          },
        };
      }).toList();

      final simulationData = {
        'scenario_title': title,
        'category': _category,
        'seniority_target': _seniorityTarget,
        'role_tag': _category,
        'context_prompt': prompt,
        'creator_role': _seniorityTarget,
        'creator_company': 'Patchwork',
        'options': optionsPayload,
        'creator_rationale': _creatorRationaleController.text.trim(),
        'senior_tip': _seniorTipController.text.trim(),
      };

      await Supabase.instance.client.from('updates').insert({
        'room_id': roomId,
        'author_id': userId,
        'content': 'Senior PM Dilemma: $title',
        'update_type': 'simulation',
        'simulation_data': simulationData,
      });

      // Award +100 reputation for creating a community challenge
      try {
        await Supabase.instance.client.from('reputation_events').insert({
          'user_id': userId,
          'action_type': 'created_simulation_challenge',
          'points': 100,
          'metadata': {'title': title},
        });
      } catch (_) {}

      if (mounted) {
        ToastService.show(context, 'Challenge published to Feed (+100 Rep)');
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isPublishing = false);
        ToastService.show(context, 'Failed to publish challenge: $e', isError: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text(
          'Drop a Simulation Challenge',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary),
        ),
        backgroundColor: context.themeColors.background,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: TextButton(
              onPressed: _isPublishing ? null : _publishSimulation,
              style: TextButton.styleFrom(
                backgroundColor: context.themeColors.primary500,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              ),
              child: _isPublishing
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Publish', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.preselectedRoomTitle != null) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.amber.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.gitCommit, size: 14, color: Colors.amber),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Converting Decision from: ${widget.preselectedRoomTitle}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Quick Template Starters
            Text(
              'QUICK TEMPLATES (1-TAP AUTOFILL)',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.themeColors.textTertiary, letterSpacing: 1.0),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildTemplateChip('Latency vs Fraud', () => _applyTemplate(0)),
                  const SizedBox(width: 8),
                  _buildTemplateChip('Refactor vs Sprint', () => _applyTemplate(1)),
                  const SizedBox(width: 8),
                  _buildTemplateChip('Legacy Sunset', () => _applyTemplate(2)),
                  const SizedBox(width: 8),
                  _buildTemplateChip('Pricing vs Margin', () => _applyTemplate(3)),
                  const SizedBox(width: 8),
                  _buildTemplateChip('AI Trust vs Legal', () => _applyTemplate(4)),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Category & Level pickers
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('DOMAIN / CATEGORY', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: _category,
                        dropdownColor: context.themeColors.surfaceHighlight,
                        style: TextStyle(fontSize: 12, color: context.themeColors.textPrimary),
                        decoration: _inputDecoration(),
                        items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12)))).toList(),
                        onChanged: (v) => setState(() => _category = v ?? _category),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('TARGET SENIORITY', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: _seniorityTarget,
                        dropdownColor: context.themeColors.surfaceHighlight,
                        style: TextStyle(fontSize: 12, color: context.themeColors.textPrimary),
                        decoration: _inputDecoration(),
                        items: _seniorityLevels.map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 12)))).toList(),
                        onChanged: (v) => setState(() => _seniorityTarget = v ?? _seniorityTarget),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Title
            Text('CHALLENGE TITLE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
            const SizedBox(height: 6),
            TextField(
              controller: _titleController,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary),
              decoration: _inputDecoration(hint: 'e.g. Stripe Checkout: Latency Spike vs Anti-Fraud Defense'),
            ),

            const SizedBox(height: 16),

            // Scenario Prompt
            Text('THE SITUATION & TENSION (CONTEXT)', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
            const SizedBox(height: 6),
            TextField(
              controller: _promptController,
              maxLines: 4,
              style: TextStyle(fontSize: 12.5, color: context.themeColors.textPrimary),
              decoration: _inputDecoration(hint: 'Describe the dilemma: What happened? What are the opposing forces (e.g. Sales vs Eng)? What is at stake?'),
            ),

            const SizedBox(height: 24),

            // Strategic Options Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('STRATEGIC PATHS (TRADE-OFFS)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.themeColors.textTertiary, letterSpacing: 1.0)),
                if (_options.length < 4)
                  TextButton.icon(
                    onPressed: _addOption,
                    icon: Icon(LucideIcons.plus, size: 13, color: context.themeColors.primary500),
                    label: Text('Add Path', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.primary500)),
                  ),
              ],
            ),

            ..._options.asMap().entries.map((entry) {
              final idx = entry.key;
              final opt = entry.value;
              final letter = String.fromCharCode(65 + idx);

              return Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: context.themeColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: context.themeColors.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('PATH $letter', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: context.themeColors.primary500)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: opt['title'] as TextEditingController,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.themeColors.textPrimary),
                      decoration: _inputDecoration(hint: 'Action title (e.g. Rollback immediately)'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: opt['description'] as TextEditingController,
                      maxLines: 2,
                      style: TextStyle(fontSize: 11.5, color: context.themeColors.textSecondary),
                      decoration: _inputDecoration(hint: 'Trade-off rationale & consequences'),
                    ),
                    const SizedBox(height: 10),
                    Text('STAKEHOLDER CONFRONTATION (OPTIONAL)',
                        style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: opt['stakeholder_persona'] as TextEditingController?,
                      style: TextStyle(fontSize: 11, color: context.themeColors.textPrimary),
                      decoration: _inputDecoration(hint: 'Stakeholder persona (e.g. Lead Architect, CISO, Sales VP)'),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: opt['stakeholder_critique'] as TextEditingController?,
                      maxLines: 2,
                      style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary),
                      decoration: _inputDecoration(hint: 'Their pushback: What tough question will they confront the PM with?'),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 16),

            // Senior Creator Takeaway
            Text('YOUR STRATEGIC RECOMMENDATION (REVEALED AFTER VOTE)', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
            const SizedBox(height: 6),
            TextField(
              controller: _creatorRationaleController,
              maxLines: 2,
              style: TextStyle(fontSize: 12, color: context.themeColors.textPrimary),
              decoration: _inputDecoration(hint: 'How would you navigate this? What is the core lesson?'),
            ),

            const SizedBox(height: 12),

            // Pro Tip
            Text('PRO TIP / HEURISTIC (OPTIONAL)', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary)),
            const SizedBox(height: 6),
            TextField(
              controller: _seniorTipController,
              style: TextStyle(fontSize: 12, color: context.themeColors.textPrimary),
              decoration: _inputDecoration(hint: 'e.g. Never treat security and conversion as a zero-sum game.'),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildTemplateChip(String label, VoidCallback onTap) {
    return ActionChip(
      onPressed: onTap,
      label: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
      backgroundColor: context.themeColors.surfaceHighlight,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: context.themeColors.borderSubtle),
      ),
    );
  }

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(fontSize: 11.5, color: context.themeColors.textTertiary),
      filled: true,
      fillColor: context.themeColors.surfaceHighlight.withOpacity(0.5),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.borderSubtle)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.borderSubtle)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.primary500)),
    );
  }
}
