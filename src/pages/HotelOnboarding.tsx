import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Plus, Upload, Image, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Property, currencies } from '../types/property';
import { loadProperties, saveProperty } from '../utils/properties';

interface HotelForm extends Omit<Property, 'id' | 'budgetUtilization'> {
  image: string;
}

const HotelOnboarding = () => {
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  const [hotel, setHotel] = useState<HotelForm>({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    generalManager: '',
    type: 'Hotel',
    rooms: 0,
    currency: currencies[0],
    image: ''
  });

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!hotel.name.trim()) errors.name = 'Hotel name is required';
    if (!hotel.location.trim()) errors.location = 'Location is required';
    if (!hotel.address.trim()) errors.address = 'Address is required';
    if (!hotel.phone.trim()) errors.phone = 'Phone number is required';
    if (!hotel.email.trim()) errors.email = 'Email is required';
    if (!hotel.generalManager.trim()) errors.generalManager = 'General Manager name is required';
    if (!hotel.rooms || hotel.rooms <= 0) errors.rooms = 'Valid number of rooms is required';
    if (!hotel.image) errors.image = 'Hotel image is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const newProperty = await saveProperty({
      name: hotel.name,
      location: hotel.location,
      address: hotel.address,
      phone: hotel.phone,
      email: hotel.email,
      generalManager: hotel.generalManager,
      type: hotel.type,
      rooms: hotel.rooms,
      currency: hotel.currency,
      image: hotel.image
    });

    if (newProperty) {
      navigate('/properties');
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/properties')}
              className="mr-4 p-2 rounded-lg text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-pastel-dusty">New Hotel</h1>
              <p className="text-sm text-pastel-gray mt-1">Add a new hotel to the platform</p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <Plus size={18} />
            <span>Add Hotel</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Hotel Name
              </label>
              <input
                type="text"
                value={hotel.name}
                onChange={(e) => setHotel(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter hotel name"
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={hotel.location}
                  onChange={(e) => setHotel(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.location && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={hotel.address}
                  onChange={(e) => setHotel(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Full street address"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.address && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={hotel.phone}
                  onChange={(e) => setHotel(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (123) 456-7890"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={hotel.email}
                  onChange={(e) => setHotel(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="hotel@example.com"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  General Manager
                </label>
                <input
                  type="text"
                  value={hotel.generalManager}
                  onChange={(e) => setHotel(prev => ({ ...prev, generalManager: e.target.value }))}
                  placeholder="Enter name"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.generalManager && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.generalManager}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Property Type
                </label>
                <select
                  value={hotel.type}
                  onChange={(e) => setHotel(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                >
                  <option value="Hotel">Hotel</option>
                  <option value="Resort">Resort</option>
                  <option value="Boutique">Boutique Hotel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-pastel-gray mb-1">
                  Number of Rooms
                </label>
                <input
                  type="number"
                  value={hotel.rooms || ''}
                  onChange={(e) => setHotel(prev => ({ ...prev, rooms: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                />
                {formErrors.rooms && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.rooms}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-2">
                Hotel Image
              </label>
              <div className={`p-6 border-2 border-dashed rounded-lg text-center transition-all ${
                hotel.image 
                  ? 'border-pastel-mauve bg-pastel-peach bg-opacity-5' 
                  : 'border-pastel-pink border-opacity-20 hover:border-pastel-mauve'
              }`}>
                {hotel.image ? (
                  <div className="relative">
                    <img 
                      src={hotel.image} 
                      alt="Hotel preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setHotel(prev => ({ ...prev, image: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-pastel-gray hover:text-red-500 shadow-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Image size={24} className="mx-auto text-pastel-gray mb-2" />
                    <div className="text-sm text-pastel-gray">
                      <input
                        type="text"
                        value={hotel.image}
                        onChange={(e) => setHotel(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="Enter image URL"
                        className="w-full mt-2 rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                      />
                    </div>
                    <p className="text-xs text-pastel-gray mt-1">
                      Enter a valid image URL
                    </p>
                  </div>
                )}
              </div>
              {formErrors.image && (
                <p className="mt-1 text-xs text-red-500">{formErrors.image}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-pastel-gray mb-1">
                Default Currency
              </label>
              <select
                value={hotel.currency.code}
                onChange={(e) => {
                  const currency = currencies.find(c => c.code === e.target.value);
                  if (currency) {
                    setHotel(prev => ({ ...prev, currency }));
                  }
                }}
                className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-pastel-gray">
                This will be the default currency for all financial transactions and cannot be changed later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelOnboarding;