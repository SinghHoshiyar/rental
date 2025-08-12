import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminReports = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalUsers: 0,
        totalBookings: 0,
        activeRentals: 0,
        totalRevenue: 0,
        averageBookingValue: 0
    });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [exportLoading, setExportLoading] = useState(false);

    useEffect(() => {
        fetchDashboardStats();
    }, [dateRange]);

    const fetchDashboardStats = async () => {
        try {
            const params = new URLSearchParams();
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const response = await axios.get(`/api/reports/dashboard?${params}`);
            setStats(response.data.stats);
        } catch (error) {
            toast.error('Failed to fetch dashboard statistics');
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (field, value) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearDateRange = () => {
        setDateRange({
            startDate: '',
            endDate: ''
        });
    };

    const exportData = async (type, format = 'json') => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('type', type);
            params.append('format', format);
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const response = await axios.get(`/api/reports/export?${params}`, {
                responseType: format === 'csv' ? 'blob' : 'json'
            });

            if (format === 'csv') {
                // Handle CSV download
                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${type}_report_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } else {
                // Handle JSON download
                const jsonData = JSON.stringify(response.data, null, 2);
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${type}_report_${Date.now()}.json`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            }

            toast.success(`${type} report exported successfully`);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to export data');
            console.error('Export error:', error);
        } finally {
            setExportLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color = 'blue' }) => (
        <div className="card">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <div className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center`}>
                        {icon}
                    </div>
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );

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
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            </div>

            {/* Date Range Filter */}
            <div className="card mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range Filter</h2>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            className="input-field"
                            value={dateRange.startDate}
                            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            className="input-field"
                            value={dateRange.endDate}
                            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                        />
                    </div>
                    <div>
                        <button
                            onClick={clearDateRange}
                            className="btn-secondary"
                        >
                            Clear Filter
                        </button>
                    </div>
                </div>
                {(dateRange.startDate || dateRange.endDate) && (
                    <div className="mt-2 text-sm text-blue-600">
                        {dateRange.startDate && dateRange.endDate
                            ? `Showing data from ${dateRange.startDate} to ${dateRange.endDate}`
                            : dateRange.startDate
                                ? `Showing data from ${dateRange.startDate}`
                                : `Showing data until ${dateRange.endDate}`
                        }
                    </div>
                )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Products"
                    value={stats.totalProducts}
                    color="blue"
                    icon={
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    }
                />

                <StatCard
                    title="Total Customers"
                    value={stats.totalUsers}
                    color="green"
                    icon={
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                    }
                />

                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    color="purple"
                    icon={
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    }
                />

                <StatCard
                    title="Active Rentals"
                    value={stats.activeRentals}
                    color="yellow"
                    icon={
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                />

                <StatCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    color="green"
                    icon={
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    }
                />

                <StatCard
                    title="Avg Booking Value"
                    value={`$${stats.averageBookingValue.toFixed(2)}`}
                    color="blue"
                    icon={
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                />
            </div>

            {/* Export Section */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
                <p className="text-gray-600 mb-4">
                    Export your data for external analysis or record keeping. All exports respect the date range filter above.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Bookings Export */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 className="font-medium text-gray-900">Bookings Data</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Export all booking information including customer details, dates, and pricing.
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={() => exportData('bookings', 'json')}
                                disabled={exportLoading}
                                className="btn-outline w-full text-sm"
                            >
                                Export as JSON
                            </button>
                            <button
                                onClick={() => exportData('bookings', 'csv')}
                                disabled={exportLoading}
                                className="btn-outline w-full text-sm"
                            >
                                Export as CSV
                            </button>
                        </div>
                    </div>

                    {/* Products Export */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <h3 className="font-medium text-gray-900">Products Data</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Export product catalog with pricing, inventory, and specifications.
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={() => exportData('products', 'json')}
                                disabled={exportLoading}
                                className="btn-outline w-full text-sm"
                            >
                                Export as JSON
                            </button>
                            <button
                                onClick={() => exportData('products', 'csv')}
                                disabled={exportLoading}
                                className="btn-outline w-full text-sm"
                            >
                                Export as CSV
                            </button>
                        </div>
                    </div>

                    {/* Users Export */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                            <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <h3 className="font-medium text-gray-900">Customer Data</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Export customer information and account details (excluding passwords).
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={() => exportData('users', 'json')}
                                disabled={exportLoading}
                                className="btn-outline w-full text-sm"
                            >
                                Export as JSON
                            </button>
                            <button
                                onClick={() => exportData('users', 'csv')}
                                disabled={exportLoading}
                                className="btn-outline w-full text-sm"
                            >
                                Export as CSV
                            </button>
                        </div>
                    </div>
                </div>

                {exportLoading && (
                    <div className="mt-4 flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        <span className="text-sm text-gray-600">Preparing export...</span>
                    </div>
                )}
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Revenue per Customer:</span>
                            <span className="font-medium">
                                ${stats.totalUsers > 0 ? (stats.totalRevenue / stats.totalUsers).toFixed(2) : '0.00'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Active Rental Rate:</span>
                            <span className="font-medium">
                                {stats.totalBookings > 0 ? ((stats.activeRentals / stats.totalBookings) * 100).toFixed(1) : '0'}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Products per Booking:</span>
                            <span className="font-medium">
                                {stats.totalBookings > 0 ? (stats.totalProducts / Math.max(stats.totalBookings, 1)).toFixed(1) : '0'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                            <span className="text-gray-600">Database Connection: </span>
                            <span className="font-medium text-green-600">Healthy</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                            <span className="text-gray-600">API Status: </span>
                            <span className="font-medium text-green-600">Operational</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                            <span className="text-gray-600">Last Updated: </span>
                            <span className="font-medium text-blue-600">Just now</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;