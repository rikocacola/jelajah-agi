"use client";

import { child, get, onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "~/lib/api/firebase";
import ParticipantOnBooth from "./list-participants";
import { ListTeamBooth } from "./list-team-booth";

export default function HomeJudge() {
  const [endCountdown, setEndCountdown] = useState<string>("-");

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "endCountdown"), (snapshot) => {
      setEndCountdown(snapshot.val() as string);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <ParticipantOnBooth />
      <ListTeamBooth />
    </div>
  );

  // if (endCountdown === "-") {
  //   return <ParticipantOnBooth />;
  // } else {
  //   return <ListTeamBooth />;
  // }
}
