import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final double radius;
  final VoidCallback? onTap;

  const UserAvatar({
    super.key,
    this.imageUrl,
    this.radius = 20.0,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget avatar = CircleAvatar(
      radius: radius,
      backgroundImage: imageUrl != null && imageUrl!.isNotEmpty
          ? NetworkImage(imageUrl!)
          : null,
      child: (imageUrl == null || imageUrl!.isEmpty)
          ? Icon(LucideIcons.user, size: radius)
          : null,
    );

    if (onTap != null) {
      avatar = GestureDetector(
        onTap: onTap,
        child: avatar,
      );
    }

    return avatar;
  }
}
