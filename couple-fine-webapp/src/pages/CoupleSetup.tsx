import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Users, ArrowRight, Loader2, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'choose' | 'create' | 'join' | 'success';

export const CoupleSetup: React.FC = () => {
  const navigate = useNavigate();
  const { createCouple, joinCouple } = useApp();
  const { user, refreshUser } = useAuth();
  
  const [step, setStep] = useState<Step>('choose');
  const [coupleCode, setCoupleCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateCouple = async () => {
    setIsLoading(true);
    
    try {
      const result = await createCouple();
      
      if ('error' in result) {
        toast.error(result.error);
      } else {
        setGeneratedCode(result.code);
        setStep('success');
        // Refresh user to get updated couple_id
        await refreshUser();
        toast.success('Couple created successfully!');
      }
    } catch (error) {
      toast.error('Failed to create couple');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coupleCode.trim()) {
      toast.error('Please enter a couple code');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await joinCouple(coupleCode.toUpperCase());
      
      if (error) {
        toast.error(error);
      } else {
        setStep('success');
        // Refresh user to get updated couple_id
        await refreshUser();
        toast.success('Successfully joined couple!');
      }
    } catch (error) {
      toast.error('Failed to join couple');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleContinue = () => {
    navigate('/');
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {generatedCode ? 'Couple Created!' : 'Couple Joined!'}
            </h2>
            <p className="text-gray-600">
              {generatedCode 
                ? 'Share your couple code with your partner'
                : 'You have successfully joined your couple'
              }
            </p>
          </div>

          {generatedCode && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Your couple code:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-primary-600 tracking-wider">
                  {generatedCode}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Your partner can use this code to join your couple account
              </p>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Couple Account</h2>
            <p className="text-gray-600">You'll get a unique code to share with your partner</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">What happens next:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• We'll create a unique couple code</li>
                <li>• Share this code with your partner</li>
                <li>• Your partner can join using the code</li>
                <li>• You can start tracking together!</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('choose')}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              
              <button
                onClick={handleCreateCouple}
                disabled={isLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Create Couple
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'join') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Couple</h2>
            <p className="text-gray-600">Enter the code your partner shared with you</p>
          </div>

          <form onSubmit={handleJoinCouple} className="space-y-4">
            <div>
              <label htmlFor="coupleCode" className="block text-sm font-medium text-gray-700 mb-2">
                Couple Code
              </label>
              <input
                id="coupleCode"
                type="text"
                value={coupleCode}
                onChange={(e) => setCoupleCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., ABCD12)"
                className="input-field text-center text-lg font-mono tracking-wider"
                maxLength={8}
                autoComplete="off"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={isLoading || !coupleCode.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Join Couple
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.display_name}!</h1>
          <p className="text-gray-600">Let's set up your couple account to start tracking together</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setStep('create')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create New Couple</h3>
                <p className="text-sm text-gray-600">Start fresh and invite your partner</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </button>

          <button
            onClick={() => setStep('join')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coral-100 group-hover:bg-coral-200 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-coral-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Join Existing Couple</h3>
                <p className="text-sm text-gray-600">Enter your partner's couple code</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};