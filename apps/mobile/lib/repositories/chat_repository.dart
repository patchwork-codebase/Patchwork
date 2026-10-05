import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/room_message.dart';

class ChatRepository {
  final SupabaseClient _client;

  ChatRepository({SupabaseClient? client}) : _client = client ?? Supabase.instance.client;

  /// Fetches the initial list of messages for a room.
  Future<List<RoomMessage>> getMessages(String roomId) async {
    final response = await _client
        .from('room_messages')
        .select('*, sender:users!sender_id(name, avatar)')
        .eq('room_id', roomId)
        .order('created_at', ascending: true);

    return (response as List).map((json) => RoomMessage.fromJson(json)).toList();
  }

  /// Sends a new text message to a room.
  Future<void> sendMessage({
    required String roomId,
    required String senderId,
    required String content,
    List<String>? mentionedUserIds,
  }) async {
    await _client.from('room_messages').insert({
      'room_id': roomId,
      'sender_id': senderId,
      'content': content,
      if (mentionedUserIds != null && mentionedUserIds.isNotEmpty)
        'mentioned_user_ids': mentionedUserIds,
    });
  }

  /// Marks a specific message as read.
  Future<void> markMessageAsRead(String messageId) async {
    await _client.from('room_messages').update({
      'read_at': DateTime.now().toIso8601String(),
    }).eq('id', messageId);
  }

  /// Deletes a message by ID.
  Future<void> deleteMessage(String messageId) async {
    await _client.from('room_messages').delete().eq('id', messageId);
  }

  /// Edits an existing message's content.
  Future<void> editMessage({
    required String messageId,
    required String newContent,
  }) async {
    await _client.from('room_messages').update({
      'content': newContent,
      'is_edited': true,
    }).eq('id', messageId);
  }
}
