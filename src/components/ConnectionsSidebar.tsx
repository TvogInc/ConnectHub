import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getConnections, getPendingRequests, searchUsers, sendConnectionRequest, respondToRequest } from '@/lib/api';
import { Connection, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, LogOut, Search, Check, X, Video } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onStartVideoCall: () => void;
}

export function ConnectionsSidebar({ onStartVideoCall }: Props) {
  const { user, logout } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadConnections();
      loadPendingRequests();
      
      const interval = setInterval(() => {
        loadConnections();
        loadPendingRequests();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;
    try {
      const data = await getConnections(user.id);
      setConnections(data);
    } catch (error: any) {
      console.error('Failed to load connections:', error);
    }
  };

  const loadPendingRequests = async () => {
    if (!user) return;
    try {
      const data = await getPendingRequests(user.id);
      setPendingRequests(data);
    } catch (error: any) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter(u => u.id !== user?.id));
    } catch (error: any) {
      toast.error('Failed to search users');
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await sendConnectionRequest(receiverId);
      toast.success('Connection request sent');
      setShowAddDialog(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      toast.error('Failed to send request');
    }
  };

  const handleRespondToRequest = async (connectionId: string, accept: boolean) => {
    try {
      await respondToRequest(connectionId, accept);
      toast.success(accept ? 'Request accepted' : 'Request declined');
      loadPendingRequests();
      if (accept) loadConnections();
    } catch (error: any) {
      toast.error('Failed to respond to request');
    }
  };

  const getOtherUser = (connection: Connection) => {
    return connection.requester_id === user?.id ? connection.receiver : connection.requester;
  };

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {user?.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Find People</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by username or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {searchResults.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{profile.username}</p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleSendRequest(profile.id)}>
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="connections" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-border">
          <TabsTrigger value="connections" className="flex-1">
            <Users className="w-4 h-4 mr-2" />
            Connections
            {connections.length > 0 && (
              <Badge variant="secondary" className="ml-2">{connections.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="flex-1 m-0">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="p-2 space-y-1">
              {connections.map((connection) => {
                const otherUser = getOtherUser(connection);
                if (!otherUser) return null;
                
                return (
                  <div
                    key={connection.id}
                    className="p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={otherUser.avatar_url} />
                          <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{otherUser.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{otherUser.email}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={onStartVideoCall}
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {connections.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No connections yet</p>
                  <p className="text-xs mt-1">Add people to start chatting</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 m-0">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="p-2 space-y-2">
              {pendingRequests.map((request) => {
                const requester = request.requester;
                if (!requester) return null;
                
                return (
                  <div
                    key={request.id}
                    className="p-3 rounded-lg border border-border bg-accent/30"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={requester.avatar_url} />
                        <AvatarFallback>{requester.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{requester.username}</p>
                        <p className="text-xs text-muted-foreground truncate mb-2">{requester.email}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRespondToRequest(request.id, true)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespondToRequest(request.id, false)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {pendingRequests.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No pending requests</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
