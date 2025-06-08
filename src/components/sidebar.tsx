'use client';

import {
  Cast,
  Calendar,
  ChevronDown,
  Users,
  FileSpreadsheet,
  Mail,
  Code,
  Wrench,
  LifeBuoy,
  Cloud,
  UserX,
  ClipboardList,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  Users2Icon,
  LogOut,
  Settings
} from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "./ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { signOut, useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { DropdownMenu, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";

export function AppSidebar() {

  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  if (status === "loading" || !session?.user) {
    return (
      <Sidebar>
        <SidebarContent className="bg-gray-200">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="w-6 h-6" />
              <span className="text-xl font-bold">Radio<span className="text-[#00b37f]">Playz</span></span>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarContent className="bg-gray-200">
        <div className="p-4 border-gray-300">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-6 h-6" />
            <span className="text-xl font-bold">Radio<span className="text-[#00b37f]">Playz</span></span>
          </div>
        </div>
        <SidebarMenu>
          {(userRole === "Management") && (
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Management
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem >
                      <a href="/dashboard/management/users" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                        <Users className="mr-2 h-4 w-4" />Benutzerverwaltung
                      </a>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem >
                      <a href="/dashboard/management/applications" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />Bewerbung Manager
                      </a>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem >
                      <a href="/dashboard/management/mails" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                        <Mail className="mr-2 h-4 w-4" />Mails
                      </a>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem >
                      <a href="/dashboard/management/maintance-mode" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                        <Wrench className="mr-2 h-4 w-4" />Wartungsmodus
                      </a>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}

          {(userRole === "Development" || userRole === "Management") && (
            <Collapsible defaultOpen className="group/collapsible mt-6">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <Code className="w-4 h-4 mr-2" />
                    Development
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {/* Hier ggf. Unterpunkte für Development einfügen */}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}

          {(userRole === "Content" || userRole === "Management") && (
            <Collapsible defaultOpen className="group/collapsible mt-6">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <Cast className="w-4 h-4 mr-2" />
                    Content
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem >
                      <a href="/dashboard/content/news" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                        <Calendar className="mr-2 h-4 w-4" />News Post
                      </a>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem >
                      <a href="/dashboard/content/kalender" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                        <Calendar className="mr-2 h-4 w-4" />Postplaner
                      </a>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}

          {/* Moderation Kategorie */}
          {(userRole === "Moderation" || userRole === "Management") && (
            <Collapsible defaultOpen className="group/collapsible mt-6">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Moderation
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {/* Hier ggf. Unterpunkte für Moderation einfügen */}
                    {/* Beispiel: <SidebarMenuSubItem><a href="/dashboard/moderation/reports">Reports</a></SidebarMenuSubItem> */}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}

          {/* Support Kategorie */}
          {(userRole === "Support" || userRole === "Management") && (
            <Collapsible defaultOpen className="group/collapsible mt-6">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Support
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {/* Hier ggf. Unterpunkte für Support einfügen */}
                    {/* Beispiel: <SidebarMenuSubItem><a href="/dashboard/support/tickets">Tickets</a></SidebarMenuSubItem> */}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}

          <Collapsible defaultOpen className="group/collapsible mt-6">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <Users2Icon className="w-4 h-4 mr-2" />
                  Team
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem >
                    <a href="/dashboard/team/cloud" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <Cloud className="mr-2 h-4 w-4" />Cloud
                    </a>
                    <a href="/dashboard/team/abwesendheit" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <UserX className="mr-2 h-4 w-4" />Abwesendheit
                    </a>
                    <a href="/dashboard/team/zuständigkeiten" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <ClipboardList className="mr-2 h-4 w-4" />Zuständigkeiten
                    </a>
                    <a href="/dashboard/team/kalender" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <CalendarDays className="mr-2 h-4 w-4" />Kalender
                    </a>
                    <a href="/dashboard/team/wichtiges" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <AlertTriangle className="mr-2 h-4 w-4" />Wichtiges
                    </a>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="bg-gray-200">
        <DropdownMenu>
          {session?.user?.name && session?.user?.role && (
            <div className="p-4 border-t border-gray-300">
              <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold truncate" title={session.user.name}>{session.user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{session.user.role}</p>
                </div>
                <div className="flex items-center justify-center">
                  <DropdownMenuTrigger className="transition-transform duration-150 ease-in-out hover:scale-110"><Settings /></DropdownMenuTrigger>
                  <DropdownMenuContent align="center" sideOffset={8} className="w-56">
                  <DropdownMenuLabel>Mein Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => {}}>Einstellungen</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/' })} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </div>

              </div>
            </div>
          )}
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
