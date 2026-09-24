import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Printer,
  X,
  Check,
  Trash2,
  Edit2,
  DollarSign,
  Download,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../types';
import { formatMoney, formatDate, getTodayIso, genId } from '../../utils/formatters';

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    accounts,
    hideAmounts,
    addInvoice,
    updateInvoice,
    markInvoicePaid,
    deleteInvoice,
  } = useFinancial();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [payAccountId, setPayAccountId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [issueDate, setIssueDate] = useState(getTodayIso());
  const [dueDate, setDueDate] = useState(getTodayIso());
  const [status, setStatus] = useState<InvoiceStatus>('sent');
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState<Omit<InvoiceItem, 'id' | 'totalMinor'>[]>([
    { description: '', quantity: 1, unitPriceMinor: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  const openAddModal = () => {
    setEditingInvoice(null);
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setClientName('');
    setClientEmail('');
    setIssueDate(getTodayIso());
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setDueDate(nextMonth.toISOString().split('T')[0]);
    setStatus('sent');
    setCurrency('USD');
    setItems([{ description: '', quantity: 1, unitPriceMinor: 0 }]);
    setNotes('Thank you for your business. Please remit payment within terms.');
    setPaymentTerms('Net 30');
    setIsAddModalOpen(true);
  };

  const openEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceNumber(inv.invoiceNumber);
    setClientName(inv.clientName);
    setClientEmail(inv.clientEmail || '');
    setIssueDate(inv.issueDate);
    setDueDate(inv.dueDate);
    setStatus(inv.status);
    setCurrency(inv.currency);
    setItems(
      inv.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
      }))
    );
    setNotes(inv.notes || '');
    setPaymentTerms(inv.paymentTerms || 'Net 30');
    setIsAddModalOpen(true);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPriceMinor: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || items.length === 0) return;

    const formattedItems: InvoiceItem[] = items.map((item) => ({
      id: genId('li'),
      description: item.description.trim() || 'Item description',
      quantity: Number(item.quantity) || 1,
      unitPriceMinor: Number(item.unitPriceMinor) || 0,
      totalMinor: (Number(item.quantity) || 1) * (Number(item.unitPriceMinor) || 0),
    }));

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        invoiceNumber,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        issueDate,
        dueDate,
        status,
        currency,
        items: formattedItems,
        notes: notes.trim() || undefined,
        paymentTerms,
      });
    } else {
      addInvoice({
        invoiceNumber,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        issueDate,
        dueDate,
        status,
        currency,
        items: formattedItems,
        notes: notes.trim() || undefined,
        paymentTerms,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleConfirmMarkPaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoice || !payAccountId) return;
    markInvoicePaid(payInvoice.id, payAccountId);
    setPayInvoice(null);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeTab !== 'all' && inv.status !== activeTab) return false;
      return true;
    });
  }, [invoices, activeTab]);

  const totals = useMemo(() => {
    let pending = 0;
    let paid = 0;
    for (const inv of invoices) {
      const invTotal = inv.items.reduce((s, i) => s + i.totalMinor, 0);
      const rate = inv.currency === 'USD' ? 16200 : inv.currency === 'IDR' ? 1 : 16200;
      if (inv.status === 'paid') paid += invTotal * rate;
      else pending += invTotal * rate;
    }
    return { pending, paid };
  }, [invoices]);

  const getStatusBadge = (st: InvoiceStatus) => {
    switch (st) {
      case 'paid':
        return (
          <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 className="size-3" /> Paid
          </span>
        );
      case 'sent':
        return (
          <span className="flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
            <Clock className="size-3" /> Sent / Open
          </span>
        );
      case 'overdue':
        return (
          <span className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
            <AlertCircle className="size-3" /> Overdue
          </span>
        );
      default:
        return (
          <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Invoices</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Client billings, freelancing retainers, and accounts receivable tracking.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Pending Invoices</p>
          <p className="mt-1 font-mono text-lg font-bold text-neutral-100">
            {formatMoney(totals.pending, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Uncollected client revenue</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Settled Invoices</p>
          <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
            {formatMoney(totals.paid, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Total collected earnings</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-neutral-900/50 p-1 border border-neutral-800 max-w-fit">
        {[
          { id: 'all', label: 'All Invoices' },
          { id: 'sent', label: 'Sent' },
          { id: 'paid', label: 'Paid' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'draft', label: 'Draft' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.map((inv) => {
          const totalAmount = inv.items.reduce((s, i) => s + i.totalMinor, 0);

          return (
            <div
              key={inv.id}
              className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 hover:border-neutral-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300">
                  <FileText className="size-4 text-neutral-400" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-200">
                      {inv.invoiceNumber}
                    </span>
                    {getStatusBadge(inv.status)}
                  </div>

                  <p className="text-xs font-semibold text-neutral-300 mt-0.5 truncate">
                    {inv.clientName}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                    <span>Issued: {formatDate(inv.issueDate, 'short')}</span>
                    <span>•</span>
                    <span>Due: {formatDate(inv.dueDate, 'short')}</span>
                    <span>•</span>
                    <span>{inv.items.length} line items</span>
                  </div>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                <div className="text-left sm:text-right font-mono">
                  <span className="text-sm font-bold text-neutral-100">
                    {formatMoney(totalAmount, inv.currency, hideAmounts)}
                  </span>
                  <p className="text-[10px] text-neutral-500 uppercase">{inv.currency}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewInvoice(inv)}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                    title="Preview Invoice"
                  >
                    <Eye className="size-3.5" />
                  </button>

                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => {
                        setPayInvoice(inv);
                        if (accounts.length > 0) setPayAccountId(accounts[0].id);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      <Check className="size-3.5" /> Mark Paid
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(inv)}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <Edit2 className="size-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) deleteInvoice(inv.id);
                    }}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Document Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5 bg-neutral-950/80">
              <span className="text-xs font-semibold text-neutral-300">
                Invoice Document Preview ({previewInvoice.invoiceNumber})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-lg border border-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  <Printer className="size-3.5" /> Print
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Page */}
            <div className="p-8 bg-neutral-950 text-neutral-100 overflow-y-auto space-y-8 font-sans">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                      N
                    </div>
                    <span className="text-base font-bold tracking-tight">Nexo Financials</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Jakarta, Indonesia • hello@nexo.app</p>
                </div>

                <div className="text-right">
                  <h2 className="text-xl font-bold tracking-tight">INVOICE</h2>
                  <p className="text-xs font-mono text-neutral-400 mt-0.5">{previewInvoice.invoiceNumber}</p>
                  <div className="mt-2">{getStatusBadge(previewInvoice.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-neutral-800 py-4 text-xs">
                <div>
                  <span className="text-neutral-500 uppercase font-semibold text-[10px] tracking-wider">
                    Billed To:
                  </span>
                  <p className="font-bold text-neutral-200 mt-0.5">{previewInvoice.clientName}</p>
                  {previewInvoice.clientEmail && (
                    <p className="text-neutral-400">{previewInvoice.clientEmail}</p>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-neutral-500">Issue Date: </span>
                    <span className="font-medium text-neutral-300">{previewInvoice.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Due Date: </span>
                    <span className="font-medium text-neutral-300">{previewInvoice.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Terms: </span>
                    <span className="font-medium text-neutral-300">{previewInvoice.paymentTerms || 'Net 30'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-500">
                      <th className="py-2 font-medium">Description</th>
                      <th className="py-2 text-right font-medium">Qty</th>
                      <th className="py-2 text-right font-medium">Unit Price</th>
                      <th className="py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 font-mono">
                    {previewInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 text-neutral-200 font-sans">{item.description}</td>
                        <td className="py-2.5 text-right text-neutral-400">{item.quantity}</td>
                        <td className="py-2.5 text-right text-neutral-400">
                          {formatMoney(item.unitPriceMinor, previewInvoice.currency, hideAmounts)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-neutral-100">
                          {formatMoney(item.totalMinor, previewInvoice.currency, hideAmounts)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-neutral-800 pt-3 flex justify-end">
                  <div className="w-48 space-y-1 text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal</span>
                      <span className="font-mono">
                        {formatMoney(
                          previewInvoice.items.reduce((s, i) => s + i.totalMinor, 0),
                          previewInvoice.currency,
                          hideAmounts
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-neutral-100 border-t border-neutral-800 pt-1.5">
                      <span>Total Due</span>
                      <span className="font-mono">
                        {formatMoney(
                          previewInvoice.items.reduce((s, i) => s + i.totalMinor, 0),
                          previewInvoice.currency,
                          hideAmounts
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {previewInvoice.notes && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-neutral-400">
                  <p className="font-semibold text-neutral-300 mb-0.5">Notes & Instructions:</p>
                  <p>{previewInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Account Selector Modal */}
      {payInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                Mark Invoice Paid
              </h2>
              <button
                onClick={() => setPayInvoice(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkPaid} className="p-5 space-y-4">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Record receiving payment for <span className="text-neutral-200 font-semibold">{payInvoice.invoiceNumber}</span> ({payInvoice.clientName}) and credit it to your ledger account.
              </p>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Deposit Into Account
                </label>
                <select
                  required
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPayInvoice(null)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
                >
                  <Check className="size-3.5" /> Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Invoice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Invoice #</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Acme Corp, Northwind Studio..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Client Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="billing@client.com"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-neutral-400">Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1"
                  >
                    <Plus className="size-3" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-center text-neutral-100 focus:border-neutral-600 focus:outline-none"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Price"
                        value={item.unitPriceMinor}
                        onChange={(e) => handleItemChange(idx, 'unitPriceMinor', parseFloat(e.target.value) || 0)}
                        className="w-24 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs font-mono text-neutral-100 focus:border-neutral-600 focus:outline-none"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
                >
                  <Check className="size-3.5" /> Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
