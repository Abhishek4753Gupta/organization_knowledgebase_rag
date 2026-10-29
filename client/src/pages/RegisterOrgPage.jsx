import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Lock, FileText } from 'lucide-react';

export default function RegisterOrgPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organizationName: '',
    organizationDescription: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.adminPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/organizations/register', {
        organizationName: form.organizationName,
        organizationDescription: form.organizationDescription,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      });
      toast.success('Organization registered! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { section: 'Organization Details' },
    { name: 'organizationName', label: 'Organization Name', type: 'text', icon: Building2, placeholder: 'Acme Corp', required: true },
    { name: 'organizationDescription', label: 'Description (optional)', type: 'text', icon: FileText, placeholder: 'What does your org do?' },
    { section: 'Admin Account' },
    { name: 'adminName', label: 'Your Name', type: 'text', icon: User, placeholder: 'Jane Smith', required: true },
    { name: 'adminEmail', label: 'Email', type: 'email', icon: Mail, placeholder: 'admin@company.com', required: true },
    { name: 'adminPassword', label: 'Password', type: 'password', icon: Lock, placeholder: '••••••••', required: true },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: Lock, placeholder: '••••••••', required: true },
  ];

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 p-4 py-10">
      <div className="card w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Register Your Organization</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your private AI knowledge base in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => {
            if (f.section) {
              return (
                <div key={f.section} className="pt-2">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b pb-2">{f.section}</h2>
                </div>
              );
            }
            const Icon = f.icon;
            return (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type={f.type} name={f.name} required={f.required}
                    value={form[f.name]} onChange={handleChange}
                    className="input-field pl-9" placeholder={f.placeholder}
                  />
                </div>
              </div>
            );
          })}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Registering...' : 'Register Organization'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
