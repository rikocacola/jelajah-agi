"use client";

import { Button } from "~/lib/components/ui/button";
import { useState, useEffect } from "react";
import { useCookies } from "next-client-cookies";
import { useAtom } from "jotai";

import { CurrentBooth } from "./current-page";
import { ListProcess } from "./list-process-page";
import UploadResult from "~/lib/components/features/ruler/participants/upload-result";
import { db } from "~/lib/api/firebase";
import { child, ref, get, onValue } from "firebase/database";
import { ListBooth, ParticipantStatus } from "~/lib/stores/app.atom";
import { CheckCircle2Icon } from "lucide-react";
import { checkCountdownValid } from "~/lib/helper/check-countdown.helper";

const ParticipantProcess = () => {
  const [screen, setScreen] = useState<"current" | "process">("current");
  const [listBooth, setListBooth] = useAtom(ListBooth);
  const [participantStatus, setParticipantStatus] = useAtom(ParticipantStatus);
  const [currentActivity, setCurrentActivity] = useState<any>({});
  const [endCountdown, setEndCountDown] = useState<any>();

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
        console.log(snapshot.val());
        setParticipantStatus(snapshot.val());
        const { currentActivity } = snapshot.val();
        if (currentActivity) {
          onValue(
            ref(db, `activity/${currentActivity}`),
            async (snapshotActivity) => {
              if (snapshotActivity.exists()) {
                setCurrentActivity(snapshotActivity.val());
              }
            },
          );
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

  return (
    <section className="h-[calc(100%-82px)]">
      {listBooth.length ? (
        <>
          <div className="flex justify-end gap-2">
            {/* {!participantStatus.isScanned?.includes(currentIndex) && (
              <Button
                // variant={"default"}
                onClick={() => router.push("/participants/scan-qr")}
              >
                Scan QR
              </Button>
            )} */}
            <Button
              // variant={"outline"}
              onClick={() => {
                if (screen === "current") {
                  setScreen("process");
                } else {
                  setScreen("current");
                }
              }}
            >
              {screen === "current" ? (
                <p>Lihat Proses</p>
              ) : (
                <p>Lihat Saat ini</p>
              )}
            </Button>
          </div>
          <div className="flex justify-center items-center flex-col h-full gap-3">
            {screen === "current" ? (
              <>
                {participantStatus.isFinish ? (
                  <>
                    <CheckCircle2Icon
                      className="text-green-600"
                      width={100}
                      height={100}
                    />
                    <p>Telah Melakukan Semua!</p>
                  </>
                ) : (
                  <CurrentBooth
                    booth={currentBooth}
                    participantStatus={participantStatus}
                  />
                )}
                {currentActivity?.status === "needValidation" ? (
                  <p>Mohon menunggu validasi dari Juri...</p>
                ) : currentActivity?.status === "process" ? (
                  checkCountdownValid(endCountdown) ? (
                    <UploadResult
                      typeResult={"file"}
                      // typeResult={currentBooth.type}
                      activityId={participantStatus.currentActivity}
                      activity={currentActivity}
                      participantStatus={participantStatus}
                      uid={uid as string}
                    />
                  ) : (
                    <p className="text-red-600">Waktu Telah Habis!!</p>
                  )
                ) : (
                  ""
                )}
              </>
            ) : (
              <div className="h-full overflow-scroll w-full pt-5">
                <ListProcess
                  listProcess={listBooth.map((item, index: number) => {
                    return {
                      ...item,
                      indexBooth: index,
                    };
                  })}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        ""
      )}
    </section>
  );
};

export { ParticipantProcess };
