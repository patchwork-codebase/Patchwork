import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';

class TeamManagementScreen extends StatefulWidget {
  final String roomId;
  final String roomTitle;

  const TeamManagementScreen({super.key, required this.roomId, required this.roomTitle});

  @override
  State<TeamManagementScreen> createState() => _TeamManagementScreenState();
}

class _TeamManagementScreenState extends State<TeamManagementScreen> {
  bool _isLoading = true;
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
      final membersResponse = await Supabase.instance.client
          .from('room_observers')
          .select('role, users(id, name, email)')
          .eq('room_id', widget.roomId);

      final invitesResponse = await Supabase.instance.client
          .from('room_invitations')
          .select('id, email, role, status')
          .eq('room_id', widget.roomId)
          .eq('status', 'pending');

      if (mounted) {
        setState(() {
          _members = List<Map<String, dynamic>>.from(membersResponse);
          _invites = List<Map<String, dynamic>>.from(invitesResponse);
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
        title: Text('Team Management', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16)),
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator(color: context.themeColors.primary500))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Invite Member', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _emailController,
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
                    onPressed: _inviteUser,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: context.themeColors.primary500,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Send Invitation', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
                
                const SizedBox(height: 48),
                Text('Pending Invitations', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                if (_invites.isEmpty)
                  Text('No pending invitations.', style: TextStyle(color: context.themeColors.textTertiary)),
                ..._invites.map((invite) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(backgroundColor: context.themeColors.surfaceHighlight, child: Icon(LucideIcons.mail, color: context.themeColors.textSecondary, size: 16)),
                  title: Text(invite['email'], style: TextStyle(color: context.themeColors.textPrimary)),
                  subtitle: Text('Role: ${invite['role']}', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12)),
                  trailing: IconButton(
                    icon: const Icon(LucideIcons.x, color: Colors.redAccent),
                    onPressed: () => _revokeInvite(invite['id']),
                  ),
                )),
                
                const SizedBox(height: 32),
                Text('Current Team', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
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
                    subtitle: Text(user['email'] ?? '', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12)),
                    trailing: Text(member['role'].toString().toUpperCase(), style: TextStyle(color: context.themeColors.textTertiary, fontSize: 10, fontWeight: FontWeight.bold)),
                  );
                }),
              ],
            ),
          ),
    );
  }
}
