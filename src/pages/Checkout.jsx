import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/Footer';
import { fetchEventById } from '../services/eventService';

const { FiArrowLeft, FiCreditCard, FiLock, FiCheck, FiUser, FiMail, FiPhone } = FiIcons;

const Checkout = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Mock data - in a real app, this would be passed from the previous page
  const mockSelectedSeats = [
    { id: 'A-2-5', section: 'A', row: 2, number: 5, price: 45 },
    { id: 'A-2-6', section: 'A', row: 2, number: 6, price: 45 }
  ];

  // Payment methods (from admin settings)
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: FiCreditCard,
      enabled: true,
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: FiCreditCard,
      enabled: false,
      description: 'Pay with your PayPal account'
    },
    {
      id: 'applepay',
      name: 'Apple Pay',
      icon: FiCreditCard,
      enabled: true,
      description: 'Pay with Touch ID or Face ID'
    }
  ];

  const enabledPaymentMethods = paymentMethods.filter(method => method.enabled);

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const eventData = await fetchEventById(id);
        if (eventData) {
          setEvent(eventData);
        }
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!customerInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!customerInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Payment info validation (only for card payments)
    if (selectedPaymentMethod === 'stripe') {
      if (!paymentInfo.cardNumber.trim()) {
        newErrors.cardNumber = 'Card number is required';
      }
      if (!paymentInfo.cardName.trim()) {
        newErrors.cardName = 'Cardholder name is required';
      }
      if (!paymentInfo.expiryDate.trim()) {
        newErrors.expiryDate = 'Expiry date is required';
      }
      if (!paymentInfo.cvv.trim()) {
        newErrors.cvv = 'CVV is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  const handleApplePayClick = () => {
    if (!validateForm()) {
      return;
    }

    // In a real app, this would trigger Apple Pay
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  const totalPrice = mockSelectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = 15;
  const grandTotal = totalPrice + serviceFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event not found</h1>
            <Link to="/concerts" className="text-primary-400 hover:text-primary-300">
              Back to concerts
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen">
          <div className="max-w-2xl mx-auto px-4 py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-zinc-800 rounded-lg p-8 text-center"
            >
              <div className="w-20 h-20 bg-primary-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <SafeIcon icon={FiCheck} className="w-10 h-10 text-black" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
              <p className="text-gray-300 mb-8">
                Your tickets for {event.title} have been confirmed. You will receive an email with your tickets shortly.
              </p>
              <div className="mb-8">
                <h3 className="font-medium mb-2">Order Summary</h3>
                <div className="bg-zinc-700/50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Event:</span>
                    <span>{event.title}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Date:</span>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Customer:</span>
                    <span>{customerInfo.firstName} {customerInfo.lastName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Email:</span>
                    <span>{customerInfo.email}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Tickets:</span>
                    <span>{mockSelectedSeats.length}</span>
                  </div>
                  <div className="flex justify-between font-medium text-primary-400">
                    <span>Total:</span>
                    <span>€{grandTotal}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className="px-6 py-3 bg-primary-400 hover:bg-primary-500 text-black font-medium rounded-lg transition-colors"
                  onClick={() => {
                    // In a real app, this would download the PDF tickets
                    alert('Downloading tickets...');
                  }}
                >
                  Download Tickets (PDF)
                </button>
                <Link to="/">
                  <button className="px-6 py-3 border border-zinc-600 hover:border-zinc-500 rounded-lg transition-colors">
                    Return to Home
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
      <NavBar />
      <div className="pt-24 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              to={`/seat-selection/${id}`}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="w-5 h-5 mr-2" />
              Back to seat selection
            </Link>
          </motion.div>

          <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-3">
              <form onSubmit={handleSubmit}>
                {/* Customer Information */}
                <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <SafeIcon icon={FiUser} className="mr-2" />
                    Customer Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="John"
                        value={customerInfo.firstName}
                        onChange={handleCustomerInfoChange}
                        className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
                          errors.firstName ? 'border-red-500' : 'border-zinc-600'
                        }`}
                        required
                      />
                      {errors.firstName && (
                        <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Smith"
                        value={customerInfo.lastName}
                        onChange={handleCustomerInfoChange}
                        className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
                          errors.lastName ? 'border-red-500' : 'border-zinc-600'
                        }`}
                        required
                      />
                      {errors.lastName && (
                        <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <SafeIcon icon={FiMail} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        placeholder="john.smith@example.com"
                        value={customerInfo.email}
                        onChange={handleCustomerInfoChange}
                        className={`w-full pl-10 pr-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
                          errors.email ? 'border-red-500' : 'border-zinc-600'
                        }`}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <SafeIcon icon={FiPhone} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+1 (555) 123-4567"
                        value={customerInfo.phone}
                        onChange={handleCustomerInfoChange}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-primary-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                  
                  <div className="space-y-3 mb-6">
                    {enabledPaymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPaymentMethod === method.id
                            ? 'border-primary-400 bg-primary-400/10'
                            : 'border-zinc-600 hover:border-zinc-500'
                        }`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={selectedPaymentMethod === method.id}
                              onChange={() => setSelectedPaymentMethod(method.id)}
                              className="w-4 h-4 text-primary-400 mr-3"
                            />
                            <SafeIcon icon={method.icon} className="mr-3 text-gray-400" />
                            <div>
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-gray-400">{method.description}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Apple Pay Button */}
                  {selectedPaymentMethod === 'applepay' && (
                    <button
                      type="button"
                      onClick={handleApplePayClick}
                      disabled={isProcessing}
                      className="w-full py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #000 0%, #333 100%)',
                        border: '1px solid #666'
                      }}
                    >
                      {isProcessing ? 'Processing...' : '🍎 Pay with Apple Pay'}
                    </button>
                  )}

                  {/* Credit Card Form */}
                  {selectedPaymentMethod === 'stripe' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Card Number</label>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={paymentInfo.cardNumber}
                          onChange={handlePaymentInfoChange}
                          className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
                            errors.cardNumber ? 'border-red-500' : 'border-zinc-600'
                          }`}
                          required
                        />
                        {errors.cardNumber && (
                          <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          name="cardName"
                          placeholder="John Smith"
                          value={paymentInfo.cardName}
                          onChange={handlePaymentInfoChange}
                          className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
                            errors.cardName ? 'border-red-500' : 'border-zinc-600'
                          }`}
                          required
                        />
                        {errors.cardName && (
                          <p className="text-red-400 text-sm mt-1">{errors.cardName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            name="expiryDate"
                            placeholder="MM/YY"
                            value={paymentInfo.expiryDate}
                            onChange={handlePaymentInfoChange}
                            className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
                              errors.expiryDate ? 'border-red-500' : 'border-zinc-600'
                            }`}
                            required
                          />
                          {errors.expiryDate && (
                            <p className="text-red-400 text-sm mt-1">{errors.expiryDate}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">CVV</label>
                          <input
                            type="text"
                            name="cvv"
                            placeholder="123"
                            value={paymentInfo.cvv}
                            onChange={handlePaymentInfoChange}
                            className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
                              errors.cvv ? 'border-red-500' : 'border-zinc-600'
                            }`}
                            required
                          />
                          {errors.cvv && (
                            <p className="text-red-400 text-sm mt-1">{errors.cvv}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-400 mb-6">
                        <SafeIcon icon={FiLock} className="mr-2" />
                        Your payment information is encrypted and secure
                      </div>

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-lg font-medium ${
                          isProcessing
                            ? 'bg-zinc-700 text-zinc-500 cursor-wait'
                            : 'bg-primary-400 hover:bg-primary-500 text-black'
                        }`}
                      >
                        {isProcessing ? 'Processing...' : `Pay €${grandTotal}`}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-2">
              <div className="bg-zinc-800 rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="mb-4">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded overflow-hidden mr-4">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-gray-400">{event.date} • {event.location}</p>
                    </div>
                  </div>

                  <div className="border-t border-b border-zinc-700 py-4 mb-4">
                    <h4 className="font-medium mb-2">Selected Seats</h4>
                    {mockSelectedSeats.map(seat => (
                      <div key={seat.id} className="flex justify-between text-sm mb-1">
                        <span>Section {seat.section}, Row {seat.row}, Seat {seat.number}</span>
                        <span>€{seat.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>€{totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee</span>
                      <span>€{serviceFee}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-700">
                    <span>Total</span>
                    <span className="text-primary-400">€{grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;