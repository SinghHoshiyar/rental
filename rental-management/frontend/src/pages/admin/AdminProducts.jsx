import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        images: [''],
        rentalUnits: [{ unit: 'day', price: 0, minDuration: 1, maxDuration: 30 }],
        inventory: { totalQuantity: 1, availableQuantity: 1, reservedQuantity: 0 },
        specifications: {}
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products');
            setProducts(response.data.products);
        } catch (error) {
            toast.error('Failed to fetch products');
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const productData = {
                ...formData,
                images: formData.images.filter(img => img.trim() !== ''),
                inventory: {
                    ...formData.inventory,
                    availableQuantity: editingProduct
                        ? formData.inventory.availableQuantity
                        : formData.inventory.totalQuantity
                }
            };

            if (editingProduct) {
                await axios.put(`/api/products/${editingProduct._id}`, productData);
                toast.success('Product updated successfully');
            } else {
                await axios.post('/api/products', productData);
                toast.success('Product created successfully');
            }

            setShowModal(false);
            setEditingProduct(null);
            resetForm();
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            category: product.category,
            images: product.images.length > 0 ? product.images : [''],
            rentalUnits: product.rentalUnits,
            inventory: product.inventory,
            specifications: product.specifications || {}
        });
        setShowModal(true);
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await axios.delete(`/api/products/${productId}`);
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: '',
            images: [''],
            rentalUnits: [{ unit: 'day', price: 0, minDuration: 1, maxDuration: 30 }],
            inventory: { totalQuantity: 1, availableQuantity: 1, reservedQuantity: 0 },
            specifications: {}
        });
    };

    const addRentalUnit = () => {
        setFormData({
            ...formData,
            rentalUnits: [...formData.rentalUnits, { unit: 'day', price: 0, minDuration: 1, maxDuration: 30 }]
        });
    };

    const removeRentalUnit = (index) => {
        setFormData({
            ...formData,
            rentalUnits: formData.rentalUnits.filter((_, i) => i !== index)
        });
    };

    const addImageField = () => {
        setFormData({
            ...formData,
            images: [...formData.images, '']
        });
    };

    const updateImageField = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData({
            ...formData,
            images: newImages
        });
    };

    const removeImageField = (index) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, i) => i !== index)
        });
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(products.map(p => p.category))];

    if (loading && products.length === 0) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingProduct(null);
                        setShowModal(true);
                    }}
                    className="btn-primary"
                >
                    Add New Product
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="md:w-64">
                    <select
                        className="input-field"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price Range
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Inventory
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
                            {filteredProducts.map((product) => (
                                <tr key={product._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-12">
                                                {product.images && product.images.length > 0 ? (
                                                    <img
                                                        className="h-12 w-12 rounded-lg object-cover"
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                <div className="text-sm text-gray-500">{product.description.substring(0, 50)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {product.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${Math.min(...product.rentalUnits.map(u => u.price))} - ${Math.max(...product.rentalUnits.map(u => u.price))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {product.inventory.availableQuantity} / {product.inventory.totalQuantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {product.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Product Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        required
                                        rows="3"
                                        className="input-field"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Images
                                    </label>
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                            <input
                                                type="url"
                                                placeholder="Image URL"
                                                className="input-field flex-1"
                                                value={image}
                                                onChange={(e) => updateImageField(index, e.target.value)}
                                            />
                                            {formData.images.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeImageField(index)}
                                                    className="btn-secondary px-3"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addImageField}
                                        className="btn-outline text-sm"
                                    >
                                        Add Image
                                    </button>
                                </div>

                                {/* Rental Units */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rental Units *
                                    </label>
                                    {formData.rentalUnits.map((unit, index) => (
                                        <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                                            <select
                                                className="input-field"
                                                value={unit.unit}
                                                onChange={(e) => {
                                                    const newUnits = [...formData.rentalUnits];
                                                    newUnits[index].unit = e.target.value;
                                                    setFormData({ ...formData, rentalUnits: newUnits });
                                                }}
                                            >
                                                <option value="hour">Hour</option>
                                                <option value="day">Day</option>
                                                <option value="week">Week</option>
                                                <option value="month">Month</option>
                                                <option value="year">Year</option>
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                min="0"
                                                step="0.01"
                                                className="input-field"
                                                value={unit.price}
                                                onChange={(e) => {
                                                    const newUnits = [...formData.rentalUnits];
                                                    newUnits[index].price = parseFloat(e.target.value) || 0;
                                                    setFormData({ ...formData, rentalUnits: newUnits });
                                                }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Min Duration"
                                                min="1"
                                                className="input-field"
                                                value={unit.minDuration}
                                                onChange={(e) => {
                                                    const newUnits = [...formData.rentalUnits];
                                                    newUnits[index].minDuration = parseInt(e.target.value) || 1;
                                                    setFormData({ ...formData, rentalUnits: newUnits });
                                                }}
                                            />
                                            {formData.rentalUnits.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRentalUnit(index)}
                                                    className="btn-secondary"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addRentalUnit}
                                        className="btn-outline text-sm"
                                    >
                                        Add Rental Unit
                                    </button>
                                </div>

                                {/* Inventory */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="input-field"
                                            value={formData.inventory.totalQuantity}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                inventory: {
                                                    ...formData.inventory,
                                                    totalQuantity: parseInt(e.target.value) || 1
                                                }
                                            })}
                                        />
                                    </div>
                                    {editingProduct && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Available Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="input-field"
                                                value={formData.inventory.availableQuantity}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    inventory: {
                                                        ...formData.inventory,
                                                        availableQuantity: parseInt(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingProduct(null);
                                            resetForm();
                                        }}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary"
                                    >
                                        {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;