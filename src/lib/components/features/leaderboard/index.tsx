"use client";

import { child, get, onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "~/lib/api/firebase";
import { MAX_MEMBER } from "~/lib/utils/config";
import { getTime } from "~/lib/helper/time.helper";
import { formatterTime } from "~/lib/helper/formatter.helper";
import { Card, CardContent } from "~/lib/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/lib/components/ui/accordion";

interface IBooth {
  name: string;
  slug: string;
}

interface ITeam {
  id: string;
  name: string;
  score: number;
  startDate: string;
  endDate: string;
}

const CardTeam = ({
  index,
  name,
  score,
  startDate,
  endDate,
}: ITeam & { index: number }) => (
  <Card className="border border-primary shadow-md">
    <CardContent className="flex justify-between items-center py-1 px-2 rounded-sm font-bold">
      <div className="flex flex-row items-center gap-2">
        <p
          className={`p-2 rounded-full ${
            index === 0
              ? "bg-[#d4af37]"
              : index === 1
                ? "bg-[#c0c0c0]"
                : index === 2
                  ? "bg-[#CD7F32]"
                  : ""
          }`}
        >
          {index + 1}
        </p>
        <h3>{name}</h3>
      </div>
      <p className="font-semibold text-end text-xs">
        <span className="text-green-600 text-sm">Score: {score}</span> <br />
        Time: {formatterTime(getTime(endDate) - getTime(startDate)).formatted}
      </p>
    </CardContent>
  </Card>
);

const BoothLeaderboard = ({
  booth,
  boothName,
}: {
  booth: string;
  boothName: string;
}) => {
  const [teams, setTeams] = useState<ITeam[]>([]);

  useEffect(() => {
    const activityRef = ref(db, "activity");
    const unsubscribe = onValue(activityRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const endCountdown = await get(child(ref(db), "endCountdown"));
      const snapshotData = Object.entries(snapshot.val()).map(
        ([id, activity]) => ({ id, ...(activity as any) }),
      );
      const filtered = snapshotData.filter(
        (item) => item.booth === booth && item.status === "done",
      );
      const withNames = await Promise.all(
        filtered.map(async (item) => {
          const nameSnap = await get(
            child(ref(db), `account/${item.uid}/name`),
          );
          return {
            id: item.id,
            name: nameSnap.val(),
            score:
              item.score *
              (item.totalMember > MAX_MEMBER
                ? 1
                : item.totalMember / MAX_MEMBER),
            startDate: item.startDate,
            endDate: item.endDate,
          };
        }),
      );
      withNames.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        const aDiff = getTime(a.endDate) - getTime(a.startDate);
        const bDiff = getTime(b.endDate) - getTime(b.startDate);
        return aDiff - bDiff;
      });
      setTeams(withNames);
    });
    return () => unsubscribe();
  }, [booth]);

  return (
    <ul className="flex flex-col gap-2">
      {teams.length === 0 && (
        <p className="text-center text-muted-foreground text-sm">No data yet</p>
      )}
      {teams.map((team, index) => (
        <li key={team.id}>
          <CardTeam index={index} {...team} />
        </li>
      ))}
    </ul>
  );
};

const LeaderboardList = ({ title = "Homepage" }: { title?: string }) => {
  const [booths, setBooths] = useState<IBooth[]>([]);

  useEffect(() => {
    const boothRef = ref(db, "booth");
    const unsubscribe = onValue(boothRef, (snapshot) => {
      if (snapshot.exists()) {
        setBooths(Object.values(snapshot.val()) as IBooth[]);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full">
      <div className="text-center mb-5">
        <h1 className="font-semibold text-2xl">{title}</h1>
      </div>
      <Accordion type="multiple" className="w-full">
        {booths.map(({ slug, name }) => (
          <AccordionItem key={slug} value={slug}>
            <AccordionTrigger className="font-semibold">
              Pos {name}
            </AccordionTrigger>
            <AccordionContent>
              <BoothLeaderboard booth={slug} boothName={name} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default LeaderboardList;
