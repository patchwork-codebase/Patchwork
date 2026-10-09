import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';
import 'builder_radar_chart.dart';
import 'builder_card_dialog.dart';
import '../screens/credential_viewer_screen.dart';

class ProofOfWorkLedger extends StatefulWidget {
  final String userId;
  final bool isOwnProfile;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final EdgeInsetsGeometry? padding;
  final bool? primary;
  final ScrollController? controller;

  const ProofOfWorkLedger({
    super.key,
    required this.userId,
    required this.isOwnProfile,
    this.shrinkWrap = false,
    this.physics,
    this.padding,
    this.primary,
    this.controller,
  });

  @override
  State<ProofOfWorkLedger> createState() => _ProofOfWorkLedgerState();
}

class _ProofOfWorkLedgerState extends State<ProofOfWorkLedger> {
  bool _isLoading = true;
  String _selectedFilter = 'all'; // 'all', 'dilemmas', 'room_decisions', 'credentials', 'endorsed'
  Map<String, dynamic>? _userDoc;

  List<Map<String, dynamic>> _simResponses = [];
  Map<String, Map<String, dynamic>> _updatesMap = {};
  List<Map<String, dynamic>> _roomDecisions = [];
  List<Map<String, dynamic>> _userBadges = [];

  // 6-Axis capability values
  double _strategy = 30.0;
  double _feasibility = 30.0;
  double _velocity = 30.0;
  double _empathy = 30.0;
  double _analytics = 30.0;
  double _governance = 30.0;

  int _endorsedCount = 0;
  String _superpower = 'Product Strategy';

  @override
  void initState() {
    super.initState();
    _loadProofOfWorkData();
  }

