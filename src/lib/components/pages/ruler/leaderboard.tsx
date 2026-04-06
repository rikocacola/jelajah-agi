"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { onValue, ref } from "firebase/database";
import { db } from "~/lib/api/firebase";
import RulerLeaderboardComp from "../../features/ruler/leaderboard";

interface IBooth {
  name: string;
  slug: string;
}

export default function RulerLeaderboard() {
  const [booths, setBooths] = useState<IBooth[]>([]);

  useEffect(() => {
    const boothRef = ref(db, "booth");
    const unsubscribe = onValue(boothRef, (snapshot) => {
      if (snapshot) {
        setBooths(snapshot.val() as IBooth[]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (booths.length === 0) {
    return <div />;
  }

  return (
    <div className="w-full p-2">
      <Tabs defaultValue={booths[0].slug} className="w-full">
        <TabsList className="w-full flex flex-row justify-start overflow-x-auto">
          {booths?.map(({ slug, name }) => (
            <TabsTrigger key={slug} value={slug}>
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
        {booths?.map(({ slug }) => (
          <TabsContent value={slug} key={slug}>
            <RulerLeaderboardComp booth={slug} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
