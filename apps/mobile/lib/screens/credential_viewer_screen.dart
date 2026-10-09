import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/rendering.dart';
import 'dart:ui' as ui;
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import '../theme.dart';

class CredentialViewerScreen extends StatefulWidget {
  final String credentialId;
  final String title;

  const CredentialViewerScreen({
    super.key,
    required this.credentialId,
    required this.title,
  });

  @override
  State<CredentialViewerScreen> createState() => _CredentialViewerScreenState();
}

class _CredentialViewerScreenState extends State<CredentialViewerScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _credentialData;
  final GlobalKey _certificateKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _fetchCredential();
  }

  Future<void> _fetchCredential() async {
    try {
      final res = await Supabase.instance.client
          .from('user_badges')
          .select('id, issued_at, users(name), badges(id, title, description, badge_type, icon_name, color_theme, points_required)')
          .eq('id', widget.credentialId)
          .maybeSingle();

      if (mounted && res != null) {
        setState(() {
          _credentialData = res;
          _isLoading = false;
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching credential: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _shareOrDownloadCredential({bool downloadOnly = false}) async {
    if (_credentialData == null) return;
    
    try {
      final boundary = _certificateKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;

      // Show loading indicator
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preparing certificate...'), duration: Duration(seconds: 1))
      );
      
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      final pngBytes = byteData!.buffer.asUint8List();

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/patchwork_credential_${widget.credentialId}.png');
      await file.writeAsBytes(pngBytes);

      final badge = _credentialData!['badges'] as Map<String, dynamic>?;
      final title = badge?['title'] ?? widget.title;
      final text = 'I just earned the "$title" milestone on Patchwork! Check out my builder profile and journey.';

      final xfile = XFile(file.path);
      await Share.shareXFiles([xfile], text: downloadOnly ? null : text);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error generating certificate: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.themeColors.background,
      appBar: AppBar(
        title: Text('Verified Credential', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 13)),
        backgroundColor: context.themeColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: context.themeColors.textPrimary),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.download),
            tooltip: 'Download',
            onPressed: () => _shareOrDownloadCredential(downloadOnly: true),
          ),
          IconButton(
            icon: const Icon(LucideIcons.share2),
            tooltip: 'Share',
            onPressed: () => _shareOrDownloadCredential(downloadOnly: false),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _credentialData == null
              ? Center(
                  child: Text('Credential not found', style: TextStyle(color: context.themeColors.textSecondary)),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      // The Certificate Card
                      _buildCertificateCard(context),
                      
                      const SizedBox(height: 32),
                      
                      // About this credential section
                      _buildAboutSection(context),
                    ],
                  ),
                ),
    );
  }

  Widget _buildCertificateCard(BuildContext context) {
    final badge = _credentialData!['badges'] as Map<String, dynamic>;
    final user = _credentialData!['users'] as Map<String, dynamic>?;
    
    final recipientName = user?['name'] ?? 'Awesome Builder';
    final title = badge['title'] ?? 'Milestone Achieved';
    final badgeType = badge['badge_type']?.toString().toUpperCase() ?? 'ACHIEVEMENT';
    
    String dateStr = 'Unknown Date';
    if (_credentialData!['issued_at'] != null) {
      final dt = DateTime.parse(_credentialData!['issued_at']);
      dateStr = DateFormat.yMMMMd('en_US').format(dt);
    }

    final points = badge['points_required']?.toString();

    return RepaintBoundary(
      key: _certificateKey,
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: const Color(0xFFFAFAFA),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF5A5EEA), width: 3),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, spreadRadius: -5),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(13),
          child: Stack(
            children: [
              // Background Watermark / Pattern
              Positioned(
                right: -40,
                bottom: -40,
                child: Icon(LucideIcons.award, size: 170, color: Colors.black.withOpacity(0.03)),
              ),
              
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFF5A5EEA),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Center(child: Text('P', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17))),
                        ),
                        const SizedBox(width: 12),
                        const Text('PATCHWORK', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 1.2)),
                      ],
                    ),
                    
                    const SizedBox(height: 24),
                    
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.black12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'MILESTONE $badgeType',
                        style: const TextStyle(color: Color(0xFF5A5EEA), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 2.0),
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    const Text('This is to certify that', style: TextStyle(color: Colors.black54, fontSize: 11)),
                    
                    const SizedBox(height: 12),
                    
                    // Recipient Name
                    Text(
                      recipientName,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: 'Georgia', // Using a generic serif font fallback
                        color: Color(0xFF4F46E5), 
                        fontSize: 27, 
                        fontWeight: FontWeight.bold,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    
                    const SizedBox(height: 12),
                    
                    const Text('has successfully achieved the milestone', style: TextStyle(color: Colors.black54, fontSize: 11)),
                    
                    const SizedBox(height: 16),
                    
                    // Milestone Title
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Color(0xFF0F172A), fontSize: 20, fontWeight: FontWeight.w900),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Footer details
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        // Left: Date
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('AWARDED ON', style: const TextStyle(color: Colors.black45, fontSize: 11, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(dateStr, style: const TextStyle(color: Colors.black87, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        
                        // Center/Right: Points or Icon
                        if (points != null)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('POINTS VALUE', style: const TextStyle(color: Colors.black45, fontSize: 11, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('$points XP', style: const TextStyle(color: Color(0xFF4F46E5), fontSize: 13, fontWeight: FontWeight.w900)),
                            ],
                          )
                        else
                          Icon(LucideIcons.medal, color: const Color(0xFF5A5EEA), size: 27),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAboutSection(BuildContext context) {
    final badge = _credentialData!['badges'] as Map<String, dynamic>;
    final description = badge['description'] ?? "This certificate represents a significant milestone within the Patchwork ecosystem, recognizing outstanding contribution, consistent participation, and proven expertise in collaborative building environments. Verified through cryptographic proof-of-work, it stands as a testament to the recipient's dedication.";
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.themeColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.themeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.info, size: 17, color: context.themeColors.textPrimary),
              const SizedBox(width: 8),
              Text('About this credential', style: TextStyle(color: context.themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            description,
            style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, height: 1.5),
          ),
          const SizedBox(height: 24),
          const Divider(height: 1),
          const SizedBox(height: 16),
          Text('Credential ID', style: TextStyle(color: context.themeColors.textTertiary, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            widget.credentialId,
            style: TextStyle(color: context.themeColors.textSecondary, fontSize: 11, fontFamily: 'monospace'),
          ),
        ],
      ),
    );
  }
}
