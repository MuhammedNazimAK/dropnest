import React from 'react';

export const MainContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex-1 p-8 overflow-y-auto">
      {children}
    </main>
  );
};