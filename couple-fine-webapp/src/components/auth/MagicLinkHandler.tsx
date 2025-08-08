import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const MagicLinkHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for magic link in URL
    const handleMagicLink = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      // Handle error
      if (error) {
        console.error('Magic link error:', error, errorDescription);
        toast.error(errorDescription || '인증 중 오류가 발생했습니다');
        navigate('/');
        return;
      }

      // Handle magic link tokens
      if (accessToken && refreshToken) {
        try {
          console.log('Processing magic link tokens...');
          
          // Exchange tokens for session
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            toast.error('로그인 처리 중 오류가 발생했습니다');
            navigate('/');
            return;
          }

          if (data.session) {
            console.log('Magic link login successful!');
            toast.success('로그인 성공! 🎉');
            
            // Clean up URL
            window.history.replaceState(null, '', window.location.pathname);
            
            // Navigate to dashboard
            navigate('/');
          }
        } catch (err) {
          console.error('Magic link processing error:', err);
          toast.error('로그인 처리 중 오류가 발생했습니다');
          navigate('/');
        }
      }
    };

    handleMagicLink();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};