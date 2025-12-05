import { useState } from 'react';
import { User, Phone, Mail, Users, Save, LogOut } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const { user, updateUser, clearUser } = useUserStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    trusted_contacts: user?.trusted_contacts || [''],
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);
    setLoading(true);

    try {
      // Filter out empty contacts
      const cleanedContacts = formData.trusted_contacts.filter((c) => c.trim());

      const updatedUser = await userAPI.updateUser(user.id, {
        name: formData.name,
        email: formData.email || null,
        trusted_contacts: cleanedContacts,
      });

      updateUser(updatedUser);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      clearUser();
      navigate('/register');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile and trusted contacts</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg mb-6">
          Settings updated successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Settings Form */}
      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Profile Information */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </h2>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            {/* Phone (Read-only) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                value={user?.phone || ''}
                className="input-field bg-gray-100 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Phone number cannot be changed
              </p>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Trusted Contacts */}
          <div className="mb-6 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Trusted Emergency Contacts
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              These contacts will receive emergency alerts if you're in distress
            </p>

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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card mt-6 bg-danger-50 border border-danger-200">
        <h2 className="text-xl font-semibold text-danger-900 mb-4">
          Danger Zone
        </h2>
        <p className="text-sm text-danger-700 mb-4">
          Logging out will require you to register again
        </p>
        <button
          onClick={handleLogout}
          className="btn-danger flex items-center justify-center"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Settings;
