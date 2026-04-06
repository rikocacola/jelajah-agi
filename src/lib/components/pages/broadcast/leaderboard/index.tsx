"use client";

import { useEffect, useState } from "react";
import { child, onValue, ref, get } from "firebase/database";
import { db } from "~/lib/api/firebase";
import { formatterTime } from "~/lib/helper/formatter.helper";
import BroadcastLeaderboardComp from "~/lib/components/features/broadcast/leaderboard";
import BroadcastLeaderboardList from "~/lib/components/features/broadcast/leaderboardAll";

interface IBooth {
  name: string;
  slug: string;
}

export default function BroadcastLeaderboard() {
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
    <div className="w-full h-full p-2 flex flex-col">
      <div className="flex-1 w-full grid-cols-4 gap-2 hidden lg:grid">
        {/* <BroadcastLeaderboardList title="All Pos" /> */}
        {booths?.map(({ slug }) => (
          <BroadcastLeaderboardComp key={slug} booth={slug} />
        ))}
      </div>
      <div className="flex lg:hidden flex-1 w-full items-center h-full justify-center">
        <p className="text-center">Mohon gunakan layar besar</p>
      </div>
      <Countdown />
    </div>
  );
}

const Countdown = () => {
  const [countdown, setCountdown] = useState<string>("00:00:00");
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
  return (
    <time className="font-semibold text-xl text-center w-full py-2">
      {countdown}
    </time>
  );
};
