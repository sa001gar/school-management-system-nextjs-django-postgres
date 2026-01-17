"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Plus,
  MoreVertical,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api/client";
import { School } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal, ModalFooter } from "@/components/ui/modal";

export default function SiteAdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch schools
  const {
    data: schools,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      return api.get<School[]>("/schools/");
    },
  });

  // Filter schools
  const filteredSchools = schools?.filter(
    (school) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            School Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage all registered schools in the system
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New School
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools?.length || 0}</div>
            <p className="text-xs text-gray-500">Registered schools</p>
          </CardContent>
        </Card>
        {/* Add more stats if needed */}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search schools..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Schools Table */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>School Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    <span>Loading schools...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSchools && filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <TableRow key={school.id} className="group">
                  <TableCell className="font-medium font-mono text-purple-600">
                    {school.code}
                  </TableCell>
                  <TableCell className="font-semibold">{school.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="mr-1 h-3 w-3" />
                      {school.city}, {school.state}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-gray-500 gap-1">
                      <span className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" /> {school.email}
                      </span>
                      {school.phone && (
                        <span className="flex items-center">
                          <Phone className="mr-1 h-3 w-3" /> {school.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-gray-500"
                >
                  No schools found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add School Modal (Placeholder) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New School"
        description="Enter the details of the new school."
        size="lg"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Form for adding a new school will be implemented here.
          </p>
          {/* Implement form here later */}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-purple-600"
            onClick={() => setIsAddModalOpen(false)}
          >
            Save School
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
