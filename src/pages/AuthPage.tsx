import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { mapSupabaseUser } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setLoading(true);
    try {
      const displayUsername = username || email.split('@')[0];
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: displayUsername,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        login(mapSupabaseUser(data.user));
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        login(mapSupabaseUser(data.user));
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        skipBrowserRedirect: false
      }
    });
    
    if (error) {
      console.error('Google login failed:', error.message);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-gradient-primary">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">ConnectHub</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username (Optional)</Label>
                  <Input
                    id="username"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button
                onClick={mode === 'login' ? handleLogin : handleRegister}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full"
                type="button"
              >
                <FcGoogle className="w-5 h-5 mr-2" />
                Google
              </Button>
              
              <div className="text-center text-sm">
                {mode === 'login' ? (
                  <button
                    onClick={() => setMode('register')}
                    className="text-primary hover:underline"
                  >
                    Don't have an account? Register
                  </button>
                ) : (
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
        </CardContent>
      </Card>
    </div>
  );
}
