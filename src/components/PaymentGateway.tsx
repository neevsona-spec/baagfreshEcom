import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CreditCard,
  Banknote,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Smartphone,
  Info
} from 'lucide-react';
import { PaymentMethod } from '../types';
import { useApp } from '../context/AppContext';

interface PaymentGatewayProps {
  amount: number;
  receiverPhone: string;
  receiverCity: string;
  receiverPincode: string;
  onPaymentSuccess: (method: PaymentMethod, transactionDetails?: { txnId: string; bankRef: string }) => void;
  onCancel: () => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  amount,
  receiverPhone,
  receiverCity,
  receiverPincode,
  onPaymentSuccess,
  onCancel
}) => {
  const { formatPrice, showToast } = useApp();

  // Selected main payment method tab
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');

  // UPI State
  const [upiMode, setUpiMode] = useState<'qr' | 'app' | 'vpa'>('qr');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred'>('gpay');
  const [customVpa, setCustomVpa] = useState('');
  const [vpaVerified, setVpaVerified] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes countdown
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Card State (RuPay / Visa / Mastercard)
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('ANANYA SHARMA');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // COD State
  const [codCaptcha, setCodCaptcha] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('7842');
  const [codAcknowledged, setCodAcknowledged] = useState(true);

  // Processing & 3D Secure / OTP Simulation modal
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [simulatedOtp, setSimulatedOtp] = useState('583921');
  const [processingMessage, setProcessingMessage] = useState('');

  // Generate dynamic QR timer
  useEffect(() => {
    if (selectedMethod === 'upi' && upiMode === 'qr') {
      const interval = setInterval(() => {
        setQrTimer((prev) => (prev > 0 ? prev - 1 : 300));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedMethod, upiMode]);

  // Generate fresh COD Captcha
  const refreshCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCaptcha(code);
    setCodCaptcha('');
  };

  // Auto format card number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    // detect card type by prefix
    if (val.startsWith('4')) {
      if (selectedMethod !== 'visa') setSelectedMethod('visa');
    } else if (val.startsWith('51') || val.startsWith('52') || val.startsWith('53') || val.startsWith('54') || val.startsWith('55') || val.startsWith('2')) {
      if (selectedMethod !== 'mastercard') setSelectedMethod('mastercard');
    } else if (val.startsWith('60') || val.startsWith('65') || val.startsWith('81') || val.startsWith('82') || val.startsWith('508') || val.startsWith('353') || val.startsWith('6521')) {
      if (selectedMethod !== 'rupay') setSelectedMethod('rupay');
    }
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  // Auto format expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val);
  };

  // Verify custom VPA
  const handleVerifyVpa = () => {
    if (!customVpa.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g., name@okhdfcbank)', 'error');
      setVpaVerified(false);
      return;
    }
    setVpaVerified(true);
    showToast(`UPI ID verified: ${customVpa} (Active on NPCI Network)`, 'success');
  };

  // Copy VPA
  const copyMerchantVpa = () => {
    navigator.clipboard.writeText('baagfresh@okhdfcbank');
    setCopiedVpa(true);
    showToast('Merchant UPI ID copied to clipboard!', 'info');
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  // Trigger Payment
  const initiatePayment = () => {
    // COD Flow
    if (selectedMethod === 'cod') {
      if (codCaptcha !== generatedCaptcha) {
        showToast('Invalid security verification code. Please enter the numbers shown.', 'error');
        return;
      }
      setIsProcessing(true);
      setProcessingMessage('Generating Cash on Delivery consignment booking...');
      setTimeout(() => {
        setIsProcessing(false);
        onPaymentSuccess('cod', {
          txnId: `COD-${Date.now().toString().slice(-8)}`,
          bankRef: `DOORSTEP-${receiverPincode}`
        });
      }, 1200);
      return;
    }

    // UPI Flow
    if (selectedMethod === 'upi') {
      setIsProcessing(true);
      setProcessingMessage(
        upiMode === 'qr'
          ? 'Verifying QR payment transmission from UPI gateway...'
          : `Sending collect request to ${customVpa || selectedUpiApp.toUpperCase()}...`
      );

      setTimeout(() => {
        setIsProcessing(false);
        setShowOtpModal(true);
        setSimulatedOtp(Math.floor(100000 + Math.random() * 900000).toString());
        setOtpTimer(60);
      }, 1000);
      return;
    }

    // Card Flow (RuPay, Visa, Mastercard)
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
      showToast('Please enter a valid 16-digit card number', 'error');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      showToast('Please enter a valid 3-digit CVV', 'error');
      return;
    }

    setIsProcessing(true);
    setProcessingMessage(`Connecting to ${selectedMethod.toUpperCase()} 3D-Secure 2.0 Access Control Server...`);
    setTimeout(() => {
      setIsProcessing(false);
      setShowOtpModal(true);
      setSimulatedOtp(Math.floor(100000 + Math.random() * 900000).toString());
      setOtpTimer(60);
    }, 1200);
  };

  // Complete OTP Authorization
  const handleVerifyOtp = () => {
    if (!otpValue || otpValue.length < 4) {
      showToast('Please enter the 6-digit bank verification code', 'error');
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Authenticating payment with Reserve Bank 3D-Secure Gateway...');
    setTimeout(() => {
      setIsProcessing(false);
      setShowOtpModal(false);
      const generatedTxn = `TXN-BF-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const generatedRef = `RBI-${Date.now().toString().slice(-10)}`;
      showToast('Payment successfully authorized & debited!', 'success');
      onPaymentSuccess(selectedMethod, { txnId: generatedTxn, bankRef: generatedRef });
    }, 1500);
  };

  // Set predefined sample card numbers for quick testing
  const fillSampleCard = (type: 'rupay' | 'visa' | 'mastercard') => {
    setSelectedMethod(type);
    if (type === 'rupay') {
      setCardNumber('6082 1459 3820 9184');
      setCardExpiry('10/28');
      setCardCvv('912');
      setCardHolder('RAJESH K VARMA');
    } else if (type === 'visa') {
      setCardNumber('4532 8920 1849 5521');
      setCardExpiry('11/29');
      setCardCvv('482');
      setCardHolder('ANANYA SHARMA');
    } else if (type === 'mastercard') {
      setCardNumber('5241 6819 4029 8812');
      setCardExpiry('06/27');
      setCardCvv('735');
      setCardHolder('VIKRAMADITYA SINGH');
    }
    showToast(`Loaded test ${type.toUpperCase()} Card credentials`, 'info');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Security & Merchant Assurance Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold block text-slate-100">BAAGFRESH Unified Payment Gateway</span>
            <span className="text-[10px] text-slate-400">256-Bit SSL • PCI-DSS Level 1 Certified • NPCI / RBI Compliant</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-right">
          <span className="text-[11px] text-slate-400">Total Payable:</span>
          <span className="font-extrabold text-sm text-[#fed65b] font-mono">{formatPrice(amount)}</span>
        </div>
      </div>

      {/* 5 Core Payment Channels Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* 1. UPI */}
        <button
          type="button"
          onClick={() => setSelectedMethod('upi')}
          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 relative overflow-hidden ${
            selectedMethod === 'upi'
              ? 'bg-[#012d1d] text-[#fed65b] border-[#fed65b] ring-2 ring-[#fed65b]/40 shadow-md scale-[1.02]'
              : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#275943] hover:border-[#fed65b]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1 pt-0.5">
            <span className="font-black text-xs tracking-wider">UPI</span>
            <QrCode className="w-4 h-4 text-[#fed65b]" />
          </div>
          <div className="text-[10px] font-bold leading-tight">Instant QR & Apps</div>
          <div className="flex items-center gap-1 text-[9px] opacity-75">
            <span>GPay • PhonePe</span>
          </div>
          {selectedMethod === 'upi' && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fed65b] animate-ping" />
          )}
        </button>

        {/* 2. RuPay */}
        <button
          type="button"
          onClick={() => {
            setSelectedMethod('rupay');
            if (!cardNumber.startsWith('60') && !cardNumber.startsWith('65') && !cardNumber.startsWith('81')) {
              fillSampleCard('rupay');
            }
          }}
          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 relative overflow-hidden ${
            selectedMethod === 'rupay'
              ? 'bg-[#012d1d] text-[#fed65b] border-[#fed65b] ring-2 ring-[#fed65b]/40 shadow-md scale-[1.02]'
              : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#275943] hover:border-[#fed65b]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1 pt-0.5">
            <span className="font-black text-xs text-orange-500 dark:text-orange-400">Ru</span>
            <span className="font-black text-xs text-blue-500 dark:text-blue-400">Pay</span>
            <span className="text-[9px] px-1 py-0.2 bg-emerald-800 text-white rounded font-bold">🇮🇳</span>
          </div>
          <div className="text-[10px] font-bold leading-tight">RuPay Card</div>
          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">0% Extra Fee</div>
          {selectedMethod === 'rupay' && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fed65b] animate-ping" />
          )}
        </button>

        {/* 3. Visa */}
        <button
          type="button"
          onClick={() => {
            setSelectedMethod('visa');
            if (!cardNumber.startsWith('4')) {
              fillSampleCard('visa');
            }
          }}
          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 relative overflow-hidden ${
            selectedMethod === 'visa'
              ? 'bg-[#012d1d] text-[#fed65b] border-[#fed65b] ring-2 ring-[#fed65b]/40 shadow-md scale-[1.02]'
              : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#275943] hover:border-[#fed65b]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1 pt-0.5">
            <span className="font-black italic text-xs tracking-wider text-blue-600 dark:text-blue-400">VISA</span>
          </div>
          <div className="text-[10px] font-bold leading-tight">Visa Card</div>
          <div className="text-[9px] opacity-75">Debit & Credit</div>
          {selectedMethod === 'visa' && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fed65b] animate-ping" />
          )}
        </button>

        {/* 4. Mastercard */}
        <button
          type="button"
          onClick={() => {
            setSelectedMethod('mastercard');
            if (!cardNumber.startsWith('5')) {
              fillSampleCard('mastercard');
            }
          }}
          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 relative overflow-hidden ${
            selectedMethod === 'mastercard'
              ? 'bg-[#012d1d] text-[#fed65b] border-[#fed65b] ring-2 ring-[#fed65b]/40 shadow-md scale-[1.02]'
              : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#275943] hover:border-[#fed65b]/50'
          }`}
        >
          <div className="flex items-center justify-center -space-x-1 pt-0.5">
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 opacity-90" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 opacity-90" />
          </div>
          <div className="text-[10px] font-bold leading-tight">Mastercard</div>
          <div className="text-[9px] opacity-75">Global 3D-Secure</div>
          {selectedMethod === 'mastercard' && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fed65b] animate-ping" />
          )}
        </button>

        {/* 5. COD */}
        <button
          type="button"
          onClick={() => setSelectedMethod('cod')}
          className={`col-span-2 sm:col-span-1 p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 relative overflow-hidden ${
            selectedMethod === 'cod'
              ? 'bg-[#012d1d] text-[#fed65b] border-[#fed65b] ring-2 ring-[#fed65b]/40 shadow-md scale-[1.02]'
              : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#275943] hover:border-[#fed65b]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1 pt-0.5">
            <Banknote className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-xs">COD</span>
          </div>
          <div className="text-[10px] font-bold leading-tight">Cash on Delivery</div>
          <div className="text-[9px] text-amber-500 font-semibold">Pay at Doorstep</div>
          {selectedMethod === 'cod' && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fed65b] animate-ping" />
          )}
        </button>
      </div>

      {/* ACTIVE CHANNEL PANELS */}

      {/* ========================================================================= */}
      {/* 1. UPI PANEL */}
      {/* ========================================================================= */}
      {selectedMethod === 'upi' && (
        <div className="p-4 sm:p-5 bg-[#FAF3E0]/70 dark:bg-[#162f22] rounded-3xl border border-[#e8dfc8] dark:border-[#275943] space-y-4 shadow-sm">
          {/* Submode toggle: QR Code vs Direct UPI App vs UPI ID / VPA */}
          <div className="flex items-center gap-2 p-1 bg-white/80 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943] text-xs font-bold">
            <button
              type="button"
              onClick={() => setUpiMode('qr')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                upiMode === 'qr'
                  ? 'bg-[#012d1d] text-[#fed65b] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Dynamic QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => setUpiMode('app')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                upiMode === 'app'
                  ? 'bg-[#012d1d] text-[#fed65b] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI Apps</span>
            </button>

            <button
              type="button"
              onClick={() => setUpiMode('vpa')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                upiMode === 'vpa'
                  ? 'bg-[#012d1d] text-[#fed65b] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>UPI ID (VPA)</span>
            </button>
          </div>

          {/* UPI MODE 1: Dynamic QR Code */}
          {upiMode === 'qr' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              {/* Dynamic QR Box */}
              <div className="relative p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border-2 border-[#012d1d] dark:border-[#fed65b] text-center shrink-0 flex flex-col items-center">
                <div className="w-44 h-44 bg-slate-950 rounded-2xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                  {/* Decorative Scan Frame */}
                  <div className="absolute inset-2 border border-dashed border-[#fed65b]/40 rounded-xl pointer-events-none" />

                  {/* QR Matrix Representation */}
                  <div className="relative z-10 flex flex-col items-center space-y-1">
                    <QrCode className="w-24 h-24 text-[#fed65b]" />
                    <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                      {formatPrice(amount)}
                    </span>
                  </div>

                  {/* Animated laser line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#fed65b] to-transparent animate-pulse" />
                </div>

                {/* Expiry Countdown */}
                <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <RefreshCw className="w-3 h-3 text-[#c79a1f] animate-spin" style={{ animationDuration: '8s' }} />
                  <span>QR expires in: </span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    {Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full mt-1">
                  Scan with GPay, PhonePe, Paytm, BHIM
                </div>
              </div>

              {/* QR Instructions & Deep Link */}
              <div className="flex-1 space-y-3.5 text-xs">
                <div>
                  <h4 className="font-cinzel text-sm font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                    Scan & Pay with Any Indian UPI App
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                    Open your camera or any UPI banking app to scan the encrypted payment QR code. Zero transaction fee.
                  </p>
                </div>

                {/* Merchant VPA Details */}
                <div className="p-3 bg-white dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Verified Merchant VPA:</span>
                    <span className="font-mono font-bold text-[#012d1d] dark:text-[#fed65b] text-xs">baagfresh@okhdfcbank</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyMerchantVpa}
                    className="p-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-[#162f22] hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1"
                  >
                    {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedVpa ? 'Copied' : 'Copy VPA'}</span>
                  </button>
                </div>

                {/* Fast mobile intent link */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`upi://pay?pa=baagfresh@okhdfcbank&pn=BAAGFRESH%20Varanasi&am=${amount}&cu=INR&tn=BAAGFRESH-Harvest-Order`}
                    className="w-full text-center py-2.5 px-3 bg-[#012d1d] text-[#fed65b] hover:bg-[#144230] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Installed UPI App on Phone</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* UPI MODE 2: UPI Apps Select */}
          {upiMode === 'app' && (
            <div className="space-y-4 pt-2">
              <h4 className="font-cinzel text-xs font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                Select Your Installed UPI Application:
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-bold">
                {[
                  { id: 'gpay', name: 'Google Pay', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                  { id: 'phonepe', name: 'PhonePe', color: 'bg-purple-50 text-purple-800 border-purple-200' },
                  { id: 'paytm', name: 'Paytm UPI', color: 'bg-sky-50 text-sky-800 border-sky-200' },
                  { id: 'bhim', name: 'BHIM UPI', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                  { id: 'cred', name: 'CRED UPI', color: 'bg-slate-100 text-slate-800 border-slate-300' },
                ].map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedUpiApp(app.id as any)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      selectedUpiApp === app.id
                        ? 'bg-[#012d1d] text-[#fed65b] border-[#fed65b] ring-2 ring-[#fed65b]/40 shadow-sm'
                        : 'bg-white dark:bg-[#0f241a] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#275943]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                      {app.name[0]}
                    </div>
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-white dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943] text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Payment Request will be dispatched to your linked registered phone: <strong>{receiverPhone}</strong>
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded font-bold text-[10px]">
                  Instant Push
                </span>
              </div>
            </div>
          )}

          {/* UPI MODE 3: Manual UPI ID (VPA) */}
          {upiMode === 'vpa' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter Your Virtual Payment Address (VPA):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customVpa}
                    onChange={(e) => {
                      setCustomVpa(e.target.value);
                      setVpaVerified(false);
                    }}
                    placeholder="e.g. mobileNumber@okhdfcbank or yourname@ybl"
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white dark:bg-[#0f241a] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyVpa}
                    className="px-4 py-2 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold text-xs rounded-xl shadow-sm"
                  >
                    Verify VPA
                  </button>
                </div>
              </div>

              {/* Popular VPA suffixes for 1-click append */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-500 font-semibold">Popular Suffixes:</span>
                {['@okhdfcbank', '@oksbi', '@okicici', '@ybl', '@paytm', '@ibl'].map((suf) => (
                  <button
                    key={suf}
                    type="button"
                    onClick={() => {
                      const prefix = customVpa.split('@')[0] || receiverPhone;
                      setCustomVpa(`${prefix}${suf}`);
                      setVpaVerified(true);
                    }}
                    className="px-2 py-1 bg-white dark:bg-[#0f241a] hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-[#275943] text-slate-700 dark:text-slate-300 font-mono"
                  >
                    {suf}
                  </button>
                ))}
              </div>

              {vpaVerified && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>UPI ID is valid and ready for collect request authorization.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2 / 3 / 4. CARDS PANEL (RuPay / Visa / Mastercard) */}
      {/* ========================================================================= */}
      {(selectedMethod === 'rupay' || selectedMethod === 'visa' || selectedMethod === 'mastercard') && (
        <div className="p-4 sm:p-5 bg-[#FAF3E0]/70 dark:bg-[#162f22] rounded-3xl border border-[#e8dfc8] dark:border-[#275943] space-y-5 shadow-sm">
          {/* Card Interactive Preview Mockup */}
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div
              className={`w-full max-w-sm p-5 rounded-3xl text-white shadow-2xl relative overflow-hidden transition-all duration-300 ${
                selectedMethod === 'rupay'
                  ? 'bg-gradient-to-tr from-[#023e27] via-[#012d1d] to-[#1b5e40] border-2 border-emerald-400/40'
                  : selectedMethod === 'visa'
                  ? 'bg-gradient-to-tr from-[#0a2540] via-[#103b68] to-[#1e5aa0] border-2 border-blue-400/40'
                  : 'bg-gradient-to-tr from-[#2c1810] via-[#1a0f0a] to-[#3d1e13] border-2 border-amber-500/40'
              }`}
            >
              {/* Background Geometric Watermark */}
              <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

              <div className="flex justify-between items-center text-xs pb-3">
                <span className="font-cinzel tracking-widest font-extrabold text-[#fed65b]">
                  BAAGFRESH PREMIUM
                </span>

                {/* Network Emblem */}
                {selectedMethod === 'rupay' && (
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg text-slate-900 font-black text-xs shadow">
                    <span className="text-orange-600">Ru</span>
                    <span className="text-blue-700">Pay</span>
                    <span className="text-[10px] text-emerald-700 font-bold">🇮🇳</span>
                  </div>
                )}
                {selectedMethod === 'visa' && (
                  <span className="font-black italic text-base tracking-wider text-white bg-blue-900/60 px-2.5 py-0.5 rounded">
                    VISA
                  </span>
                )}
                {selectedMethod === 'mastercard' && (
                  <div className="flex items-center -space-x-1.5 bg-black/40 px-2 py-1 rounded-lg">
                    <div className="w-4 h-4 rounded-full bg-red-600" />
                    <div className="w-4 h-4 rounded-full bg-amber-500" />
                  </div>
                )}
              </div>

              {/* EMV Gold Chip */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300 shadow-inner flex items-center justify-center my-2">
                <div className="w-7 h-4 border-t border-b border-amber-700/60" />
              </div>

              {/* Formatted Number */}
              <div className="font-mono text-base tracking-widest font-bold text-slate-100 pt-1 drop-shadow">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>

              {/* Cardholder & Expiry */}
              <div className="flex justify-between items-end text-[10px] pt-3">
                <div>
                  <span className="block text-[8px] text-slate-300 uppercase tracking-wider">Cardholder Name</span>
                  <span className="font-bold tracking-wider uppercase font-mono">{cardHolder || 'CUSTOMER NAME'}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-300 uppercase tracking-wider">Expires</span>
                  <span className="font-bold font-mono">{cardExpiry || 'MM/YY'}</span>
                </div>
              </div>
            </div>

            {/* Quick Card Testing Presets */}
            <div className="flex-1 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                Quick Test Card Presets (1-Click Fill):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillSampleCard('rupay')}
                  className="p-2 bg-white dark:bg-[#0f241a] rounded-xl border border-slate-200 dark:border-[#275943] text-left hover:border-[#fed65b] transition-colors"
                >
                  <span className="font-bold text-orange-600 block">RuPay Platinum</span>
                  <span className="text-[10px] text-slate-500 font-mono">6082 •••• 9184</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillSampleCard('visa')}
                  className="p-2 bg-white dark:bg-[#0f241a] rounded-xl border border-slate-200 dark:border-[#275943] text-left hover:border-[#fed65b] transition-colors"
                >
                  <span className="font-bold text-blue-600 block">Visa Infinite</span>
                  <span className="text-[10px] text-slate-500 font-mono">4532 •••• 5521</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillSampleCard('mastercard')}
                  className="p-2 bg-white dark:bg-[#0f241a] rounded-xl border border-slate-200 dark:border-[#275943] text-left hover:border-[#fed65b] transition-colors"
                >
                  <span className="font-bold text-amber-600 block">Mastercard World</span>
                  <span className="text-[10px] text-slate-500 font-mono">5241 •••• 8812</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Input Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Card Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="Enter 16-digit card number"
                  maxLength={19}
                  className="w-full pl-3.5 pr-12 py-2.5 bg-white dark:bg-[#0f241a] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 font-mono text-sm tracking-wider focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cardholder Name *
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="NAME ON CARD"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f241a] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date (MM/YY) *
              </label>
              <input
                type="text"
                value={cardExpiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f241a] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                CVV / Security Code *
              </label>
              <input
                type="password"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                placeholder="3 digits"
                maxLength={4}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f241a] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="saveCardBox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="rounded text-[#012d1d] focus:ring-[#c79a1f]"
            />
            <label htmlFor="saveCardBox" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              Securely save card for faster 1-click checkout (RBI Tokenization Compliant)
            </label>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CASH ON DELIVERY (COD) PANEL */}
      {/* ========================================================================= */}
      {selectedMethod === 'cod' && (
        <div className="p-4 sm:p-5 bg-amber-50/80 dark:bg-[#162f22] rounded-3xl border border-amber-200 dark:border-[#275943] space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-cinzel text-sm font-bold text-amber-950 dark:text-[#fed65b]">
                Cash on Delivery (Doorstep Payment)
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                Pay in cash or scan the delivery courier's official UPI QR code at your doorstep when your consignment arrives in <strong>{receiverCity} (PIN: {receiverPincode})</strong>.
              </p>
            </div>
          </div>

          {/* COD Serviceability Notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-[#0f241a] rounded-2xl border border-amber-200 dark:border-[#275943]">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Serviceable Hub Pincode: {receiverPincode}</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">BlueDart & Express Courier Handover</span>
            </div>

            <div className="p-3 bg-white dark:bg-[#0f241a] rounded-2xl border border-amber-200 dark:border-[#275943]">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#c79a1f]" />
                <span>Zero Advance Deposit Required</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">Total payable on delivery: <strong>{formatPrice(amount)}</strong></span>
            </div>
          </div>

          {/* Anti-Bot / Anti-Spam Security Code Verification */}
          <div className="p-3.5 bg-white dark:bg-[#0f241a] rounded-2xl border border-amber-300 dark:border-[#275943] space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Confirm COD Order Security Verification Code:
            </label>
            <div className="flex items-center gap-3">
              {/* Captcha Display */}
              <div className="px-4 py-2 bg-slate-900 text-[#fed65b] font-mono font-black text-lg tracking-widest rounded-xl select-none border border-slate-700 shadow-inner">
                {generatedCaptcha}
              </div>

              <button
                type="button"
                onClick={refreshCaptcha}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#162f22] text-slate-600 hover:text-slate-900 transition-colors"
                title="Refresh verification code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <input
                type="text"
                maxLength={4}
                value={codCaptcha}
                onChange={(e) => setCodCaptcha(e.target.value)}
                placeholder="Enter 4-digit code"
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#162f22] rounded-xl border border-slate-300 dark:border-[#275943] font-mono text-center font-bold tracking-widest"
              />
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="pt-4 border-t border-slate-200 dark:border-[#275943] flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162f22] transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={initiatePayment}
          className="px-7 py-3.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-black text-xs sm:text-sm rounded-2xl shadow-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#fed65b]" />
              <span>Processing Gateway...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-[#fed65b]" />
              <span>
                {selectedMethod === 'cod'
                  ? `Confirm COD Order (${formatPrice(amount)})`
                  : `Authorize & Pay ${formatPrice(amount)}`}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* SIMULATED 3D-SECURE / OTP AUTHENTICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border-2 border-[#012d1d] dark:border-[#fed65b] overflow-hidden">
            {/* Bank Header */}
            <div className="p-4 bg-[#012d1d] text-white flex items-center justify-between border-b border-[#275943]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#fed65b]" />
                <div>
                  <span className="font-bold text-xs block">
                    {selectedMethod === 'rupay'
                      ? 'NPCI RuPay PaySecure 3D-OTP'
                      : selectedMethod === 'visa'
                      ? 'Verified by Visa 3-D Secure'
                      : selectedMethod === 'mastercard'
                      ? 'Mastercard Identity Check'
                      : 'Unified Payments Interface (UPI)'}
                  </span>
                  <span className="text-[10px] text-slate-300">Reserve Bank of India 2FA Protocol</span>
                </div>
              </div>
              <span className="font-mono font-bold text-xs text-[#fed65b]">{formatPrice(amount)}</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="text-center space-y-1">
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  A 6-digit one-time authorization passcode was dispatched to your mobile:
                </p>
                <div className="font-mono font-black text-sm text-[#012d1d] dark:text-[#fed65b]">
                  {receiverPhone.slice(0, 3)}••••••{receiverPhone.slice(-2)}
                </div>
              </div>

              {/* Instant Test Fill Hint Box */}
              <div className="p-2.5 bg-[#FAF3E0] dark:bg-[#162f22] rounded-xl border border-[#e8dfc8] dark:border-[#275943] flex items-center justify-between">
                <span className="text-[11px] text-slate-700 dark:text-slate-300">
                  Simulated Bank OTP: <strong className="font-mono font-bold text-emerald-600">{simulatedOtp}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpValue(simulatedOtp)}
                  className="px-2.5 py-1 bg-[#012d1d] text-[#fed65b] rounded-lg font-bold text-[10px] hover:bg-[#144230]"
                >
                  Auto-Fill Test OTP
                </button>
              </div>

              {/* OTP Input Field */}
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#162f22] rounded-2xl border-2 border-slate-300 dark:border-[#275943] text-center font-mono text-xl tracking-widest font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#fed65b]"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Merchant: BAAGFRESH AGRO VARANASI</span>
                <span>Valid for 10 mins</span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleVerifyOtp}
                  className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-extrabold shadow-md flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Submit & Authorize</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
