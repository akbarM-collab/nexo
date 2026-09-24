import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Users,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  History,
  Clock,
  UserCheck,
  AlertTriangle,
  Lock,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { UserAccount, UserRole, AuditLog } from '../../types';
import { SecurityPinModal } from './SecurityPinModal';

export const AdminDashboardView: React.FC = () => {
  const {
    isAdmin,
    currentUserAccount,
    userAccounts,
    auditLogs,
    addUserAccount,
    updateUserAccount,
    toggleUserAccountStatus,
    deleteUserAccount,
    language,
    setCurrentRoute,
  } = useFinancial();

  // Active tab: 'users' or 'audit'
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Security PIN Modal State for Authorizing Actions
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: (pin: string) => { success: boolean; error?: string };
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => ({ success: true }),
  });

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
    isActive: true,
  });
  const [formError, setFormError] = useState('');

  // Edit User Form State
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
  });

  // Success / Feedback notification
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return userAccounts.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'inactive' && !u.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [userAccounts, searchQuery, roleFilter, statusFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      return (
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.targetUser && log.targetUser.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [auditLogs, searchQuery]);

  // Authorization Check: Only Admin can see this dashboard!
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center select-none">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4 shadow-lg">
          <ShieldAlert className="size-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-100">
          {language === 'id' ? 'Akses Ditolak (403 Forbidden)' : 'Access Denied (403 Forbidden)'}
        </h2>
        <p className="mt-2 text-sm text-neutral-400 max-w-md">
          {language === 'id'
            ? `Halaman Dashboard Admin memiliki otorisasi terbatas. Akun Anda (${
                currentUserAccount?.username || 'user'
              }) bertipe Pengguna Biasa dan tidak memiliki izin akses Administrator.`
            : `The Admin Dashboard is strictly restricted. Your account has standard user permissions.`}
        </p>
        <button
          onClick={() => setCurrentRoute('/dashboard')}
          className="mt-6 px-4 py-2 bg-neutral-800 text-neutral-200 rounded-xl hover:bg-neutral-700 transition-colors text-xs font-semibold"
        >
          {language === 'id' ? 'Kembali ke Dasbor Utama' : 'Return to Main Dashboard'}
        </button>
      </div>
    );
  }

  // --- Handlers with Security PIN Enforcement ---

  // 1. Trigger Add User with PIN confirmation
  const handleRequestAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.name.trim() || !newUserForm.password.trim()) {
      setFormError(
        language === 'id'
          ? 'Semua kolom bertanda wajib harus diisi.'
          : 'Please fill in all required fields.'
      );
      return;
    }

    setPinModalConfig({
      isOpen: true,
      title: language === 'id' ? 'Otorisasi Pembuatan Pengguna' : 'Authorize User Creation',
      description:
        language === 'id'
          ? `Konfirmasi pembuatan akun pengguna baru '${newUserForm.username.trim()}' (${
              newUserForm.name.trim()
            }) dengan peran ${
              newUserForm.role === 'admin' ? 'Administrator' : 'Pengguna Biasa'
            }.`
          : `Confirm creation of new user account '${newUserForm.username.trim()}'.`,
      action: (pin: string) => {
        const res = addUserAccount(
          {
            username: newUserForm.username.trim(),
            name: newUserForm.name.trim(),
            email: newUserForm.email.trim() || `${newUserForm.username.trim()}@nexo.app`,
            password: newUserForm.password.trim(),
            role: newUserForm.role,
            isActive: newUserForm.isActive,
          },
          pin
        );

        if (res.success) {
          setIsAddUserModalOpen(false);
          setNewUserForm({
            username: '',
            name: '',
            email: '',
            password: '',
            role: 'user',
            isActive: true,
          });
          setFormError('');
          showFeedback(
            language === 'id'
              ? 'Akun pengguna baru berhasil dibuat.'
              : 'New user account created successfully.'
          );
        }
        return res;
      },
    });
  };

  // 2. Trigger Edit User with PIN confirmation
  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setFormError('');
  };

  const handleRequestUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editUserForm.name.trim() || !editUserForm.email.trim()) {
      setFormError(
        language === 'id' ? 'Nama dan Email wajib diisi.' : 'Name and Email are required.'
      );
      return;
    }

    setPinModalConfig({
      isOpen: true,
      title: language === 'id' ? 'Otorisasi Perubahan Data Pengguna' : 'Authorize User Update',
      description:
        language === 'id'
          ? `Konfirmasi penyimpanan pembaruan profil akun '${editingUser.username}'.`
          : `Confirm updates for account '${editingUser.username}'.`,
      action: (pin: string) => {
        const updates: Partial<UserAccount> = {
          name: editUserForm.name.trim(),
          email: editUserForm.email.trim(),
          role: editUserForm.role,
        };
        if (editUserForm.password.trim()) {
          updates.password = editUserForm.password.trim();
        }

        const res = updateUserAccount(editingUser.id, updates, pin);
        if (res.success) {
          setEditingUser(null);
          showFeedback(
            language === 'id'
              ? 'Data pengguna berhasil diperbarui.'
              : 'User details updated successfully.'
          );
        }
        return res;
      },
    });
  };

  // 3. Trigger Toggle Status (Activate / Deactivate) with PIN confirmation
  const handleRequestToggleStatus = (user: UserAccount) => {
    const nextAction = user.isActive
      ? language === 'id'
        ? 'Penonaktifan'
        : 'Deactivation'
      : language === 'id'
      ? 'Pengaktifan Kembali'
      : 'Activation';

    setPinModalConfig({
      isOpen: true,
      title: `${language === 'id' ? 'Otorisasi' : 'Authorize'} ${nextAction}`,
      description:
        language === 'id'
          ? `Apakah Anda yakin ingin ${
              user.isActive ? 'menonaktifkan' : 'mengaktifkan kembali'
            } akses akun '${user.username}' (${user.name})? Pengguna ${
              user.isActive ? 'tidak akan bisa login ke aplikasi.' : 'akan dapat login kembali.'
            }`
          : `Confirm ${nextAction.toLowerCase()} of account '${user.username}'.`,
      action: (pin: string) => {
        const res = toggleUserAccountStatus(user.id, pin);
        if (res.success) {
          showFeedback(
            language === 'id'
              ? `Status akun ${user.username} berhasil diubah.`
              : `Account status for ${user.username} updated.`
          );
        }
        return res;
      },
    });
  };

  // 4. Trigger Delete User with PIN confirmation
  const handleRequestDeleteUser = (user: UserAccount) => {
    setPinModalConfig({
      isOpen: true,
      title: language === 'id' ? 'Otorisasi Penghapusan Akun' : 'Authorize Account Deletion',
      description:
        language === 'id'
          ? `PERINGATAN SENSITIF: Akun '${user.username}' (${user.name}) akan dihapus secara permanen dari basis data sistem.`
          : `CRITICAL: Account '${user.username}' will be permanently deleted from the system.`,
      action: (pin: string) => {
        const res = deleteUserAccount(user.id, pin);
        if (res.success) {
          showFeedback(
            language === 'id'
              ? `Akun ${user.username} berhasil dihapus permanen.`
              : `Account ${user.username} permanently deleted.`
          );
        }
        return res;
      },
    });
  };

  // Export audit logs as CSV
  const handleExportAuditLogs = () => {
    const headers = ['ID', 'Tindakan', 'Detail', 'Dilakukan Oleh', 'Target Pengguna', 'Waktu ISO'];
    const rows = auditLogs.map((log) => [
      log.id,
      log.action,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${log.performedBy}"`,
      log.targetUser || '-',
      log.timestamp,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexo-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(date);
    } catch {
      return iso;
    }
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'CREATE_USER':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            <UserPlus className="size-2.5" /> CREATE
          </span>
        );
      case 'UPDATE_USER':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
            <Edit2 className="size-2.5" /> UPDATE
          </span>
        );
      case 'DEACTIVATE_USER':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
            <PowerOff className="size-2.5" /> DEACTIVATE
          </span>
        );
      case 'ACTIVATE_USER':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/20">
            <Power className="size-2.5" /> ACTIVATE
          </span>
        );
      case 'DELETE_USER':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
            <Trash2 className="size-2.5" /> DELETE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-700/40 px-2 py-0.5 text-[10px] font-semibold text-neutral-300 border border-neutral-700">
            <Shield className="size-2.5" /> SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Shield className="size-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">
              {language === 'id' ? 'Dashboard Administrator' : 'Admin Dashboard'}
            </h1>
            <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
              RBAC PROTECTED
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            {language === 'id'
              ? 'Kelola akun pengguna, hak akses role, serta audit trail kepatuhan perubahan data dengan verifikasi PIN keamanan.'
              : 'Manage user accounts, RBAC permissions, and review audit trail logs with security PIN authorization.'}
          </p>
        </div>

        {/* Action Button: Add User */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setFormError('');
              setIsAddUserModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-white transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="size-4" />
            <span>{language === 'id' ? 'Tambah Pengguna Baru' : 'Add New User'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium border animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="size-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3.5">
          <span className="text-[11px] font-medium text-neutral-400 flex items-center justify-between">
            {language === 'id' ? 'Total Pengguna' : 'Total Users'}
            <Users className="size-3.5 text-neutral-500" />
          </span>
          <p className="mt-1 font-mono text-xl font-bold text-neutral-100">{userAccounts.length}</p>
          <span className="text-[10px] text-neutral-500">
            {userAccounts.filter((u) => u.isActive).length} {language === 'id' ? 'aktif' : 'active'}
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3.5">
          <span className="text-[11px] font-medium text-neutral-400 flex items-center justify-between">
            {language === 'id' ? 'Administrator' : 'Administrators'}
            <ShieldCheck className="size-3.5 text-blue-400" />
          </span>
          <p className="mt-1 font-mono text-xl font-bold text-blue-400">
            {userAccounts.filter((u) => u.role === 'admin').length}
          </p>
          <span className="text-[10px] text-neutral-500">
            {language === 'id' ? 'Hak akses penuh' : 'Full system privileges'}
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3.5">
          <span className="text-[11px] font-medium text-neutral-400 flex items-center justify-between">
            {language === 'id' ? 'Pengguna Biasa' : 'Standard Users'}
            <UserCheck className="size-3.5 text-emerald-400" />
          </span>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
            {userAccounts.filter((u) => u.role === 'user').length}
          </p>
          <span className="text-[10px] text-neutral-500">
            {language === 'id' ? 'Akses finansial operasional' : 'Operational finance'}
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3.5">
          <span className="text-[11px] font-medium text-neutral-400 flex items-center justify-between">
            {language === 'id' ? 'Total Log Audit' : 'Audit Trail Logs'}
            <History className="size-3.5 text-amber-400" />
          </span>
          <p className="mt-1 font-mono text-xl font-bold text-amber-400">{auditLogs.length}</p>
          <span className="text-[10px] text-neutral-500">
            {language === 'id' ? 'Peristiwa tercatat' : 'Recorded change events'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-neutral-100 text-neutral-100 font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users className="size-4" />
          <span>{language === 'id' ? 'Kelola Akun Pengguna' : 'Manage User Accounts'}</span>
          <span className="rounded-full bg-neutral-800 px-1.5 py-0.2 text-[10px] text-neutral-300">
            {userAccounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-neutral-100 text-neutral-100 font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <History className="size-4" />
          <span>{language === 'id' ? 'Riwayat Perubahan & Audit Log' : 'Audit Logs & Change History'}</span>
          <span className="rounded-full bg-neutral-800 px-1.5 py-0.2 text-[10px] text-neutral-300">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'users'
                ? language === 'id'
                  ? 'Cari nama, username, atau email...'
                  : 'Search by name, username, or email...'
                : language === 'id'
                ? 'Cari rincian log, user pengubah...'
                : 'Search audit logs, performed by...'
            }
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 pl-9 pr-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
          />
        </div>

        {activeTab === 'users' ? (
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="rounded-xl border border-neutral-800 bg-neutral-900/80 px-2.5 py-2 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">{language === 'id' ? 'Semua Peran' : 'All Roles'}</option>
              <option value="admin">Administrator</option>
              <option value="user">{language === 'id' ? 'Pengguna Biasa' : 'Standard User'}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-neutral-800 bg-neutral-900/80 px-2.5 py-2 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">{language === 'id' ? 'Semua Status' : 'All Status'}</option>
              <option value="active">{language === 'id' ? 'Aktif' : 'Active'}</option>
              <option value="inactive">{language === 'id' ? 'Dinonaktifkan' : 'Inactive'}</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAuditLogs}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-400" />
              <span>{language === 'id' ? 'Ekspor CSV' : 'Export CSV'}</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: USERS MANAGEMENT TABLE */}
      {activeTab === 'users' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-900/70 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tanggal Dibuat</th>
                  <th className="px-4 py-3">Login Terakhir</th>
                  <th className="px-4 py-3 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                      Tidak ada akun pengguna yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === currentUserAccount?.id;

                    return (
                      <tr key={user.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-neutral-200">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[9px] text-neutral-400">
                                    {language === 'id' ? 'Anda' : 'You'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                                <span className="font-mono text-neutral-400">@{user.username}</span>
                                <span>•</span>
                                <span className="truncate">{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                              <ShieldCheck className="size-3" /> Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
                              <User className="size-3 text-neutral-400" /> Pengguna Biasa
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                              {language === 'id' ? 'Aktif' : 'Active'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-400 border border-rose-500/20">
                              <span className="size-1.5 rounded-full bg-rose-400" />
                              {language === 'id' ? 'Dinonaktifkan' : 'Deactivated'}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-neutral-400 font-mono text-[11px]">
                          {formatTimestamp(user.createdAt)}
                        </td>

                        <td className="px-4 py-3 text-neutral-400 font-mono text-[11px]">
                          {user.lastLoginAt ? formatTimestamp(user.lastLoginAt) : '-'}
                        </td>

                        {/* Action buttons (All protected by Security PIN modal) */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              title="Edit rincian akun"
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            >
                              <Edit2 className="size-3.5" />
                            </button>

                            {/* Toggle Active/Inactive Button */}
                            <button
                              onClick={() => handleRequestToggleStatus(user)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? 'Tidak dapat menonaktifkan akun sendiri'
                                  : user.isActive
                                  ? 'Nonaktifkan akun pengguna'
                                  : 'Aktifkan kembali akun pengguna'
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed text-neutral-600'
                                  : user.isActive
                                  ? 'text-amber-400 hover:bg-amber-500/10'
                                  : 'text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {user.isActive ? (
                                <PowerOff className="size-3.5" />
                              ) : (
                                <Power className="size-3.5" />
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleRequestDeleteUser(user)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? 'Tidak dapat menghapus akun Anda sendiri'
                                  : 'Hapus akun pengguna'
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed text-neutral-600'
                                  : 'text-rose-400 hover:bg-rose-500/10'
                              }`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS TABLE */}
      {activeTab === 'audit' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-900/70 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Tindakan</th>
                  <th className="px-4 py-3">Rincian Perubahan Data</th>
                  <th className="px-4 py-3">Target Pengguna</th>
                  <th className="px-4 py-3">Dilakukan Oleh</th>
                  <th className="px-4 py-3">Waktu Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                      Tidak ada rekaman log audit yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                      <td className="px-4 py-3 text-neutral-200 max-w-md font-medium">
                        {log.details}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 font-mono text-[11px]">
                        {log.targetUser ? `@${log.targetUser}` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Shield className="size-3 text-neutral-500" />
                          {log.performedBy}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                        {formatTimestamp(log.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW USER (Strictly Admin Provisioned) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <UserPlus className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-100">
                  {language === 'id' ? 'Buat Akun Pengguna Baru' : 'Create New User Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleRequestAddUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  {language === 'id' ? 'Nama Pengguna (Username)*' : 'Username*'}
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.username}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })
                  }
                  placeholder="e.g. johan, sarah"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  {language === 'id' ? 'Nama Lengkap*' : 'Full Name*'}
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Johan Alexander"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="contoh: johan@nexo.app"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  {language === 'id' ? 'Kata Sandi (Password)*' : 'Password*'}
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder={language === 'id' ? 'Minimal 6 karakter' : 'At least 6 characters'}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">
                    {language === 'id' ? 'Hak Akses (Role)' : 'Role'}
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:outline-none"
                  >
                    <option value="user">{language === 'id' ? 'Pengguna Biasa (User)' : 'Standard User'}</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-300 mb-1">
                    {language === 'id' ? 'Status Awal' : 'Initial Status'}
                  </label>
                  <select
                    value={newUserForm.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isActive: e.target.value === 'active' })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:outline-none"
                  >
                    <option value="active">{language === 'id' ? 'Langsung Aktif' : 'Active'}</option>
                    <option value="inactive">{language === 'id' ? 'Nonaktif' : 'Inactive'}</option>
                  </select>
                </div>
              </div>

              {/* Note on PIN verification */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                <Lock className="size-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  {language === 'id'
                    ? 'Menekan tombol Lanjutkan akan meminta verifikasi PIN Keamanan Administrator sebelum akun diproses.'
                    : 'Security PIN verification is required before user creation is finalized.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3.5 py-2 text-neutral-400 hover:text-white"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 font-semibold text-neutral-950 hover:bg-white transition-all shadow-sm"
                >
                  <UserPlus className="size-3.5" />
                  <span>{language === 'id' ? 'Lanjutkan & Verifikasi PIN' : 'Proceed & Verify PIN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER (Strictly Admin Managed) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Edit2 className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-100">
                  {language === 'id' ? `Edit Akun: @${editingUser.username}` : `Edit Account: @${editingUser.username}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-neutral-500 hover:text-neutral-300 p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleRequestUpdateUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  {language === 'id' ? 'Nama Lengkap*' : 'Full Name*'}
                </label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  {language === 'id' ? 'Ganti Password Baru (Opsional)' : 'Change Password (Optional)'}
                </label>
                <input
                  type="password"
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                  placeholder={language === 'id' ? 'Biarkan kosong jika tidak ingin diubah' : 'Leave empty to keep existing'}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none placeholder-neutral-600"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  {language === 'id' ? 'Hak Akses (Role)' : 'Role'}
                </label>
                <select
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                  disabled={editingUser.id === currentUserAccount?.id}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:outline-none disabled:opacity-50"
                >
                  <option value="user">{language === 'id' ? 'Pengguna Biasa (User)' : 'Standard User'}</option>
                  <option value="admin">Administrator</option>
                </select>
                {editingUser.id === currentUserAccount?.id && (
                  <p className="mt-1 text-[10px] text-neutral-500">
                    {language === 'id'
                      ? 'Anda tidak dapat menurunkan role akun Anda sendiri.'
                      : 'You cannot demote your own account role.'}
                  </p>
                )}
              </div>

              {/* Note on PIN verification */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                <Lock className="size-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  {language === 'id'
                    ? 'Perubahan ini wajib dikonfirmasi dengan PIN Keamanan Administrator.'
                    : 'This change requires Administrator Security PIN confirmation.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 text-neutral-400 hover:text-white"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 font-semibold text-neutral-950 hover:bg-white transition-all shadow-sm"
                >
                  <KeyRound className="size-3.5" />
                  <span>{language === 'id' ? 'Simpan dengan PIN' : 'Save with PIN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY PIN CONFIRMATION MODAL */}
      <SecurityPinModal
        isOpen={pinModalConfig.isOpen}
        onClose={() => setPinModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={pinModalConfig.title}
        actionDescription={pinModalConfig.description}
        onConfirm={pinModalConfig.action}
      />
    </div>
  );
};
