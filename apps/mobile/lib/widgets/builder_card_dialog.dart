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
  bool _isLandscapeRatio = false;

  String get _usernameSlug {
    final cleaned = widget.name.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toLowerCase();
    return cleaned.isNotEmpty ? cleaned : 'builder';
  }

  String get _publicPowUrl => 'https://www.joinpatchwork.xyz/@$_usernameSlug/pow';

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
            name: 'patchwork_certificate_${_isLandscapeRatio ? "landscape" : "portrait"}_$_usernameSlug.png',
          ),
        ],
        text: shareText,
      );

      if (mounted) {
        ToastService.show(context, 'Certificate exported successfully');
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
      insetPadding: EdgeInsets.symmetric(
        horizontal: _isLandscapeRatio ? 12 : 20,
        vertical: 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Top Controls row: Ratio switcher & Close
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Ratio Toggle Pill
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.12)),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          if (_isLandscapeRatio) {
                            HapticFeedback.selectionClick();
                            setState(() => _isLandscapeRatio = false);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: !_isLandscapeRatio ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                LucideIcons.smartphone,
                                size: 12,
                                color: !_isLandscapeRatio ? const Color(0xFF0F172A) : Colors.white60,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Portrait',
                                style: TextStyle(
                                  color: !_isLandscapeRatio ? const Color(0xFF0F172A) : Colors.white60,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          if (!_isLandscapeRatio) {
                            HapticFeedback.selectionClick();
                            setState(() => _isLandscapeRatio = true);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _isLandscapeRatio ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                LucideIcons.monitor,
                                size: 12,
                                color: _isLandscapeRatio ? const Color(0xFF0F172A) : Colors.white60,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Diploma 16:9',
                                style: TextStyle(
                                  color: _isLandscapeRatio ? const Color(0xFF0F172A) : Colors.white60,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(LucideIcons.x, color: Colors.white70, size: 22),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // ── The Capturable Physical Archival Diploma ────────────────────
            RepaintBoundary(
              key: _cardKey,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFFBF9F5), // Archival ivory parchment paper
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFD6D3D1), width: 1.5), // Outer blind deboss border
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.35),
                      blurRadius: 28,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Container(
                  margin: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE7E5E4), width: 0.8), // Inner hairline frame
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Institutional Top Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: const Color(0xFF292524), width: 1.2),
                                ),
                                child: const Center(
                                  child: Text(
                                    'P',
                                    style: TextStyle(
                                      color: Color(0xFF1C1917),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'serif',
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 7),
                              const Text(
                                'PATCHWORK PROTOCOL',
                                style: TextStyle(
                                  color: Color(0xFF292524),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.6,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            'FOLIO № PW-${widget.reputationPoints.toString().padLeft(4, '0')}',
                            style: const TextStyle(
                              color: Color(0xFF78716C),
                              fontSize: 11,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Classical Diploma Title
                      const Text(
                        'CERTIFICATE OF PROOF OF WORK',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF1C1917),
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'serif',
                          letterSpacing: 1.8,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Container(
                        width: 48,
                        height: 1,
                        color: const Color(0xFF78716C),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        'IN RECOGNITION OF VERIFIED PRODUCT EXECUTION & PEER CONSENSUS',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF78716C),
                          fontSize: 7.5,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.4,
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Recipient Section (Honoree)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (widget.avatar != null && widget.avatar!.isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFFD6D3D1), width: 1.2),
                              ),
                              child: CircleAvatar(
                                radius: 18,
                                backgroundColor: const Color(0xFFE7E5E4),
                                backgroundImage: CachedNetworkImageProvider(widget.avatar!),
                              ),
                            ),
                            const SizedBox(width: 10),
                          ],
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text(
                                  widget.name,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Color(0xFF1C1917),
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800,
                                    fontFamily: 'serif',
                                    letterSpacing: 0.2,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  widget.organization.isNotEmpty
                                      ? '${widget.seniority} · ${widget.organization}'
                                      : widget.seniority,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Color(0xFF57534E),
                                    fontSize: 11,
                                    fontStyle: FontStyle.italic,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Content Based on Mode
                      if (widget.mode == BuilderCardMode.global)
                        _buildGlobalContent()
                      else
                        _buildBattleContent(),

                      const SizedBox(height: 14),

                      // Diploma Attestation & Seal Footer
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          // Left: Registrar & Consensus Signature
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(LucideIcons.checkCheck, color: Color(0xFF059669), size: 12),
                                  SizedBox(width: 4),
                                  Text(
                                    'ATTESTED VIA CONSENSUS',
                                    style: TextStyle(
                                      color: Color(0xFF44403C),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'joinpatchwork.xyz/@$_usernameSlug/pow',
                                style: const TextStyle(
                                  color: Color(0xFF78716C),
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),

                          // Right: Classical Circular Embossed Seal
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F5F4),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFD6D3D1), width: 1),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(LucideIcons.award, color: Color(0xFF1C1917), size: 13),
                                const SizedBox(width: 5),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'VERIFIED',
                                      style: TextStyle(
                                        color: Color(0xFF1C1917),
                                        fontSize: 7.5,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                    Text(
                                      'REP: ${widget.reputationPoints}',
                                      style: const TextStyle(
                                        color: Color(0xFF57534E),
                                        fontSize: 11,
                                        fontFamily: 'monospace',
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
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
                      _isExporting ? 'Generating...' : 'Export Certificate ↗',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A), // Premium dark executive button
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

    final entries = metrics.entries.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Transcript Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'ASSESSED COMPETENCY TRANSCRIPT',
              style: TextStyle(
                color: Color(0xFF78716C),
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.0,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
              decoration: BoxDecoration(
                color: const Color(0xFFE7E5E4),
                borderRadius: BorderRadius.circular(3),
              ),
              child: const Text(
                'PEER EVALUATED',
                style: TextStyle(
                  color: Color(0xFF44403C),
                  fontSize: 7.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Clean 2-column tabular diploma transcript
        LayoutBuilder(
          builder: (context, constraints) {
            final colWidth = (constraints.maxWidth - 8) / 2;
            return Wrap(
              spacing: 8,
              runSpacing: 6,
              children: entries.map((entry) {
                final double val = (entry.value / 100).clamp(0.0, 1.0);
                return SizedBox(
                  width: colWidth,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFE7E5E4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                entry.key,
                                style: const TextStyle(
                                  color: Color(0xFF292524),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              '${entry.value}%',
                              style: const TextStyle(
                                color: Color(0xFF1C1917),
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        // Understated ink gauge on paper
                        ClipRRect(
                          borderRadius: BorderRadius.circular(2),
                          child: LinearProgressIndicator(
                            value: val,
                            minHeight: 2.5,
                            backgroundColor: const Color(0xFFF5F5F4),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF292524)),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildBattleContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.challengeTitle != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFE7E5E4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'EXAMINED SCENARIO',
                  style: TextStyle(
                    color: Color(0xFF78716C),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  widget.challengeTitle!,
                  style: const TextStyle(
                    color: Color(0xFF1C1917),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],

        // Executed Move
        if (widget.chosenOptionTitle != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F4),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFD6D3D1)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.check, color: Color(0xFF059669), size: 13),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    widget.chosenOptionTitle!,
                    style: const TextStyle(
                      color: Color(0xFF1C1917),
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
          const SizedBox(height: 8),
        ],

        // Confrontation & Defense
        if (widget.stakeholderPersona != null) ...[
          Text(
            'OPPOSING STAKEHOLDER: ${widget.stakeholderPersona!.toUpperCase()}',
            style: const TextStyle(
              color: Color(0xFF78716C),
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 4),
        ],

        if (widget.defenseRationale != null && widget.defenseRationale!.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFE7E5E4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'DEFENSE RATIONALE',
                  style: TextStyle(
                    color: Color(0xFF78716C),
                    fontSize: 7.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '"${widget.defenseRationale!}"',
                  style: const TextStyle(
                    color: Color(0xFF292524),
                    fontSize: 11.5,
                    fontStyle: FontStyle.italic,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],

        if (widget.isEndorsed) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F4),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: const Color(0xFFD6D3D1)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.award, color: Color(0xFFB45309), size: 12),
                SizedBox(width: 5),
                Text(
                  'PEER ACCREDITATION ENDORSED',
                  style: TextStyle(
                    color: Color(0xFF92400E),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
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
