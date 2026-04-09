"use client";

import { useEffect, useState } from "react";

import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "~/lib/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "~/lib/components/ui/use-toast";
import { db } from "~/lib/api/firebase";
import { child, ref, get, onValue, update, push } from "firebase/database";
import { useCookies } from "next-client-cookies";
import { ListBooth, ParticipantStatus } from "~/lib/stores/app.atom";
import { useAtom } from "jotai";
import { checkCountdownValid } from "~/lib/helper/check-countdown.helper";
import { fetchLog } from "~/lib/api/log";

export const ScanQr = () => {
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);
  const [listBooth, setListBooth] = useAtom(ListBooth);
  const [participantStatus, setParticipantStatus] = useAtom(ParticipantStatus);
  const [endCountdown, setEndCountDown] = useState<any>();
  const router = useRouter();
  const { toast } = useToast();
  const cookies = useCookies();
  const uid = cookies.get("uid");

  useEffect(() => {
    const dbRef = ref(db);
    get(child(dbRef, "booth")).then((snapshot) => {
      if (snapshot.exists()) {
        setListBooth(snapshot.val());
      }
    });
    const statusUserRef = ref(db, `account/${uid}`);
    const unSubscribe = onValue(statusUserRef, async (snapshot) => {
      if (snapshot.exists()) {
        const participant = snapshot.val();
        setParticipantStatus(participant);

        if (
          participant.isScanned &&
          participant?.isScanned.includes(participant.currentBooth)
        ) {
          toast({
            variant: "destructive",
            title:
              "Upload Hasil Booth Saat Ini Sebelum Scan Booth Selanjutnya!",
          });
          router.replace("/participants");
        }
      }
    });

    get(child(ref(db), "endCountdown")).then((countdownSnapshot) => {
      setEndCountDown(countdownSnapshot.val());
    });

    return () => {
      unSubscribe();
    };
  }, []);

  const currentIndex =
    participantStatus.currentBooth !== undefined
      ? participantStatus.currentBooth
      : participantStatus.index % 7;
  const currentBooth = listBooth[currentIndex];

  const handleScan = (result: any[]) => {
    if (result.length === 0) return;
    const decodedText = result[0].rawValue;

    setShowQRScanner(false);
    if (checkCountdownValid(endCountdown)) {
      if (decodedText === currentBooth.slug) {
        const dataActivty = {
          startDate: new Date(),
          booth: currentBooth.slug,
          endDate: "-",
          score: 0,
          status: "needValidation",
          totalMember: 0,
          teamName: participantStatus.name,
          uid,
        };
        const newActivityRef = push(ref(db, `activity`));
        const newActivityKey = newActivityRef.key;
        update(newActivityRef, dataActivty);
        fetchLog({
          state: "push activity",
          key: newActivityKey,
          ...dataActivty,
        });

        const userUpdateData = {
          ...participantStatus,
          currentBooth: currentIndex,
          currentActivity: newActivityKey,
          editableActivity: "",
          isScanned: participantStatus.isScanned
            ? [...participantStatus.isScanned, currentIndex]
            : [currentIndex],
        };
        const updates: any = {};
        updates["/account/" + uid] = userUpdateData;
        update(ref(db), updates);
        fetchLog({ state: "scan qr", ...updates });
        toast({
          variant: "success",
          title: "Success Scan Booth",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Can't scan this booth, please go to the current Booth",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Failed.",
        description: "Waktu telah habis.",
      });
    }
    router.replace("/participants");
  };

  return (
    <section className="h-[calc(100%-82px)]">
      <div className="text-center font-bold uppercase text-xl">
        {currentBooth?.name}
      </div>
      <div className="flex items-center justify-center h-full flex-col">
        <div className="w-auto h-4/6 flex items-center justify-center">
          {showQRScanner && (
            <div className="max-w-[600px] h-auto">
              <Scanner
                onScan={handleScan}
                constraints={{ facingMode: "environment" }}
                styles={{ container: { width: "100%", height: "100%" } }}
              />
            </div>
          )}
        </div>
        {showQRScanner ? (
          <div className="mt-2 flex justify-center">
            <Button
              variant={"destructive"}
              onClick={() => {
                setShowQRScanner(false);
              }}
            >
              Stop Scan
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => {
              setShowQRScanner(true);
            }}
          >
            Start Scan
          </Button>
        )}
      </div>
    </section>
  );
};