  Future<void> _loadProofOfWorkData() async {
    setState(() => _isLoading = true);
    final client = Supabase.instance.client;

    try {
      // 0. Fetch user identity for export card
      Map<String, dynamic>? userDoc;
      try {
        userDoc = await client
            .from('users')
            .select('name, avatar, seniority, organization_name, reputation')
            .eq('id', widget.userId)
            .maybeSingle();
      } catch (_) {}

      if (userDoc == null && widget.isOwnProfile) {
        final currentUser = client.auth.currentUser;
        if (currentUser != null) {
          userDoc = {
            'name': currentUser.userMetadata?['name'] ?? currentUser.userMetadata?['full_name'] ?? 'Product Builder',
            'avatar': currentUser.userMetadata?['avatar'] ?? currentUser.userMetadata?['avatar_url'],
            'seniority': currentUser.userMetadata?['seniority'] ?? 'Senior PM',
            'organization_name': currentUser.userMetadata?['organization_name'] ?? '',
            'reputation': 100,
          };
        }
      }

      if (userDoc != null) {
        final rawAvatar = userDoc['avatar']?.toString();
        if (rawAvatar != null && rawAvatar.contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg')) {
          userDoc['avatar'] = 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg';
        }
      }

      // 1. Fetch simulation responses
      final responsesRes = await client
          .from('simulation_responses')
          .select('*')
          .eq('user_id', widget.userId)
          .order('created_at', ascending: false);

      final List<Map<String, dynamic>> rawResponses =
          List<Map<String, dynamic>>.from(responsesRes);

      // 2. Fetch corresponding updates for simulation context
      final Map<String, Map<String, dynamic>> updatesMap = {};
      final updateIds = rawResponses
          .map((r) => r['update_id']?.toString())
          .where((id) => id != null && id.isNotEmpty)
          .toSet()
          .toList();

      if (updateIds.isNotEmpty) {
        try {
          final updatesRes = await client
              .from('updates')
              .select('id, author_id, author_name, simulation_data, users(name, avatar)')
              .inFilter('id', updateIds);
          for (final u in (updatesRes as List)) {
            updatesMap[u['id'].toString()] = Map<String, dynamic>.from(u);
          }
        } catch (_) {}
      }

      // 3. Fetch room decisions logged
      List<Map<String, dynamic>> rawDecisions = [];
      try {
        final decRes = await client
            .from('room_decisions')
            .select('*, rooms(title)')
            .eq('builder_id', widget.userId)
            .order('created_at', ascending: false);
        rawDecisions = List<Map<String, dynamic>>.from(decRes);
      } catch (_) {}

      // 4. Fetch verified credentials/badges (filter out level badges per gamification rules)
      List<Map<String, dynamic>> rawBadges = [];
      try {
        final badgesRes = await client
            .from('user_badges')
            .select('id, issued_at, badges!inner(id, title, description, icon_name, color_theme, badge_type)')
            .eq('user_id', widget.userId)
            .neq('badges.badge_type', 'level')
            .order('issued_at', ascending: false);
        rawBadges = List<Map<String, dynamic>>.from(badgesRes);
      } catch (_) {}

      // 5. Compute 6-Axis Capability Radar
      _computeCapabilityRadar(rawResponses, updatesMap, rawDecisions);

      if (mounted) {
        setState(() {
          _userDoc = userDoc;
          _simResponses = rawResponses;
          _updatesMap = updatesMap;
          _roomDecisions = rawDecisions;
          _userBadges = rawBadges;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _computeCapabilityRadar(
    List<Map<String, dynamic>> responses,
    Map<String, Map<String, dynamic>> updates,
    List<Map<String, dynamic>> decisions,
  ) {
    double strat = 32.0;
    double feas = 28.0;
    double vel = 30.0;
    double emp = 28.0;
    double anal = 26.0;
    double gov = 28.0;
    int endorsed = 0;

    for (final r in responses) {
      final isFeatured = r['is_featured'] == true;
      if (isFeatured) endorsed++;

      final u = updates[r['update_id']?.toString()];
      final simData = u?['simulation_data'] as Map<String, dynamic>? ?? {};
      final roleTag = (simData['role_tag'] ?? simData['category'] ?? '').toString().toLowerCase();

      // Find chosen option impact metrics
      final chosenId = r['selected_option_id']?.toString() ?? '';
      final options = (simData['options'] as List?) ?? [];
      final chosenOpt = options.firstWhere(
        (o) => o['id']?.toString() == chosenId,
        orElse: () => null,
      );

      final impact = (chosenOpt != null ? chosenOpt['impact_metrics'] : null) as Map<String, dynamic>? ?? {};
      final int trust = (impact['trust'] as num?)?.toInt() ?? 0;
      final int velocity = (impact['velocity'] as num?)?.toInt() ?? 0;
      final int risk = (impact['risk'] as num?)?.toInt() ?? 0;

      // Score deltas
      strat += 6.0 + (isFeatured ? 14.0 : 0.0);
      if (trust > 0) emp += 8.0 + (isFeatured ? 10.0 : 0.0);
      if (velocity > 0) vel += 8.0 + (isFeatured ? 10.0 : 0.0);
      if (risk < 0 || roleTag.contains('risk') || roleTag.contains('security')) {
        gov += 9.0 + (isFeatured ? 10.0 : 0.0);
      }
      if (roleTag.contains('tech') || roleTag.contains('arch') || roleTag.contains('infra')) {
        feas += 10.0 + (isFeatured ? 12.0 : 0.0);
      }
      if (roleTag.contains('data') || roleTag.contains('analytic') || roleTag.contains('growth')) {
        anal += 10.0 + (isFeatured ? 12.0 : 0.0);
      }
    }

    for (final d in decisions) {
      final type = d['type']?.toString().toLowerCase() ?? 'decision';
      strat += 4.0;
      if (type == 'shipped') {
        vel += 8.0;
        strat += 4.0;
      } else if (type == 'blocker') {
        feas += 6.0;
        gov += 6.0;
      } else if (type == 'scrapped') {
        gov += 8.0;
        strat += 5.0;
      } else {
        feas += 5.0;
        emp += 4.0;
      }
    }

    _strategy = strat.clamp(25.0, 96.0);
    _feasibility = feas.clamp(25.0, 96.0);
    _velocity = vel.clamp(25.0, 96.0);
    _empathy = emp.clamp(25.0, 96.0);
    _analytics = anal.clamp(25.0, 96.0);
    _governance = gov.clamp(25.0, 96.0);
    _endorsedCount = endorsed;

    // Determine highest axis
    final scores = {
      'Product Strategy': _strategy,
      'Technical Feasibility': _feasibility,
      'Execution Velocity': _velocity,
      'Stakeholder Empathy': _empathy,
      'Data & Analytics': _analytics,
      'Risk & Governance': _governance,
    };
    final sorted = scores.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    _superpower = sorted.first.key;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40.0),
          child: CircularProgressIndicator(color: context.themeColors.primary500),
        ),
      );
    }

    final totalDilemmas = _simResponses.length;
    final totalDecisions = _roomDecisions.length;
    final totalCredentials = _userBadges.length;
    final totalPowPoints = (totalDilemmas * 50) + (_endorsedCount * 100) + (totalDecisions * 25) + (totalCredentials * 150);

    final radarAxes = [
      RadarAxisData(label: 'Strategy', key: 'strat', value: _strategy, icon: LucideIcons.compass),
      RadarAxisData(label: 'Technical', key: 'tech', value: _feasibility, icon: LucideIcons.cpu),
      RadarAxisData(label: 'Velocity', key: 'vel', value: _velocity, icon: LucideIcons.zap),
      RadarAxisData(label: 'Empathy', key: 'emp', value: _empathy, icon: LucideIcons.heartHandshake),
      RadarAxisData(label: 'Analytics', key: 'anal', value: _analytics, icon: LucideIcons.barChart2),
      RadarAxisData(label: 'Governance', key: 'gov', value: _governance, icon: LucideIcons.shieldCheck),
    ];

    // Build unified chronological item list based on filter
    final combinedItems = <Map<String, dynamic>>[];

    if (_selectedFilter == 'all' || _selectedFilter == 'dilemmas' || _selectedFilter == 'endorsed') {
      for (final r in _simResponses) {
        if (_selectedFilter == 'endorsed' && r['is_featured'] != true) continue;
        combinedItems.add({
          'kind': 'dilemma',
          'response': r,
          'update': _updatesMap[r['update_id']?.toString()],
          'date': DateTime.tryParse(r['created_at']?.toString() ?? '') ?? DateTime.now(),
        });
      }
    }

    if (_selectedFilter == 'all' || _selectedFilter == 'room_decisions') {
      for (final d in _roomDecisions) {
        combinedItems.add({
          'kind': 'decision',
          'decision': d,
          'date': DateTime.tryParse(d['created_at']?.toString() ?? '') ?? DateTime.now(),
        });
      }
    }

    if (_selectedFilter == 'all' || _selectedFilter == 'credentials') {
      for (final b in _userBadges) {
        combinedItems.add({
          'kind': 'credential',
          'badge': b,
          'date': DateTime.tryParse(b['issued_at']?.toString() ?? '') ?? DateTime.now(),
        });
      }
    }

    combinedItems.sort((a, b) => (b['date'] as DateTime).compareTo(a['date'] as DateTime));

    return ListView(
      primary: widget.primary ?? false,
      controller: widget.controller,
      shrinkWrap: widget.shrinkWrap,
      physics: widget.physics,
      padding: widget.padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      children: [
        // ── 1. Proof of Work Header Bento Card ──────────────────────────────
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                context.themeColors.surface,
                context.themeColors.surfaceHighlight.withOpacity(0.6),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.themeColors.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Living Proof of Work',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                            color: context.themeColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Verified decisions & endorsements',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: context.themeColors.textTertiary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.amber.withOpacity(0.35)),
                    ),
                    child: Text(
                      '$totalPowPoints PoW Pts',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.3,
                        color: Colors.amber,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Bento metrics row
              Row(
                children: [
                  _buildBentoMetric(
                    context,
                    label: 'Dilemmas Solved',
                    value: '$totalDilemmas',
                    color: context.themeColors.primary500,
                  ),
                  const SizedBox(width: 8),
                  _buildBentoMetric(
                    context,
                    label: 'Senior Endorsed',
                    value: '$_endorsedCount',
                    color: Colors.amber,
                    isHighlight: _endorsedCount > 0,
                  ),
                  const SizedBox(width: 8),
                  _buildBentoMetric(
                    context,
                    label: 'Verified Awards',
                    value: '$totalCredentials',
                    color: const Color(0xFF10B981),
                  ),
                  const SizedBox(width: 8),
                  _buildBentoMetric(
                    context,
                    label: 'Room Decisions',
                    value: '$totalDecisions',
                    color: Colors.cyanAccent,
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Superpower pill
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: context.themeColors.surfaceHighlight.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: context.themeColors.borderSubtle),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: context.themeColors.primary400,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Primary Competency: ',
                      style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary),
                    ),
                    Text(
                      _superpower,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: context.themeColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    BuilderCardDialog.show(
                      context,
                      mode: BuilderCardMode.global,
                      name: _userDoc?['name']?.toString() ?? 'Product Builder',
                      avatar: (_userDoc?['avatar'] != null && !_userDoc!['avatar'].toString().contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg'))
                          ? _userDoc!['avatar'].toString()
                          : 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg',
                      seniority: _userDoc?['seniority']?.toString() ?? 'Senior PM',
                      organization: _userDoc?['organization_name']?.toString() ?? '',
                      reputationPoints: (_userDoc?['reputation'] as num?)?.toInt() ?? totalPowPoints,
                      capabilityMetrics: {
                        'Strategy': _strategy.toInt(),
                        'Feasibility': _feasibility.toInt(),
                        'Velocity': _velocity.toInt(),
                        'Empathy': _empathy.toInt(),
                        'Analytics': _analytics.toInt(),
                        'Governance': _governance.toInt(),
                      },
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: context.themeColors.primary500,
                    side: BorderSide(color: context.themeColors.primary500.withOpacity(0.4)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 11),
                  ),
                  child: const Text(
                    'Export Builder Card & Share PoW ↗',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // ── 2. 6-Axis Capability Radar Card ─────────────────────────────────
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: context.themeColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.themeColors.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Builder Capability Radar',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.2,
                      color: context.themeColors.textPrimary,
                    ),
                  ),
                  Text(
                    '6 Dimensions',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: context.themeColors.textTertiary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Dynamic index computed from real trade-offs and peer validations.',
                style: TextStyle(fontSize: 11.5, color: context.themeColors.textTertiary),
              ),
              const SizedBox(height: 16),

              // Center radar visualizer
              Center(
                child: BuilderRadarChart(
                  axes: radarAxes,
                  size: 260,
                  accentColor: context.themeColors.primary500,
                ),
              ),
              const SizedBox(height: 14),

              // Axis breakdown chips
              Wrap(
                spacing: 6,
                runSpacing: 6,
                alignment: WrapAlignment.center,
                children: radarAxes.map((axis) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: context.themeColors.surfaceHighlight.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: context.themeColors.borderSubtle),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${axis.label}: ',
                          style: TextStyle(fontSize: 11, color: context.themeColors.textSecondary),
                        ),
                        Text(
                          '${axis.value.round()}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: context.themeColors.primary400,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // ── 3. Filter Pills Bar ─────────────────────────────────────────────
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterPill('all', 'All Activity (${combinedItems.length})'),
              const SizedBox(width: 6),
              _buildFilterPill('dilemmas', 'Dilemmas ($totalDilemmas)'),
              const SizedBox(width: 6),
              _buildFilterPill('room_decisions', 'Decisions ($totalDecisions)'),
              if (totalCredentials > 0) ...[
                const SizedBox(width: 6),
                _buildFilterPill('credentials', 'Awards ($totalCredentials)'),
              ],
              if (_endorsedCount > 0) ...[
                const SizedBox(width: 6),
                _buildFilterPill('endorsed', 'Featured ($_endorsedCount)'),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),

        // ── 4. Chronological Ledger Items ───────────────────────────────────
        if (combinedItems.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
            decoration: BoxDecoration(
              color: context.themeColors.surface.withOpacity(0.4),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Column(
              children: [
                Icon(LucideIcons.compass, size: 36, color: context.themeColors.textTertiary),
                const SizedBox(height: 12),
                Text(
                  widget.isOwnProfile ? 'No Proof of Work yet' : 'No public decisions yet',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: context.themeColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.isOwnProfile
                      ? 'Tackle simulation challenges in the feed or log decisions in your project rooms to establish your verifiable capability index.'
                      : 'This builder has not completed feed simulations or logged decisions yet.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary, height: 1.4),
                ),
              ],
            ),
          )
        else
          ...combinedItems.map((item) {
            if (item['kind'] == 'dilemma') {
              return _buildDilemmaLedgerCard(item['response'], item['update']);
            } else if (item['kind'] == 'credential') {
              return _buildCredentialLedgerCard(item['badge']);
            } else {
              return _buildDecisionLedgerCard(item['decision']);
            }
          }),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildBentoMetric(
    BuildContext context, {
    required String label,
    required String value,
    required Color color,
    bool isHighlight = false,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: isHighlight ? color.withOpacity(0.08) : context.themeColors.surfaceHighlight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isHighlight ? color.withOpacity(0.35) : context.themeColors.borderSubtle,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: isHighlight ? color : context.themeColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: context.themeColors.textSecondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterPill(String key, String label) {
    final isSelected = _selectedFilter == key;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? context.themeColors.primary500 : context.themeColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? context.themeColors.primary500 : context.themeColors.borderSubtle,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : context.themeColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildDilemmaLedgerCard(Map<String, dynamic> response, Map<String, dynamic>? update) {
    final simData = update?['simulation_data'] as Map<String, dynamic>? ?? {};
    final title = simData['scenario_title'] ?? 'Strategic Simulation';
    final roleTag = simData['role_tag'] ?? simData['category'] ?? 'Strategy';
    final authorName = update?['author_name'] ?? 'Senior Lead';
    final isFeatured = response['is_featured'] == true;
    final rationale = response['rationale']?.toString() ?? '';
    final createdAt = DateTime.tryParse(response['created_at']?.toString() ?? '') ?? DateTime.now();

    final chosenId = response['selected_option_id']?.toString() ?? '';
    final options = (simData['options'] as List?) ?? [];
    final chosenOpt = options.firstWhere(
      (o) => o['id']?.toString() == chosenId,
      orElse: () => {'title': chosenId, 'label': 'Option $chosenId'},
    );
    final chosenLabel = chosenOpt['title'] ?? chosenOpt['label'] ?? chosenId;
    final stakeholder = _getStakeholderForOption(chosenOpt, simData);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isFeatured ? Colors.amber.withOpacity(0.4) : context.themeColors.borderSubtle,
          width: isFeatured ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: context.themeColors.primary500.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  roleTag.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                    color: context.themeColors.primary500,
                  ),
                ),
              ),
              const Spacer(),
              if (isFeatured)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.amber.withOpacity(0.4)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.star, size: 10, color: Colors.amber),
                      SizedBox(width: 3),
                      Text(
                        'FEATURED STRATEGIC THINKING',
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w900, color: Colors.amber),
                      ),
                    ],
                  ),
                )
              else
                Text(
                  timeago.format(createdAt, locale: 'en_short'),
                  style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.bold,
              color: context.themeColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Challenge by $authorName',
            style: TextStyle(fontSize: 11.5, color: context.themeColors.textSecondary),
          ),
          const SizedBox(height: 12),

          // Chosen path banner
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight.withOpacity(0.5),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: context.themeColors.borderSubtle),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(LucideIcons.checkCircle2, size: 14, color: Colors.greenAccent),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Chosen Path:',
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.bold,
                          color: context.themeColors.textTertiary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        chosenLabel,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: context.themeColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Stakeholder Pushback Callout
          Container(
            margin: const EdgeInsets.only(top: 10),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight.withOpacity(0.35),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: context.themeColors.borderSubtle.withOpacity(0.6)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.userCheck, size: 12, color: context.themeColors.primary400),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        stakeholder['persona'] ?? 'Stakeholder Pushback',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: context.themeColors.primary400,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  stakeholder['critique'] ?? '',
                  style: TextStyle(
                    fontSize: 11,
                    color: context.themeColors.textSecondary,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),

          if (rationale.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              'Strategic Defense / Rationale:',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.bold,
                color: context.themeColors.textTertiary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '"$rationale"',
              style: TextStyle(
                fontSize: 11.5,
                fontStyle: FontStyle.italic,
                color: context.themeColors.textSecondary,
                height: 1.4,
              ),
            ),
          ],
          const SizedBox(height: 14),

