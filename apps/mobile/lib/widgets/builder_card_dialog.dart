import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import 'toast_notification.dart';

enum BuilderCardMode { global, battle }

class BuilderCardDialog extends StatefulWidget {
  final BuilderCardMode mode;
  final String name;
  final String? avatar;
  final String seniority;
  final String organization;
  final int reputationPoints;
  final Map<String, int>? capabilityMetrics;

  // Battle Mode specific
  final String? challengeTitle;
  final String? chosenOptionTitle;
  final String? stakeholderPersona;
  final String? stakeholderCritique;
  final String? defenseRationale;
  final bool isEndorsed;

  const BuilderCardDialog({
    super.key,
    required this.mode,
    required this.name,
    this.avatar,
    this.seniority = 'Product Builder',
    this.organization = '',
    this.reputationPoints = 100,
    this.capabilityMetrics,
    this.challengeTitle,
    this.chosenOptionTitle,
    this.stakeholderPersona,
    this.stakeholderCritique,
    this.defenseRationale,
    this.isEndorsed = false,
  });

  static void show(
    BuildContext context, {
    required BuilderCardMode mode,
    required String name,
    String? avatar,
    String seniority = 'Product Builder',
    String organization = '',
    int reputationPoints = 100,
    Map<String, int>? capabilityMetrics,
    String? challengeTitle,
    String? chosenOptionTitle,
    String? stakeholderPersona,
    String? stakeholderCritique,
    String? defenseRationale,
    bool isEndorsed = false,
  }) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.85),
      builder: (ctx) => BuilderCardDialog(
        mode: mode,
        name: name,
        avatar: avatar,
        seniority: seniority,
        organization: organization,
        reputationPoints: reputationPoints,
        capabilityMetrics: capabilityMetrics,
        challengeTitle: challengeTitle,
        chosenOptionTitle: chosenOptionTitle,
        stakeholderPersona: stakeholderPersona,
        stakeholderCritique: stakeholderCritique,
        defenseRationale: defenseRationale,
        isEndorsed: isEndorsed,
      ),
    );
  }

  @override
  State<BuilderCardDialog> createState() => _BuilderCardDialogState();
}

class _BuilderCardDialogState extends State<BuilderCardDialog> {
  final GlobalKey _cardKey = GlobalKey();
  bool _isExporting = false;

  String get _usernameSlug {
    final cleaned = widget.name.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toLowerCase();
    return cleaned.isNotEmpty ? cleaned : 'builder';
  }

  String get _publicPowUrl => 'https://patchwork.app/@$_usernameSlug/pow';

  Future<void> _shareImage() async {
    if (_isExporting) return;
    setState(() => _isExporting = true);
    HapticFeedback.heavyImpact();

    try {
      final boundary = _cardKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        throw Exception('Card boundary not ready');
      }

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) {
        throw Exception('Failed to generate image bytes');
      }

      final pngBytes = byteData.buffer.asUint8List();
      final shareText = widget.mode == BuilderCardMode.battle
          ? 'Confronted tough product trade-offs on Patchwork: $_publicPowUrl'
          : 'Check out my verified Proof of Work ledger on Patchwork: $_publicPowUrl';

      // ignore: deprecated_member_use
      await Share.shareXFiles(
        [
          XFile.fromData(
            pngBytes,
            mimeType: 'image/png',
            name: 'patchwork_builder_card_$_usernameSlug.png',
          ),
        ],
        text: shareText,
      );

