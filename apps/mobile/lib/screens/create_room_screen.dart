import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';

class CreateRoomScreen extends StatefulWidget {
  const CreateRoomScreen({super.key});

  @override
  State<CreateRoomScreen> createState() => _CreateRoomScreenState();
}

class _CreateRoomScreenState extends State<CreateRoomScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _primaryLinkController = TextEditingController();
  final _coverImageController = TextEditingController();
  bool _isPrivate = false;
  final List<String> _selectedTags = [];
  bool _isLoading = false;

  final List<String> _availableTags = [
    'product', 'engineering', 'design', 'research', 'marketing', 'dev'
  ];

  Future<void> _submitRoom() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Room title is required')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      // Fetch the builder's name from the users table
      final userDoc = await Supabase.instance.client
          .from('users')
          .select('name')
          .eq('id', userId)
          .maybeSingle();
      
      final builderName = (userDoc != null && userDoc['name'] != null && userDoc['name'].toString().isNotEmpty) 
          ? userDoc['name'] 
          : 'Anonymous Builder';

      // We use uuid for the id, but since we don't have the uuid package imported, 
      // let's generate a unique string ID based on timestamp and user id, or let DB handle it.
      // If the DB doesn't generate an ID automatically, we'll provide a string ID.
      final String roomId = '${userId.substring(0, 8)}-${DateTime.now().millisecondsSinceEpoch}';

      final primaryLink = _primaryLinkController.text.trim();
      final coverImageUrl = _coverImageController.text.trim();

      await Supabase.instance.client.from('rooms').insert({
        'id': roomId,
        'builder_id': userId,
        'builder_name': builderName,
        'title': title,
        'description': _descriptionController.text.trim(),
        'tags': _selectedTags.isEmpty ? ['product'] : _selectedTags,
        'primary_link': primaryLink.isNotEmpty ? primaryLink : null,
        'cover_image_url': coverImageUrl.isNotEmpty ? coverImageUrl : null,
        'is_private': _isPrivate,
      });

      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Launch a Room', style: TextStyle(fontWeight: FontWeight.bold, color: context.themeColors.textPrimary)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _submitRoom,
            child: _isLoading
                ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: context.themeColors.primary500))
                : Text('Launch', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Studio Lighting Gradient
          Positioned(
            top: -150,
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title Input
            Text('ROOM TITLE', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _titleController,
                style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  hintText: "e.g. Mobile App Redesign",
                  hintStyle: TextStyle(color: context.themeColors.textTertiary),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(20),
                ),
              ),
            ),
            
            const SizedBox(height: 32),

            // Description Input
            Text('DESCRIPTION', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _descriptionController,
                maxLines: 4,
                style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16, height: 1.5),
                decoration: InputDecoration(
                  hintText: "What are you building here? What is the goal?",
                  hintStyle: TextStyle(color: context.themeColors.textTertiary),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(20),
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Tags Selector
            Text('TAGS', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 12,
              children: _availableTags.map((tag) {
                final isSelected = _selectedTags.contains(tag);
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      if (isSelected) {
                        _selectedTags.remove(tag);
                      } else {
                        _selectedTags.add(tag);
                      }
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? context.themeColors.primary500.withOpacity(0.15) : Colors.white.withOpacity(0.02),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: isSelected ? context.themeColors.primary500.withOpacity(0.5) : Colors.white.withOpacity(0.05)),
                      boxShadow: isSelected ? [BoxShadow(color: context.themeColors.primary500.withOpacity(0.2), blurRadius: 8)] : null,
                    ),
                    child: Text(
                      tag.toUpperCase(),
                      style: TextStyle(
                        color: isSelected ? context.themeColors.primary500 : context.themeColors.textSecondary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 32),

            // Primary Link Input
            Text('PRIMARY LINK', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _primaryLinkController,
                style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16),
                decoration: InputDecoration(
                  hintText: "e.g. https://github.com/my-repo",
                  hintStyle: TextStyle(color: context.themeColors.textTertiary),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(20),
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Cover Image URL Input
            Text('COVER IMAGE URL', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _coverImageController,
                style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16),
                decoration: InputDecoration(
                  hintText: "e.g. https://example.com/image.png",
                  hintStyle: TextStyle(color: context.themeColors.textTertiary),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(20),
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Privacy Toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(LucideIcons.lock, color: context.themeColors.textSecondary, size: 20),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Private Room', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                          Text('Only you and invited members can view', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                  Switch(
                    value: _isPrivate,
                    onChanged: (val) => setState(() => _isPrivate = val),
                    activeColor: context.themeColors.primary500,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 48),

            // Help Box
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.info, color: context.themeColors.textTertiary),
                  SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'Rooms are public by default. Once launched, you can invite observers and start posting updates to the timeline.',
                      style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13, height: 1.5),
                    ),
                  )
                ],
              ),
            )
          ],
        ),
      ),
    ],
  ),
);
  }
}
