import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';

class PollWidget extends StatefulWidget {
  final Map<String, dynamic> poll;

  const PollWidget({super.key, required this.poll});

  @override
  State<PollWidget> createState() => _PollWidgetState();
}

class _PollWidgetState extends State<PollWidget> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _votes = [];
  String? _currentUserVoteId;
  int _totalVotes = 0;

  @override
  void initState() {
    super.initState();
    _fetchVotes();
  }

  Future<void> _fetchVotes() async {
    final pollId = widget.poll['id'];
    if (pollId == null) return;

    try {
      final res = await Supabase.instance.client
          .from('poll_votes')
          .select('*')
          .eq('poll_id', pollId);

      final userId = Supabase.instance.client.auth.currentUser?.id;

      if (mounted) {
        setState(() {
          _votes = List<Map<String, dynamic>>.from(res);
          _totalVotes = _votes.length;
          if (userId != null) {
            final userVote = _votes.where((v) => v['user_id'] == userId).firstOrNull;
            _currentUserVoteId = userVote?['poll_option_id'] as String?;
          } else {
            _currentUserVoteId = null;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleVote(String optionId) async {
    final pollId = widget.poll['id'];
    if (pollId == null) return;

    // Optimistic update
    setState(() {
      _currentUserVoteId = optionId;
    });

    try {
      await Supabase.instance.client.rpc('vote_on_poll', params: {
        'p_poll_id': pollId,
        'p_poll_option_id': optionId,
      });
      _fetchVotes();
    } catch (e) {
      // Refresh to revert if failed
      _fetchVotes();
    }
  }

  @override
  Widget build(BuildContext context) {
    final question = widget.poll['question'] ?? 'Poll';
    final options = List<Map<String, dynamic>>.from(widget.poll['poll_options'] ?? []);

    return Container(
      margin: const EdgeInsets.only(top: 12, bottom: 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.themeColors.surfaceHighlight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: context.themeColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          ...options.map((opt) {
            final optionId = opt['id'];
            final optionText = opt['option_text'] ?? '';
            final votesForOption = _votes.where((v) => v['poll_option_id'] == optionId).length;
            final percentage = _totalVotes > 0 ? (votesForOption / _totalVotes) : 0.0;
            final isSelected = _currentUserVoteId == optionId;

            return GestureDetector(
              onTap: () => _handleVote(optionId),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: Stack(
                  children: [
                    // Background progress bar
                    Container(
                      height: 40,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: context.themeColors.background,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected ? context.themeColors.primary500 : context.themeColors.borderSubtle,
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                    ),
                    if (_currentUserVoteId != null || _totalVotes > 0)
                      Container(
                        height: 40,
                        width: MediaQuery.of(context).size.width * percentage,
                        decoration: BoxDecoration(
                          color: isSelected 
                              ? context.themeColors.primary500.withOpacity(0.2)
                              : context.themeColors.textTertiary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    // Text
                    Positioned.fill(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                optionText,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  color: isSelected ? context.themeColors.primary500 : context.themeColors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (_currentUserVoteId != null || _totalVotes > 0)
                              Text(
                                '${(percentage * 100).toStringAsFixed(0)}%',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: context.themeColors.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          Text(
            '$_totalVotes votes',
            style: TextStyle(
              fontSize: 10,
              color: context.themeColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}
