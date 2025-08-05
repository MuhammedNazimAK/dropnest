'use client';

import React, { useState, useRef } from 'react';
import { Cloud, Upload } from 'lucide-react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Variants, motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const DropNestLanding = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    // Replace this with your real upload logic later
    simulateUpload();
  }
}

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    simulateUpload();
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    }
  };

  const floatingVariants: Variants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden">

      {/* Navigation */}
      <motion.nav 
        className="relative z-10 px-6 py-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className="w-8 h-8 bg-gradient-to-r from-blue-500 to-gray-700 rounded-lg flex items-center justify-center cursor-pointer"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Cloud className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-black">
              DropNest
            </span>
          </motion.div>
          <div className="hidden md:flex items-center space-x-8">
            <motion.a 
              className="hover:text-blue-600 transition-colors cursor-pointer"
              whileHover={{ y: -2 }}
              onClick={() => router.push('/sign-in')}
            >
              Sign In
            </motion.a>
            <motion.a 
              className="hover:text-blue-600 transition-colors cursor-pointer"
              whileHover={{ y: -2 }}
            >
              About
            </motion.a>
            <Button
              className="bg-black text-white font-semibold hover:bg-gray-800 cursor-pointer"
              size="md"
              radius="full"
              onClick={() => router.push('/sign-up')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </motion.nav>

        {/* Hero Section */}
        <motion.section 
          className="relative z-10 px-6 py-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-7xl mx-auto text-center">
            <motion.div 
              className="mb-8"
              variants={itemVariants}
            >
              <motion.h1 
                className="text-6xl md:text-8xl font-bold mb-6 text-black"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              DropNest
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Your files deserve a beautiful home. Store, sync, and share with the elegance your data deserves.
            </motion.p>
          </motion.div>

          {/* Interactive Upload Demo */}
          <motion.div 
            className="max-w-2xl mx-auto mb-12 flex justify-center"
            variants={itemVariants}
          >

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />

            <Card
              onClick={handleCardClick}
              className={`bg-gray-50 border-2 border-gray-200 transition-all duration-300 cursor-pointer ${
                isDragOver ? 'border-blue-500 bg-blue-50 scale-105' : ''
              } ${isUploading ? 'border-gray-400 bg-gray-100' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              isPressable
              onPress={simulateUpload}
            >
              <CardBody className="p-12 min-h-[300px] overflow-hidden">
                <AnimatePresence mode="wait">
                  {isUploading ? (
                    <motion.div 
                      key="uploading"
                      className="space-y-4"
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1 }}
                    >
                      <motion.div 
                        className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-gray-700 rounded-full flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Upload className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          className="bg-gradient-to-r from-blue-500 to-gray-700 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-lg text-black w-[180px]">Uploading... {uploadProgress}%</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="upload"
                      className="space-y-4"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <motion.div 
                        className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-gray-700 rounded-full flex items-center justify-center cursor-pointer"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        variants={floatingVariants}
                        animate="animate"
                      >
                        <Upload className="w-8 h-8 text-white" />
                      </motion.div>
                      <p className="text-xl font-semibold text-black">Drop files here or click to upload</p>
                      <p className="text-gray-500">Experience the magic of seamless file storage</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 px-6 py-12 border-t border-gray-200"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            className="flex items-center justify-center space-x-2 mb-4 cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className="w-6 h-6 bg-gradient-to-r from-blue-500 to-gray-700 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Cloud className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-lg font-bold text-black">
              DropNest
            </span>
          </motion.div>
          <p className="text-gray-600">
            Built with ❤️ by Nazim
          </p>
        </div>
      </motion.footer>
    </div>
  );
};

export default DropNestLanding;