'use client'

import { changeRole, createUser, deleteUser, getUsers, resetPassword } from "@/actions/management";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Roles } from "@prisma/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export type UserType = {
  id: string;
  name: string;
  role: Roles;
};


export default function UsersPage() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Roles>('Management');

  const [users, setUsers] = useState<UserType[]>([]);

  const fetchUsers = async () => {
    const fetchedUsers = await getUsers();
    setUsers(fetchedUsers);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, role: Roles) => {
    await changeRole(role, userId);
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    fetchUsers();
  };

  const handleCreateUser = async (username: string, password: string, role: Roles) => {
    await createUser({ username, password }, role);
    fetchUsers();

    setUsername('')
    setPassword('')
    setRole('Management')
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = await resetPassword(userId);
    toast.success(`Das neue Passwort wurde in deiner Zwischenablage kopiert`);

    navigator.clipboard.writeText(newPassword);
  };

  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
      <div className="max-w-4xl w-full space-y-8">
        <div className="rounded-lg border p-8 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Benutzerverwaltung</h2>
              <p className="text-muted-foreground">
                Verwalte die Benutzer und deren Rollen
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Aktionen</TableHead>
                  <TableHead>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Neuer Benutzer
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="flex flex-col gap-4">
                          <Input
                            type="text"
                            placeholder="Username"
                            onChange={(e) => setUsername(e.target.value)}
                          />
                          <Input
                            type="password"
                            placeholder="Password"
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <Select value={role} onValueChange={(value) => setRole(value as Roles)}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Management">Management</SelectItem>
                              <SelectItem value="Development">Development</SelectItem>
                              <SelectItem value="Content">Content</SelectItem>
                              <SelectItem value="Moderation">Moderation</SelectItem>
                              <SelectItem value="Support">Support</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                            onClick={() => handleCreateUser(username, password, role)}
                          >
                            Erstellen
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as Roles)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Management">Management</SelectItem>
                          <SelectItem value="Development">Development</SelectItem>
                          <SelectItem value="Content">Content</SelectItem>
                          <SelectItem value="Moderation">Moderation</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Löschen
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleResetPassword(user.id)}
                      >
                        Passwort zurücksetzen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}