import React, { useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiImage } = FiIcons;

const EventBasicInfo = ({ data, onChange, errors = {} }) => {
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Event Information</h3>
        <p className="text-gray-400 mb-6">
          Enter the basic information about your event.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Event Title *
          </label>
          <input
            type="text"
            name="title"
            value={data.title}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
              errors.title ? 'border-red-500' : 'border-zinc-600'
            }`}
            placeholder="Enter event title"
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Date *
          </label>
          <input
            type="date"
            name="date"
            value={data.date}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
              errors.date ? 'border-red-500' : 'border-zinc-600'
            }`}
          />
          {errors.date && (
            <p className="text-red-400 text-sm mt-1">{errors.date}</p>
          )}
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Time
          </label>
          <input
            type="time"
            name="time"
            value={data.time}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-primary-400"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={data.location}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
              errors.location ? 'border-red-500' : 'border-zinc-600'
            }`}
            placeholder="City, Venue"
          />
          {errors.location && (
            <p className="text-red-400 text-sm mt-1">{errors.location}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Category
          </label>
          <select
            name="category"
            value={data.category}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-primary-400"
          >
            <option value="concert">Concert</option>
            <option value="party">Party</option>
            <option value="bustour">Bus Tour</option>
          </select>
        </div>

        {/* Artist */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Artist
          </label>
          <input
            type="text"
            name="artist"
            value={data.artist}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-primary-400"
            placeholder="Artist name (optional)"
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Genre
          </label>
          <input
            type="text"
            name="genre"
            value={data.genre}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-primary-400"
            placeholder="Genre (optional)"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={data.description}
            onChange={handleInputChange}
            rows="4"
            className={`w-full px-4 py-3 bg-zinc-700 border rounded-lg text-white focus:outline-none focus:border-primary-400 ${
              errors.description ? 'border-red-500' : 'border-zinc-600'
            }`}
            placeholder="Describe your event..."
          />
          {errors.description && (
            <p className="text-red-400 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Image Upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Cover Image
          </label>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div
                className="w-full px-4 py-8 bg-zinc-700 border-2 border-dashed border-zinc-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-600 transition-colors"
                onClick={() => fileInputRef.current.click()}
              >
                <SafeIcon icon={FiImage} className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-gray-400 text-sm">
                  {data.image ? 'Change image' : 'Click to upload image'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 800x600px. JPG, PNG supported.
              </p>
            </div>
            
            {data.image && (
              <div className="w-32 h-32 rounded-lg overflow-hidden">
                <img
                  src={data.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventBasicInfo;