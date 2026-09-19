import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme.dart';

class EditRoomScreen extends StatefulWidget {
  final Map<String, dynamic> initialRoomData;

  const EditRoomScreen({super.key, required this.initialRoomData});

  @override
  State<EditRoomScreen> createState() => _EditRoomScreenState();
}

class _EditRoomScreenState extends State<EditRoomScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  late TextEditingController _titleController;
  late TextEditingController _descController;
  late TextEditingController _primaryLinkController;
  late bool _isPrivate;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.initialRoomData['title'] ?? '');
    _descController = TextEditingController(text: widget.initialRoomData['description'] ?? '');
    _primaryLinkController = TextEditingController(text: widget.initialRoomData['primary_link'] ?? '');
    _isPrivate = widget.initialRoomData['is_private'] == true;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _primaryLinkController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);

    try {
      await Supabase.instance.client.from('rooms').update({
        'title': _titleController.text.trim(),
        'description': _descController.text.trim(),
        'primary_link': _primaryLinkController.text.trim(),
        'is_private': _isPrivate,
      }).eq('id', widget.initialRoomData['id']);

      if (mounted) {
        Navigator.of(context).pop(true); // Return true to signal refresh
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
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
        title: Text('Edit Room Settings', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 16)),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _handleSave,
            child: _isLoading 
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : Text('Save', style: TextStyle(color: context.themeColors.primary500, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Room Title', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _titleController,
                validator: (val) => val == null || val.isEmpty ? 'Title is required' : null,
                style: TextStyle(color: context.themeColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'e.g. Project Orion',
                  hintStyle: TextStyle(color: context.themeColors.textTertiary),
                  filled: true,
                  fillColor: context.themeColors.borderSubtle.withOpacity(0.3),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),
              
              Text('Description', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descController,
                maxLines: 4,
                style: TextStyle(color: context.themeColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'What is this room about?',
                  hintStyle: TextStyle(color: context.themeColors.textTertiary),
                  filled: true,
                  fillColor: context.themeColors.borderSubtle.withOpacity(0.3),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),
              
              Text('Primary Link (Optional)', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _primaryLinkController,
                style: TextStyle(color: context.themeColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'https://...',
                  hintStyle: TextStyle(color: context.themeColors.textTertiary),
                  filled: true,
                  fillColor: context.themeColors.borderSubtle.withOpacity(0.3),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('Private Room', style: TextStyle(color: context.themeColors.textPrimary, fontWeight: FontWeight.bold)),
                subtitle: Text('Only you and invited members can view this room.', style: TextStyle(color: context.themeColors.textSecondary, fontSize: 13)),
                value: _isPrivate,
                activeColor: context.themeColors.primary500,
                onChanged: (val) => setState(() => _isPrivate = val),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
