import { supabase } from './supabase';
import { UserProfile, Connection, Group, Message, VideoCall } from '@/types';

// User Profiles
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const searchUsers = async (query: string): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);
  
  if (error) throw error;
  return data || [];
};

// Connections
export const getConnections = async (userId: string): Promise<Connection[]> => {
  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      requester:user_profiles!connections_requester_id_fkey(*),
      receiver:user_profiles!connections_receiver_id_fkey(*)
    `)
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getPendingRequests = async (userId: string): Promise<Connection[]> => {
  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      requester:user_profiles!connections_requester_id_fkey(*),
      receiver:user_profiles!connections_receiver_id_fkey(*)
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const sendConnectionRequest = async (receiverId: string) => {
  const { error } = await supabase
    .from('connections')
    .insert({ receiver_id: receiverId, status: 'pending' });
  
  if (error) throw error;
};

export const respondToRequest = async (connectionId: string, accept: boolean) => {
  const { error } = await supabase
    .from('connections')
    .update({ status: accept ? 'accepted' : 'blocked', updated_at: new Date().toISOString() })
    .eq('id', connectionId);
  
  if (error) throw error;
};

// Groups
export const getGroups = async (userId: string): Promise<Group[]> => {
  const { data, error } = await supabase
    .from('group_members')
    .select('group:groups(*)')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data?.map(item => item.group).filter(Boolean) || [];
};

export const createGroup = async (name: string, description?: string, memberIds: string[] = []) => {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, description })
    .select()
    .single();
  
  if (groupError) throw groupError;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const members = [
    { group_id: group.id, user_id: user.id, role: 'admin' as const },
    ...memberIds.map(userId => ({ group_id: group.id, user_id: userId, role: 'member' as const }))
  ];
  
  const { error: membersError } = await supabase
    .from('group_members')
    .insert(members);
  
  if (membersError) throw membersError;
  return group;
};

// Messages
export const getDirectMessages = async (userId: string, otherUserId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!messages_sender_id_fkey(*)
    `)
    .is('group_id', null)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const getGroupMessages = async (groupId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!messages_sender_id_fkey(*)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const sendMessage = async (content: string, receiverId?: string, groupId?: string) => {
  const { error } = await supabase
    .from('messages')
    .insert({ content, receiver_id: receiverId, group_id: groupId });
  
  if (error) throw error;
};

// Video Calls
export const initiateCall = async (receiverId: string, offer: any): Promise<VideoCall> => {
  const { data, error } = await supabase
    .from('video_calls')
    .insert({ receiver_id: receiverId, offer, status: 'calling' })
    .select(`
      *,
      caller:user_profiles!video_calls_caller_id_fkey(*),
      receiver:user_profiles!video_calls_receiver_id_fkey(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const answerCall = async (callId: string, answer: any) => {
  const { error } = await supabase
    .from('video_calls')
    .update({ answer, status: 'active' })
    .eq('id', callId);
  
  if (error) throw error;
};

export const endCall = async (callId: string) => {
  const { error } = await supabase
    .from('video_calls')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', callId);
  
  if (error) throw error;
};

export const getActiveCall = async (userId: string): Promise<VideoCall | null> => {
  const { data, error } = await supabase
    .from('video_calls')
    .select(`
      *,
      caller:user_profiles!video_calls_caller_id_fkey(*),
      receiver:user_profiles!video_calls_receiver_id_fkey(*)
    `)
    .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
    .in('status', ['calling', 'active'])
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};
