import { useState } from 'react';
import { ConnectionsSidebar } from '@/components/ConnectionsSidebar';
import { ConversationsList } from '@/components/ConversationsList';
import { ChatView } from '@/components/ChatView';
import { VideoCallWindow } from '@/components/VideoCallWindow';
import { ChatConversation } from '@/types';

export function MainPage() {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Connections Sidebar */}
      <ConnectionsSidebar onStartVideoCall={() => setShowVideoCall(true)} />
      
      {/* Conversations List */}
      <ConversationsList 
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />
      
      {/* Chat View */}
      <ChatView 
        conversation={selectedConversation}
        onStartVideoCall={() => setShowVideoCall(true)}
      />
      
      {/* Video Call Window */}
      {showVideoCall && (
        <VideoCallWindow onClose={() => setShowVideoCall(false)} />
      )}
    </div>
  );
}
