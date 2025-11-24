export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  requester?: UserProfile;
  receiver?: UserProfile;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: UserProfile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  group_id?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'file';
  created_at: string;
  updated_at: string;
  sender?: UserProfile;
}

export interface VideoCall {
  id: string;
  caller_id: string;
  receiver_id: string;
  status: 'calling' | 'active' | 'ended' | 'declined' | 'missed';
  offer?: any;
  answer?: any;
  ice_candidates?: any;
  started_at: string;
  ended_at?: string;
  caller?: UserProfile;
  receiver?: UserProfile;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}
