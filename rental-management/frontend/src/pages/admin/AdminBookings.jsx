import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await axios.get('/api/bookings');
            setBookings(response.data.bookings);
        } catch (error) {
            toast.error('Failed to fetch bookings');
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (bookingId, newStatus) => {
        try {
            await axios.put(`/api/bookings/${bookingId}`, { status: newStatus });
            toast.success('Booking status updated successfully');
            fetchBookings();
        } catch (error) {
            toast.error('Failed to update booking status');
            console.error('Error updating booking:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-gray-100 text-gray-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'partial':
                return 'bg-orange-100 text-orange-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'refunded':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesStatus = !statusFilter || booking.status === statusFilter;
        const matchesSearch = booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customer?.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.customer?.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const statusOptions = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
                <div className="text-sm text-gray-600">
                    Total Bookings: {bookings.length}
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by booking number, customer name, or email..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="md:w-64">
                    <select
                        className="input-field"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {statusOptions.map(status => (
                            <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Booking
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dates
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                                <tr key={booking._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">#{booking.bookingNumber}</div>
                                            <div className="text-sm text-gray-500">
                                                {booking.items?.length} item(s)
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {booking.customer?.profile?.firstName} {booking.customer?.profile?.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">{booking.customer?.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>
                                            <div>Start: {formatDate(booking.dates.startDate)}</div>
                                            <div>End: {formatDate(booking.dates.endDate)}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ${booking.pricing.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                            {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setShowModal(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            View
                                        </button>
                                        <select
                                            value={booking.status}
                                            onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                                            className="text-sm border border-gray-300 rounded px-2 py-1"
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBookings.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No bookings found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Booking Details Modal */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Booking Details - #{selectedBooking.bookingNumber}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Customer Information */}
                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-2">Customer Information</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p><strong>Name:</strong> {selectedBooking.customer?.profile?.firstName} {selectedBooking.customer?.profile?.lastName}</p>
                                        <p><strong>Email:</strong> {selectedBooking.customer?.email}</p>
                                        {selectedBooking.customer?.profile?.phone && (
                                            <p><strong>Phone:</strong> {selectedBooking.customer.profile.phone}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Booking Items */}
                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-2">Rental Items</h4>
                                    <div className="space-y-2">
                                        {selectedBooking.items?.map((item, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{item.product?.name || 'Product Name'}</p>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {item.quantity} | Duration: {item.duration} {item.rentalUnit}(s)
                                                        </p>
                                                    </div>
                                                    <p className="font-medium">${(item.unitPrice * item.quantity * item.duration).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-2">Rental Period</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p><strong>Start Date:</strong> {formatDate(selectedBooking.dates.startDate)}</p>
                                        <p><strong>End Date:</strong> {formatDate(selectedBooking.dates.endDate)}</p>
                                        {selectedBooking.dates.actualReturnDate && (
                                            <p><strong>Actual Return:</strong> {formatDate(selectedBooking.dates.actualReturnDate)}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                {selectedBooking.deliveryAddress && (
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Delivery Address</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p>{selectedBooking.deliveryAddress.street}</p>
                                            <p>{selectedBooking.deliveryAddress.city}, {selectedBooking.deliveryAddress.state} {selectedBooking.deliveryAddress.zipCode}</p>
                                            <p>{selectedBooking.deliveryAddress.country}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Pricing */}
                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-2">Pricing Details</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>${selectedBooking.pricing.subtotal.toFixed(2)}</span>
                                        </div>
                                        {selectedBooking.pricing.discount > 0 && (
                                            <div className="flex justify-between">
                                                <span>Discount:</span>
                                                <span>-${selectedBooking.pricing.discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {selectedBooking.pricing.lateFees > 0 && (
                                            <div className="flex justify-between">
                                                <span>Late Fees:</span>
                                                <span>${selectedBooking.pricing.lateFees.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                                            <span>Total:</span>
                                            <span>${selectedBooking.pricing.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedBooking.notes && (
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Notes</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p>{selectedBooking.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Status and Payment */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Booking Status</h4>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                                            {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-900 mb-2">Payment Status</h4>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                                            {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookings;