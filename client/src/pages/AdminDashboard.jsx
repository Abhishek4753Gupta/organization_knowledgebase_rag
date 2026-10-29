import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Upload, FileText, Users, Trash2, UserPlus, Shield, RefreshCw, Building2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const statusIcon = { ready: <CheckCircle className="h-4 w-4 text-green-500" />, processing: <Clock className="h-4 w-4 text-yellow-500" />, error: <AlertCircle className="h-4 w-4 text-red-500" /> };
const statusColor = { ready: 'text-green-600 bg-green-50', processing: 'text-yellow-600 bg-yellow-50', error: 'text-red-600 bg-red-50' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const fileRef = useRef();

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoadingDocs(true);
    try {
      const [docsRes, usersRes, statsRes] = await Promise.all([
        api.get('/documents'),
        api.get('/organizations/users'),
        api.get('/organizations/stats'),
      ]);
      setDocuments(docsRes.data.documents);
      setOrgUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded! Processing in background...');
      setTimeout(fetchAll, 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document and all its vectors?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Document deleted');
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      await api.post('/organizations/users', newUser);
      toast.success('User added successfully');
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await api.patch(`/organizations/users/${userId}/toggle`);
      toast.success(res.data.message);
      fetchAll();
    } catch {
      toast.error('Failed to toggle user status');
    }
  };

  const tabs = [
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500">{user?.organization?.name}</p>
        </div>
        {stats && (
          <div className="flex gap-4">
            {[
              { label: 'Documents', value: stats.organization.documentCount, icon: FileText },
              { label: 'Users', value: stats.userCount, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card text-center min-w-[100px] py-4">
                <Icon className="h-5 w-5 text-primary-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Upload className="h-5 w-5 text-primary-500" />Upload Document</h2>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <><LoadingSpinner className="mb-2" /><p className="text-gray-500">Uploading & processing...</p></>
              ) : (
                <><Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" /><p className="text-gray-600 font-medium">Click to upload PDF, TXT, or Markdown</p><p className="text-gray-400 text-sm">Max 50 MB</p></>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleUpload} />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Documents ({documents.length})</h2>
              <button onClick={fetchAll} className="btn-secondary text-sm flex items-center gap-1"><RefreshCw className="h-3 w-3" />Refresh</button>
            </div>
            {loadingDocs ? <LoadingSpinner /> : documents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary-400" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.originalName}</p>
                        <p className="text-xs text-gray-500">{doc.chunkCount} chunks · {(doc.size / 1024).toFixed(1)} KB · by {doc.uploadedBy?.name}</p>
                        {doc.status === 'error' && doc.errorMessage && (
                          <p className="text-xs text-red-600 mt-1 max-w-xl break-words">{doc.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor[doc.status]}`}>
                        {statusIcon[doc.status]}{doc.status}
                      </span>
                      <button onClick={() => handleDelete(doc._id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary-500" />Add User</h2>
            <form onSubmit={handleAddUser} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input className="input-field" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@company.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" className="input-field" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="input-field" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-span-2">
                <button type="submit" disabled={addingUser} className="btn-primary">{addingUser ? 'Adding...' : 'Add User'}</button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Team Members ({orgUsers.length})</h2>
            <div className="space-y-3">
              {orgUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 rounded-full p-2">
                      {u.role === 'admin' ? <Shield className="h-4 w-4 text-amber-500" /> : <Users className="h-4 w-4 text-primary-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleUser(u._id)}
                    className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
                      u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
