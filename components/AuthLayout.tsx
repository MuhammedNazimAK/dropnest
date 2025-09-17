import React, { ReactNode } from 'react';
import Logo from './ui/logo';

interface AuthLayoutProps {
    children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="min-h-screen flex flex-col bg-background p-4">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="mb-8">
                    <Logo size="lg" />
                </div>

                {/* The children prop is where the actual SignInForm or SignUpForm will be rendered */}
                {children}
            </div>

            <div className="flex justify-center pb-4">
                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} DropNest. All rights reserved.
                </p>
            </div>
        </div>
    );
};