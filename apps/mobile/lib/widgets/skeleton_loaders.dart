import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme.dart';

class SkeletonBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  final EdgeInsetsGeometry margin;

  const SkeletonBox({
    super.key,
    this.width = double.infinity,
    this.height = double.infinity,
    this.borderRadius = 16,
    this.margin = EdgeInsets.zero,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: context.themeColors.surfaceHighlight,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    )
    .animate(onPlay: (controller) => controller.repeat())
    .shimmer(
      duration: 1500.ms,
      color: Colors.white.withOpacity(0.1),
      angle: 1.0,
    );
  }
}

class SkeletonCircle extends StatelessWidget {
  final double size;
  final EdgeInsetsGeometry margin;

  const SkeletonCircle({
    super.key,
    required this.size,
    this.margin = EdgeInsets.zero,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      margin: margin,
      decoration: BoxDecoration(
        color: context.themeColors.surfaceHighlight,
        shape: BoxShape.circle,
      ),
    )
    .animate(onPlay: (controller) => controller.repeat())
    .shimmer(
      duration: 1500.ms,
      color: Colors.white.withOpacity(0.1),
      angle: 1.0,
    );
  }
}

class BuilderDashboardSkeleton extends StatelessWidget {
  const BuilderDashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        bottom: 120,
        left: 16,
        right: 16,
      ),
      physics: const NeverScrollableScrollPhysics(),
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const SkeletonBox(width: 44, height: 44, borderRadius: 14),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    SkeletonBox(width: 60, height: 12, borderRadius: 4, margin: EdgeInsets.only(bottom: 4)),
                    SkeletonBox(width: 120, height: 20, borderRadius: 4),
                  ],
                ),
              ],
            ),
            const SkeletonBox(width: 40, height: 40, borderRadius: 12),
          ],
        ),
        const SizedBox(height: 24),
        
        // Bento Grid
        SizedBox(
          height: 140,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Expanded(flex: 5, child: SkeletonBox(borderRadius: 28)),
              const SizedBox(width: 12),
              Expanded(
                flex: 4,
                child: Column(
                  children: const [
                    Expanded(child: SkeletonBox(borderRadius: 24)),
                    SizedBox(height: 12),
                    Expanded(child: SkeletonBox(borderRadius: 24)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        
        // Workspaces
        const SkeletonBox(width: 100, height: 14, borderRadius: 4),
        const SizedBox(height: 16),
        Row(
          children: const [
            SkeletonBox(width: 80, height: 36, borderRadius: 20),
            SizedBox(width: 8),
            SkeletonBox(width: 100, height: 36, borderRadius: 20),
            SizedBox(width: 8),
            SkeletonBox(width: 90, height: 36, borderRadius: 20),
          ],
        ),
        const SizedBox(height: 16),
        const SkeletonBox(height: 180, borderRadius: 28),
        
        const SizedBox(height: 32),
        const SkeletonBox(height: 140, borderRadius: 28),
      ],
    );
  }
}

class ObserverDashboardSkeleton extends StatelessWidget {
  const ObserverDashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      physics: const NeverScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 20, 20, 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const SkeletonCircle(size: 40),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        SkeletonBox(width: 60, height: 12, borderRadius: 4, margin: EdgeInsets.only(bottom: 4)),
                        SkeletonBox(width: 120, height: 16, borderRadius: 4),
                      ],
                    ),
                  ],
                ),
                const SkeletonBox(width: 36, height: 36, borderRadius: 12),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 90,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 4,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, __) => const SkeletonBox(width: 100, height: 90, borderRadius: 16),
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: const [
                SkeletonBox(width: 60, height: 32, borderRadius: 16),
                SizedBox(width: 8),
                SkeletonBox(width: 80, height: 32, borderRadius: 16),
                SizedBox(width: 8),
                SkeletonBox(width: 70, height: 32, borderRadius: 16),
              ],
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 20)),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) => const Padding(
              padding: EdgeInsets.only(left: 20, right: 20, bottom: 16),
              child: SkeletonBox(height: 220, borderRadius: 20),
            ),
            childCount: 3,
          ),
        ),
      ],
    );
  }
}

class FeedCardSkeleton extends StatelessWidget {
  const FeedCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: context.themeColors.borderSubtle, width: 1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SkeletonCircle(size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    SkeletonBox(width: 100, height: 14, borderRadius: 4),
                    SizedBox(width: 8),
                    SkeletonBox(width: 60, height: 12, borderRadius: 4),
                  ],
                ),
                const SizedBox(height: 8),
                const SkeletonBox(width: 80, height: 12, borderRadius: 4),
                const SizedBox(height: 12),
                const SkeletonBox(height: 14, borderRadius: 4, margin: EdgeInsets.only(bottom: 6)),
                const SkeletonBox(height: 14, borderRadius: 4, margin: EdgeInsets.only(bottom: 6)),
                const SkeletonBox(width: 200, height: 14, borderRadius: 4),
                const SizedBox(height: 16),
                Row(
                  children: const [
                    SkeletonBox(width: 48, height: 24, borderRadius: 12),
                    SizedBox(width: 12),
                    SkeletonBox(width: 48, height: 24, borderRadius: 12),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
