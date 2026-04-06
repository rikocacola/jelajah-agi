"use client";

import { useState, useEffect } from "react";
import { Button } from "~/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/lib/components/ui/dialog";
import { Input } from "~/lib/components/ui/input";
import { db } from "~/lib/api/firebase";
import { ref as refDb, update, get, child } from "firebase/database";
import { createClient } from "~/utils/supabase/client";
import { IParticipantStatus, ListBooth } from "~/lib/stores/app.atom";
import { toast } from "~/lib/components/ui/use-toast";
import { checkCountdownValid } from "~/lib/helper/check-countdown.helper";
import { fetchLog } from "~/lib/api/log";
import { useAtom } from "jotai";
import { Html5Qrcode } from "html5-qrcode";

interface IProps {
  typeResult: "file" | "link";
  activityId?: string;
  activity: any;
  participantStatus: IParticipantStatus;
  uid: string;
}

export default function UploadResult({
  typeResult,
  activityId,
  activity,
  participantStatus,
  uid,
}: IProps) {
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);
  const [html5QrcodeVar, setHtml5QrcodeVar] = useState<Html5Qrcode>();
  const [open, setOpen] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [listBooth, setListBooth] = useAtom(ListBooth);
  const [file, setFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [endCountdown, setEndCountDown] = useState<any>();

  const handleSubmit = async () => {
    if (checkCountdownValid(endCountdown)) {
      setIsLoading(true);
      if (typeResult === "file") {
        if (!file) {
          toast({
            title: "Pilih File",
          });
          return;
        }
        const supabase = createClient();
        const filePath = `${uid}/${file.name}`;
        const { data, error } = await supabase.storage
          .from("jelajahamaliah")
          .upload(filePath, file, { upsert: true });
        if (error) {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Upload failed.",
            description: error.message,
          });
          return;
        }
        const { data: urlData } = supabase.storage
          .from("jelajahamaliah")
          .getPublicUrl(data.path);
        updateData(urlData.publicUrl);
      } else {
        updateData(result);
      }
    } else {
      setFile(null);
      toast({
        variant: "destructive",
        title: "Uh oh! Failed.",
        description: "Waktu telah habis.",
      });
    }
  };

  useEffect(() => {
    const dbRef = refDb(db);
    get(child(dbRef, "endCountdown")).then((countdownSnapshot) => {
      setEndCountDown(countdownSnapshot.val());
    });
    get(child(dbRef, "booth")).then((snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());
        setListBooth(snapshot.val());
      }
    });
  }, []);

  const currentBooth = participantStatus.currentBooth;
  const currentIndex =
    participantStatus.currentBooth !== undefined
      ? participantStatus.currentBooth
      : participantStatus.index % 7;
  const currentBoothDetail = listBooth[currentIndex];

  console.log("currentBoothDetail", currentBoothDetail);

  const updateData = (result: string) => {
    setIsLoading(true);
    const data = {
      ...activity,
      status: "needInputScore",
      endDate: new Date(),
      result,
    };
    const userUpdateData = {
      ...participantStatus,
      currentBooth: currentBooth < 6 ? currentBooth + 1 : 0,
      editableActivity: participantStatus.currentActivity,
      currentActivity: "",
      isDone: participantStatus.isDone
        ? [...participantStatus.isDone, currentBooth]
        : [currentBooth],
      isFinish:
        participantStatus.isDone && participantStatus.isDone.length === 6
          ? true
          : false,
    };
    const updates: any = {};
    updates["/activity/" + activityId] = data;
    updates["/account/" + uid] = userUpdateData;
    update(refDb(db), updates).then(() => {
      setIsLoading(false);
      setOpen(false);
    });
    fetchLog({ state: "upload", ...updates });
  };

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("scan-qr-reader");
    setHtml5QrcodeVar(html5QrCode);
    const qrCodeSuccessCallback = (decodedText: any) => {
      // decodedText = text hasil scan
      // decodedResult = {result text, decoderName, format dll}

      html5QrCode.stop().then(() => {
        // Show success message
        setShowQRScanner(false);
        if (checkCountdownValid(endCountdown)) {
          if (decodedText === currentBoothDetail.slugEnd) {
            handleSubmit();
          } else {
            toast({
              variant: "destructive",
              title: "Can't scan QR Code. Please scan the correct QR Code.",
            });
            setFile(null);
            setOpen(false);
          }
        } else {
          toast({
            variant: "destructive",
            title: "Uh oh! Failed.",
            description: "Waktu telah habis.",
          });
          setOpen(false);
        }
      });
      /* handle success */
    };
    const qrCodeErrorCallback = (error: any) => {
      console.log(error);
      /* handle success */
    };

    // Check if when scan is the time is still available !!

    if (showQRScanner) {
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { height: 250, width: 250 } },
        qrCodeSuccessCallback,
        qrCodeErrorCallback,
      );
    } else {
      html5QrCode.clear();
    }

    // cleanup function when component will unmount
    return () => {
      //   html5QrCode.clear();
    };
  }, [showQRScanner]);

  return (
    <>
      <Button
        variant="default"
        className="w-24"
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        Upload hasil
      </Button>
      <div
        id="scan-qr-reader"
        className={`w-screen h-screen !fixed top-0 left-0 bg-black ${showQRScanner ? "block" : "hidden"} z-50`}
      />
      {showQRScanner && (
        <div className="fixed bottom-0 z-50 py-2 flex justify-center items-center">
          <Button
            variant={"destructive"}
            onClick={() => {
              if (html5QrcodeVar) {
                html5QrcodeVar.stop();
              }
              setFile(null);
              setShowQRScanner(false);
              setOpen(false);
            }}
          >
            Stop Scan
          </Button>
        </div>
      )}
      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Upload hasil</DialogTitle>
            <form className="flex flex-col gap-2">
              {typeResult === "link" && (
                <fieldset className="flex flex-col items-start">
                  <label>Link</label>
                  <Input
                    onChange={(e) => setResult(e.target.value)}
                    placeholder="ex. https://www.instagram.com/astragemaislami/"
                    name="link"
                  />
                </fieldset>
              )}

              {typeResult === "file" && (
                <fieldset className="flex flex-col items-start">
                  <label>Image</label>
                  <Input
                    name="img"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFile(e.target.files[0]);
                      } else {
                        setFile(null);
                      }
                    }}
                  />
                </fieldset>
              )}
              <Button
                type="button"
                className="mt-2"
                variant="default"
                onClick={() => {
                  if (checkCountdownValid(endCountdown)) {
                    if (typeResult === "file") {
                      if (!file) {
                        toast({
                          title: "Pilih File",
                        });
                        return;
                      }
                      setShowQRScanner(true);
                      setOpen(false);
                    } else {
                      if (!result) {
                        toast({
                          title: "Isi Link",
                        });
                        return;
                      }
                      setShowQRScanner(true);
                      setOpen(false);
                    }
                  } else {
                    toast({
                      variant: "destructive",
                      title: "Uh oh! Failed.",
                      description: "Waktu telah habis.",
                    });
                  }
                }}
              >
                Save
              </Button>
              <Button
                type="button"
                className="mt-2"
                variant="secondary"
                onClick={() => {
                  setOpen(false);
                  setFile(null);
                }}
              >
                Close
              </Button>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
