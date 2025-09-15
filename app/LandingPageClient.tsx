'use client';

import React, { useState } from 'react';
import { Cloud, Upload, Search, FolderOpen, Eye, Star, File } from 'lucide-react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Variants, AnimatePresence, motion } from 'framer-motion';
import { Modal, ModalContent, ModalBody } from '@heroui/modal';
import SignInForm from '@/components/SignInForm';
import SignUpForm from '@/components/SignUpForm';


type ModalState = {
  type: 'signin' | 'signup' | null;
  isOpen: boolean;
};

const DropNestLanding = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [showModal, setShowModal] = useState<ModalState>({ type: null, isOpen: false });
  const [copied, setCopied] = useState('');

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field); // Set which field was copied
      setTimeout(() => setCopied(''), 2000); // Clear after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const features = [
    { icon: Upload, text: "Drag & drop upload" },
    { icon: Search, text: "Instant search" },
    { icon: Eye, text: "Rich previews" },
    { icon: FolderOpen, text: "Smart organization" }
  ];

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

  const mockupVariants: Variants = {
    animate: {
      transition: {
        staggerChildren: 0.3,
        repeat: Infinity,
        repeatDelay: 2
      }
    }
  };

  const fileVariants: Variants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 1
      }
    }
  };

  // Cycling feature animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [features.length]);

  const techStack = [
    { name: "Next.js", color: "from-black to-gray-700" },
    { name: "Drizzle", color: "from-green-500 to-green-700" },
    { name: "Zustand", color: "from-orange-500 to-red-600" },
    { name: "Neon", color: "from-cyan-400 to-blue-600" },
    { name: "Clerk", color: "from-purple-500 to-indigo-600" }
  ];

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL || "email_not_set";
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD || "password_not_set";

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
          <div className="hidden md:flex items-center space-x-4">
            <Button
              className="bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 border border-gray-300 transition-all duration-200"
              size="md"
              radius="full"
              onClick={() => setShowModal({ type: 'signup', isOpen: true })}
            >
              Get Started
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-gray-700 text-white font-semibold hover:shadow-lg hover:scale-102 transition-all duration-200"
              size="md"
              radius="full"
              onClick={() => setShowModal({ type: 'signin', isOpen: true })}
            >
              Try Demo
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
              Experience a Modern<br />File Cloud.
              <motion.span
                className="text-transparent bg-gradient-to-r from-blue-500 to-gray-700 bg-clip-text"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Instantly.
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Skip the setup. Jump straight into a fully-featured file management experience that showcases what modern cloud storage should feel like.
            </motion.p>
          </motion.div>

          {/* Interactive Dashboard Preview */}
          <motion.div
            className="max-w-4xl mx-auto mb-12"
            variants={itemVariants}
          >
            <Card className="bg-gray-50 border-2 border-gray-200 overflow-hidden">
              <CardBody className="p-8">
                <motion.div
                  className="space-y-6"
                  variants={mockupVariants}
                  animate="animate"
                >
                  {/* Mock Search Bar */}
                  <motion.div
                    className="flex items-center bg-white rounded-lg p-3 border border-gray-300 max-w-md mx-auto"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Search className="w-4 h-4 text-gray-400 mr-3" />
                    <motion.div
                      className="text-gray-500 text-left flex-1"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Search files...
                    </motion.div>
                  </motion.div>

                  {/* Mock File Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "Project.pdf", starred: true, type: "pdf" },
                      { name: "Design.png", starred: false, type: "image" },
                      { name: "Video.mp4", starred: false, type: "video" },
                      { name: "Notes.md", starred: true, type: "text" }
                    ].map((file, index) => (
                      <motion.div
                        key={file.name}
                        className="bg-white rounded-lg p-4 border border-gray-200 relative"
                        variants={fileVariants}
                        animate="animate"
                        style={{ animationDelay: `${index * 0.5}s` }}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-gray-700 rounded flex items-center justify-center">
                            <File className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs text-gray-600 text-center">{file.name}</span>
                          {file.starred && (
                            <motion.div
                              className="absolute top-2 right-2"
                              animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                            >
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Animated Feature Showcase */}
                  <motion.div
                    className="flex justify-center items-center space-x-8 pt-4"
                  >
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      const isActive = index === activeFeature;
                      return (
                        <motion.div
                          key={index}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-500 to-gray-700 text-white' : 'text-gray-500'
                            }`}
                          animate={{
                            scale: isActive ? 1.1 : 1,
                            opacity: isActive ? 1 : 0.6
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium hidden md:block">{feature.text}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              </CardBody>
            </Card>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="flex flex-col items-center space-y-6"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="bg-gradient-to-r from-blue-500 to-gray-700 text-white font-semibold text-lg px-12 py-4 hover:shadow-xl transition-all duration-300"
                size="lg"
                radius="full"
                onClick={() => setShowModal({ type: 'signin', isOpen: true })}
              >
                View Live Demo
              </Button>
            </motion.div>
            <p className="text-sm text-gray-500">
              No signup required • Pre-populated account ready
            </p>
          </motion.div>

          {/* Tech Stack Credibility Bar */}
          <motion.div
            className="mt-16 pt-8 border-t border-gray-200"
            variants={itemVariants}
          >
            <p className="text-sm text-gray-500 mb-6">Built with modern technologies:</p>
            <div className="flex flex-wrap justify-center items-center gap-6">
              {techStack.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${tech.color}`} />
                  <span className="text-sm font-medium text-gray-700">{tech.name}</span>
                </motion.div>
              ))}
            </div>
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

      <Modal
        isOpen={showModal.isOpen}
        onClose={() => setShowModal({ type: null, isOpen: false })}
        placement="center"
        backdrop="blur"
        size="4xl"
        closeButton={false}
        disableAnimation={true}
        hideCloseButton={true}
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-sm",
          base: "bg-transparent shadow-none max-w-6xl",
          body: "p-0"
        }}
      >
        <ModalContent className="bg-transparent shadow-none">
          <ModalBody className="p-0 flex justify-center relative">
            {/* ---------------- Sign In / Sign Up Forms ---------------- */}
            <AnimatePresence mode="wait">
              {showModal.type === "signin" && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="relative z-10"
                >
                  <SignInForm
                    isModal
                    onClose={() => setShowModal({ type: null, isOpen: false })}
                    setShowModal={setShowModal}
                  />
                </motion.div>
              )}

              {showModal.type === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="relative z-10"
                >
                  <SignUpForm
                    isModal
                    onClose={() => setShowModal({ type: null, isOpen: false })}
                    setShowModal={setShowModal}
                  />
                </motion.div>
              )}
            </AnimatePresence>


            {/* ---------------- Demo Credentials Panel (Outside Modal) ---------------- */}
            {showModal.type === "signin" && (
              <motion.div
                key="demo-panel"
                className="fixed top-1/2 right-4 transform -translate-y-1/2 w-72 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-lg z-[60]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="text-center mb-4">
                  <motion.div
                    className="text-3xl mb-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <h3 className="font-semibold text-gray-900 text-lg">Demo Credentials</h3>
                  <p className="text-xs text-gray-600 mt-1">Instant access to full experience</p>
                </div>

                <div className="space-y-3">
                  <motion.div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
                        <p className="text-sm font-mono text-gray-800">{demoEmail}</p>
                      </div>
                      {/* <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(demoEmail, "email") }}
                        className="text-xs cursor-pointer bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        {copied === "email" ? "Copied!" : "Copy"}
                      </button> */}
                    </div>
                  </motion.div>

                  <motion.div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Password</p>
                        <p className="text-sm font-mono text-gray-800">{demoPassword}</p>
                      </div>
                      {/* <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(demoPassword, "password") }}
                        className="text-xs cursor-pointer bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        {copied === "password" ? "Copied!" : "Copy"}
                      </button> */}
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  className="mt-4 text-center"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.dispatchEvent(new CustomEvent("fillDemo")) }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                  >
                    Auto-fill Credentials
                  </button>
                </motion.div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">Pre-populated with files, folders, and activity</p>
                </div>
              </motion.div>
            )}


          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DropNestLanding;