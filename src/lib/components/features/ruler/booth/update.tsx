"use client";

import { PencilIcon } from "lucide-react";
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

interface IProps {
  index: number;
  name: string;
  slug: string;
  image: string;
}

export default function BoothUpdate({ index, name: initialName, slug, image: initialImage }: IProps) {
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name) return;
    setLoading(true);
    try {
      let imageUrl = initialImage;
      if (image) {
        const supabase = createClient();
        const path = `${slug}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from("jelajahamaliah").upload(path, image);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("jelajahamaliah").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }

      const snapshot = await get(dbRef(db, "jelajahamaliah"));
      const current: any[] = snapshot.exists() ? Object.values(snapshot.val()) : [];
      current[index] = { ...current[index], name, image: imageUrl };
      await set(dbRef(db, "jelajahamaliah"), current);

      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger aria-label="EditButton">
        <PencilIcon className="text-primary" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Update pos</DialogTitle>
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
              disabled={loading || !name}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
