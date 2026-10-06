import 'package:flutter/material.dart';

/// Reusable skeleton loading widgets with shimmer effect
/// ใช้แทน CircularProgressIndicator ทุกหน้า

class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  final double width;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final baseColor = brightness == Brightness.dark
        ? Colors.grey[800]!
        : Colors.grey[200]!;
    final highlightColor = brightness == Brightness.dark
        ? Colors.grey[700]!
        : Colors.grey[100]!;

    return _Shimmer(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: baseColor,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Skeleton สำหรับ card หน้า dashboard
class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header skeleton
        SkeletonBox(width: 200, height: 24, borderRadius: 4),
        const SizedBox(height: 8),
        SkeletonBox(width: 140, height: 14, borderRadius: 4),
        const SizedBox(height: 20),
        // Module grid skeleton
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.4,
          children: List.generate(
            4,
            (_) => _SkeletonModuleCard(),
          ),
        ),
      ],
    );
  }
}

class _SkeletonModuleCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            SkeletonBox(width: 40, height: 40, borderRadius: 12),
            const SizedBox(height: 12),
            SkeletonBox(width: 100, height: 14, borderRadius: 4),
            const SizedBox(height: 6),
            SkeletonBox(width: 80, height: 10, borderRadius: 4),
          ],
        ),
      ),
    );
  }
}

/// Skeleton สำหรับ profile page
class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        // Title
        SkeletonBox(width: 160, height: 28, borderRadius: 4),
        const SizedBox(height: 8),
        SkeletonBox(width: 240, height: 14, borderRadius: 4),
        const SizedBox(height: 20),
        // Avatar card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                const SkeletonBox(width: 80, height: 80, borderRadius: 40),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(width: 150, height: 18, borderRadius: 4),
                      const SizedBox(height: 8),
                      SkeletonBox(width: 100, height: 14, borderRadius: 4),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Info card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: 100, height: 18, borderRadius: 4),
                const SizedBox(height: 16),
                _SkeletonInfoRow(),
                const SizedBox(height: 12),
                _SkeletonInfoRow(),
                const SizedBox(height: 12),
                _SkeletonInfoRow(),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SkeletonInfoRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SkeletonBox(width: 36, height: 36, borderRadius: 8),
        const SizedBox(width: 14),
        SkeletonBox(width: 60, height: 14, borderRadius: 4),
        const SizedBox(width: 12),
        Expanded(child: SkeletonBox(width: 120, height: 14, borderRadius: 4)),
      ],
    );
  }
}

/// Skeleton สำหรับ evaluation/task list
class ListSkeleton extends StatelessWidget {
  const ListSkeleton({super.key, this.itemCount = 5});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: itemCount,
      itemBuilder: (_, __) => Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonBox(width: 200, height: 16, borderRadius: 4),
              const SizedBox(height: 8),
              SkeletonBox(width: 120, height: 12, borderRadius: 4),
              const SizedBox(height: 12),
              Row(
                children: [
                  SkeletonBox(width: 60, height: 24, borderRadius: 12),
                  const SizedBox(width: 8),
                  SkeletonBox(width: 80, height: 24, borderRadius: 12),
                ],
              ),
              const SizedBox(height: 12),
              SkeletonBox(width: double.infinity, height: 6, borderRadius: 3),
            ],
          ),
        ),
      ),
    );
  }
}

/// Skeleton สำหรับ attendance page
class AttendanceSkeleton extends StatelessWidget {
  const AttendanceSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Today card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: 120, height: 18, borderRadius: 4),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        const SkeletonBox(width: 50, height: 50, borderRadius: 25),
                        const SizedBox(height: 8),
                        SkeletonBox(width: 60, height: 12, borderRadius: 4),
                      ],
                    ),
                    Column(
                      children: [
                        const SkeletonBox(width: 50, height: 50, borderRadius: 25),
                        const SizedBox(height: 8),
                        SkeletonBox(width: 60, height: 12, borderRadius: 4),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // History list skeleton
        SkeletonBox(width: 100, height: 16, borderRadius: 4),
        const SizedBox(height: 12),
        ...List.generate(
          3,
          (_) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const SkeletonBox(width: 40, height: 40, borderRadius: 8),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: 100, height: 14, borderRadius: 4),
                        const SizedBox(height: 6),
                        SkeletonBox(width: 160, height: 10, borderRadius: 4),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Shimmer animation wrapper — ไม่ต้องใช้ package เพิ่ม
class _Shimmer extends StatefulWidget {
  const _Shimmer({
    required this.child,
    required this.baseColor,
    required this.highlightColor,
  });

  final Widget child;
  final Color baseColor;
  final Color highlightColor;

  @override
  State<_Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<_Shimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            final shimmer = _controller.value;
            return LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                widget.baseColor,
                widget.highlightColor,
                widget.baseColor,
              ],
              stops: [
                (shimmer - 0.3).clamp(0.0, 1.0),
                shimmer,
                (shimmer + 0.3).clamp(0.0, 1.0),
              ],
            ).createShader(bounds);
          },
          blendMode: BlendMode.srcATop,
          child: child,
        );
      },
      child: widget.child,
    );
  }
}