      if (mounted) {
        ToastService.show(context, 'Builder Card exported successfully');
      }
    } catch (e) {
      if (mounted) {
        ToastService.show(context, 'Failed to export card: $e', isError: true);
      }
    } finally {
      if (mounted) {
        setState(() => _isExporting = false);
      }
    }
  }

  void _copyWebLink() {
    Clipboard.setData(ClipboardData(text: _publicPowUrl));
    HapticFeedback.lightImpact();
    ToastService.show(context, 'Public PoW link copied: $_publicPowUrl');
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Top Close row
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(LucideIcons.x, color: Colors.white70, size: 22),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // ── The Capturable Card ─────────────────────────────────────────
            RepaintBoundary(
              key: _cardKey,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF07090E), Color(0xFF0F1420), Color(0xFF090D16)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF1E293B), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withOpacity(0.08),
                      blurRadius: 30,
                      spreadRadius: 2,
                    ),
                    BoxShadow(
                      color: Colors.black.withOpacity(0.6),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header: Patchwork ID & Status Pulse
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF10B981), Color(0xFF065F46)],
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Center(
                                  child: Icon(LucideIcons.zap, color: Colors.white, size: 16),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'PATCHWORK',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF10B981),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  widget.mode == BuilderCardMode.battle ? 'BATTLE DEPLOYED' : 'VERIFIED PROOF',
                                  style: const TextStyle(
                                    color: Color(0xFF10B981),
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // User Identity Block
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 26,
                            backgroundColor: const Color(0xFF1E293B),
                            backgroundImage: widget.avatar != null && widget.avatar!.isNotEmpty
                                ? CachedNetworkImageProvider(widget.avatar!)
                                : null,
                            child: widget.avatar == null || widget.avatar!.isEmpty
                                ? Text(
                                    widget.name.isNotEmpty ? widget.name[0].toUpperCase() : 'B',
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.2,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  widget.organization.isNotEmpty
                                      ? '${widget.seniority} · ${widget.organization}'
                                      : widget.seniority,
                                  style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          // Rep Pill
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                            ),
                            child: Column(
                              children: [
                                const Text(
                                  'REP',
                                  style: TextStyle(
                                    color: Color(0xFFF59E0B),
                                    fontSize: 8.5,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.6,
                                  ),
                                ),
                                Text(
                                  '${widget.reputationPoints}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 18),
                      const Divider(color: Color(0xFF1E293B), height: 1),
                      const SizedBox(height: 16),

                      // Card Content Based on Mode
                      if (widget.mode == BuilderCardMode.global)
                        _buildGlobalContent()
                      else
                        _buildBattleContent(),

                      const SizedBox(height: 20),
                      const Divider(color: Color(0xFF1E293B), height: 1),
                      const SizedBox(height: 14),

                      // Footer URL strip
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(LucideIcons.globe, color: Color(0xFF64748B), size: 12),
                              const SizedBox(width: 5),
                              Text(
                                'patchwork.app/@$_usernameSlug/pow',
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          const Text(
                            'LIVING PROOF OF WORK',
                            style: TextStyle(
                              color: Color(0xFF475569),
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // ── Action Buttons ──────────────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _copyWebLink,
                    icon: const Icon(LucideIcons.link, size: 16, color: Colors.white),
                    label: const Text('Copy Link', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFF334155)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: _isExporting ? null : _shareImage,
                    icon: _isExporting
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(LucideIcons.share2, size: 16, color: Colors.white),
                    label: Text(
                      _isExporting ? 'Generating...' : 'Export Builder Card ↗',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGlobalContent() {
    final metrics = widget.capabilityMetrics ?? {
      'Velocity': 88,
      'Trust': 94,
      'Revenue': 82,
      'Risk Mit.': 90,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(LucideIcons.radar, color: Color(0xFF10B981), size: 14),
            SizedBox(width: 6),
            Text(
              'STRATEGIC CAPABILITY PROFILE',
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Capability Matrix Bars
        ...metrics.entries.map((entry) {
          final double val = (entry.value / 100).clamp(0.0, 1.0);
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      entry.key,
                      style: const TextStyle(color: Colors.white70, fontSize: 11.5, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '${entry.value}%',
                      style: const TextStyle(color: Color(0xFF10B981), fontSize: 11.5, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: val,
                    minHeight: 5,
                    backgroundColor: const Color(0xFF1E293B),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildBattleContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.challengeTitle != null) ...[
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.swords, color: Color(0xFFF59E0B), size: 14),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.challengeTitle!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Chosen Move
        if (widget.chosenOptionTitle != null) ...[
          const Text(
            'EXECUTED MOVE',
            style: TextStyle(
              color: Color(0xFF64748B),
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.checkCircle2, color: Color(0xFF10B981), size: 14),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.chosenOptionTitle!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Confrontation & Defense
        if (widget.stakeholderPersona != null) ...[
          Row(
            children: [
              const Icon(LucideIcons.shieldAlert, color: Color(0xFFF43F5E), size: 13),
              const SizedBox(width: 6),
              Text(
                'CONFRONTED: ${widget.stakeholderPersona!.toUpperCase()}',
                style: const TextStyle(
                  color: Color(0xFFF43F5E),
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
        ],

        if (widget.defenseRationale != null && widget.defenseRationale!.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B).withOpacity(0.5),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'DEFENSE RATIONALE',
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 8.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '"${widget.defenseRationale!}"',
                  style: const TextStyle(
                    color: Color(0xFFE2E8F0),
                    fontSize: 11,
                    fontStyle: FontStyle.italic,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],

        if (widget.isEndorsed) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withOpacity(0.15),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.5)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.crown, color: Color(0xFFF59E0B), size: 13),
                SizedBox(width: 6),
                Text(
                  'SENIOR CREATOR ENDORSED',
                  style: TextStyle(
                    color: Color(0xFFF59E0B),
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
