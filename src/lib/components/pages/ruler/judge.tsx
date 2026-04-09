"use client";

import CardJudge from "../../features/ruler/judge/card";
import JugeAdd from "../../features/ruler/judge/add";
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "~/lib/api/firebase";

interface IAccount {
  id: string;
  name: string;
  booth: string;
  type: string;
}

export default function Judge() {
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
          if (item.type === "judge") {
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

  return (
    <div className="flex flex-col gap-4 py-3 px-5">
      <h1 className="text-3xl font-semibold text-center">List Judge</h1>
      <JugeAdd />
      <ul className="flex flex-col gap-3">
        {accounts.map(({ name, booth, id }) => (
          <CardJudge key={id} uid={id} name={name} booth={booth} />
        ))}
      </ul>
    </div>
  );
}
