"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PersonalEntryForm } from "./PersonalEntryForm";

export function NewPersonalEntryDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nueva entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva entrada personal</DialogTitle>
        </DialogHeader>
        <PersonalEntryForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
