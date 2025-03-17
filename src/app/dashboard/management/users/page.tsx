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
  const [role, setRole] = useState<Roles>('Admin');

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
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = await resetPassword(userId);
    toast.success(`Das neue Passwort wurde in deiner Zwischenablage kopiert`);

    navigator.clipboard.writeText(newPassword);
  };

  return (
    <div className="flex justify-center w-full p-4">
      <div className="rounded-md border w-full max-w-4xl p-8 mt-16">
        <h1 className="text-2xl font-bold mb-4 text-center">Benutzerverwaltung</h1>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Aktionen</TableHead>
              <TableHead>
                <Popover>
                  <PopoverTrigger>
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white"
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
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent defaultValue={role}>
                          <SelectItem value="Admin" className={role === 'Admin' ? 'bg-gray-200' : ''}>Admin</SelectItem>
                          <SelectItem value="Developer" className={role === 'Developer' ? 'bg-gray-200' : ''}>Developer</SelectItem>
                          <SelectItem value="Content" className={role === 'Content' ? 'bg-gray-200' : ''}>Content</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white"
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
                    <SelectContent defaultValue={user.role}>
                      <SelectItem value="Admin" className={user.role === 'Admin' ? 'bg-gray-200' : ''}>Admin</SelectItem>
                      <SelectItem value="Developer" className={user.role === 'Developer' ? 'bg-gray-200' : ''}>Developer</SelectItem>
                      <SelectItem value="Content" className={user.role === 'Content' ? 'bg-gray-200' : ''}>Content</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Löschen
                  </Button>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white"
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
  );
}