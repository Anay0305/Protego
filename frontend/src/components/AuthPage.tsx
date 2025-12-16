import { useState } from 'react';
import { Shield, Eye, EyeOff, Phone, Mail, Lock, User, Users, Plus, X, AlertCircle } from 'lucide-react';
import { userAPI, UserData } from '../services/api';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+1', country: 'US/Canada', flag: '\ud83c\uddfa\ud83c\uddf8' },
  { code: '+44', country: 'UK', flag: '\ud83c\uddec\ud83c\udde7' },
  { code: '+91', country: 'India', flag: '\ud83c\uddee\ud83c\uddf3' },
  { code: '+86', country: 'China', flag: '\ud83c\udde8\ud83c\uddf3' },
  { code: '+81', country: 'Japan', flag: '\ud83c\uddef\ud83c\uddf5' },
  { code: '+49', country: 'Germany', flag: '\ud83c\udde9\ud83c\uddea' },
  { code: '+33', country: 'France', flag: '\ud83c\uddeb\ud83c\uddf7' },
  { code: '+61', country: 'Australia', flag: '\ud83c\udde6\ud83c\uddfa' },
  { code: '+7', country: 'Russia', flag: '\ud83c\uddf7\ud83c\uddfa' },
  { code: '+55', country: 'Brazil', flag: '\ud83c\udde7\ud83c\uddf7' },
];

interface AuthPageProps {
  onSuccess: (token: string, user: any) => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [trustedContacts, setTrustedContacts] = useState<string[]>([]);
  const [newContactCode, setNewContactCode] = useState('+91');
  const [newContactNumber, setNewContactNumber] = useState('');

  const addTrustedContact = () => {
    if (!newContactNumber.trim()) return;

    const fullNumber = `${newContactCode}${newContactNumber}`;
    if (trustedContacts.includes(fullNumber)) {
      setError('Contact already added');
      return;
    }

    setTrustedContacts([...trustedContacts, fullNumber]);
    setNewContactNumber('');
    setError(null);
  };

  const removeTrustedContact = (contact: string) => {
    setTrustedContacts(trustedContacts.filter(c => c !== contact));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Sign up
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        if (trustedContacts.length === 0) {
          setError('Please add at least one trusted contact');
          setLoading(false);
          return;
        }

        const userData: UserData = {
          email,
          password,
          name,
          phone: `${countryCode}${phoneNumber}`,
          trusted_contacts: trustedContacts,
        };

        const response = await userAPI.signup(userData);
        localStorage.setItem('access_token', response.data.access_token);
        onSuccess(response.data.access_token, response.data.user);
      } else {
        // Sign in
        const response = await userAPI.signin({ email, password });
        localStorage.setItem('access_token', response.data.access_token);
        onSuccess(response.data.access_token, response.data.user);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
          <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white">Protego</h1>
          <p className="text-indigo-100 mt-2">Your Personal Safety Companion</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-4 font-semibold transition ${
              mode === 'signin'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-4 font-semibold transition ${
              mode === 'signup'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {COUNTRY_CODES.map((cc) => (
                      <option key={cc.code} value={cc.code}>
                        {cc.flag} {cc.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                placeholder="••••••••"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="inline mr-2" />
                Trusted Emergency Contacts
              </label>

              {/* Add Contact Input */}
              <div className="flex gap-2 mb-3">
                <select
                  value={newContactCode}
                  onChange={(e) => setNewContactCode(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {COUNTRY_CODES.map((cc) => (
                    <option key={cc.code} value={cc.code}>
                      {cc.flag} {cc.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={newContactNumber}
                  onChange={(e) => setNewContactNumber(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrustedContact())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Emergency contact number"
                />
                <button
                  type="button"
                  onClick={addTrustedContact}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Contact List */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {trustedContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <span className="text-sm font-medium text-gray-700">{contact}</span>
                    <button
                      type="button"
                      onClick={() => removeTrustedContact(contact)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {trustedContacts.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Add at least one emergency contact who will be notified in case of alerts
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-8 text-center">
          <p className="text-sm text-gray-600">
            Protected with end-to-end encryption
          </p>
        </div>
      </div>
    </div>
  );
}
