import { useState, useEffect } from 'react';
import { Users, Plus, X, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { userAPI, User } from '../services/api';

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

interface TrustedContactsPageProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function TrustedContactsPage({ user, onUpdate }: TrustedContactsPageProps) {
  const [contacts, setContacts] = useState<string[]>(user.trusted_contacts || []);
  const [newContactCode, setNewContactCode] = useState('+91');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setContacts(user.trusted_contacts || []);
  }, [user.trusted_contacts]);

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  const addContact = async () => {
    if (!newContactNumber.trim()) {
      setError('Please enter a phone number');
      clearMessages();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const fullNumber = `${newContactCode}${newContactNumber}`;
      const response = await userAPI.addTrustedContact({ phone: fullNumber });
      setContacts(response.data.trusted_contacts);
      onUpdate(response.data);
      setNewContactNumber('');
      setSuccess('Contact added successfully');
      clearMessages();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to add contact';
      setError(message);
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  const removeContact = async (phone: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await userAPI.removeTrustedContact(phone);
      setContacts(response.data.trusted_contacts);
      onUpdate(response.data);
      setSuccess('Contact removed successfully');
      clearMessages();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to remove contact';
      setError(message);
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-xl text-gray-800 mb-4 flex items-center">
          <Users className="mr-2 text-indigo-600" />
          Trusted Emergency Contacts
        </h3>

        <p className="text-gray-600 text-sm mb-6">
          These contacts will be notified when an emergency alert is triggered. Make sure to keep this list updated.
        </p>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Add Contact Form */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add New Contact
          </label>
          <div className="flex gap-2">
            <select
              value={newContactCode}
              onChange={(e) => setNewContactCode(e.target.value)}
              disabled={loading}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
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
              onKeyPress={(e) => e.key === 'Enter' && addContact()}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              placeholder="9876543210"
            />
            <button
              onClick={addContact}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">
            Your Contacts ({contacts.length})
          </h4>

          {contacts.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Users className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600 font-medium">No contacts added yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Add trusted contacts who should be notified during emergencies
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact}
                  className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <Phone className="text-indigo-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{contact}</p>
                        <p className="text-xs text-gray-500">Emergency Contact</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeContact(contact)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition opacity-0 group-hover:opacity-100 disabled:opacity-30"
                      title="Remove contact"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {contacts.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These contacts will receive SMS alerts with your location when an emergency is detected or when you trigger the SOS button.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
