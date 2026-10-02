import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { Send, ArrowLeft, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { supabase, useAuth } from "../auth/AuthContext";
import { UserAvatar } from "../ui/UserAvatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { useChatMutations } from "../../hooks/useChatMutations";
import { useChatRoom, useChatMessages } from "../../hooks/useChat";
import { uploadImage } from "../../utils/uploadImage";
import { Loader2, X } from "lucide-react";

export default function ChatThread() {
  const { roomId } = useParams();
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { room } = useChatRoom(roomId);
  const { 
    messages, 
    isLoading, 
    typingUsers, 
    channelRef, 
    typingTimeoutRef 
  } = useChatMessages(roomId, user);

  const { sendMessage } = useChatMutations(roomId, user);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const isTyping = e.target.value.length > 0;
    setInputText(e.target.value);
    
    // Track typing status via Presence
    if (channelRef.current && user) {
      channelRef.current.track({
        userId: user.id, 
        userName: user.user_metadata?.name || 'Someone', 
        typing: isTyping 
      });
      
      // Clear typing indicator after 2 seconds of inactivity
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          if (channelRef.current) {
            channelRef.current.track({
              userId: user.id, 
              userName: user.user_metadata?.name || 'Someone', 
              typing: false 
            });
          }
        }, 2000);
      }
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || !user || !roomId || isUploading) return;
    
    const text = inputText;
    const imageToUpload = selectedImage;
    
    setInputText("");
    setSelectedImage(null);
    
    // Broadcast stopped typing immediately
    if (channelRef.current) {
      channelRef.current.track({
        userId: user.id, 
        userName: user.user_metadata?.name || 'Someone', 
        typing: false 
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
    
    try {
      let mediaUrl;
      if (imageToUpload) {
        setIsUploading(true);
        mediaUrl = await uploadImage(imageToUpload);
        setIsUploading(false);
      }

      sendMessage.mutate({ 
        content: text.trim(),
        mediaUrl,
        mediaType: mediaUrl ? 'image' : undefined
      });
      scrollToBottom();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send message");
      setInputText(text); // Restore on fail
      setSelectedImage(imageToUpload);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      {/* HEADER */}
      <div className="h-[68px] border-b border-slate-100 dark:border-white/5 flex items-center px-4 shrink-0 bg-slate-50 dark:bg-[#050505]">
        <Link to="/dashboard/messages" className="md:hidden mr-3 p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-full text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/10 dark:from-primary-500/20 to-purple-500/10 dark:to-purple-500/20 flex items-center justify-center border border-primary-500/10 dark:border-white/10 shrink-0">
            <span className="font-bold text-primary-600 dark:text-primary-400 font-display">
              {room?.title?.substring(0, 2).toUpperCase() || 'RM'}
            </span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              {room?.title || 'Loading...'}
              {room?.is_private && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] uppercase font-bold tracking-wider">Private</span>}
            </h2>
            <Link to={`/dashboard/room/${roomId}`} className="text-xs text-primary-500 dark:text-primary-400 hover:underline">View Room ↗</Link>
          </div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-slate-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-slate-500">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary-500/50" />
            </div>
            <p>You're matched! Say hi to your collaborator.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const showAvatar = i === 0 || messages[i-1].sender_id !== msg.sender_id;
              
              return (
                <div key={msg.id} className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && showAvatar ? (
                    <UserAvatar userId={msg.sender?.id} name={msg.sender?.name} avatarUrl={msg.sender?.avatar} className="w-8 h-8 rounded-full shrink-0" />
                  ) : !isMine ? (
                    <div className="w-8 shrink-0" />
                  ) : null}
                  
                  <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMine && showAvatar && (
                      <span className="text-[11px] text-slate-500 mb-1 font-medium pl-1">{msg.sender?.name}</span>
                    )}
                    
                    <div className={`px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed ${isMine ? 'bg-primary-500 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>
                      {msg.media_url && (
                        <div className="mb-2 -mx-2 -mt-1 rounded-xl overflow-hidden">
                          <img src={msg.media_url} alt="Attachment" className="max-w-full rounded-xl" style={{ maxHeight: 250, objectFit: 'cover' }} />
                        </div>
                      )}
                      {msg.content}
                    </div>
                    
                    <span className="text-[10px] text-slate-500 mt-1 opacity-60">
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Live Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex gap-3 justify-start items-end">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500 font-bold">{typingUsers[0]?.substring(0, 1) || '?'}</span>
                </div>
                <div className="bg-slate-100 dark:bg-white/10 rounded-[20px] rounded-tl-sm px-4 py-3 flex items-center gap-1.5 h-[40px]">
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-slate-50 dark:bg-[#050505] border-t border-slate-200 dark:border-white/5 shrink-0">
        
        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 w-24 h-24">
              <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            {!isUploading && (
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-end gap-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-[24px] p-2 focus-within:border-primary-500/50 focus-within:bg-slate-50 dark:focus-within:bg-[#151515] transition-colors">
          <input 
            type="file" 
            accept="image/*"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none py-2.5 px-2 focus:outline-none text-[15px]"
            rows={1}
          />
          
          <button 
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isUploading}
            className="p-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 dark:hover:bg-primary-400 disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-white/10 disabled:text-slate-400 dark:disabled:text-slate-500 transition-colors shrink-0"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
