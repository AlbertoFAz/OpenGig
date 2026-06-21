"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
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
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t.calendar.newEntry}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.calendar.newEntryTitle}</DialogTitle>
        </DialogHeader>
        <PersonalEntryForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
