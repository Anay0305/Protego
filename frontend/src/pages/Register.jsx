import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, UserPlus, Phone, Mail, Users } from 'lucide-react';
import { userAPI } from '../services/api';
import { useUserStore } from '../store/useUserStore';

function Register() {
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    trusted_contacts: [''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleContactChange = (index, value) => {
    const newContacts = [...formData.trusted_contacts];
    newContacts[index] = value;
    setFormData({ ...formData, trusted_contacts: newContacts });
  };

  const addContact = () => {
    setFormData({
      ...formData,
      trusted_contacts: [...formData.trusted_contacts, ''],
    });
  };

  const removeContact = (index) => {
    const newContacts = formData.trusted_contacts.filter((_, i) => i !== index);
    setFormData({ ...formData, trusted_contacts: newContacts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Filter out empty contacts
      const cleanedContacts = formData.trusted_contacts.filter((c) => c.trim());

      // Ensure phone numbers have + prefix
      const phone = formData.phone.startsWith('+')
        ? formData.phone
        : `+${formData.phone}`;

      const contacts = cleanedContacts.map((c) =>
        c.startsWith('+') ? c : `+${c}`
      );

      const user = await userAPI.register({
        name: formData.name,
        phone,
        email: formData.email || null,
        trusted_contacts: contacts,
      });

      setUser(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-4 rounded-full">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Protego</h1>
          <p className="text-gray-600 mt-2">Your Personal Safety Companion</p>
        </div>

        {/* Registration Form */}
        <div className="card">
          <div className="flex items-center mb-6">
            <UserPlus className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number * (E.164 format)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-field"
                placeholder="+1234567890"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="john@example.com"
              />
            </div>

            {/* Trusted Contacts */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Trusted Contacts
              </label>
              {formData.trusted_contacts.map((contact, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => handleContactChange(index, e.target.value)}
                    className="input-field"
                    placeholder="+1234567890"
                  />
                  {formData.trusted_contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="btn-secondary"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addContact}
                className="btn-secondary w-full mt-2"
              >
                + Add Contact
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Emergency contacts who will be notified if you're in distress
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
