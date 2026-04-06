"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ref as dbRef, get, set } from "firebase/database";
import { Button } from "~/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/components/ui/dialog";
import { Input } from "~/lib/components/ui/input";
import { db } from "~/lib/api/firebase";
import { createClient } from "~/utils/supabase/client";

export default function BoothAdd() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !image) return;
    setLoading(true);
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const supabase = createClient();
      const path = `${slug}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("jelajahamaliah")
        .upload(path, image);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from("jelajahamaliah")
        .getPublicUrl(path);
      const imageUrl = data.publicUrl;

      const snapshot = await get(dbRef(db, "booth"));
      const current: any[] = snapshot.exists()
        ? Object.values(snapshot.val())
        : [];
      await set(dbRef(db, "booth"), [
        ...current,
        { name, slug, image: imageUrl },
      ]);

      setName("");
      setImage(null);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="default" className="w-24 self-end" asChild>
        <DialogTrigger>
          <Plus /> Add
        </DialogTrigger>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Add </DialogTitle>
          <div className="flex flex-col gap-2 pt-2">
            <fieldset className="flex flex-col items-start gap-1">
              <label>Name</label>
              <Input
                placeholder="ex. Janaiz"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </fieldset>
            <fieldset className="flex flex-col items-start gap-1">
              <label>Image</label>
              <Input
                name="img"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </fieldset>
            <Button
              type="button"
              className="mt-2"
              variant="default"
              onClick={handleSave}
              disabled={loading || !name || !image}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
