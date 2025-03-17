import {
  Calendar,
  ChevronDown,
  Users,
  Server,
  Bot,
  FileSpreadsheet,
  Mail,
  Code,
  Radio
} from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "./ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { signOut } from "next-auth/react"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-6 h-6" />
            <span className="text-xl font-bold">Radio<span className="text-[#00b37f]">Playz</span></span>
          </div>
        </div>

        <SidebarMenu>
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
                    <a href="dashboard/management/users" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <Users className="mr-2 h-4 w-4" />Benutzerverwaltung
                    </a>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem >
                    <a href="dashboard/management/servers" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <Server className="mr-2 h-4 w-4" />Serverübersicht
                    </a>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem >
                    <a href="dashboard/management/bots" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <Bot className="mr-2 h-4 w-4" />Botverwaltung
                    </a>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem >
                    <a href="dashboard/management/applications" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />Bewerbung Manager
                    </a>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem >
                    <a href="dashboard/management/mails" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <Mail className="mr-2 h-4 w-4" />Mails
                    </a>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

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
                  <SidebarMenuSubItem >
                    <a href="dashboard/development/bots" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <Bot className="mr-2 h-4 w-4" />Bot verwaltung
                    </a>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem >
                    <a href="dashboard/development/servers" className="flex items-center px-2 py-1 hover:bg-accent rounded-md">
                      <Server className="mr-2 h-4 w-4" />Server übersicht
                    </a>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
          <button onClick={() => signOut({ redirectTo: "/"})} className="flex items-center px-2 py-1 hover:bg-accent rounded-md text-red-500">
            <Users className="mr-2 h-4 w-4" />Logout
          </button>
        </SidebarFooter>
    </Sidebar>
  )
}
