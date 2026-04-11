"use client";

import { child, get, onValue, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "~/lib/api/firebase";
import { useCookies } from "next-client-cookies";
import { IParticipant } from "~/lib/interfaces/participant.interface";
import { IActivity } from "~/lib/interfaces/activity.interface";
import { validateParticipantFormSchema as formSchema } from "~/lib/schema/judgeAction.schema";
import { checkCountdownValid } from "~/lib/helper/check-countdown.helper";
import { formatterTime } from "~/lib/helper/formatter.helper";
import { fetchLog } from "~/lib/api/log";
import { useToast } from "../../ui/use-toast";
import { Timer, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import Score from "../../features/judge/score";

export default function HomeJudge() {
  const cookies = useCookies();
  const { toast } = useToast();

  const [participants, setParticipants] = useState<IParticipant[]>([]);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [dialogTeam, setDialogTeam] = useState<IActivity | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const accountRef = ref(db, "account");
    get(child(ref(db), "booth")).then((boothSnapshot) => {
      const booths = boothSnapshot.val() as any[];
      const boothIndex = booths.findIndex(
        (booth) => booth.slug === cookies.get("booth"),
      );

      if (boothIndex !== -1) {
        const unsubscribe = onValue(accountRef, async (snapshot) => {
          const participantsTemp: IParticipant[] = [];
          const snapshotData = Object?.entries(snapshot.val()).map(
            ([id, participant]) => ({ id, ...(participant as any) }),
          );
          if (snapshotData) {
            for (const item of snapshotData) {
              const currentBooth =
                item.currentBooth || item.index % booths.length;
              if (
                item.type === "participants" &&
                currentBooth === boothIndex &&
                !item.isScanned?.includes(currentBooth)
              ) {
                participantsTemp.push(item as IParticipant);
              }
            }
          }
          setParticipants(participantsTemp);
        });

        return () => {
          unsubscribe();
        };
      }
    });
  }, [cookies]);

  useEffect(() => {
    const activityRef = ref(db, "activity");
    const unsubscribe = onValue(activityRef, async (snapshot) => {
      const activitiesTemp: IActivity[] = [];
      const snapshotValue = snapshot.val();
      if (snapshotValue) {
        const snapshotData = Object?.entries(snapshotValue).map(
          ([id, activity]) => ({ id, ...(activity as any) }),
        );
        if (snapshotData) {
          for (const item of snapshotData) {
            if (item.booth === cookies.get("booth")) {
              const name = await get(
                child(ref(db), `account/${item.uid}/name`),
              );
              activitiesTemp.push({
                ...(item as Omit<IActivity, "name">),
                name: name.val(),
              });
            }
          }
        }
      }
      setActivities(activitiesTemp.reverse());
    });

    return () => {
      unsubscribe();
    };
  }, [cookies]);

  const handleSubmitValidate = async (values: z.infer<typeof formSchema>) => {
    const endCountdown = await get(child(ref(db), "endCountdown"));
    if (checkCountdownValid(endCountdown.val())) {
      update(ref(db, `activity/${dialogTeam?.id}`), {
        status: "process",
        startDate: new Date(),
        totalMember: values.numberOfParticipants,
      });
      fetchLog({
        state: "validation member",
        url: `activity/${dialogTeam?.id}`,
        status: "process",
        startDate: new Date(),
        totalMember: values.numberOfParticipants,
      });
      setDialogTeam(null);
      setOpenDialog(false);
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Failed.",
        description: "Waktu telah habis.",
      });
    }
  };

  const processActivities = activities.filter((a) => a.status === "process");
  const needScoreActivities = activities.filter(
    (a) => a.status === "needInputScore",
  );
  const doneActivities = activities.filter((a) => a.status === "done");
  const needValidationActivities = activities.filter(
    (a) => a.status === "needValidation",
  );

  const getTime = (date: string) => new Date(date).getTime();

  return (
    <>
      <Accordion
        type="multiple"
        defaultValue={[
          "akan-datang",
          "sedang-bermain",
          "perlu-dinilai",
          "sudah-selesai",
        ]}
        className="w-full p-2"
      >
        <AccordionItem value="akan-datang">
          <AccordionTrigger>
            Tim yang akan datang ({participants.length + needValidationActivities.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              {participants.map((participant) => (
                <div
                  key={participant.name}
                  className="py-5 px-6 rounded-lg shadow-md border flex justify-between items-center"
                >
                  <p>{participant.name}</p>
                </div>
              ))}
              {needValidationActivities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => {
                    setDialogTeam(activity);
                    setOpenDialog(true);
                  }}
                >
                  <div className="py-5 px-6 rounded-lg shadow-md border flex justify-between items-center">
                    <p>{activity.name}</p>
                    <Button variant="destructive">Validate</Button>
                  </div>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sedang-bermain">
          <AccordionTrigger>
            Tim yang sedang bermain ({processActivities.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              {processActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="py-5 px-6 rounded-lg shadow-md border flex justify-between items-center"
                >
                  <p>{activity.name}</p>
                  <Button variant="outline">on Process</Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="perlu-dinilai">
          <AccordionTrigger>
            Tim yang perlu dinilai ({needScoreActivities.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              {needScoreActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="py-5 px-6 rounded-lg shadow-md border flex justify-between items-center"
                >
                  <p>{activity.name}</p>
                  <Score
                    team={activity.name}
                    id={activity.id}
                    result={activity.result || ""}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sudah-selesai">
          <AccordionTrigger>
            Tim yang sudah selesai ({doneActivities.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              {doneActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="py-5 px-6 rounded-lg shadow-md border flex justify-between items-center"
                >
                  <p>{activity.name}</p>
                  <p className="font-semibold text-end">
                    <span className="text-green-600 text-2xl">
                      Score: {activity.score}
                    </span>
                    <br />
                    <span className="flex flex-row items-center justify-end my-1">
                      <Timer />:{" "}
                      {
                        formatterTime(
                          getTime(activity.endDate) -
                            getTime(activity.startDate),
                        ).formatted
                      }
                    </span>
                    <span className="flex flex-row items-center justify-end">
                      <Users />: {activity.totalMember} orang
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog
        open={openDialog}
        onOpenChange={(e) => {
          if (!e) {
            setDialogTeam(null);
            setOpenDialog(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validasi {dialogTeam?.name}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitValidate)}>
              <section className="my-5 grid flex-1 gap-2">
                <FormField
                  control={form.control}
                  name="numberOfParticipants"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Number of Participants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            id="numberOfParticipants"
                            placeholder="Input Number of Participants"
                            {...field}
                            onChange={(event) =>
                              field.onChange(Number(event.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </section>
              <DialogFooter>
                <Button type="submit" variant="default">
                  Validate
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
