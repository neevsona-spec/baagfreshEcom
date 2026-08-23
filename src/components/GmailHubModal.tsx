import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  FileText, 
  User, 
  ShieldCheck, 
  Inbox, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  connectGoogleGmail, 
  getGmailAccessToken, 
  fetchGmailProfile, 
  sendGmailMessage, 
  listRecentEmails, 
  generateOrderConfirmationEmailHtml,
  generateInquiryReplyEmailHtml,
  GmailProfile, 
  GmailMessageSummary 
} from '../lib/gmailService';
import { useApp } from '../context/AppContext';
import { Order, WholesaleInquiry } from '../types';

interface GmailHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: Order | null;
  initialInquiry?: WholesaleInquiry | null;
}

export const GmailHubModal: React.FC<GmailHubModalProps> = ({
  isOpen,
  onClose,
  initialOrder,
  initialInquiry,
}) => {
  const { orders, wholesaleInquiries, showToast } = useApp();
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [recentEmails, setRecentEmails] = useState<GmailMessageSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'invoice' | 'inquiry' | 'custom' | 'inbox'>('invoice');

  // Confirmation modal state for mutating email send operations
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmDetails, setConfirmDetails] = useState<{ title: string; recipient: string; subject: string }>({
    title: '',
    recipient: '',
    subject: '',
  });

  // Invoice tab state
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrder?.id || (orders[0]?.id || ''));
  const [recipientEmail, setRecipientEmail] = useState<string>(initialOrder?.shippingAddress?.fullName ? 'customer@example.com' : '');

  // Inquiry tab state
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>(initialInquiry?.id || (wholesaleInquiries[0]?.id || ''));
  const [inquiryReplyText, setInquiryReplyText] = useState<string>('Thank you for contacting Baagh Fresh. We can fulfill your wholesale dry fruit requirement with fresh Grade-1 batches. Please find our estimated terms below.');
  const [inquiryQuoteAmount, setInquiryQuoteAmount] = useState<string>('15000');

  // Custom compose state
  const [customTo, setCustomTo] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');

  // Check auth state on mount
  useEffect(() => {
    if (isOpen) {
      checkConnection();
      if (initialOrder) {
        setActiveTab('invoice');
        setSelectedOrderId(initialOrder.id);
      } else if (initialInquiry) {
        setActiveTab('inquiry');
        setSelectedInquiryId(initialInquiry.id);
      }
    }
  }, [isOpen, initialOrder, initialInquiry]);

  const checkConnection = async () => {
    const token = getGmailAccessToken();
    if (token) {
      try {
        setLoading(true);
        const prof = await fetchGmailProfile();
        setProfile(prof);
        setIsConnected(true);
        loadRecentEmails();
      } catch (e) {
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    } else {
      setIsConnected(false);
    }
  };

  const loadRecentEmails = async () => {
    try {
      const list = await listRecentEmails('Baagh Fresh OR Order', 6);
      setRecentEmails(list);
    } catch (e) {
      console.warn('Error loading recent emails:', e);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setLoading(true);
      const res = await connectGoogleGmail();
      const prof = await fetchGmailProfile();
      setProfile(prof);
      setIsConnected(true);
      showToast(`Connected as ${prof.emailAddress}`, 'success');
      loadRecentEmails();
    } catch (err: any) {
      showToast(err.message || 'Failed to connect Gmail', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger confirmation dialog before sending
  const promptEmailConfirmation = (title: string, recipient: string, subject: string, action: () => Promise<void>) => {
    setConfirmDetails({ title, recipient, subject });
    setPendingAction(() => action);
    setShowConfirmModal(true);
  };

  const executeConfirmedSend = async () => {
    if (!pendingAction) return;
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await pendingAction();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch email', 'error');
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  // 1. Send Order Confirmation Email
  const handleSendOrderInvoice = () => {
    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order) {
      showToast('Please select a valid order', 'warning');
      return;
    }
    const targetEmail = recipientEmail || 'customer@example.com';
    if (!targetEmail.includes('@')) {
      showToast('Please specify a valid customer email', 'warning');
      return;
    }

    const subject = `Baagh Fresh Order Confirmation & Invoice #${order.id}`;
    const htmlBody = generateOrderConfirmationEmailHtml({
      id: order.id,
      customerName: order.shippingAddress?.fullName || 'Valued Connoisseur',
      total: order.total,
      items: order.items.map((i) => ({
        name: i.product.name,
        weight: i.selectedWeight,
        quantity: i.quantity,
        price: i.price,
      })),
      address: `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      paymentMethod: order.paymentMethod.toUpperCase(),
      date: order.date || new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    });

    promptEmailConfirmation(
      'Send Order Confirmation & Invoice',
      targetEmail,
      subject,
      async () => {
        await sendGmailMessage({
          to: targetEmail,
          subject,
          htmlBody,
        });
        showToast(`Invoice for Order ${order.orderNumber || order.id} sent to ${targetEmail}`, 'success');
        loadRecentEmails();
      }
    );
  };

  // 2. Send Wholesale Inquiry Reply
  const handleSendInquiryReply = () => {
    const inquiry = wholesaleInquiries.find((iq) => iq.id === selectedInquiryId);
    if (!inquiry) {
      showToast('Please select an inquiry to respond to', 'warning');
      return;
    }

    const subject = `Baagh Fresh Wholesale Response - ${inquiry.companyName || inquiry.contactPerson}`;
    const htmlBody = generateInquiryReplyEmailHtml({
      customerName: inquiry.contactPerson,
      companyName: inquiry.companyName,
      requirement: inquiry.requirement,
      replyMessage: inquiryReplyText,
      quotationAmount: Number(inquiryQuoteAmount) || undefined,
    });

    promptEmailConfirmation(
      'Send Wholesale Reply & Quotation',
      inquiry.email,
      subject,
      async () => {
        await sendGmailMessage({
          to: inquiry.email,
          subject,
          htmlBody,
        });
        showToast(`Quotation sent to ${inquiry.email}`, 'success');
        loadRecentEmails();
      }
    );
  };

  // 3. Send Custom Email
  const handleSendCustomEmail = () => {
    if (!customTo || !customTo.includes('@')) {
      showToast('Please enter a valid recipient email', 'warning');
      return;
    }
    if (!customSubject.trim()) {
      showToast('Please enter a subject', 'warning');
      return;
    }
    if (!customMessage.trim()) {
      showToast('Please enter message body', 'warning');
      return;
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #1f2937; padding: 20px; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #012d1d; margin-top: 0;">Baagh Fresh Dry Fruits & Spices</h2>
        <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px;">
          ${customMessage}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #6b7280; margin: 0;">
          Varanasi Processing Hub • Royal Connoisseur Selection • support@baagfresh.in
        </p>
      </div>
    `;

    promptEmailConfirmation(
      'Dispatch Custom Email',
      customTo,
      customSubject,
      async () => {
        await sendGmailMessage({
          to: customTo,
          subject: customSubject,
          htmlBody,
        });
        showToast(`Email sent to ${customTo}`, 'success');
        setCustomSubject('');
        setCustomMessage('');
        loadRecentEmails();
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#0c1f16] w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-[#275943] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#012d1d] text-[#fed65b] flex items-center justify-between border-b border-[#fed65b]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fed65b]/10 border border-[#fed65b]/30 flex items-center justify-center text-[#fed65b]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel text-lg font-bold">Gmail Integration & Dispatch Hub</h3>
              <p className="text-xs text-slate-300">
                Send nitrogen-sealed harvest invoices, order updates, and B2B quotations directly via Gmail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Sign-in Banner */}
        <div className="p-4 bg-slate-50 dark:bg-[#0f241a] border-b border-slate-200 dark:border-[#275943]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {isConnected && profile ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Connected: {profile.emailAddress}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {profile.messagesTotal.toLocaleString()} Messages in Gmail account
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Gmail Authorization Required
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Connect your Google Account to send official emails with your permission.
                </div>
              </div>
            </div>
          )}

          <div>
            {!isConnected ? (
              <button
                onClick={handleConnectGmail}
                disabled={loading}
                className="px-4 py-2 bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#275943] hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{loading ? 'Connecting...' : 'Sign in with Google (Gmail)'}</span>
              </button>
            ) : (
              <button
                onClick={loadRecentEmails}
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#162f22] text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200"
                title="Refresh Gmail Feed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#275943]/60 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'invoice'
                ? 'border-[#012d1d] text-[#012d1d] dark:border-[#fed65b] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Order Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiry')}
            className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'inquiry'
                ? 'border-[#012d1d] text-[#012d1d] dark:border-[#fed65b] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Wholesale Quotes</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-[#012d1d] text-[#012d1d] dark:border-[#fed65b] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Custom Email</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'inbox'
                ? 'border-[#012d1d] text-[#012d1d] dark:border-[#fed65b] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Recent Activity ({recentEmails.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: ORDER INVOICES */}
          {activeTab === 'invoice' && (
            <div className="space-y-4">
              <div className="bg-[#FAF3E0] dark:bg-[#0f241a] p-4 rounded-2xl border border-[#d6caba] dark:border-[#275943]">
                <div className="text-xs font-bold text-[#012d1d] dark:text-[#fed65b] uppercase tracking-wider mb-1">
                  Varanasi Order Invoice Mailer
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Select an order from the database to generate an official HTML invoice and send it to the customer via your authenticated Gmail.
                </p>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Select Customer Order
                    </label>
                    <select
                      value={selectedOrderId}
                      onChange={(e) => {
                        setSelectedOrderId(e.target.value);
                        const sel = orders.find((o) => o.id === e.target.value);
                        if (sel && sel.shippingAddress?.fullName) {
                          setRecipientEmail(`${sel.shippingAddress.fullName.toLowerCase().replace(/\s+/g, '')}@gmail.com`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          Order #{o.id} - {o.shippingAddress?.fullName || 'Connoisseur'} (₹{o.total}) - {o.status.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Recipient Customer Email
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. customer@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Preview Card */}
                  {selectedOrderId && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#162f22] border border-slate-200 dark:border-[#275943] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#012d1d] dark:text-[#fed65b]">
                          Order #{selectedOrderId} Details
                        </span>
                        <span className="text-emerald-600 font-bold">Ready to Dispatch</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {orders.find((o) => o.id === selectedOrderId)?.items.map((i) => `${i.quantity}x ${i.product.name} (${i.selectedWeight})`).join(', ')}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSendOrderInvoice}
                    disabled={!isConnected || loading}
                    className="w-full py-3 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Dispatching via Gmail...' : 'Send Order Invoice via Gmail'}</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No orders placed yet. Place an order to test invoice mailing.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHOLESALE B2B QUOTES */}
          {activeTab === 'inquiry' && (
            <div className="space-y-4">
              <div className="bg-[#FAF3E0] dark:bg-[#0f241a] p-4 rounded-2xl border border-[#d6caba] dark:border-[#275943]">
                <div className="text-xs font-bold text-[#012d1d] dark:text-[#fed65b] uppercase tracking-wider mb-1">
                  Wholesale & Corporate Quotation Dispatcher
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Respond to bulk procurement inquiries with custom batch terms, pricing, and sample delivery details.
                </p>
              </div>

              {wholesaleInquiries.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Select Inquiry
                    </label>
                    <select
                      value={selectedInquiryId}
                      onChange={(e) => setSelectedInquiryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {wholesaleInquiries.map((iq) => (
                        <option key={iq.id} value={iq.id}>
                          {iq.contactPerson} {iq.companyName ? `(${iq.companyName})` : ''} - {iq.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Quotation Estimate (₹)
                    </label>
                    <input
                      type="number"
                      value={inquiryQuoteAmount}
                      onChange={(e) => setInquiryQuoteAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Executive Response Note
                    </label>
                    <textarea
                      rows={3}
                      value={inquiryReplyText}
                      onChange={(e) => setInquiryReplyText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    onClick={handleSendInquiryReply}
                    disabled={!isConnected || loading}
                    className="w-full py-3 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Sending Quotation...' : 'Send Quotation Email via Gmail'}</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No wholesale inquiries submitted yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM EMAIL */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. patron@example.com"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baagh Fresh Special Harvest Note"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your official response..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleSendCustomEmail}
                disabled={!isConnected || loading}
                className="w-full py-3 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Dispatching...' : 'Send Custom Email via Gmail'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: RECENT ACTIVITY */}
          {activeTab === 'inbox' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Recent Emails in Gmail Account
              </div>

              {recentEmails.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-[#275943]/40 border border-slate-200 dark:border-[#275943] rounded-2xl overflow-hidden">
                  {recentEmails.map((msg) => (
                    <div key={msg.id} className="p-3.5 bg-white dark:bg-[#162f22] hover:bg-slate-50 dark:hover:bg-[#1b3b2b] transition-colors">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                          {msg.subject || '(No Subject)'}
                        </span>
                        <span className="text-[10px] text-slate-400">{msg.date}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                        From: {msg.from} | To: {msg.to}
                      </div>
                      {msg.snippet && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 italic">
                          "{msg.snippet}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No matching emails found. Click Refresh to load from Gmail.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0f241a] border-t border-slate-200 dark:border-[#275943]/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Direct Client Integration</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#162f22] text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300"
          >
            Close Hub
          </button>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog (MANDATORY per Workspace guidelines) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f241a] rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-[#275943] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Confirm Email Dispatch
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {confirmDetails.title}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#162f22] rounded-2xl space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Recipient:</span>{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{confirmDetails.recipient}</span>
              </div>
              <div>
                <span className="text-slate-400">Subject:</span>{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{confirmDetails.subject}</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-[#275943]/40">
                This will send an email from your authenticated Gmail account ({profile?.emailAddress || 'connected Google account'}) with your explicit permission.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162f22]"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedSend}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Send Email</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
