'use client'

import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();

    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
          redirect("/");
        }
    });

    if(status === "loading") {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Laden...</p>
            </div>
        );
    }

    if(status === "authenticated") {
        if (pathname.startsWith("/dashboard/management")) {
            if (session?.user?.role !== "Management") { 
                redirect("/dashboard");
                return null; 
            }
        } else if (pathname.startsWith("/dashboard/content")) {
            const userRole = session?.user?.role;
            if (!(userRole === "Content" || userRole === "Management")) { 
                redirect("/dashboard");
                return null; 
            }
        }

        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarTrigger />
                {children}
                <Toaster />
            </SidebarProvider>
        );
    }

    return null; 
}