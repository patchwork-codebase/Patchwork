import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../theme.dart';
import 'public_profile_screen.dart';
import 'room_detail_screen.dart';
import 'chat_thread_screen.dart';
import '../widgets/shared/user_avatar.dart';

class BountyDashboardScreen extends StatefulWidget {
  const BountyDashboardScreen({super.key});

  @override
  State<BountyDashboardScreen> createState() => _BountyDashboardScreenState();
}

class _BountyDashboardScreenState extends State<BountyDashboardScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _applications = [];

  @override
  void initState() {
    super.initState();
    _fetchApplications();
  }

  Future<void> _fetchApplications() async {
    setState(() => _isLoading = true);
    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId == null) return;

      final res = await Supabase.instance.client
          .from('bounty_applications')
          .select('*, builder:users!builder_id(id, name, avatar, reputation, is_verified_expert, organization_logo_url), update:updates!update_id(id, content)')
          .eq('observer_id', userId)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _applications = List<Map<String, dynamic>>.from(res);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading applications: $e')));
      }
    }
  }

  Future<void> _acceptMatch(String applicationId) async {
    try {
      // Call the RPC function we defined in the migration
      final res = await Supabase.instance.client.rpc('accept_bounty_application', params: {
        'p_application_id': applicationId,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Match Accepted! Room created. 🚀')),
        );
        final roomId = res['room_id'];
        _fetchApplications(); // Refresh list
        // Navigate to chat in the newly created room
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatThreadScreen(
              roomId: roomId,
              roomTitle: 'Bounty Match',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to accept match: $e')),
        );
      }
    }
  }

  Future<void> _rejectMatch(String applicationId) async {
    try {
      await Supabase.instance.client
          .from('bounty_applications')
          .update({'status': 'rejected'})
          .eq('id', applicationId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pitch declined.')),
        );
        _fetchApplications(); // Refresh list to reflect rejection
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to reject match: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        backgroundColor: context.themeColors.surface,
        title: const Text('Bounty Matches', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        elevation: 0,
        centerTitle: true,
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator(color: context.themeColors.primary500))
        : _applications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.target, size: 54, color: context.themeColors.textTertiary),
                  const SizedBox(height: 16),
                  Text('No pitches yet', style: TextStyle(fontSize: 15, color: context.themeColors.textSecondary)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _fetchApplications,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _applications.length,
                itemBuilder: (context, index) {
                  final app = _applications[index];
                  final builder = app['builder'] ?? {};
                  final update = app['update'] ?? {};
                  final isAccepted = app['status'] == 'accepted';
                  
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: context.themeColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isAccepted ? Colors.green.withOpacity(0.5) : context.themeColors.borderSubtle),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Update Reference
                        Row(
                          children: [
                            Icon(LucideIcons.fileText, size: 11, color: context.themeColors.textTertiary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                update['content'] ?? 'Request For Builder',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(color: context.themeColors.textSecondary, fontSize: 10, fontStyle: FontStyle.italic),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        
                        // Builder Info
                        Row(
                          children: [
                            UserAvatar(
                              imageUrl: builder['avatar'],
                              radius: 20,
                              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: builder['id']))),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(builder['name'] ?? 'Unknown', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
                                      if (builder['is_verified_expert'] == true) ...[
                                        const SizedBox(width: 4),
                                        Icon(LucideIcons.badgeCheck, size: 11, color: context.themeColors.primary500),
                                      ],
                                    ],
                                  ),
                                  Text('Reputation: ${builder['reputation'] ?? 0} ★', style: const TextStyle(color: Colors.amber, fontSize: 10, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            Text(
                              timeago.format(DateTime.parse(app['created_at'])),
                              style: TextStyle(color: context.themeColors.textTertiary, fontSize: 10),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        
                        // Pitch Text
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: context.themeColors.surfaceHighlight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            app['pitch_text'] ?? '',
                            style: TextStyle(color: context.themeColors.textPrimary, fontSize: 11),
                          ),
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Actions
                        if (isAccepted)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                width: double.infinity,
                                decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                child: const Center(
                                  child: Text('✅ Match Accepted', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                                ),
                              ),
                              const SizedBox(height: 10),
                              OutlinedButton.icon(
                                onPressed: () {
                                  // Get the room_id from the application if stored
                                  // Otherwise navigate via the Messages tab
                                  if (app['room_id'] != null) {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => ChatThreadScreen(
                                          roomId: app['room_id'],
                                          roomTitle: app['room_title'] ?? 'Bounty Match',
                                        ),
                                      ),
                                    );
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Open the Messages tab to find your chat!')),
                                    );
                                  }
                                },
                                icon: const Icon(LucideIcons.messageCircle, size: 13),
                                label: const Text('Open Chat'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.green,
                                  side: const BorderSide(color: Colors.green),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ],
                          )
                        else if (app['status'] == 'pending')
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => _rejectMatch(app['id']),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.redAccent,
                                    side: BorderSide(color: Colors.redAccent.withOpacity(0.5)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: const Text('Reject'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                flex: 2,
                                child: ElevatedButton(
                                  onPressed: () => _acceptMatch(app['id']),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: context.themeColors.primary500,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: const Text('Accept Match'),
                                ),
                              ),
                            ],
                          )
                        else 
                          const Center(child: Text('Rejected', style: TextStyle(color: Colors.red))),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}
