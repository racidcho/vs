import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { 
  User, 
  Palette, 
  Shield, 
  Smartphone,
  Users,
  LogOut,
  Edit,
  Save,
  X,
  Lock,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppLock } from '../hooks/useAppLock';

export const Settings: React.FC = () => {
  const { user, signOut, updateProfile } = useAuth();
  const { state } = useApp();
  const { isLocked, lock, hasPin, setPin } = useAppLock();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPin = async () => {
    if (newPin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    const result = await setPin(newPin);
    if (result.success) {
      setNewPin('');
      setConfirmPin('');
      toast.success('PIN setup successfully');
    } else {
      toast.error(result.error || 'Failed to setup PIN');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and app preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          Profile
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xl">
                {user?.display_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              {isEditingProfile ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field"
                    placeholder="Display name"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setDisplayName(user?.display_name || '');
                      }}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-gray-900">{user?.display_name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1 mt-2"
                  >
                    <Edit className="w-3 h-3" />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Couple Information */}
      {state.couple && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Couple Information
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Couple Code</span>
              <span className="font-mono font-semibold text-primary-600">{state.couple.code}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Created</span>
              <span className="text-gray-900">
                {new Date(state.couple.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Theme</span>
              <span className="text-gray-900 capitalize">{state.couple.theme}</span>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" />
          Security
        </h2>
        
        <div className="space-y-4">
          {/* App Lock */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">App Lock</h3>
                <p className="text-sm text-gray-600">Secure your app with a 4-digit PIN</p>
              </div>
              {hasPin && (
                <button
                  onClick={lock}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  disabled={isLocked}
                >
                  <Lock className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {!hasPin ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit PIN"
                    className="input-field text-center"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirm PIN"
                    className="input-field text-center"
                  />
                </div>
                <button
                  onClick={handleSetupPin}
                  disabled={newPin.length !== 4 || confirmPin.length !== 4}
                  className="btn-primary text-sm w-full"
                >
                  {hasPin ? 'Update PIN' : 'Setup PIN'}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  PIN protection is {isLocked ? 'active' : 'enabled'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-600" />
          Preferences
        </h2>
        
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Theme</h3>
              <p className="text-sm text-gray-600">Choose your preferred color scheme</p>
            </div>
            <select className="input-field text-sm min-w-0">
              <option>Light</option>
              <option>Dark</option>
              <option>Auto</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-600">Get notified about violations and rewards</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>

          {/* PWA Install */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Install App</h3>
              <p className="text-sm text-gray-600">Add to home screen for quick access</p>
            </div>
            <button className="btn-secondary text-sm flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Install
            </button>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary-600" />
          Support
        </h2>
        
        <div className="space-y-3">
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-700">Help & FAQ</span>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-700">Contact Support</span>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-700">Privacy Policy</span>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-700">Terms of Service</span>
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="card p-6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* App Version */}
      <div className="text-center text-sm text-gray-500">
        Couple Fine v1.0.0
      </div>
    </div>
  );
};