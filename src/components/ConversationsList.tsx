import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getConnections, getGroups } from '@/lib/api';
import { ChatConversation } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Users, Plus } from 'lucide-react';
import { createGroup } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  selectedConversation: ChatConversation | null;
  onSelectConversation: (conversation: ChatConversation) => void;
}

export function ConversationsList({ selectedConversation, onSelectConversation }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadConversations();
      const interval = setInterval(loadConversations, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const [connectionsData, groupsData] = await Promise.all([
        getConnections(user.id),
        getGroups(user.id)
      ]);

      const directChats: ChatConversation[] = connectionsData.map(conn => {
        const otherUser = conn.requester_id === user.id ? conn.receiver : conn.requester;
        return {
          id: otherUser?.id || '',
          type: 'direct',
          name: otherUser?.username || 'Unknown',
          avatar: otherUser?.avatar_url,
          isOnline: true,
        };
      });

      const groupChats: ChatConversation[] = groupsData.map(group => ({
        id: group.id,
        type: 'group',
        name: group.name,
        avatar: group.avatar_url,
      }));

      setConversations([...directChats, ...groupChats]);
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      await createGroup(groupName, groupDescription);
      toast.success('Group created successfully');
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDescription('');
      loadConversations();
    } catch (error: any) {
      toast.error('Failed to create group');
    }
  };

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Messages
          </h2>
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-desc">Description (Optional)</Label>
                  <Input
                    id="group-desc"
                    placeholder="Enter group description"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateGroup} className="w-full">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={cn(
                "p-3 rounded-lg hover:bg-accent/70 transition-colors cursor-pointer",
                selectedConversation?.id === conversation.id && "bg-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
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
                  {conversation.type === 'direct' && conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">{conversation.name}</p>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-muted-foreground">{conversation.lastMessageTime}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {conversation.lastMessage || 'Start a conversation'}
                    </p>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2">{conversation.unreadCount}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Connect with people to start chatting</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
