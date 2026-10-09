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
        .maybeSingle();
    
    if (data == null) return null;

    final dbAvatar = data['avatar']?.toString() ?? '';
    if (dbAvatar.isEmpty) {
      final metaAvatar = user.userMetadata?['avatar']?.toString() ?? user.userMetadata?['avatar_url']?.toString();
      if (metaAvatar != null && metaAvatar.isNotEmpty) {
        data['avatar'] = metaAvatar;
      }
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
