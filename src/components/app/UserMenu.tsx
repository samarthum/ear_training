"use client"
import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  user?: { name?: string | null; email?: string | null; image?: string | null } | null
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || "U"
  const words = String(source).split(" ")
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return String(source).slice(0, 2).toUpperCase()
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-[color:var(--brand-accent)]">
        <Avatar>
          {user?.image ? (
            <AvatarImage src={user.image} alt={user?.name ?? "User"} />
          ) : (
            <AvatarFallback>{getInitials(user?.name ?? null, user?.email ?? null)}</AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[color:var(--brand-text)] truncate">{user?.name ?? "Account"}</span>
            {user?.email && (
              <span className="text-xs text-[color:var(--brand-muted)] truncate">{user.email}</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="w-full">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/practice" className="w-full">Practice</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/api/auth/signout" className="w-full text-red-600">Sign out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