          // Action row: Share Battle Card
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (isFeatured)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.amber.withOpacity(0.3)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.star, size: 10, color: Colors.amber),
                      SizedBox(width: 4),
                      Text(
                        '+100 Rep Endorsement',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber,
                        ),
                      ),
                    ],
                  ),
                )
              else
                Text(
                  timeago.format(createdAt, locale: 'en_short'),
                  style: TextStyle(fontSize: 11.5, color: context.themeColors.textTertiary),
                ),
              TextButton(
                onPressed: () {
                  BuilderCardDialog.show(
                    context,
                    mode: BuilderCardMode.battle,
                    name: _userDoc?['name']?.toString() ?? 'Product Builder',
                    avatar: (_userDoc?['avatar'] != null && !_userDoc!['avatar'].toString().contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg'))
                        ? _userDoc!['avatar'].toString()
                        : 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg',
                    seniority: _userDoc?['seniority']?.toString() ?? 'Senior PM',
                    organization: _userDoc?['organization_name']?.toString() ?? '',
                    reputationPoints: (_userDoc?['reputation'] as num?)?.toInt() ?? 100,
                    challengeTitle: title,
                    chosenOptionTitle: chosenLabel,
                    stakeholderPersona: stakeholder['persona'],
                    stakeholderCritique: stakeholder['critique'],
                    defenseRationale: rationale,
                    isEndorsed: isFeatured,
                  );
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  backgroundColor: const Color(0xFF10B981).withOpacity(0.08),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: const Color(0xFF10B981).withOpacity(0.3)),
                  ),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Share Battle Card ↗',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF10B981),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDecisionLedgerCard(Map<String, dynamic> decision) {
    final title = decision['title'] ?? 'Untitled Decision';
    final desc = decision['description']?.toString() ?? '';
    final type = decision['type']?.toString().toUpperCase() ?? 'DECISION';
    final room = decision['rooms'] as Map<String, dynamic>? ?? {};
    final roomTitle = room['title'] ?? 'Project Room';
    final createdAt = DateTime.tryParse(decision['created_at']?.toString() ?? '') ?? DateTime.now();

    Color typeColor = context.themeColors.primary500;
    IconData typeIcon = LucideIcons.gitCommit;
    if (type == 'SHIPPED') {
      typeColor = Colors.greenAccent;
      typeIcon = LucideIcons.rocket;
    } else if (type == 'BLOCKER') {
      typeColor = Colors.redAccent;
      typeIcon = LucideIcons.alertTriangle;
    } else if (type == 'SCRAPPED') {
      typeColor = Colors.orangeAccent;
      typeIcon = LucideIcons.archive;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: typeColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(typeIcon, size: 10, color: typeColor),
                    const SizedBox(width: 4),
                    Text(
                      type,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: typeColor,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Text(
                timeago.format(createdAt, locale: 'en_short'),
                style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.bold,
              color: context.themeColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Room: $roomTitle',
            style: TextStyle(fontSize: 11.5, color: context.themeColors.textSecondary),
          ),
          if (desc.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              desc,
              style: TextStyle(
                fontSize: 11.5,
                color: context.themeColors.textSecondary,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCredentialLedgerCard(Map<String, dynamic> userBadge) {
    final badge = userBadge['badges'] as Map<String, dynamic>? ?? {};
    final title = badge['title'] ?? 'Verified Credential';
    final desc = badge['description'] ?? 'Verified achievement on Patchwork';
    final iconName = badge['icon_name']?.toString();
    final colorTheme = badge['color_theme']?.toString();
    final issuedAt = DateTime.tryParse(userBadge['issued_at']?.toString() ?? '') ?? DateTime.now();

    Color accentColor = const Color(0xFF10B981);
    if (colorTheme == 'gold' || colorTheme == 'amber') {
      accentColor = Colors.amber;
    } else if (colorTheme == 'purple') {
      accentColor = Colors.purpleAccent;
    } else if (colorTheme == 'cyan') {
      accentColor = Colors.cyanAccent;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accentColor.withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_getBadgeIcon(iconName), size: 11, color: accentColor),
                    const SizedBox(width: 4),
                    Text(
                      'VERIFIED CREDENTIAL',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: accentColor,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Text(
                timeago.format(issuedAt, locale: 'en_short'),
                style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: context.themeColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: TextStyle(
              fontSize: 11.5,
              color: context.themeColors.textSecondary,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => CredentialViewerScreen(
                      credentialId: userBadge['id'].toString(),
                      title: title,
                    ),
                  ),
                );
              },
              icon: Icon(LucideIcons.externalLink, size: 12, color: accentColor),
              label: Text(
                'View Credential ↗',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: accentColor,
                ),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                backgroundColor: accentColor.withOpacity(0.08),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(color: accentColor.withOpacity(0.3)),
                ),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getBadgeIcon(String? iconName) {
    if (iconName == null) return LucideIcons.award;
    switch (iconName.toLowerCase()) {
      case 'rocket': return LucideIcons.rocket;
      case 'truck':
      case 'shipped!': return LucideIcons.truck;
      case 'star': return LucideIcons.star;
      case 'fire':
      case 'flame': return LucideIcons.flame;
      case 'crown': return LucideIcons.crown;
      case 'shield': return LucideIcons.shield;
      case 'zap': return LucideIcons.zap;
      case 'compass': return LucideIcons.compass;
      case 'code': return LucideIcons.code;
      default: return LucideIcons.award;
    }
  }

  Map<String, String> _getStakeholderForOption(Map<String, dynamic>? chosenOpt, Map<String, dynamic> simData) {
    if (chosenOpt == null) {
      return {'persona': 'Lead Stakeholder', 'critique': 'How do you defend this strategic trade-off?'};
    }
    final p = chosenOpt['stakeholder_persona']?.toString().trim();
    final c = chosenOpt['stakeholder_critique']?.toString().trim();
    if (p != null && p.isNotEmpty && c != null && c.isNotEmpty) {
      return {'persona': p, 'critique': c};
    }
    final metrics = (chosenOpt['impact_metrics'] as Map<String, dynamic>?) ?? {};
    final risk = (metrics['risk'] as num?)?.toInt() ?? 0;
    final velocity = (metrics['velocity'] as num?)?.toInt() ?? 0;
    final trust = (metrics['trust'] as num?)?.toInt() ?? 0;

    if (risk > 15) {
      return {
        'persona': 'Chief Information Security Officer (CISO)',
        'critique': 'This move sharply elevates our operational and security attack surface. Who bears responsibility if an exploit compromises customer data?',
      };
    } else if (velocity < -10) {
      return {
        'persona': 'VP of Global Sales',
        'critique': 'Slowing down delivery here directly imperils our committed deal pipeline. How will we keep our largest enterprise renewals from churning?',
      };
    } else if (trust < 0) {
      return {
        'persona': 'Head of Customer Success',
        'critique': 'This path degrades user trust and forces users into disruptive workflow changes. How are we preventing severe community backlash?',
      };
    } else {
      return {
        'persona': 'Principal Infrastructure Architect',
        'critique': 'This approach adds friction to our underlying engineering roadmap. How do we ensure this doesn\'t devolve into compounding technical debt?',
      };
    }
  }
}
