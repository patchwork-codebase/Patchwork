import 'dart:math';

/// Generates a standard RFC4122 version 4 UUID.
String generateUuid() {
  final random = Random();
  String hex() => random.nextInt(256).toRadixString(16).padLeft(2, '0');
  return '${hex()}${hex()}${hex()}${hex()}-'
         '${hex()}${hex()}-'
         '4${hex().substring(1)}-'
         '${(random.nextInt(4) + 8).toRadixString(16)}${hex().substring(1)}-'
         '${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}';
}
