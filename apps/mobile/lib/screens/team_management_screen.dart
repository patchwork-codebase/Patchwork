import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme.dart';
import '../utils/user_identity_formatter.dart';

class TeamManagementScreen extends StatefulWidget {
  final String roomId;
  final String roomTitle;

  const TeamManagementScreen({super.key, required this.roomId, required this.roomTitle});

  @override
  State<TeamManagementScreen> createState() => _TeamManagementScreenState();
}

class _TeamManagementScreenState extends State<TeamManagementScreen> {
  bool _isLoading = true;
  bool _isPrivateRoom = false;
  List<Map<String, dynamic>> _members = [];
  List<Map<String, dynamic>> _invites = [];
  final _emailController = TextEditingController();
  String _selectedRole = 'collaborator';

  @override
  void initState() {
    super.initState();
    _fetchTeamData();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _fetchTeamData() async {
    setState(() => _isLoading = true);
    try {
      // Fetch room privacy status
      final roomResponse = await Supabase.instance.client
          .from('rooms')
          .select('is_private')
          .eq('id', widget.roomId)
          .maybeSingle();

      final membersResponse = await Supabase.instance.client
          .from('room_observers')
          .select('role, users(id, name, email, specialisation, seniority, pm_level, company_name, organization_name)')
          .eq('room_id', widget.roomId);

      List<Map<String, dynamic>> invites = [];
      if (roomResponse?['is_private'] == true) {
        final invitesResponse = await Supabase.instance.client
            .from('room_invitations')
            .select('id, email, role, status')
            .eq('room_id', widget.roomId)
            .eq('status', 'pending');
        invites = List<Map<String, dynamic>>.from(invitesResponse);
      }

      if (mounted) {
        setState(() {
          _isPrivateRoom = roomResponse?['is_private'] == true;
          _members = List<Map<String, dynamic>>.from(membersResponse);
          _invites = invites;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading team: $e')));
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _inviteUser() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) return;

    if (!_isPrivateRoom) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invitations are only available for private rooms. Toggle your room to private first.')),
        );
      }
      return;
    }

    try {
      await Supabase.instance.client.rpc('invite_user_to_room', params: {
        'p_room_id': widget.roomId,
        'p_email': email,
        'p_role': _selectedRole,
      });

      _emailController.clear();
      _fetchTeamData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invitation sent!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _revokeInvite(String id) async {
    try {
      await Supabase.instance.client
          .from('room_invitations')
          .update({'status': 'revoked'})
          .eq('id', id);
      _fetchTeamData();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        backgroundColor: context.themeColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        title: Text('Team Management', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 13)),
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator(color: context.themeColors.primary500))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Invite Member', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (!_isPrivateRoom)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.info, color: Colors.orange, size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Invitations are only for private rooms. Public rooms are open for anyone to observe.',
                              style: TextStyle(color: Colors.orange.shade200, fontSize: 11, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _emailController,
                        enabled: _isPrivateRoom,
                        style: TextStyle(color: context.themeColors.textPrimary),
                        decoration: InputDecoration(
                          hintText: 'Email address',
                          hintStyle: TextStyle(color: context.themeColors.textTertiary),
                          filled: true,
                          fillColor: context.themeColors.borderSubtle.withOpacity(0.3),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: context.themeColors.borderSubtle.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedRole,
                          dropdownColor: context.themeColors.surfaceHighlight,
                          style: TextStyle(color: context.themeColors.textPrimary),
                          items: const [
                            DropdownMenuItem(value: 'collaborator', child: Text('Collaborator')),
                            DropdownMenuItem(value: 'observer', child: Text('Observer')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedRole = val);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isPrivateRoom ? _inviteUser : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isPrivateRoom ? context.themeColors.primary500 : context.themeColors.primary500.withOpacity(0.3),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Send Invitation', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
                
                const SizedBox(height: 48),
                Text('Pending Invitations', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                if (_invites.isEmpty)
                  Text('No pending invitations.', style: TextStyle(color: context.themeColors.textTertiary)),
                ..._invites.map((invite) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(backgroundColor: context.themeColors.surfaceHighlight, child: Icon(LucideIcons.mail, color: context.themeColors.textSecondary, size: 13)),
                  title: Text(invite['email'], style: TextStyle(color: context.themeColors.textPrimary)),
                  subtitle: Text('Role: ${invite['role']}', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11)),
                  trailing: IconButton(
                    icon: const Icon(LucideIcons.x, color: Colors.redAccent),
                    onPressed: () => _revokeInvite(invite['id']),
                  ),
                )),
                
                const SizedBox(height: 32),
                Text('Current Team', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                if (_members.isEmpty)
                  Text('No team members yet.', style: TextStyle(color: context.themeColors.textTertiary)),
                ..._members.map((member) {
                  final user = member['users'] as Map<String, dynamic>;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: context.themeColors.primary500,
                      child: Text(user['name']?.substring(0, 1).toUpperCase() ?? '?', style: const TextStyle(color: Colors.white)),
                    ),
                    title: Text(user['name'] ?? 'Unknown', style: TextStyle(color: context.themeColors.textPrimary)),
                    subtitle: Builder(
                      builder: (context) {
                        final pmIdentity = UserIdentityFormatter.formatPmIdentity(
                          specialisation: user['specialisation']?.toString(),
                          seniority: user['seniority']?.toString() ?? user['pm_level']?.toString(),
                          company: user['company_name']?.toString() ?? user['organization_name']?.toString(),
                          includeCompany: true,
                        );
                        final subtitleText = pmIdentity.isNotEmpty
                            ? '$pmIdentity · ${user['email'] ?? ''}'
                            : (user['email'] ?? '');
                        return Text(subtitleText, style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11));
                      },
                    ),
                    trailing: Text(member['role'].toString().toUpperCase(), style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.bold)),
                  );
                }),
              ],
            ),
          ),
    );
  }
}
