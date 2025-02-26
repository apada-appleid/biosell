import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/app/store/cart';

interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: 'credit_card' | 'cash_on_delivery';
}

const CheckoutForm: React.FC = () => {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CheckoutFormData>({
    defaultValues: {
      paymentMethod: 'cash_on_delivery'
    }
  });
  
  const onSubmit = async (data: CheckoutFormData) => {
    try {
      // In a real application, you would send this data to your backend
      console.log('Order data:', { 
        customer: data,
        items: cart.items,
        total: cart.total
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear cart and redirect to success page
      clearCart();
      router.push('/checkout/success');
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Contact Information</h2>
        
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            {...register('fullName', { required: 'Full name is required' })}
            aria-invalid={errors.fullName ? 'true' : 'false'}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            {...register('phone', { required: 'Phone number is required' })}
            aria-invalid={errors.phone ? 'true' : 'false'}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Shipping Address</h2>
        
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            id="address"
            type="text"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            {...register('address', { required: 'Address is required' })}
            aria-invalid={errors.address ? 'true' : 'false'}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              id="city"
              type="text"
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              {...register('city', { required: 'City is required' })}
              aria-invalid={errors.city ? 'true' : 'false'}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              id="postalCode"
              type="text"
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              {...register('postalCode', { required: 'Postal code is required' })}
              aria-invalid={errors.postalCode ? 'true' : 'false'}
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            id="country"
            type="text"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            {...register('country', { required: 'Country is required' })}
            aria-invalid={errors.country ? 'true' : 'false'}
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Payment Method</h2>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="cash_on_delivery"
              type="radio"
              value="cash_on_delivery"
              className="h-4 w-4 text-blue-500 focus:ring-blue-500"
              {...register('paymentMethod')}
            />
            <label htmlFor="cash_on_delivery" className="ml-3 block text-sm font-medium text-gray-700">
              Cash on Delivery
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="credit_card"
              type="radio"
              value="credit_card"
              className="h-4 w-4 text-blue-500 focus:ring-blue-500"
              {...register('paymentMethod')}
            />
            <label htmlFor="credit_card" className="ml-3 block text-sm font-medium text-gray-700">
              Credit Card
            </label>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
          <p>Subtotal</p>
          <p>{formatPrice(cart.total)}</p>
        </div>
        <div className="flex justify-between text-base font-medium text-gray-500 mb-2">
          <p>Shipping</p>
          <p>Free</p>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
          <p>Total</p>
          <p>{formatPrice(cart.total)}</p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-70"
          aria-label="Place order"
          tabIndex={0}
        >
          {isSubmitting ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm; 