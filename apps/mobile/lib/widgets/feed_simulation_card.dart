import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';
import '../widgets/toast_notification.dart';
import '../screens/public_profile_screen.dart';
import 'builder_card_dialog.dart';

class FeedSimulationCard extends StatefulWidget {
  final Map<String, dynamic> update;
  final VoidCallback? onRefresh;

  const FeedSimulationCard({
    super.key,
    required this.update,
    this.onRefresh,
  });

  @override
  State<FeedSimulationCard> createState() => _FeedSimulationCardState();
}

class _FeedSimulationCardState extends State<FeedSimulationCard> {
  String? _selectedOptionId;
  final TextEditingController _rationaleController = TextEditingController();
  bool _isSubmitting = false;
  bool _hasUserResponded = false;
  String? _userChosenOptionId;
  String? _userRationale;
  bool _showCreatorTake = false;

  // Responses breakdown
  List<Map<String, dynamic>> _responses = [];
  Map<String, int> _optionCounts = {};
  int _totalResponses = 0;
  RealtimeChannel? _responsesChannel;

  final List<String> _selectedDefenseTags = [];
  final Set<String> _bookmarkedCandidateIds = {};
  static const List<String> _kDefenseTactics = [
    'Phased Rollout',
    'Grandfather Contracts',
    'Accept Tech Debt',
    'Executive Waiver',
    'Data Guardrail',
    'SLA Exemption',
  ];

  Map<String, dynamic> get _simData {
    final raw = widget.update['simulation_data'];
    if (raw is Map<String, dynamic>) return raw;
    if (raw is Map) return Map<String, dynamic>.from(raw);
    return {};
  }

  List<dynamic> get _options {
    final opts = _simData['options'];
    if (opts is List) return opts;
    return [];
  }

  int _currentStep = 1;

  Map<String, String> _getStakeholderForOption(String? optId) {
    if (optId == null) {
      return {'persona': 'Lead Stakeholder', 'critique': 'How do you defend this strategic trade-off?'};
    }
    final opt = _options.firstWhere(
      (o) => o['id']?.toString() == optId,
      orElse: () => null,
    );
    if (opt == null) {
      return {'persona': 'Lead Stakeholder', 'critique': 'How do you defend this strategic trade-off?'};
    }

    final p = opt['stakeholder_persona']?.toString().trim();
    final c = opt['stakeholder_critique']?.toString().trim();
    if (p != null && p.isNotEmpty && c != null && c.isNotEmpty) {
      return {'persona': p, 'critique': c};
    }

    final metrics = (opt['impact_metrics'] as Map<String, dynamic>?) ?? {};
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

  @override
  void initState() {
    super.initState();
    _checkExistingResponse();
    _fetchResponses();
    _setupRealtime();
  }

  @override
  void dispose() {
    _responsesChannel?.unsubscribe();
    _rationaleController.dispose();
    super.dispose();
  }

  void _setupRealtime() {
    final updateId = widget.update['id'];
    if (updateId == null) return;

    _responsesChannel = Supabase.instance.client
        .channel('public:simulation_responses:$updateId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'simulation_responses',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'update_id',
            value: updateId,
          ),
          callback: (payload) {
            _fetchResponses();
          },
        )
        .subscribe();
  }

  Future<void> _checkExistingResponse() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    final updateId = widget.update['id'];
    if (userId == null || updateId == null) return;

