import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { auth, db } from "~/lib/api/firebase";
import { Button } from "~/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import { useToast } from "~/lib/components/ui/use-toast";
import { ToastAction } from "~/lib/components/ui/toast";
import readXlsxFile from "read-excel-file";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";

export default function ParticipantAddBulk() {
  const { toast } = useToast();

  const [isLoading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [participants, setParticipants] = useState<
    { name: string; email: string; password: string }[]
  >([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[event.target.files.length - 1];
    fileRef.current!.value = "";
    if (file && file.name.split(".").pop() !== "xlsx") {
      toast({
        variant: "destructive",
        title: "Uh oh! Login failed.",
        description: "Please check your file type again.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }
    if (file) {
      readXlsxFile(file, { sheet: "User Kelompok " }).then((rows) => {
        setParticipants(
          rows
            .map((row) => ({ name: row[1], email: row[3], password: row[4] }))
            .filter((row) => row.name && row.email && row.password)
            .slice(1) as { name: string; email: string; password: string }[]
        );
        setLoading(false);
        setIsOpen(true);
      });
    }
  };

  async function onSubmit() {
    if (!isLoading) {
      setLoading(true);
      for (const participant of participants) {
        const account = await createUserWithEmailAndPassword(
          auth,
          participant.email,
          participant.password
        );
        if (account) {
          set(ref(db, `account/${account.user.uid}`), {
            name: participant.name,
            index: 0,
            type: "participants",
          });
        }
      }
      toast({
        variant: "success",
        title: "Success",
        description: "Create participant account successfully",
      });
      setLoading(false);
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen || isLoading} onOpenChange={setIsOpen}>
      <Button variant="default" onClick={() => fileRef.current?.click()}>
        <Plus /> Add Bulk
      </Button>
      <input
        type="file"
        className="hidden"
        ref={fileRef}
        onChange={handleFileChange}
        accept=".xlsx"
      />
      <DialogContent>
        <DialogHeader className="max-h-[70vh] overflow-y-auto gap-2">
          <DialogTitle className="text-center">List participant</DialogTitle>
          <table>
            <thead>
              <tr>
                <th className="px-1">No</th>
                <th className="px-1">Name</th>
                <th className="px-1">Email</th>
                <th className="px-1">Password</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => (
                <tr key={index}>
                  <td className="px-1">{index + 1}</td>
                  <td className="px-1">{participant.name}</td>
                  <td className="px-1">{participant.email}</td>
                  <td className="px-1">{participant.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            type="button"
            className="w-full self-end"
            disabled={isLoading}
            onClick={onSubmit}
          >
            {isLoading ? "Loading..." : "Save"}
          </Button>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
