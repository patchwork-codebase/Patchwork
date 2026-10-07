import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Provides the raw Supabase Auth User stream
final authUserProvider = StreamProvider<User?>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange.map((event) => event.session?.user);
});

/// Caches and provides the full user profile data from the 'users' table
final userProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final user = ref.watch(authUserProvider).value;
  if (user == null) return null;

  try {
    final data = await Supabase.instance.client
        .from('users')
        .select()
        .eq('id', user.id)
        .single();
    
    // Auto-heal buggy old cartoon avatar and sync metadata
    if (data['avatar'] != null && data['avatar'].toString().contains('1791234378920_867a1eff-b70e-4a93-9ed6-aa3cb2bbd2eb.jpg')) {
      final metaAvatar = user.userMetadata?['avatar']?.toString() ?? user.userMetadata?['avatar_url']?.toString();
      final healed = (metaAvatar != null && metaAvatar.isNotEmpty && !metaAvatar.contains('1791234378920'))
          ? metaAvatar
          : 'https://res.cloudinary.com/dfqvoc8dz/image/upload/v1784553143/ofzqfwogokbkxfggyxm1.jpg';
      data['avatar'] = healed;
      Future.microtask(() async {
        try {
          await Supabase.instance.client.from('users').update({'avatar': healed}).eq('id', user.id);
          await Supabase.instance.client.auth.updateUser(UserAttributes(data: {'avatar': healed, 'avatar_url': healed}));
        } catch (_) {}
      });
    }
    return data;
  } catch (e) {
    print('Error fetching user profile: $e');
    return null;
  }
});

/// A convenience provider that strictly tells us if a user is authenticated
final isAuthenticatedProvider = Provider<bool>((ref) {
  final user = ref.watch(authUserProvider).value;
  return user != null;
});
