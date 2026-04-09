"use client";

import CardJudge from "../../features/ruler/judge/card";
import JugeAdd from "../../features/ruler/judge/add";
import { useEffect, useState } from "react";
import { child, get, onValue, ref, update } from "firebase/database";
import { db } from "~/lib/api/firebase";
import CardParticipant from "../../features/ruler/participant/card";
import ParticipantAdd from "../../features/ruler/participant/add";
import { Button } from "../../ui/button";
import { useToast } from "../../ui/use-toast";
import ParticipantAddBulk from "../../features/ruler/participant/add-bulk";

interface IAccount {
  id: string;
  name: string;
  type: string;
}

export default function Participant() {
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<IAccount[]>([]);

  useEffect(() => {
    const accountRef = ref(db, "account");
    const unsubscribe = onValue(accountRef, (snapshot) => {
      const accountTemp: IAccount[] = [];
      const snapshotData = Object?.entries(snapshot.val()).map(
        ([id, account]) => ({ id, ...(account as any) })
      );
      if (snapshotData) {
        for (const item of snapshotData) {
          if (item.type === "participants") {
            accountTemp.push(item as IAccount);
          }
        }
      }
      setAccounts(accountTemp);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function handleGenerate() {
    const snapshot = await get(child(ref(db), "account"));
    const account = Object?.entries(snapshot.val()).map(([id, account]) => ({
      id,
      ...(account as any),
    }));
    let index = 0;
    for (const item of account) {
      if (item.type === "participants") {
        await update(ref(db, `account/${item.id}`), {
          index,
        });
        index++;
      }
    }
    toast({
      variant: "success",
      title: "Success",
      description: "Generate index successfully",
    });
  }

  return (
    <div className="flex flex-col gap-4 py-3 px-5">
      <h1 className="text-3xl font-semibold text-center">List Participant</h1>
      <div className="flex flex-row justify-between">
        <Button onClick={handleGenerate}>Generete Index</Button>
        <div className="flex flex-row gap-2">
          <ParticipantAddBulk />
          <ParticipantAdd />
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {accounts.map(({ name, id }) => (
          <CardParticipant key={id} uid={id} name={name} />
        ))}
      </ul>
    </div>
  );
}
