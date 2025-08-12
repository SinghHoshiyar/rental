import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Booking = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { product, bookingData } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
    });
    const [notes, setNotes] = useState('');

    // Redirect if no booking data
    if (!product || !bookingData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Booking</h2>
                    <p className="text-gray-600 mb-6">No booking data found. Please start from the product page.</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="btn-primary"
                    >
                        Browse Products
                    </button>
                </div>
            </div>
        );
    }

    const handleAddressChange = (e) => {
        setDeliveryAddress({
            ...deliveryAddress,
            [e.target.name]: e.target.value
        });
    };

    const calculateDuration = () => {
        const startDate = new Date(bookingData.startDate);
        const endDate = new Date(bookingData.endDate);
        const timeDiff = endDate.getTime() - startDate.getTime();

        switch (bookingData.selectedUnit) {
            case 'hour':
                return Math.ceil(timeDiff / (1000 * 3600));
            case 'day':
                return Math.ceil(timeDiff / (1000 * 3600 * 24));
            case 'week':
                return Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));
            case 'month':
                return Math.ceil(timeDiff / (1000 * 3600 * 24 * 30));
            default:
                return 1;
        }
    };

    const handleConfirmBooking = async () => {
        if (!deliveryAddress.street || !deliveryAddress.city) {
            toast.error('Please provide delivery address');
            return;
        }

        setLoading(true);

        try {
            const selectedRentalUnit = product.rentalUnits.find(unit => unit.unit === bookingData.selectedUnit);
            const duration = calculateDuration();

            const bookingPayload = {
                items: [{
                    product: product._id,
                    quantity: bookingData.quantity,
                    unitPrice: selectedRentalUnit.price,
                    rentalUnit: bookingData.selectedUnit,
                    duration: duration
                }],
                dates: {
                    startDate: bookingData.startDate,
                    endDate: bookingData.endDate
                },
                pricing: {
                    subtotal: bookingData.totalPrice,
                    discount: 0,
                    lateFees: 0,
                    total: bookingData.totalPrice
                },
                deliveryAddress,
                notes
            };

            const response = await axios.post('/api/bookings', bookingPayload);

            if (response.data.success) {
                toast.success('Booking created successfully!');
                navigate('/dashboard');
            } else {
                toast.error('Failed to create booking');
            }

        } catch (error) {
            console.error('Booking error:', error);
            toast.error(error.response?.data?.error?.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Your Booking</h1>
                <p className="text-gray-600">Review your booking details and provide delivery information</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Booking Summary */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>

                    <div className="flex items-start space-x-4 mb-6">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            <p className="text-gray-600">{product.category}</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{bookingData.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Rental Period:</span>
                            <span className="font-medium">{calculateDuration()} {bookingData.selectedUnit}(s)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Start Date:</span>
                            <span className="font-medium">{formatDate(bookingData.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">End Date:</span>
                            <span className="font-medium">{formatDate(bookingData.endDate)}</span>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-semibold">
                            <span>Total Amount:</span>
                            <span className="text-blue-600">${bookingData.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Information */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Street Address *
                            </label>
                            <input
                                type="text"
                                name="street"
                                value={deliveryAddress.street}
                                onChange={handleAddressChange}
                                className="input-field"
                                placeholder="Enter street address"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={deliveryAddress.city}
                                    onChange={handleAddressChange}
                                    className="input-field"
                                    placeholder="City"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    State
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={deliveryAddress.state}
                                    onChange={handleAddressChange}
                                    className="input-field"
                                    placeholder="State"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ZIP Code
                                </label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={deliveryAddress.zipCode}
                                    onChange={handleAddressChange}
                                    className="input-field"
                                    placeholder="ZIP Code"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={deliveryAddress.country}
                                    onChange={handleAddressChange}
                                    className="input-field"
                                    placeholder="Country"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Special Instructions
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="input-field"
                                rows="3"
                                placeholder="Any special delivery instructions or notes..."
                            />
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleConfirmBooking}
                            className="btn-primary flex-1"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="spinner mr-2"></div>
                                    Processing...
                                </div>
                            ) : (
                                'Confirm Booking'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Booking;