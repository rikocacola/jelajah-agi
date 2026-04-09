"use client";

import { child, get, onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { db } from "~/lib/api/firebase";
import { getTime } from "~/lib/helper/time.helper";
import { IActivity } from "~/lib/interfaces/activity.interface";
import { CardTeam } from "./card";
import { MAX_MEMBER } from "~/lib/utils/config";

interface IProps {
  booth: string;
}

export default function BroadcastLeaderboardComp({ booth }: IProps) {
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [boothName, setBoothName] = useState<string>("");

  useEffect(() => {
    const activityRef = ref(db, "activity");
    get(child(ref(db), "booth")).then((snapshot) => {
      const boothData = snapshot.val();
      if (boothData) {
        const item = boothData.find((item: any) => item.slug === booth);
        if (item) {
          setBoothName(item.name);
        }
      }
    });
    const unsubscribe = onValue(activityRef, async (snapshot) => {
      const activitiesTemp: IActivity[] = [];
      const snapshotData = Object?.entries(snapshot.val()).map(
        ([id, activity]) => ({ id, ...(activity as any) })
      );
      if (snapshotData) {
        for (const item of snapshotData) {
          if (item.booth === booth && item.status === "done") {
            const name = await get(child(ref(db), `account/${item.uid}/name`));
            activitiesTemp.push({
              ...(item as Omit<IActivity, "name" | "score">),
              score:
                item.score *
                (item.totalMember > MAX_MEMBER
                  ? 1
                  : item.totalMember / MAX_MEMBER),
              name: name.val(),
            });
          }
        }
      }
      activitiesTemp.sort(function (a, b) {
        const aDifference = getTime(a.endDate) - getTime(a.startDate);
        const bDifference = getTime(b.endDate) - getTime(b.startDate);
        if (a.score < b.score) {
          return 1;
        } else if (a.score > b.score) {
          return -1;
        } else if (a.score === b.score && aDifference < bDifference) {
          return -1;
        } else if (a.score === b.score && aDifference > bDifference) {
          return 1;
        } else {
          return 0;
        }
      });
      setActivities(activitiesTemp);
    });

    return () => {
      unsubscribe();
    };
  }, [booth]);

  return (
    <div>
      <h1 className="font-semibold text-lg text-center w-full">
        Pos {boothName}
      </h1>
      <ul className="flex w-full flex-col p-2 gap-2">
        {activities
          .filter((_, index) => index < 4)
          .map((activity, index) => {
            return (
              <li key={activity.id}>
                <CardTeam
                  index={index}
                  name={activity.name}
                  score={activity.score}
                  startDate={activity.startDate}
                  endDate={activity.endDate}
                />
              </li>
            );
          })}
      </ul>
    </div>
  );
}