    try {
      final res = await Supabase.instance.client
          .from('simulation_responses')
          .select('*')
          .eq('update_id', updateId)
          .eq('user_id', userId)
          .maybeSingle();

      if (mounted && res != null) {
        setState(() {
          _hasUserResponded = true;
          _userChosenOptionId = res['selected_option_id']?.toString();
          _userRationale = res['rationale']?.toString();
          _selectedOptionId = _userChosenOptionId;
          _showCreatorTake = true;
          _currentStep = 3;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchResponses() async {
    final updateId = widget.update['id'];
    if (updateId == null) return;

    try {
      final res = await Supabase.instance.client
          .from('simulation_responses')
          .select('*, users(name, avatar, seniority, specialisation)')
          .eq('update_id', updateId);

      final list = List<Map<String, dynamic>>.from(res);
      final counts = <String, int>{};
      for (final r in list) {
        final optId = r['selected_option_id']?.toString() ?? '';
        counts[optId] = (counts[optId] ?? 0) + 1;
      }

      if (mounted) {
        setState(() {
          _responses = list;
          _optionCounts = counts;
          _totalResponses = list.length;
        });
      }
    } catch (_) {}
  }

  Future<void> _submitDecision({bool includeDefense = true}) async {
    if (_selectedOptionId == null || _isSubmitting) return;

    final userId = Supabase.instance.client.auth.currentUser?.id;
    final updateId = widget.update['id'];
    if (userId == null || updateId == null) return;

    HapticFeedback.heavyImpact();
    setState(() => _isSubmitting = true);

    try {
      String finalRationale = '';
      if (includeDefense) {
        final typedText = _rationaleController.text.trim();
        final tagText = _selectedDefenseTags.isNotEmpty
            ? '[${_selectedDefenseTags.join(', ')}]'
            : '';
        if (tagText.isNotEmpty && typedText.isNotEmpty) {
          finalRationale = '$tagText $typedText';
        } else if (tagText.isNotEmpty) {
          finalRationale = tagText;
        } else {
          finalRationale = typedText;
        }
      }

      final hasDefense = finalRationale.isNotEmpty;
      final points = hasDefense ? 75 : 50;
      final actionType = hasDefense ? 'simulation_defense_submitted' : 'simulation_choice_submitted';

      await Supabase.instance.client.from('simulation_responses').insert({
        'update_id': updateId,
        'user_id': userId,
        'selected_option_id': _selectedOptionId,
        'rationale': finalRationale,
      });

      try {
        await Supabase.instance.client.from('reputation_events').insert({
          'user_id': userId,
          'action_type': actionType,
          'points': points,
          'metadata': {
            'update_id': updateId,
            'defense_provided': hasDefense,
          },
        });
      } catch (_) {}

      if (mounted) {
        ToastService.show(context, 'Decision locked (+${points} Rep)');
        setState(() {
          _hasUserResponded = true;
          _userChosenOptionId = _selectedOptionId;
          _userRationale = finalRationale;
          _showCreatorTake = true;
          _currentStep = 3;
          _isSubmitting = false;
        });
        _fetchResponses();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ToastService.show(context, 'Failed to submit decision: $e', isError: true);
      }
    }
  }

  void _showTalentPipelineSheet() {
    final candidates = List<Map<String, dynamic>>.from(_responses);
    // Sort: featured candidates first, then those with rationales, then the rest
    candidates.sort((a, b) {
      final aFeatured = a['is_featured'] == true ? 1 : 0;
      final bFeatured = b['is_featured'] == true ? 1 : 0;
      if (aFeatured != bFeatured) return bFeatured.compareTo(aFeatured);
      final aHasRationale = (a['rationale']?.toString() ?? '').trim().isNotEmpty ? 1 : 0;
      final bHasRationale = (b['rationale']?.toString() ?? '').trim().isNotEmpty ? 1 : 0;
      return bHasRationale.compareTo(aHasRationale);
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: BoxDecoration(
                color: context.themeColors.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: context.themeColors.borderSubtle),
              ),
              child: Column(
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: context.themeColors.borderSubtle,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(
                                color: Colors.amber.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(LucideIcons.sparkles, size: 18, color: Colors.amber),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Talent Discovery Pipeline',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: context.themeColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  '${candidates.length} builders evaluated · High-signal recruitment',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: context.themeColors.textTertiary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(LucideIcons.x, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: candidates.isEmpty
                        ? Center(
                            child: Text(
                              'No candidates have responded yet.',
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 13),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: candidates.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 14),
                            itemBuilder: (cContext, idx) {
                              final item = candidates[idx];
                              final u = item['users'] as Map<String, dynamic>? ?? {};
                              final candidateId = item['user_id']?.toString() ?? '';
                              final name = u['name']?.toString() ?? 'Builder';
                              final avatar = u['avatar']?.toString();
                              final seniority = u['seniority']?.toString() ?? 'Product Builder';
                              final specialisation = u['specialisation']?.toString() ?? '';
                              final initial = name.isNotEmpty ? name[0].toUpperCase() : 'B';
                              final rationale = item['rationale']?.toString() ?? '';
                              final optId = item['selected_option_id']?.toString() ?? '';
                              final opt = _options.firstWhere(
                                (o) => o['id']?.toString() == optId,
                                orElse: () => {'title': 'Strategic Option'},
                              );
                              final optTitle = opt['title']?.toString() ?? 'Option';
                              final isFeatured = item['is_featured'] == true;
                              final isBookmarked = _bookmarkedCandidateIds.contains(candidateId);

                              return Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: isFeatured
                                      ? Colors.amber.withOpacity(0.06)
                                      : context.themeColors.surfaceHighlight.withOpacity(0.4),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: isFeatured
                                        ? Colors.amber.withOpacity(0.4)
                                        : context.themeColors.borderSubtle,
                                    width: isFeatured ? 1.5 : 1.0,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Candidate Header
                                    Row(
                                      children: [
                                        GestureDetector(
                                          onTap: () {
                                            Navigator.push(context, MaterialPageRoute(
                                              builder: (_) => PublicProfileScreen(userId: candidateId),
                                            ));
                                          },
                                          child: CircleAvatar(
                                            radius: 17,
                                            backgroundColor: context.themeColors.primary500,
                                            backgroundImage: avatar != null && avatar.isNotEmpty
                                                ? CachedNetworkImageProvider(avatar)
                                                : null,
                                            child: avatar == null || avatar.isEmpty
                                                ? Text(initial, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold))
                                                : null,
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: GestureDetector(
                                            onTap: () {
                                              Navigator.push(context, MaterialPageRoute(
                                                builder: (_) => PublicProfileScreen(userId: candidateId),
                                              ));
                                            },
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Flexible(
                                                      child: Text(
                                                        name,
                                                        style: TextStyle(
                                                          fontSize: 13,
                                                          fontWeight: FontWeight.bold,
                                                          color: context.themeColors.textPrimary,
                                                        ),
                                                        maxLines: 1,
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                    if (isFeatured) ...[
                                                      const SizedBox(width: 6),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: Colors.amber.withOpacity(0.15),
                                                          borderRadius: BorderRadius.circular(4),
                                                        ),
                                                        child: const Row(
                                                          mainAxisSize: MainAxisSize.min,
                                                          children: [
                                                            Icon(LucideIcons.crown, size: 10, color: Colors.amber),
                                                            SizedBox(width: 3),
                                                            Text(
                                                              'ENDORSED',
                                                              style: TextStyle(
                                                                fontSize: 8.5,
                                                                fontWeight: FontWeight.w900,
                                                                color: Colors.amber,
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ],
                                                  ],
                                                ),
                                                Text(
                                                  specialisation.isNotEmpty ? '$seniority · $specialisation' : seniority,
                                                  style: TextStyle(
                                                    fontSize: 10.5,
                                                    color: context.themeColors.textTertiary,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        // Bookmark icon
                                        IconButton(
                                          onPressed: () {
                                            HapticFeedback.lightImpact();
                                            setState(() {
                                              if (isBookmarked) {
                                                _bookmarkedCandidateIds.remove(candidateId);
                                              } else {
                                                _bookmarkedCandidateIds.add(candidateId);
                                              }
                                            });
                                            setSheetState(() {});
                                            ToastService.show(
                                              context,
                                              isBookmarked ? 'Removed from talent shortlist' : 'Saved $name to talent shortlist',
                                            );
                                          },
                                          icon: Icon(
                                            isBookmarked ? LucideIcons.bookmarkCheck : LucideIcons.bookmark,
                                            size: 18,
                                            color: isBookmarked ? Colors.amber : context.themeColors.textTertiary,
                                          ),
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 10),

                                    // Chosen Option Pill
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: context.themeColors.surfaceHighlight,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(LucideIcons.cornerDownRight, size: 11, color: context.themeColors.textTertiary),
                                          const SizedBox(width: 5),
                                          Flexible(
                                            child: Text(
                                              'Move: $optTitle',
                                              style: TextStyle(
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.w600,
                                                color: context.themeColors.textSecondary,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    if (rationale.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: context.themeColors.surface,
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: context.themeColors.borderSubtle),
                                        ),
                                        child: Text(
                                          '"$rationale"',
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            color: context.themeColors.textPrimary,
                                            fontStyle: FontStyle.italic,
                                            height: 1.35,
                                          ),
                                        ),
                                      ),
                                    ],

                                    const SizedBox(height: 12),

                                    // Tri-Action Suite Buttons
                                    Row(
                                      children: [
                                        if (!isFeatured)
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () async {
                                                await _endorseResponse(item['id'], candidateId, name);
                                                setSheetState(() {
                                                  item['is_featured'] = true;
                                                });
                                              },
                                              icon: const Icon(LucideIcons.star, size: 13),
                                              label: const Text('Endorse (+100 Rep)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.amber,
                                                foregroundColor: Colors.black,
                                                elevation: 0,
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                              ),
                                            ),
                                          )
                                        else
                                          Expanded(
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(vertical: 7),
                                              decoration: BoxDecoration(
                                                color: Colors.amber.withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: const Center(
                                                child: Text('Endorsed & Featured', style: TextStyle(color: Colors.amber, fontSize: 11, fontWeight: FontWeight.bold)),
                                              ),
                                            ),
                                          ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: () {
                                              Navigator.push(context, MaterialPageRoute(
                                                builder: (_) => PublicProfileScreen(userId: candidateId),
                                              ));
                                            },
                                            icon: const Icon(LucideIcons.user, size: 13),
                                            label: const Text('View Profile & DM', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: context.themeColors.textPrimary,
                                              side: BorderSide(color: context.themeColors.borderSubtle),
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _endorseResponse(dynamic responseId, dynamic respondentUserId, String name) async {
    if (responseId == null || respondentUserId == null) return;
    HapticFeedback.heavyImpact();
    try {
      await Supabase.instance.client
          .from('simulation_responses')
          .update({'is_featured': true})
          .eq('id', responseId.toString());

      await Supabase.instance.client.from('reputation_events').insert({
        'user_id': respondentUserId.toString(),
        'action_type': 'featured_simulation_rationale',
        'points': 100,
        'metadata': {
          'update_id': widget.update['id'],
          'endorsed_by': Supabase.instance.client.auth.currentUser?.id,
        },
      });

      try {
        final currentAuthor = Supabase.instance.client.auth.currentUser;
        await Supabase.instance.client.from('notifications').insert({
          'user_id': respondentUserId.toString(),
          'actor_id': currentAuthor?.id,
          'type': 'simulation_endorsed',
          'metadata': {
            'update_id': widget.update['id'],
            'simulation_title': _simData['scenario_title'] ?? 'Product Challenge',
          },
          'read': false,
          'is_read': false,
        });
      } catch (_) {}

      if (mounted) {
        setState(() {
          for (final r in _responses) {
            if (r['id']?.toString() == responseId.toString()) {
              r['is_featured'] = true;
            }
          }
        });
        ToastService.show(context, 'Endorsed $name (+100 Rep)');
      }
    } catch (e) {
      if (mounted) {
        ToastService.show(context, 'Failed to endorse: $e', isError: true);
      }
    }
  }

  void _showRationalesSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: BoxDecoration(
            color: context.themeColors.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(color: context.themeColors.borderSubtle),
          ),
          child: Column(
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: context.themeColors.borderSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                child: Row(
                  children: [
                    Icon(LucideIcons.messageSquare, size: 18, color: context.themeColors.primary500),
                    const SizedBox(width: 8),
                    Text(
                      'Builder Rationales (${_responses.length})',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: context.themeColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: _responses.isEmpty
                    ? Center(
                        child: Text(
                          'No rationales submitted yet. Be the first!',
                          style: TextStyle(color: context.themeColors.textTertiary, fontSize: 13),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _responses.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (ctx, idx) {
                          final item = _responses[idx];
                          final u = item['users'] as Map<String, dynamic>? ?? {};
                          final name = u['name']?.toString() ?? 'Builder';
                          final avatar = u['avatar']?.toString();
                          final initial = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'B';
                          final rationale = item['rationale']?.toString() ?? '';
                          final optId = item['selected_option_id']?.toString() ?? '';
                          final opt = _options.firstWhere(
                            (o) => o['id']?.toString() == optId,
                            orElse: () => {'title': 'Option'},
                          );
                          final isFeatured = item['is_featured'] == true;
                          final isAuthor = widget.update['author_id'] == Supabase.instance.client.auth.currentUser?.id;

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isFeatured 
                                  ? Colors.amber.withOpacity(0.06)
                                  : context.themeColors.surfaceHighlight.withOpacity(0.5),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isFeatured ? Colors.amber.withOpacity(0.4) : context.themeColors.borderSubtle,
                                width: isFeatured ? 1.2 : 1.0,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 14,
                                      backgroundColor: context.themeColors.primary500,
                                      backgroundImage: avatar != null && avatar.isNotEmpty
                                          ? CachedNetworkImageProvider(avatar)
                                          : null,
                                      child: avatar == null || avatar.isEmpty
                                          ? Text(initial, style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold))
                                          : null,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            name,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: context.themeColors.textPrimary,
                                            ),
                                          ),
                                          Text(
                                            'Chose: ${opt['title'] ?? optId}',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                              color: context.themeColors.primary500,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
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
                                              'FEATURED',
                                              style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w900, color: Colors.amber),
                                            ),
                                          ],
                                        ),
                                      ),
                                  ],
                                ),
                                if (rationale.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    rationale,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: context.themeColors.textSecondary,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                                if (isAuthor && !isFeatured) ...[
                                  const SizedBox(height: 8),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton.icon(
                                      onPressed: () => _endorseResponse(item['id'], item['user_id'], name),
                                      icon: const Icon(LucideIcons.award, size: 12, color: Colors.amber),
                                      label: const Text(
                                        'Endorse Answer (+100 Rep)',
                                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.amber),
                                      ),
                                      style: TextButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        minimumSize: Size.zero,
                                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final update = widget.update;
    final users = update['users'] as Map<String, dynamic>? ?? {};
    final authorName = update['author_name'] ?? users['name'] ?? 'Senior PM';
    final authorAvatar = users['avatar']?.toString();
    final initial = authorName.isNotEmpty ? authorName.substring(0, 1).toUpperCase() : 'S';
    final createdAt = DateTime.tryParse(update['created_at'] ?? '') ?? DateTime.now();
    final timeStr = timeago.format(createdAt, locale: 'en_short');

    final simData = _simData;
    final title = simData['scenario_title']?.toString() ?? update['content']?.toString() ?? 'Strategic Dilemma';
    final prompt = simData['context_prompt']?.toString() ?? '';
    final category = simData['category']?.toString() ?? simData['role_tag']?.toString() ?? 'Product Strategy';
    final seniority = simData['seniority_target']?.toString() ?? 'Strategic';
    final creatorRole = simData['creator_role']?.toString() ?? users['seniority']?.toString() ?? 'Senior PM';
    final creatorCompany = simData['creator_company']?.toString() ?? users['organization_name']?.toString() ?? '';
    final creatorRationale = simData['creator_rationale']?.toString() ?? '';
    final seniorTip = simData['senior_tip']?.toString() ?? '';
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final isAuthor = currentUserId != null && currentUserId == update['author_id'];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.transparent,
        border: Border(bottom: BorderSide(color: context.themeColors.borderSubtle, width: 1)),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: context.themeColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: context.themeColors.primary500.withOpacity(0.25),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isAuthor) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.amber.withOpacity(0.18), Colors.amber.withOpacity(0.06)],
                    ),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.amber.withOpacity(0.4)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.sparkles, size: 14, color: Colors.amber),
                          const SizedBox(width: 8),
                          Text(
                            'Talent Pipeline (${_responses.length} Candidates)',
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.bold,
                              color: Colors.amber,
                            ),
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: _showTalentPipelineSheet,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Row(
                          children: [
                            Text(
                              'Review →',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w900,
                                color: Colors.amber,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // ── Header: Badge & Creator Info ─────────────────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: () {
                      final authorId = update['author_id'];
                      if (authorId != null) {
                        Navigator.push(context, MaterialPageRoute(
                          builder: (context) => PublicProfileScreen(userId: authorId),
                        ));
                      }
                    },
                    child: CircleAvatar(
                      radius: 18,
                      backgroundColor: context.themeColors.primary500,
                      backgroundImage: authorAvatar != null && authorAvatar.isNotEmpty
                          ? CachedNetworkImageProvider(authorAvatar)
                          : null,
                      child: authorAvatar == null || authorAvatar.isEmpty
                          ? Text(initial, style: const TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.bold))
                          : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                authorName,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: context.themeColors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(LucideIcons.badgeCheck, size: 14, color: context.themeColors.primary500),
                            const SizedBox(width: 4),
                            Text(
                              '· $timeStr',
                              style: TextStyle(fontSize: 11, color: context.themeColors.textTertiary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 1),
                        Text(
                          creatorCompany.isNotEmpty ? '$creatorRole @ $creatorCompany' : creatorRole,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: context.themeColors.textTertiary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  // Challenge Pill Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: context.themeColors.primary500.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: context.themeColors.primary500.withOpacity(0.25), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.zap, size: 12, color: context.themeColors.primary500),
                        const SizedBox(width: 4),
                        Text(
                          'CHALLENGE',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                            color: context.themeColors.primary500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Category & Seniority tags
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: context.themeColors.surfaceHighlight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      category,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textSecondary),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: context.themeColors.surfaceHighlight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      seniority,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: context.themeColors.textTertiary),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Title
              Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                  color: context.themeColors.textPrimary,
                  letterSpacing: -0.3,
                  height: 1.3,
                ),
              ),

              if (prompt.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  prompt,
                  style: TextStyle(
                    fontSize: 12.5,
                    color: context.themeColors.textSecondary,
                    height: 1.45,
                  ),
                ),
              ],

              const SizedBox(height: 16),

              // ── Step 1 or Step 3: Interactive Options Block ─────────────
              if (_currentStep != 2 || _hasUserResponded) ...[
                ..._options.map((opt) {
                  final optId = opt['id']?.toString() ?? '';
                  final optTitle = opt['title']?.toString() ?? '';
                  final optDesc = opt['description']?.toString() ?? '';
                  final metrics = opt['impact_metrics'] as Map<String, dynamic>? ?? {};

                  final isSelected = _selectedOptionId == optId;
                  final isUserPick = _userChosenOptionId == optId;

                  // Distribution calculation
                  final voteCount = _optionCounts[optId] ?? 0;
                  final double percent = _totalResponses > 0 ? (voteCount / _totalResponses) : 0.0;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: GestureDetector(
                      onTap: _hasUserResponded ? null : () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _selectedOptionId = optId;
                        });
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? context.themeColors.primary500.withOpacity(0.08)
                              : context.themeColors.surfaceHighlight.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? context.themeColors.primary500
                                : context.themeColors.borderSubtle,
                            width: isSelected ? 1.5 : 1.0,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                // Radio or Check indicator
                                Container(
                                  width: 20,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isSelected ? context.themeColors.primary500 : Colors.transparent,
                                    border: Border.all(
                                      color: isSelected ? context.themeColors.primary500 : context.themeColors.textTertiary,
                                      width: 1.5,
                                    ),
                                  ),
                                  child: isSelected
                                      ? const Icon(Icons.check, size: 13, color: Colors.white)
                                      : null,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    optTitle,
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                      color: context.themeColors.textPrimary,
                                    ),
                                  ),
                                ),
                                if (_hasUserResponded) ...[
                                  const SizedBox(width: 8),
                                  Text(
                                    '${(percent * 100).toInt()}%',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: isUserPick ? context.themeColors.primary500 : context.themeColors.textTertiary,
                                    ),
                                  ),
                                ],
                              ],
                            ),

                            if (optDesc.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Padding(
                                padding: const EdgeInsets.only(left: 30),
                                child: Text(
                                  optDesc,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: context.themeColors.textTertiary,
                                    height: 1.35,
                                  ),
                                ),
                              ),
                            ],

                            // Distribution bar if answered
                            if (_hasUserResponded) ...[
                              const SizedBox(height: 8),
                              Padding(
                                padding: const EdgeInsets.only(left: 30),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: percent,
                                    minHeight: 5,
                                    backgroundColor: context.themeColors.borderSubtle.withOpacity(0.5),
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      isUserPick ? context.themeColors.primary500 : context.themeColors.textTertiary.withOpacity(0.5),
                                    ),
                                  ),
                                ),
                              ),
                            ],

                            // Impact Metrics Preview when selected
                            if (isSelected && !_hasUserResponded && metrics.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Padding(
                                padding: const EdgeInsets.only(left: 30),
                                child: Wrap(
                                  spacing: 6,
                                  runSpacing: 4,
                                  children: [
                                    if (metrics['trust'] != null)
                                      _buildImpactChip('Trust', metrics['trust'] as int),
                                    if (metrics['velocity'] != null)
                                      _buildImpactChip('Velocity', metrics['velocity'] as int),
                                    if (metrics['revenue'] != null)
                                      _buildImpactChip('Revenue', metrics['revenue'] as int),
                                    if (metrics['risk'] != null)
                                      _buildImpactChip('Risk', metrics['risk'] as int, isRisk: true),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                }),

                // Step 1 CTA: Face Stakeholder Pushback
                if (!_hasUserResponded && _currentStep == 1 && _selectedOptionId != null) ...[
                  const SizedBox(height: 4),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        setState(() => _currentStep = 2);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.themeColors.primary500,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.shieldAlert, size: 15),
                          SizedBox(width: 8),
                          Text('Face Stakeholder Pushback', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          SizedBox(width: 6),
                          Icon(LucideIcons.arrowRight, size: 14),
                        ],
                      ),
                    ),
                  ),
                ],
              ],

              // ── Step 2: Stakeholder Pushback & Rebuttal View ─────────────
              if (!_hasUserResponded && _currentStep == 2 && _selectedOptionId != null) ...[
                Builder(
                  builder: (context) {
                    final chosenOpt = _options.firstWhere(
                      (o) => o['id']?.toString() == _selectedOptionId,
                      orElse: () => {'title': 'Strategic Move'},
                    );
                    final chosenTitle = chosenOpt['title']?.toString() ?? '';
                    final stakeholder = _getStakeholderForOption(_selectedOptionId);
                    final persona = stakeholder['persona'] ?? 'Key Stakeholder';
                    final critique = stakeholder['critique'] ?? 'How do you defend this strategic move?';

                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: context.themeColors.surfaceHighlight.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.35)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Move Recap & Change button
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Flexible(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: context.themeColors.primary500.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(LucideIcons.check, size: 11, color: context.themeColors.primary500),
                                      const SizedBox(width: 5),
                                      Flexible(
                                        child: Text(
                                          chosenTitle,
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: context.themeColors.primary500,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              TextButton.icon(
                                onPressed: () {
                                  HapticFeedback.lightImpact();
                                  setState(() => _currentStep = 1);
                                },
                                icon: const Icon(LucideIcons.arrowLeft, size: 12),
                                label: const Text('Change Move', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          // Stakeholder Persona Header
                          Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF43F5E).withOpacity(0.15),
                                  shape: BoxShape.circle,
                                ),
                                child: const Center(
                                  child: Icon(LucideIcons.shieldAlert, size: 15, color: Color(0xFFF43F5E)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      persona,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: context.themeColors.textPrimary,
                                      ),
                                    ),
                                    const Text(
                                      'EXECUTIVE PUSHBACK',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.6,
                                        color: Color(0xFFF43F5E),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 10),

                          // Critique Speech Bubble
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: context.themeColors.surface,
                              borderRadius: BorderRadius.circular(10),
                              border: Border(
                                left: const BorderSide(color: Color(0xFFF43F5E), width: 3.5),
                                top: BorderSide(color: context.themeColors.borderSubtle),
                                right: BorderSide(color: context.themeColors.borderSubtle),
                                bottom: BorderSide(color: context.themeColors.borderSubtle),
                              ),
                            ),
                            child: Text(
                              '"$critique"',
                              style: TextStyle(
                                fontSize: 12,
                                fontStyle: FontStyle.italic,
                                color: context.themeColors.textPrimary,
                                height: 1.4,
                              ),
                            ),
                          ),

                          const SizedBox(height: 14),

                          // 1-Tap Defense Tactics
                          const Text(
                            '1-Tap Tactical Defense Tags (Optional):',
                            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: _kDefenseTactics.map((tag) {
                              final isSelected = _selectedDefenseTags.contains(tag);
                              return FilterChip(
                                label: Text(
                                  tag,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                    color: isSelected ? Colors.white : context.themeColors.textSecondary,
                                  ),
                                ),
                                selected: isSelected,
                                onSelected: (val) {
                                  HapticFeedback.selectionClick();
                                  setState(() {
                                    if (val) {
                                      _selectedDefenseTags.add(tag);
                                    } else {
                                      _selectedDefenseTags.remove(tag);
                                    }
                                  });
                                },
                                selectedColor: context.themeColors.primary500,
                                backgroundColor: context.themeColors.surface,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  side: BorderSide(
                                    color: isSelected
                                        ? context.themeColors.primary500
                                        : context.themeColors.borderSubtle,
                                  ),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                showCheckmark: false,
                              );
                            }).toList(),
                          ),

                          const SizedBox(height: 12),

                          // Rebuttal Text Field
                          TextField(
                            controller: _rationaleController,
                            maxLines: 2,
                            style: TextStyle(fontSize: 12, color: context.themeColors.textPrimary),
                            decoration: InputDecoration(
                              hintText: 'Articulate your strategic counter-argument...',
                              hintStyle: TextStyle(fontSize: 11, color: context.themeColors.textTertiary),
                              filled: true,
                              fillColor: context.themeColors.surface,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.borderSubtle)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.borderSubtle)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.themeColors.primary500)),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Action Buttons: Stand Ground vs Submit Defense
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: _isSubmitting ? null : () => _submitDecision(includeDefense: false),
                                  style: OutlinedButton.styleFrom(
                                    side: BorderSide(color: context.themeColors.borderSubtle),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    padding: const EdgeInsets.symmetric(vertical: 11),
                                  ),
                                  child: const Text('Stand Ground · +50 Rep', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                flex: 2,
                                child: ElevatedButton(
                                  onPressed: _isSubmitting ? null : () => _submitDecision(includeDefense: true),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: context.themeColors.primary500,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(vertical: 11),
                                  ),
                                  child: _isSubmitting
                                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(LucideIcons.zap, size: 13),
                                            SizedBox(width: 5),
                                            Text('Submit Defense · +75 Rep', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                          ],
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],

              // ── Post-Submission Creator Takeaway & Actions ─────────────────
              if (_hasUserResponded) ...[
                const SizedBox(height: 6),
                if (_userRationale != null && _userRationale!.isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: context.themeColors.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: context.themeColors.borderSubtle),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(LucideIcons.quote, size: 12, color: Colors.amber),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Your Locked Defense: "${_userRationale!}"',
                            style: TextStyle(
                              fontSize: 11,
                              fontStyle: FontStyle.italic,
                              color: context.themeColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                if (_showCreatorTake && creatorRationale.isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: context.themeColors.surfaceHighlight.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: context.themeColors.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(LucideIcons.lightbulb, size: 14, color: Colors.amber),
                            const SizedBox(width: 6),
                            Text(
                              "Senior Creator's Takeaway",
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                                color: context.themeColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          creatorRationale,
                          style: TextStyle(
                            fontSize: 11,
                            color: context.themeColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                        if (seniorTip.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            'Pro Tip: $seniorTip',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontStyle: FontStyle.italic,
                              color: context.themeColors.textTertiary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                // Footer row: Rationales modal, Battle Card Share & Pipeline
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton.icon(
                      onPressed: _showRationalesSheet,
                      icon: Icon(LucideIcons.messageSquare, size: 13, color: context.themeColors.primary500),
                      label: Text(
                        '${_responses.length} Rationales',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: context.themeColors.primary500,
                        ),
                      ),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                    Row(
                      children: [
                        TextButton.icon(
                          onPressed: () {
                            final userChosenOpt = _options.firstWhere(
                              (o) => o['id']?.toString() == _userChosenOptionId,
                              orElse: () => {'title': 'Strategic Move'},
                            );
                            final stakeholder = _getStakeholderForOption(_userChosenOptionId);
                            final currentUser = Supabase.instance.client.auth.currentUser;
                            final metadata = currentUser?.userMetadata ?? {};
                            final currentUserName = metadata['name']?.toString() ?? metadata['full_name']?.toString() ?? 'Product Builder';
                            final currentUserAvatar = metadata['avatar_url']?.toString();

                            BuilderCardDialog.show(
                              context,
                              mode: BuilderCardMode.battle,
                              name: currentUserName,
                              avatar: currentUserAvatar,
                              challengeTitle: title,
                              chosenOptionTitle: userChosenOpt['title']?.toString(),
                              stakeholderPersona: stakeholder['persona'],
                              stakeholderCritique: stakeholder['critique'],
                              defenseRationale: _userRationale,
                              isEndorsed: _responses.any((r) => r['user_id'] == currentUser?.id && r['is_featured'] == true),
                            );
                          },
                          icon: const Icon(LucideIcons.share2, size: 12, color: Color(0xFF10B981)),
                          label: const Text(
                            'Share Battle Card ↗',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF10B981),
                            ),
                          ),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                        if (isAuthor) ...[
                          const SizedBox(width: 4),
                          TextButton.icon(
                            onPressed: _showTalentPipelineSheet,
                            icon: const Icon(LucideIcons.crown, size: 12, color: Colors.amber),
                            label: Text(
                              'Pipeline (${_responses.length})',
                              style: const TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                                color: Colors.amber,
                              ),
                            ),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImpactChip(String label, int value, {bool isRisk = false}) {
    final isPositive = value > 0;
    Color color;
    if (isRisk) {
      color = value > 0 ? Colors.redAccent : const Color(0xFF10B981);
    } else {
      color = isPositive ? const Color(0xFF10B981) : Colors.redAccent;
    }

    final sign = isPositive ? '+' : '';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3), width: 0.8),
      ),
      child: Text(
        '$label $sign$value%',
        style: TextStyle(
          fontSize: 9.5,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}
