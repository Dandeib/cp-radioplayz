'use client'

import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <SessionProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarTrigger />
                {children}
                <Toaster />
            </SidebarProvider>
        </SessionProvider>
    );
}