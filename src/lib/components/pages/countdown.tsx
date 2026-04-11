"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { child, get, ref, remove, set, update } from "firebase/database";
import { db } from "~/lib/api/firebase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { formatterTime } from "~/lib/helper/formatter.helper";
import { useToast } from "../ui/use-toast";

interface IProps {
  isRuler?: boolean;
}

export default function Countdown({ isRuler }: IProps) {
  const { toast } = useToast();
  const [countdown, setCountdown] = useState<string>("00:00:00");
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    setInterval(() => {
      get(child(ref(db), "endCountdown")).then((snapshot) => {
        if (snapshot.val() === "-") {
          setCountdown("00:00:00");
        } else {
          const now = new Date();
          const endCountdown = new Date(snapshot.val());
          if (now.getTime() < endCountdown.getTime()) {
            const difference = endCountdown.getTime() - now.getTime();

            const { formatted } = formatterTime(difference);

            setCountdown(formatted);
          } else {
            setCountdown("00:00:00");
          }
        }
      });
    }, 100);
  }, []);

  const handleStart = () => {
    const minutesAdded = parseInt(process.env.NEXT_PUBLIC_COUNTDOWN || "0");
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutesAdded);
    set(ref(db, "endCountdown"), now.toString());
  };

  const handleClear = () => {
    set(ref(db, "endCountdown"), "-");
  };

  const handleResetGame = async () => {
    setIsResetting(true);
    try {
      await remove(ref(db, "activity"));

      const accountSnapshot = await get(ref(db, "account"));
      if (accountSnapshot.exists()) {
        const accounts = accountSnapshot.val();
        const updates: Record<string, any> = {};
        for (const [uid, account] of Object.entries<any>(accounts)) {
          if (account.type === "participants") {
            updates[uid] = {
              index: account.index,
              name: account.name,
              type: account.type,
            };
          }
        }
        if (Object.keys(updates).length > 0) {
          await update(ref(db, "account"), updates);
        }
      }

      toast({
        variant: "success",
        title: "Success",
        description: "Game has been reset successfully.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset game.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col gap-3 items-center justify-center">
      <time className="font-semibold text-4xl">{countdown}</time>
      {isRuler && (
        <div className="flex flex-row gap-3">
          <Button
            className="w-full max-w-16"
            onClick={handleStart}
            disabled={countdown !== "00:00:00"}
          >
            Start
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={countdown !== "00:00:00" || isResetting}
              >
                Reset Game
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Apakah anda yakin akan mereset seluruh game? Semua activity
                  akan dihapus dan data peserta akan direset.
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button asChild variant="outline">
                  <AlertDialogCancel>Tidak</AlertDialogCancel>
                </Button>
                <Button asChild variant="destructive" className="mb-2 md:m-0">
                  <AlertDialogAction onClick={handleResetGame}>
                    Ya, Reset Game
                  </AlertDialogAction>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {Boolean(countdown !== "00:00:00") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full max-w-16">
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Apakah anda yakin akan mereset countdown yang sedang
                    berjalan ?
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button asChild variant="outline">
                    <AlertDialogCancel>Tidak</AlertDialogCancel>
                  </Button>
                  <Button asChild variant="destructive" className="mb-2 md:m-0">
                    <AlertDialogAction onClick={handleClear}>
                      Ya
                    </AlertDialogAction>
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}
