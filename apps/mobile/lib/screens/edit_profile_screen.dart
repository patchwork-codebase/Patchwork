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

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {int maxLines = 1, TextInputType? keyboardType}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            maxLines: maxLines,
            keyboardType: keyboardType,
            style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              prefixIcon: maxLines == 1 ? Icon(icon, color: context.themeColors.textTertiary, size: 18) : null,
              filled: true,
              fillColor: Colors.white.withOpacity(0.02),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withOpacity(0.05))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withOpacity(0.05))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: context.themeColors.primary500)),
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
          Text(label, style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: value.isNotEmpty && options.contains(value) ? value : options.first,
                dropdownColor: context.themeColors.surfaceHighlight,
                icon: Icon(LucideIcons.chevronDown, color: context.themeColors.textTertiary),
                style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15),
                isExpanded: true,
                items: options.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                onChanged: onChanged,
              ),
            ),
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
                Text(label, style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12)),
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
        title: const Text('Edit Profile'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isSaving ? null : () {
          HapticFeedback.lightImpact();
          _saveProfile();
        },
        backgroundColor: context.themeColors.primary500,
        foregroundColor: Colors.white,
        icon: _isSaving 
          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Icon(LucideIcons.save),
        label: const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold)),
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
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Avatar
                      GestureDetector(
                    onTap: _isUploadingImage ? null : _pickAndUploadImage,
                    child: Container(
                      width: 100, height: 100,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: context.themeColors.primary500.withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: context.themeColors.primary500.withOpacity(0.3), width: 2),
                        // Prefer local file preview; fall back to network URL
                        image: _selectedImage != null
                            ? DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.cover)
                            : (_avatarUrl != null && _avatarUrl!.isNotEmpty)
                                ? DecorationImage(image: NetworkImage(_avatarUrl!), fit: BoxFit.cover)
                                : null,
                      ),
                      child: Stack(
                        children: [
                          if (_selectedImage == null && (_avatarUrl == null || _avatarUrl!.isEmpty))
                            Center(child: Text(_nameController.text.isNotEmpty ? _nameController.text[0].toUpperCase() : 'B', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.w900, fontSize: 40))),
                          if (_isUploadingImage)
                            Container(
                              decoration: const BoxDecoration(color: Colors.black38, shape: BoxShape.circle),
                              child: Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                            ),
                          Positioned(
                            right: 0, bottom: 0,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: context.themeColors.primary500, shape: BoxShape.circle),
                              child: const Icon(LucideIcons.camera, color: Colors.white, size: 16),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  Text('Tap to change avatar', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12)),
                  const SizedBox(height: 32),
                  
                  _buildTextField('FULL NAME', _nameController, LucideIcons.user),
                  _buildTextField('BIO', _bioController, LucideIcons.fileText, maxLines: 4),
                  _buildTextField('LOCATION (CITY, COUNTRY)', _cityController, LucideIcons.mapPin),
                  _buildDropdownField('PRIMARY ROLE', _role, ['builder', 'observer'], (val) {
                    if (val != null) setState(() => _role = val);
                  }),
                  _buildDropdownField('DOMAIN', _domain, ['', 'product-manager', 'founder', 'design', 'engineering'], (val) {
                    if (val != null) setState(() => _domain = val);
                  }),
                  
                  const SizedBox(height: 16),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 24),
                  
                  Text('SOCIAL LINKS', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                  const SizedBox(height: 16),
                  _buildTextField('WEBSITE', _websiteController, LucideIcons.globe),
                  _buildTextField('TWITTER', _twitterController, LucideIcons.twitter),
                  _buildTextField('GITHUB', _githubController, LucideIcons.github),
                  _buildTextField('LINKEDIN', _linkedinController, LucideIcons.linkedin),
                  
                  if (_isVerifiedExpert) ...[
                    const SizedBox(height: 8),
                    const Divider(color: Colors.white10),
                    const SizedBox(height: 24),
                    Text('EXPERT AVAILABILITY', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                    const SizedBox(height: 16),
                    _buildSwitch('Available for requests', 'Manage your review capacity', _expertAvailable, (val) => setState(() => _expertAvailable = val)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _buildTextField('OPEN SLOTS', _expertSlotsController, LucideIcons.users, keyboardType: TextInputType.number)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildTextField('AVG RESPONSE (HRS)', _expertResponseController, LucideIcons.clock, keyboardType: TextInputType.number)),
                      ],
                    ),
                  ],

                  const SizedBox(height: 8),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 24),
                  
                  Text('NOTIFICATION PREFERENCES', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                  const SizedBox(height: 16),
                  _buildSwitch('Email Notifications', 'Receive important updates via email', _emailNotifications, (val) => setState(() => _emailNotifications = val)),
                  _buildSwitch('In-App Notifications', 'Receive push notifications on your device', _inAppNotifications, (val) => setState(() => _inAppNotifications = val)),
                  
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ],
        ),
    );
  }
}
