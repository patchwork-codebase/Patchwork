/// Utility to format raw errors and exceptions into clean, user-friendly messages.
class ErrorFormatter {
  static String format(dynamic error) {
    if (error == null) return 'An unexpected error occurred. Please try again.';

    final raw = error.toString().trim();

    // Check for row-level security / forbidden (42501)
    if (raw.contains('42501') || 
        raw.contains('row-level security policy') || 
        raw.contains('Forbidden') ||
        raw.contains('permission denied')) {
      return 'You do not have permission to perform this action.';
    }

    // Check for not found / PGRST116
    if (raw.contains('PGRST116') || raw.contains('0 rows') || raw.contains('Cannot coerce the result')) {
      return 'The requested item could not be found or is unavailable.';
    }

    // Duplicate key / already exists (23505)
    if (raw.contains('23505') || raw.contains('unique constraint') || raw.contains('already exists')) {
      return 'This action has already been completed.';
    }

    // Foreign key violation (23503)
    if (raw.contains('23503') || raw.contains('violates foreign key constraint')) {
      return 'Referenced item is no longer available.';
    }

    // Network / Socket / Timeout
    if (raw.contains('SocketException') || 
        raw.contains('Failed host lookup') || 
        raw.contains('NetworkImageLoadException') ||
        raw.contains('ClientException') ||
        raw.contains('TimeoutException') ||
        raw.contains('Connection closed')) {
      return 'Network connection issue. Please check your internet and try again.';
    }

    // AuthException
    if (raw.contains('AuthException')) {
      if (raw.contains('Invalid login credentials')) {
        return 'Invalid email or password.';
      }
      if (raw.contains('User already registered')) {
        return 'An account with this email already exists.';
      }
      if (raw.contains('Email not confirmed')) {
        return 'Please confirm your email address before continuing.';
      }
      // Extract inner message if present
      final match = RegExp(r'message:\s*([^,\)]+)').firstMatch(raw);
      if (match != null && match.group(1) != null) {
        return match.group(1)!.trim();
      }
    }

    // Clean up "Exception: " or "Failed to do X: PostgrestException(...)"
    var cleaned = raw;
    if (cleaned.contains('PostgrestException(')) {
      // Extract the message parameter if human readable
      final msgMatch = RegExp(r'message:\s*([^,\)]+)').firstMatch(cleaned);
      if (msgMatch != null && msgMatch.group(1) != null) {
        final innerMsg = msgMatch.group(1)!.trim();
        if (!innerMsg.contains('row-level security') && !innerMsg.contains('coerce')) {
          cleaned = innerMsg;
        } else {
          return 'Action could not be completed due to access permissions.';
        }
      }
    }

    cleaned = cleaned.replaceFirst(RegExp(r'^Exception:\s*'), '');
    cleaned = cleaned.replaceFirst(RegExp(r'^Error:\s*'), '');

    // If cleaned string is still an unhelpful stack or raw dump, provide safe fallback
    if (cleaned.length > 140 || cleaned.contains('Stack trace:') || cleaned.contains('Instance of')) {
      return 'Something went wrong. Please try again.';
    }

    return cleaned.isNotEmpty ? cleaned : 'An error occurred. Please try again.';
  }
}
