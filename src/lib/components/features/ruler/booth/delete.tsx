"use client";

import { Trash } from "lucide-react";
import { ref, get, set } from "firebase/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/lib/components/ui/alert-dialog";
import { Button } from "~/lib/components/ui/button";
import { db } from "~/lib/api/firebase";

interface IProps {
  index: number;
}

export default function BoothDelete({ index }: IProps) {
  const handleDelete = async () => {
    const snapshot = await get(ref(db, "booth"));
    if (!snapshot.exists()) return;
    const current: any[] = Object.values(snapshot.val());
    current.splice(index, 1);
    await set(ref(db, "booth"), current);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger aria-label="DeleteButton">
        <Trash className="text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure ?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            post and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button asChild variant="outline">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </Button>
          <Button asChild variant="destructive" className="mb-2 md:m-0">
            <AlertDialogAction onClick={handleDelete}>Yes</AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
