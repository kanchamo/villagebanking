"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

interface Group {
  id: string;
  name: string;
  description: string;
  maxMembers: number;
  contributionAmount: number;
  _count: {
    members: number;
  };
}

export function GroupSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchGroups = async () => {
      if (!debouncedQuery) {
        setGroups([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/groups/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setGroups(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Failed to search groups:", error);
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchGroups();
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && groups.length > 0) {
      router.push(`/dashboard/groups/${groups[0].id}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative w-full max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search groups..."
          className="pl-9 pr-4 bg-orange-100 w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {isOpen && (
        <Card className="absolute mt-2 w-full overflow-hidden py-2">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Searching...</div>
          ) : groups.length > 0 ? (
            <div className="max-h-[300px] overflow-auto">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/dashboard/groups/${group.id}`}
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {group.description}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-600">
                        {group._count.members}/{group.maxMembers} members
                      </p>
                      <p className="text-primary">
                        {formatCurrency(group.contributionAmount)}/month
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="px-4 py-2 text-sm text-gray-500">No groups found</div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
