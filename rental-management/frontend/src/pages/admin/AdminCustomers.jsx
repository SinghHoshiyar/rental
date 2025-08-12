import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [customerBookings, setCustomerBookings] = useState([]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('/api/users');
            // Filter only customers
            const customerUsers = response.data.users.filter(user => user.role === 'customer');
            setCustomers(customerUsers);
        } catch (error) {
            toast.error('Failed to fetch customers');
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerBookings = async (customerId) => {
        try {
            const response = await axios.get('/api/bookings');
            const userBookings = response.data.bookings.filter(booking =>
                booking.customer._id === customerId
            );
            setCustomerBookings(userBookings);
        } catch (error) {
            console.error('Error fetching customer bookings:', error);
            setCustomerBookings([]);
        }
    };

    const updateCustomerStatus = async (customerId, isActive) => {
        try {
            await axios.put(`/api/users/${customerId}`, { isActive });
            toast.success(`Customer ${isActive ? 'activated' : 'deactivated'} successfully`);
            fetchCustomers();
        } catch (error) {
            toast.error('Failed to update customer status');
            console.error('Error updating customer:', error);
        }
    };

    const viewCustomerDetails = async (customer) => {
        setSelectedCustomer(customer);
        await fetchCustomerBookings(customer._id);
        setShowModal(true);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === '' ||
            (statusFilter === 'active' && customer.isActive) ||
            (statusFilter === 'inactive' && !customer.isActive);

        return matchesSearch && matchesStatus;
    });

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
                <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
                <div className="text-sm text-gray-600">
                    Total Customers: {customers.length}
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
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
                        <option value="">All Customers</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Customers Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-blue-600">
                                                        {customer.profile?.firstName?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {customer.profile?.firstName} {customer.profile?.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">{customer.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>
                                            <div>{customer.email}</div>
                                            {customer.profile?.phone && (
                                                <div className="text-gray-500">{customer.profile.phone}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(customer.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {customer.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => viewCustomerDetails(customer)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => updateCustomerStatus(customer._id, !customer.isActive)}
                                            className={`${customer.isActive
                                                    ? 'text-red-600 hover:text-red-900'
                                                    : 'text-green-600 hover:text-green-900'
                                                }`}
                                        >
                                            {customer.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredCustomers.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No customers found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Customer Details Modal */}
            {showModal && selectedCustomer && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Customer Details - {selectedCustomer.profile?.firstName} {selectedCustomer.profile?.lastName}
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Customer Information */}
                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-4">Personal Information</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <div>
                                            <span className="font-medium">Name:</span> {selectedCustomer.profile?.firstName} {selectedCustomer.profile?.lastName}
                                        </div>
                                        <div>
                                            <span className="font-medium">Email:</span> {selectedCustomer.email}
                                        </div>
                                        {selectedCustomer.profile?.phone && (
                                            <div>
                                                <span className="font-medium">Phone:</span> {selectedCustomer.profile.phone}
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-medium">Member Since:</span> {formatDate(selectedCustomer.createdAt)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Status:</span>
                                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedCustomer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Address Information */}
                                    {selectedCustomer.profile?.address && (
                                        <div className="mt-6">
                                            <h4 className="text-md font-semibold text-gray-900 mb-4">Address</h4>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div>{selectedCustomer.profile.address.street}</div>
                                                <div>{selectedCustomer.profile.address.city}, {selectedCustomer.profile.address.state} {selectedCustomer.profile.address.zipCode}</div>
                                                <div>{selectedCustomer.profile.address.country}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Booking History */}
                                <div>
                                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                                        Booking History ({customerBookings.length})
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                        {customerBookings.length > 0 ? (
                                            <div className="space-y-3">
                                                {customerBookings.map((booking) => (
                                                    <div key={booking._id} className="bg-white p-3 rounded border">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <div className="font-medium">#{booking.bookingNumber}</div>
                                                                <div className="text-sm text-gray-600">
                                                                    {booking.items?.length} item(s)
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-medium">${booking.pricing.total.toFixed(2)}</div>
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <div>Start: {formatDate(booking.dates.startDate)}</div>
                                                            <div>End: {formatDate(booking.dates.endDate)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">No bookings found</p>
                                        )}
                                    </div>

                                    {/* Customer Stats */}
                                    {customerBookings.length > 0 && (
                                        <div className="mt-4">
                                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Statistics</h5>
                                            <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                                <div className="flex justify-between">
                                                    <span>Total Bookings:</span>
                                                    <span className="font-medium">{customerBookings.length}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Total Spent:</span>
                                                    <span className="font-medium">
                                                        ${customerBookings.reduce((sum, booking) => sum + booking.pricing.total, 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Active Bookings:</span>
                                                    <span className="font-medium">
                                                        {customerBookings.filter(b => b.status === 'active').length}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Completed Bookings:</span>
                                                    <span className="font-medium">
                                                        {customerBookings.filter(b => b.status === 'completed').length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 space-x-4">
                                <button
                                    onClick={() => updateCustomerStatus(selectedCustomer._id, !selectedCustomer.isActive)}
                                    className={`${selectedCustomer.isActive
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                        } px-4 py-2 rounded-lg font-medium`}
                                >
                                    {selectedCustomer.isActive ? 'Deactivate Customer' : 'Activate Customer'}
                                </button>
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

export default AdminCustomers;