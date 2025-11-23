import React, { useState } from 'react';

const ProductRow = ({ product, onUpdate, onDelete, onViewHistory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({ ...product });

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProduct({ ...product });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProduct({ ...product });
  };

  const handleSave = () => {
    // Auto-update status based on stock
    const updatedData = {
      ...editedProduct,
      status: editedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'
    };

    onUpdate(product.id, updatedData);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: field === 'stock' ? parseInt(value) || 0 : value
    }));
  };

  const getStatusBadge = (status, stock) => {
    const isInStock = stock > 0;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
          isInStock
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        <span className={`w-2 h-2 rounded-full mr-2 ${isInStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {isInStock ? 'In Stock' : 'Out of Stock'}
      </span>
    );
  };

  return (
    <tr className="hover:bg-slate-50 transition-all duration-150">
      {/* Image */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          )}
        </div>
      </td>

      {/* Product Name */}
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            type="text"
            value={editedProduct.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="input-field text-sm"
          />
        ) : (
          <div className="text-sm font-medium text-gray-900">{product.name}</div>
        )}
      </td>

      {/* Unit */}
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            type="text"
            value={editedProduct.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="input-field text-sm w-24"
          />
        ) : (
          <div className="text-sm text-gray-700">{product.unit}</div>
        )}
      </td>

      {/* Category */}
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            type="text"
            value={editedProduct.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="input-field text-sm"
          />
        ) : (
          <div className="text-sm text-gray-700">{product.category}</div>
        )}
      </td>

      {/* Brand */}
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            type="text"
            value={editedProduct.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            className="input-field text-sm"
          />
        ) : (
          <div className="text-sm text-gray-700">{product.brand}</div>
        )}
      </td>

      {/* Stock */}
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            type="number"
            min="0"
            value={editedProduct.stock}
            onChange={(e) => handleChange('stock', e.target.value)}
            className="input-field text-sm w-24"
          />
        ) : (
          <div className="text-sm font-semibold text-gray-900">{product.stock}</div>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(product.status, product.stock)}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-900 font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 font-medium rounded-md transition-colors duration-150"
            >
              Edit
            </button>
            <button
              onClick={() => onViewHistory(product.id)}
              className="px-3 py-1.5 text-purple-600 hover:bg-purple-50 font-medium rounded-md transition-colors duration-150"
            >
              History
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="px-3 py-1.5 text-red-600 hover:bg-red-50 font-medium rounded-md transition-colors duration-150"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default ProductRow;
