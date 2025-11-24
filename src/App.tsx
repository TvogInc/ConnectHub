import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/pages/AuthPage';
import { MainPage } from '@/pages/MainPage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
          <Route path="/" element={user ? <MainPage /> : <Navigate to="/auth" />} />
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </>
  );
}

export default App;
