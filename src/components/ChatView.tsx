import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDirectMessages, getGroupMessages, sendMessage } from '@/lib/api';
import { Message, ChatConversation } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Video, Phone, MoreVertical, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  conversation: ChatConversation | null;
  onStartVideoCall: () => void;
}

export function ChatView({ conversation, onStartVideoCall }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      loadMessages();
      const interval = setInterval(loadMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!conversation) return;

    try {
      const data = conversation.type === 'direct'
        ? await getDirectMessages(user!.id, conversation.id)
        : await getGroupMessages(conversation.id);
      
      setMessages(data);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversation || sending) return;

    setSending(true);
    try {
      await sendMessage(
        messageInput,
        conversation.type === 'direct' ? conversation.id : undefined,
        conversation.type === 'group' ? conversation.id : undefined
      );
      
      setMessageInput('');
      loadMessages();
    } catch (error: any) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm mt-1">Choose a contact or group to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback className={conversation.type === 'group' ? 'bg-secondary' : 'bg-primary'}>
              {conversation.type === 'group' ? (
                <Users className="w-4 h-4 text-secondary-foreground" />
              ) : (
                conversation.name.charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{conversation.name}</h3>
            {conversation.type === 'direct' && (
              <p className="text-xs text-muted-foreground">
                {conversation.isOnline ? 'Online' : 'Offline'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {conversation.type === 'direct' && (
            <>
              <Button variant="ghost" size="icon" onClick={onStartVideoCall}>
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Phone className="w-5 h-5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 scrollbar-thin" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user?.id;
            const showAvatar = conversation.type === 'group' && !isOwn;
            const showSenderName = conversation.type === 'group' && !isOwn;
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  isOwn && "flex-row-reverse"
                )}
              >
                {showAvatar && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.sender?.avatar_url} />
                    <AvatarFallback>
                      {message.sender?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
                  {showSenderName && (
                    <p className="text-xs font-medium text-muted-foreground mb-1 px-3">
                      {message.sender?.username}
                    </p>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 shadow-sm",
                      isOwn
                        ? "bg-gradient-primary text-primary-foreground"
                        : "bg-card border border-border"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 px-3">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={sending || !messageInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
