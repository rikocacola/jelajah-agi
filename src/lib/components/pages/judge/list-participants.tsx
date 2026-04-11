"use client";

import { child, get, onValue, ref } from "firebase/database";
import { useCookies } from "next-client-cookies";
import { useEffect, useState } from "react";
import { db } from "~/lib/api/firebase";
import { IParticipant } from "~/lib/interfaces/participant.interface";

export default function ParticipantOnBooth() {
  const cookies = useCookies();
  const [participants, setParticipants] = useState<IParticipant[]>([]);

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
            console.log("snapshotData", snapshotData);
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
          console.log("participantsTemp", participantsTemp);
          console.log("boothIndex", boothIndex);
          setParticipants(participantsTemp);
        });

        return () => {
          unsubscribe();
        };
      }
    });
  }, [cookies]);

  return (
    <ul className="flex w-full flex-col p-2 gap-3">
      {participants.map((participant) => {
        return (
          <li key={participant.name}>
            <CardTeam name={participant.name} />
          </li>
        );
      })}
    </ul>
  );
}

const CardTeam = ({ name }: { name: string }) => {
  return (
    <div className="py-5 px-6 rounded-lg shadow-md border flex justify-between items-center">
      <div className="flex flex-row items-center gap-2">
        <h3>{name}</h3>
      </div>
    </div>
  );
};
