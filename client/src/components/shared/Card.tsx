import React, { type ReactNode } from 'react';

export interface CardProps {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  children?: ReactNode;
  actions?: ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined' | 'elevated';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

/**
 * Reusable Card component for displaying content in a styled container
 * Supports different sizes, variants, and hover effects
 */
export const Card: React.FC<CardProps> = ({
  title,
  description,
  image,
  imageAlt = '',
  children,
  actions,
  size = 'medium',
  variant = 'default',
  className = '',
  onClick,
  hoverable = false,
}) => {
  // Size classes
  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-transparent border-2 border-gray-300',
    elevated: 'bg-white shadow-lg border border-gray-100',
  };

  // Hover effect classes
  const hoverClasses = hoverable || onClick
    ? 'transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
    : '';

  // Combine all classes
  const cardClasses = `
    rounded-lg overflow-hidden
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${hoverClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Image Section */}
      {image && (
        <div className="mb-4 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-6 lg:-mt-6">
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Title Section */}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}

      {/* Description Section */}
      {description && (
        <p className="text-sm text-gray-600 mb-4">
          {description}
        </p>
      )}

      {/* Children Content */}
      {children && (
        <div className="mb-4">
          {children}
        </div>
      )}

      {/* Actions Section */}
      {actions && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Card;
