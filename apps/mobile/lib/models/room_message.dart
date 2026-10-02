class RoomMessage {
  final String id;
  final String roomId;
  final String senderId;
  final String content;
  final DateTime createdAt;
  final DateTime? readAt;
  final String? mediaUrl;
  final String? mediaType;
  final bool isEdited;
  final Map<String, dynamic>? sender;

  RoomMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.content,
    required this.createdAt,
    this.readAt,
    this.mediaUrl,
    this.mediaType,
    this.isEdited = false,
    this.sender,
  });

  factory RoomMessage.fromJson(Map<String, dynamic> json) {
    return RoomMessage(
      id: json['id'] as String,
      roomId: json['room_id'] as String,
      senderId: json['sender_id'] as String,
      content: json['content'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      readAt: json['read_at'] != null ? DateTime.parse(json['read_at'] as String) : null,
      mediaUrl: json['media_url'] as String?,
      mediaType: json['media_type'] as String?,
      isEdited: json['is_edited'] as bool? ?? false,
      sender: json['sender'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'room_id': roomId,
      'sender_id': senderId,
      'content': content,
      'created_at': createdAt.toIso8601String(),
      'read_at': readAt?.toIso8601String(),
      'media_url': mediaUrl,
      'media_type': mediaType,
      'is_edited': isEdited,
      'sender': sender,
    };
  }
}
