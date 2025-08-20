'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cloud } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className="flex items-center space-x-3">
      <motion.div 
        className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-gray-700 rounded-lg flex items-center justify-center cursor-pointer`}
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <Cloud className={`${iconSizeClasses[size]} text-white`} />
      </motion.div>
      {showText && (
        <h1 className={`${textSizeClasses[size]} font-bold text-blue-600`}>
          DropNest
        </h1>
      )}
    </div>
  );
};

export default Logo;