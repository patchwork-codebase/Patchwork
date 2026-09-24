import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/services.dart';
import '../theme.dart';

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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load profile: $e')));
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

      // Read bytes directly from XFile — works on all platforms (avoids dart:io _Namespace error)
      final bytes = await pickedFile.readAsBytes();
      final fileExt = pickedFile.path.split('.').last.toLowerCase();
      final mimeType = fileExt == 'png' ? 'image/png' : 'image/jpeg';
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$userId.$fileExt';
      final filePath = 'avatars/$fileName';

      // Upload bytes to Supabase Storage
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
          // Show preview from local bytes while the network URL propagates
          _selectedImage = kIsWeb ? null : File(pickedFile.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: $e'),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        setState(() => _selectedImage = null);
      }
    } finally {
      if (mounted) setState(() => _isUploadingImage = false);
    }
  }

  Future<void> _saveProfile() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _isSaving = true);
    try {
      await Supabase.instance.client.from('users').update({
        'name': _nameController.text.trim(),
        'city': _cityController.text.trim(),
        'bio': _bioController.text.trim(),
        'role': _role,
        'domain': _domain,
        'website': _websiteController.text.trim(),
        'twitter': _twitterController.text.trim(),
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
      }).eq('id', userId);

      if (mounted) {
        Navigator.of(context).pop(true); // Return true to signal refresh
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving profile: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, bottom: 8),
            child: Text(
              title,
              style: TextStyle(
                color: context.themeColors.textTertiary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: context.themeColors.surfaceHighlight.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: children.asMap().entries.map((entry) {
                final int index = entry.key;
                final Widget item = entry.value;
                return Column(
                  children: [
                    item,
                    if (index < children.length - 1)
                      Divider(
                        height: 1,
                        thickness: 1,
                        color: context.themeColors.borderSubtle.withOpacity(0.3),
                        indent: 16, // Indent to match iOS style
                      ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {int maxLines = 1, TextInputType? keyboardType}) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: maxLines > 1 ? 12 : 4),
      child: Row(
        crossAxisAlignment: maxLines > 1 ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                color: context.themeColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: TextField(
              controller: controller,
              maxLines: maxLines,
              keyboardType: keyboardType,
              style: TextStyle(
                color: context.themeColors.textSecondary,
                fontSize: 16,
                fontWeight: FontWeight.w400,
              ),
              decoration: InputDecoration(
                isDense: true,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                hintText: 'Enter $label',
                hintStyle: TextStyle(color: context.themeColors.textTertiary.withOpacity(0.5)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField(String label, String value, List<String> options, ValueChanged<String?> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                color: context.themeColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: value.isNotEmpty && options.contains(value) ? value : options.first,
                dropdownColor: context.themeColors.surfaceHighlight,
                icon: Icon(LucideIcons.chevronRight, color: context.themeColors.textTertiary, size: 18),
                style: TextStyle(color: context.themeColors.textSecondary, fontWeight: FontWeight.w400, fontSize: 16),
                isExpanded: true,
                alignment: Alignment.centerRight,
                items: options.map((opt) => DropdownMenuItem(value: opt, child: Align(alignment: Alignment.centerRight, child: Text(opt)))).toList(),
                onChanged: onChanged,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSwitch(String label, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.w500, fontSize: 16)),
                const SizedBox(height: 2),
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
        title: const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 17)),
        backgroundColor: context.themeColors.background,
        elevation: 0,
        centerTitle: true,
        actions: [
          if (_isSaving)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
            )
          else
            TextButton(
              onPressed: _saveProfile,
              child: Text(
                'Save',
                style: TextStyle(
                  color: context.themeColors.primary500,
                  fontWeight: FontWeight.w600,
                  fontSize: 17,
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: context.themeColors.primary500))
          : Stack(
              children: [
                // Studio Lighting Gradient
                Positioned(
                  top: -100,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: 400,
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        colors: [
                          context.themeColors.primary500.withOpacity(0.12),
                          Colors.purple.withOpacity(0.05),
                          Colors.transparent,
                        ],
                        radius: 0.8,
                      ),
                    ),
                  ),
                ),
                SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Minimalist Avatar
                      GestureDetector(
                        onTap: _isUploadingImage ? null : _pickAndUploadImage,
                        child: Container(
                          width: 80, height: 80,
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: context.themeColors.surfaceHighlight,
                            shape: BoxShape.circle,
                            border: Border.all(color: context.themeColors.borderSubtle, width: 1),
                            image: _selectedImage != null
                                ? DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.cover)
                                : (_avatarUrl != null && _avatarUrl!.isNotEmpty)
                                    ? DecorationImage(image: NetworkImage(_avatarUrl!), fit: BoxFit.cover)
                                    : null,
                          ),
                          child: Stack(
                            children: [
                              if (_selectedImage == null && (_avatarUrl == null || _avatarUrl!.isEmpty))
                                Center(child: Text(_nameController.text.isNotEmpty ? _nameController.text[0].toUpperCase() : 'B', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.w500, fontSize: 32))),
                              if (_isUploadingImage)
                                Container(
                                  decoration: const BoxDecoration(color: Colors.black26, shape: BoxShape.circle),
                                  child: Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                                ),
                            ],
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: _isUploadingImage ? null : _pickAndUploadImage,
                        child: Text('Edit picture', style: TextStyle(color: context.themeColors.primary500, fontSize: 13, fontWeight: FontWeight.w500)),
                      ),
                      const SizedBox(height: 32),
                      
                      _buildSection('Personal Information', [
                        _buildTextField('Name', _nameController, LucideIcons.user),
                        _buildTextField('Bio', _bioController, LucideIcons.fileText, maxLines: 4),
                        _buildTextField('Location', _cityController, LucideIcons.mapPin),
                        _buildDropdownField('Role', _role, ['builder', 'observer'], (val) {
                          if (val != null) setState(() => _role = val);
                        }),
                        _buildDropdownField('Domain', _domain, ['', 'product-manager', 'founder', 'design', 'engineering'], (val) {
                          if (val != null) setState(() => _domain = val);
                        }),
                      ]),
                      
                      _buildSection('Social Links', [
                        _buildTextField('Website', _websiteController, LucideIcons.globe),
                        _buildTextField('Twitter', _twitterController, LucideIcons.twitter),
                        _buildTextField('GitHub', _githubController, LucideIcons.github),
                        _buildTextField('LinkedIn', _linkedinController, LucideIcons.linkedin),
                      ]),
                      
                      if (_isVerifiedExpert) 
                        _buildSection('Expert Availability', [
                          _buildSwitch('Available for requests', 'Manage your review capacity', _expertAvailable, (val) => setState(() => _expertAvailable = val)),
                          _buildTextField('Open Slots', _expertSlotsController, LucideIcons.users, keyboardType: TextInputType.number),
                          _buildTextField('Response Time', _expertResponseController, LucideIcons.clock, keyboardType: TextInputType.number),
                        ]),

                      _buildSection('Notification Preferences', [
                        _buildSwitch('Email Notifications', 'Receive important updates via email', _emailNotifications, (val) => setState(() => _emailNotifications = val)),
                        _buildSwitch('In-App Notifications', 'Receive push notifications on your device', _inAppNotifications, (val) => setState(() => _inAppNotifications = val)),
                      ]),
                      
                      const SizedBox(height: 60),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
