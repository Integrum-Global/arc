/**
 * Admin Users Settings Page
 *
 * Allows administrators to manage user accounts.
 */

"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Loader2,
} from "lucide-react";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/api";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive" | "pending";
  lastActive: string;
}

// Mock users data
const mockUsers: MockUser[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
    status: "active",
    lastActive: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "portfolio_manager",
    status: "active",
    lastActive: "2024-01-14T15:45:00Z",
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob.wilson@example.com",
    role: "analyst",
    status: "active",
    lastActive: "2024-01-13T09:15:00Z",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice.brown@example.com",
    role: "viewer",
    status: "inactive",
    lastActive: "2024-01-01T12:00:00Z",
  },
  {
    id: "5",
    name: "Charlie Davis",
    email: "charlie.davis@example.com",
    role: "analyst",
    status: "pending",
    lastActive: "Never",
  },
];

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  portfolio_manager: "Portfolio Manager",
  analyst: "Analyst",
  viewer: "Viewer",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  portfolio_manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  analyst: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusColors: Record<MockUser["status"], string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Invitation sent", {
      description: `An invitation has been sent to ${email}`,
    });

    setEmail("");
    setRole("viewer");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new user to your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="portfolio_manager">Portfolio Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatLastActive(dateStr: string): string {
  if (dateStr === "Never") return "Never";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export default function AdminUsersPage() {
  const isAdmin = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Redirect non-admins
  if (!isAdmin) {
    redirect("/settings/profile");
  }

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleChangeRole = useCallback((userId: string, newRole: UserRole) => {
    toast.success("Role updated", {
      description: "User role has been updated successfully",
    });
  }, []);

  const handleDeactivateUser = useCallback((userId: string) => {
    toast.success("User deactivated", {
      description: "User account has been deactivated",
    });
  }, []);

  const handleDeleteUser = useCallback((userId: string) => {
    toast.success("User deleted", {
      description: "User account has been permanently deleted",
    });
  }, []);

  const handleResendInvitation = useCallback((userId: string) => {
    toast.success("Invitation resent", {
      description: "A new invitation email has been sent",
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="portfolio_manager">Portfolio Manager</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]} variant="secondary">
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[user.status]} variant="secondary">
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatLastActive(user.lastActive)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(user.id, "admin")}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        {user.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() => handleResendInvitation(user.id)}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Invitation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeactivateUser(user.id)}
                          className="text-yellow-600"
                        >
                          Deactivate User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}
