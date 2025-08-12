import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProductDetails = () => {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [bookingData, setBookingData] = useState({
        startDate: '',
        endDate: '',
        quantity: 1,
        selectedUnit: ''
    });

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await axios.get(`/api/products/${id}`);
            setProduct(response.data.product);

            // Set default rental unit
            if (response.data.product.rentalUnits.length > 0) {
                setBookingData(prev => ({
                    ...prev,
                    selectedUnit: response.data.product.rentalUnits[0].unit
                }));
            }
        } catch (error) {
            toast.error('Failed to load product details');
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookingChange = (e) => {
        setBookingData({
            ...bookingData,
            [e.target.name]: e.target.value
        });
    };

    const calculatePrice = () => {
        if (!product || !bookingData.selectedUnit || !bookingData.startDate || !bookingData.endDate) {
            return 0;
        }

        const selectedRentalUnit = product.rentalUnits.find(unit => unit.unit === bookingData.selectedUnit);
        if (!selectedRentalUnit) return 0;

        const startDate = new Date(bookingData.startDate);
        const endDate = new Date(bookingData.endDate);
        const timeDiff = endDate.getTime() - startDate.getTime();

        let duration = 0;
        switch (bookingData.selectedUnit) {
            case 'hour':
                duration = Math.ceil(timeDiff / (1000 * 3600));
                break;
            case 'day':
                duration = Math.ceil(timeDiff / (1000 * 3600 * 24));
                break;
            case 'week':
                duration = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));
                break;
            case 'month':
                duration = Math.ceil(timeDiff / (1000 * 3600 * 24 * 30));
                break;
            default:
                duration = 1;
        }

        return selectedRentalUnit.price * duration * bookingData.quantity;
    };

    const handleBookNow = () => {
        if (!isAuthenticated) {
            toast.error('Please login to book this product');
            navigate('/login');
            return;
        }

        if (!bookingData.startDate || !bookingData.endDate) {
            toast.error('Please select rental dates');
            return;
        }

        if (new Date(bookingData.startDate) >= new Date(bookingData.endDate)) {
            toast.error('End date must be after start date');
            return;
        }

        // Navigate to booking page with product and booking data
        navigate('/booking', {
            state: {
                product,
                bookingData: {
                    ...bookingData,
                    totalPrice: calculatePrice()
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
                    <button
                        onClick={() => navigate('/products')}
                        className="btn-primary"
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images */}
                <div>
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[selectedImage]}
                                alt={product.name}
                                className="h-96 w-full object-cover object-center"
                            />
                        ) : (
                            <div className="h-96 w-full bg-gray-200 flex items-center justify-center">
                                <svg className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Image Thumbnails */}
                    {product.images && product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg ${selectedImage === index ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                >
                                    <img
                                        src={image}
                                        alt={`${product.name} ${index + 1}`}
                                        className="h-20 w-full object-cover object-center"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                    <p className="text-gray-600 mb-6">{product.description}</p>

                    <div className="mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {product.category}
                        </span>
                    </div>

                    {/* Availability */}
                    <div className="mb-6">
                        <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${product.inventory.availableQuantity > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                {product.inventory.availableQuantity > 0
                                    ? `${product.inventory.availableQuantity} Available`
                                    : 'Out of Stock'
                                }
                            </span>
                        </div>
                    </div>

                    {/* Rental Options */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Rental Options</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {product.rentalUnits.map(unit => (
                                <div
                                    key={unit.unit}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${bookingData.selectedUnit === unit.unit
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    onClick={() => setBookingData({ ...bookingData, selectedUnit: unit.unit })}
                                >
                                    <div className="text-sm font-medium">${unit.price}</div>
                                    <div className="text-xs text-gray-500">per {unit.unit}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Booking Form */}
                    {product.inventory.availableQuantity > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Book This Product</h3>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={bookingData.startDate}
                                        onChange={handleBookingChange}
                                        className="input-field"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={bookingData.endDate}
                                        onChange={handleBookingChange}
                                        className="input-field"
                                        min={bookingData.startDate}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={bookingData.quantity}
                                    onChange={handleBookingChange}
                                    min="1"
                                    max={product.inventory.availableQuantity}
                                    className="input-field"
                                />
                            </div>

                            {calculatePrice() > 0 && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="text-lg font-semibold">
                                        Total: ${calculatePrice().toFixed(2)}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleBookNow}
                                className="btn-primary w-full"
                                disabled={!bookingData.startDate || !bookingData.endDate}
                            >
                                Book Now
                            </button>
                        </div>
                    )}

                    {/* Product Specifications */}
                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-3">Specifications</h3>
                            <div className="space-y-2">
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                        <span className="text-gray-600">{key}:</span>
                                        <span className="font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;