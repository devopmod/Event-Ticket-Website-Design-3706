import React from 'react';
import SearchBar from './SearchBar';

const HeroSection = () => {
  return (
    <div className="relative">
      {/* Background Video/Image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80")',
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-zinc-900"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-24 pb-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
          Live the Experience
        </h1>
        
        <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
          Discover amazing events, concerts, and bus tours across Europe
        </p>

        {/* SearchBar integrated directly in HeroSection */}
        <div className="w-full max-w-lg">
          <SearchBar />
        </div>

        {/* Button positioned below search bar with 40px gap */}
        <button className="mt-10 bg-primary-400 hover:bg-primary-500 text-white font-medium px-8 py-3 rounded-full transition-all duration-300 hover:opacity-100 opacity-50">
          GET A BONUS TICKET
        </button>
      </div>
    </div>
  );
};

export default HeroSection;