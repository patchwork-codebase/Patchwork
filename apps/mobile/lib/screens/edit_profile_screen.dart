import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import '../theme.dart';
import '../widgets/toast_notification.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isUploadingImage = false;

  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _cityController = TextEditingController();
  final _bioController = TextEditingController();
  
  String _role = 'builder';
  String _domain = '';
  
  final _websiteController = TextEditingController();
  final _twitterController = TextEditingController();
  final _githubController = TextEditingController();
  final _linkedinController = TextEditingController();
  
  bool _emailNotifications = true;
  bool _inAppNotifications = true;
  bool _isVerifiedExpert = false;
  
  bool _expertAvailable = true;
  final _expertSlotsController = TextEditingController(text: '3');
  final _expertResponseController = TextEditingController(text: '48');
  String? _avatarUrl;
  File? _selectedImage;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _cityController.dispose();
    _bioController.dispose();
    _websiteController.dispose();
    _twitterController.dispose();
    _githubController.dispose();
    _linkedinController.dispose();
    _expertSlotsController.dispose();
    _expertResponseController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final response = await Supabase.instance.client
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

      if (mounted) {
        setState(() {
          _nameController.text = response['name'] ?? '';
          _usernameController.text = response['username'] ?? (response['twitter'] ?? '');
          _cityController.text = response['city'] ?? '';
          _bioController.text = response['bio'] ?? '';
          _role = response['role'] ?? 'builder';
          _domain = response['domain'] ?? '';
          
          _websiteController.text = response['website'] ?? '';
          _twitterController.text = response['twitter'] ?? '';
          _githubController.text = response['github_url'] ?? '';
          _linkedinController.text = response['linkedin_url'] ?? '';
          
          _emailNotifications = response['email_notifications_enabled'] ?? true;
          _inAppNotifications = response['in_app_notifications_enabled'] ?? true;
          
          _isVerifiedExpert = response['is_verified_expert'] ?? false;
          _expertAvailable = response['expert_available'] ?? true;
          _expertSlotsController.text = (response['expert_open_slots'] ?? 3).toString();
          _expertResponseController.text = (response['expert_avg_response_hours'] ?? 48).toString();
          _avatarUrl = response['avatar'];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ToastService.show(context, 'Failed to load profile: $e', isError: true);
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _pickAndUploadImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800, maxHeight: 800);
    
    if (pickedFile == null) return;

    setState(() => _isUploadingImage = true);

    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId == null) throw Exception('Not logged in');

      final bytes = await pickedFile.readAsBytes();
      final fileExt = pickedFile.path.split('.').last.toLowerCase();
      final mimeType = fileExt == 'png' ? 'image/png' : 'image/jpeg';
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$userId.$fileExt';
      final filePath = 'avatars/$fileName';

      await Supabase.instance.client.storage
          .from('avatars')
          .uploadBinary(
            filePath,
            bytes,
            fileOptions: FileOptions(contentType: mimeType, upsert: true),
          );

      final publicUrl = Supabase.instance.client.storage
          .from('avatars')
          .getPublicUrl(filePath);

      if (mounted) {
        setState(() {
          _avatarUrl = publicUrl;
          _selectedImage = kIsWeb ? null : File(pickedFile.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ToastService.show(context, 'Upload failed: $e', isError: true);
        setState(() => _selectedImage = null);
      }
    } finally {
      if (mounted) setState(() => _isUploadingImage = false);
    }
  }

  Future<void> _saveProfile() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ToastService.show(context, 'Name cannot be empty', isError: true);
      return;
    }

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    final rawUsername = _usernameController.text.trim().replaceAll('@', '').toLowerCase();

    setState(() => _isSaving = true);
    try {
      final updateData = <String, dynamic>{
        'name': name,
        'city': _cityController.text.trim(),
        'bio': _bioController.text.trim(),
        'role': _role,
        'domain': _domain,
        'website': _websiteController.text.trim(),
        'twitter': rawUsername.isNotEmpty ? '@$rawUsername' : _twitterController.text.trim(),
        'github_url': _githubController.text.trim(),
        'linkedin_url': _linkedinController.text.trim(),
        'email_notifications_enabled': _emailNotifications,
        'in_app_notifications_enabled': _inAppNotifications,
        if (_isVerifiedExpert) ...{
          'expert_available': _expertAvailable,
          'expert_open_slots': int.tryParse(_expertSlotsController.text.trim()) ?? 3,
          'expert_avg_response_hours': int.tryParse(_expertResponseController.text.trim()) ?? 48,
        },
        if (_avatarUrl != null) 'avatar': _avatarUrl,
      };

      if (rawUsername.isNotEmpty) {
        updateData['username'] = rawUsername;
      }

      await Supabase.instance.client.from('users').update(updateData).eq('id', userId);

      if (mounted) {
        ToastService.show(context, 'Profile updated successfully! 🎉');
        await Future.delayed(const Duration(milliseconds: 300));
        if (mounted) {
          Navigator.of(context).pop(true);
        }
      }
    } catch (e) {
      if (mounted) {
        String errorMsg = e.toString();
        if (errorMsg.contains('chk_users_name')) {
           errorMsg = 'Name cannot be empty.';
        }
        ToastService.show(context, 'Error saving profile: $errorMsg', isError: true);
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _confirmDeleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.themeColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Account', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to permanently delete your Patchwork account? This will remove your rooms, updates, and profile. This action cannot be undone.',
          style: TextStyle(color: context.themeColors.textSecondary, fontSize: 14, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text('Cancel', style: TextStyle(color: context.themeColors.textTertiary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete Permanently'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isSaving = true);
    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId != null) {
        // Call RPC or remove user record
        try {
          await Supabase.instance.client.rpc('delete_user_account');
        } catch (_) {
          // If RPC doesn't exist, remove from users table
          await Supabase.instance.client.from('users').delete().eq('id', userId);
        }
      }
      await Supabase.instance.client.auth.signOut();
      if (mounted) {
        ToastService.show(context, 'Your account has been deleted.');
        Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
      }
    } catch (e) {
      if (mounted) {
        ToastService.show(context, 'Failed to delete account: $e', isError: true);
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.5,
          color: context.themeColors.textTertiary,
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {int maxLines = 1, TextInputType? keyboardType, String? hintText}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFieldLabel(label),
          TextField(
            controller: controller,
            minLines: maxLines > 1 ? 3 : 1,
            maxLines: maxLines > 1 ? 6 : 1,
            keyboardType: keyboardType,
            style: TextStyle(
              color: context.themeColors.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: hintText ?? 'Enter your ${label.toLowerCase()}',
              hintStyle: TextStyle(color: context.themeColors.textTertiary.withOpacity(0.5)),
              filled: true,
              fillColor: context.themeColors.surfaceHighlight,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.themeColors.borderSubtle, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.themeColors.primary500, width: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField(String label, String value, List<String> options, ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFieldLabel(label),
          DropdownButtonFormField<String>(
            value: value.isNotEmpty && options.contains(value) ? value : options.first,
            dropdownColor: context.themeColors.surfaceHighlight,
            icon: Icon(LucideIcons.chevronDown, color: context.themeColors.textTertiary, size: 20),
            style: TextStyle(color: context.themeColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              filled: true,
              fillColor: context.themeColors.surfaceHighlight,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.themeColors.borderSubtle, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.themeColors.primary500, width: 2),
              ),
            ),
            items: options.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildSwitch(String label, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(color: context.themeColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 13)),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: context.themeColors.primary500,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Edit profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: context.themeColors.textPrimary)),
        backgroundColor: context.themeColors.background,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        actions: [
          if (_isSaving)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: context.themeColors.primary500))),
            )
          else
            Padding(
              padding: const EdgeInsets.only(right: 16.0, top: 10, bottom: 10),
              child: ElevatedButton(
                onPressed: _saveProfile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.themeColors.primary500,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  elevation: 0,
                ),
                child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: context.themeColors.primary500))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar Section
                  Center(
                    child: Column(
                      children: [
                        GestureDetector(
                          onTap: _isUploadingImage ? null : _pickAndUploadImage,
                          child: Stack(
                            children: [
                              Container(
                                width: 100,
                                height: 100,
                                decoration: BoxDecoration(
                                  color: context.themeColors.surfaceHighlight,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: context.themeColors.borderSubtle, width: 2),
                                  image: _selectedImage != null
                                      ? DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.cover)
                                      : (_avatarUrl != null && _avatarUrl!.isNotEmpty)
                                          ? DecorationImage(image: NetworkImage(_avatarUrl!), fit: BoxFit.cover)
                                          : null,
                                ),
                                child: (_selectedImage == null && (_avatarUrl == null || _avatarUrl!.isEmpty))
                                    ? Center(child: Text(_nameController.text.isNotEmpty ? _nameController.text[0].toUpperCase() : 'B', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 36)))
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
                                  child: _isUploadingImage
                                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                      : const Icon(LucideIcons.camera, color: Colors.white, size: 14),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  // Main Info
                  _buildTextField('Name', _nameController, hintText: 'Your name'),
                  _buildTextField('Username', _usernameController, hintText: '@username'),
                  _buildTextField('Bio', _bioController, maxLines: 4, hintText: 'Tell observers about yourself...'),
                  _buildTextField('Location', _cityController, hintText: 'City, Country'),
                  _buildTextField('Website', _websiteController, keyboardType: TextInputType.url),
                  
                  const SizedBox(height: 8),
                  Divider(color: context.themeColors.borderSubtle),
                  const SizedBox(height: 32),
                  
                  _buildDropdownField('Role', _role, ['builder', 'observer'], (val) {
                    if (val != null) setState(() => _role = val);
                  }),
                  _buildDropdownField('Domain', _domain, ['', 'product-manager', 'founder', 'design', 'engineering'], (val) {
                    if (val != null) setState(() => _domain = val);
                  }),
                  
                  const SizedBox(height: 8),
                  Divider(color: context.themeColors.borderSubtle),
                  const SizedBox(height: 32),

                  _buildTextField('Twitter', _twitterController, hintText: '@username'),
                  _buildTextField('GitHub', _githubController, hintText: 'github.com/username'),
                  _buildTextField('LinkedIn', _linkedinController, hintText: 'linkedin.com/in/username'),
                  
                  if (_isVerifiedExpert) ...[
                    const SizedBox(height: 8),
                    Divider(color: context.themeColors.borderSubtle),
                    const SizedBox(height: 24),
                    
                    Text('EXPERT SETTINGS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.5, color: context.themeColors.textTertiary)),
                    const SizedBox(height: 16),
                    
                    _buildSwitch('Available for requests', 'Manage your review capacity', _expertAvailable, (val) => setState(() => _expertAvailable = val)),
                    const SizedBox(height: 16),
                    
                    Row(
                      children: [
                        Expanded(child: _buildTextField('Open Slots', _expertSlotsController, keyboardType: TextInputType.number)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildTextField('Response Time (Hr)', _expertResponseController, keyboardType: TextInputType.number)),
                      ],
                    ),
                  ],

                  const SizedBox(height: 8),
                  Divider(color: context.themeColors.borderSubtle),
                  const SizedBox(height: 24),
                  
                  Text('NOTIFICATIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.5, color: context.themeColors.textTertiary)),
                  const SizedBox(height: 16),
                  
                  _buildSwitch('Email Notifications', 'Receive important updates via email', _emailNotifications, (val) => setState(() => _emailNotifications = val)),
                  _buildSwitch('In-App Notifications', 'Receive push notifications on your device', _inAppNotifications, (val) => setState(() => _inAppNotifications = val)),
                  
                  const SizedBox(height: 24),
                  Divider(color: context.themeColors.borderSubtle),
                  const SizedBox(height: 24),

                  // Danger Zone (App Store Compliance)
                  Text('DANGER ZONE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.5, color: Colors.redAccent.withOpacity(0.8))),
                  const SizedBox(height: 12),
                  
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withOpacity(0.06),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.redAccent.withOpacity(0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Delete Account', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 4),
                        Text(
                          'Permanently delete your profile, rooms, and updates. This action is irreversible.',
                          style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, height: 1.4),
                        ),
                        const SizedBox(height: 14),
                        OutlinedButton.icon(
                          onPressed: _confirmDeleteAccount,
                          icon: const Icon(LucideIcons.trash2, size: 14, color: Colors.redAccent),
                          label: const Text('Delete My Account', style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.redAccent.withOpacity(0.4)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 60),
                ],
              ),
            ),
    );
  }
}
