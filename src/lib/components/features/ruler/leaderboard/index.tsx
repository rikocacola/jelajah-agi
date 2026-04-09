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

export default function RulerLeaderboardComp({ booth }: IProps) {
  const [activities, setActivities] = useState<IActivity[]>([]);

  useEffect(() => {
    const activityRef = ref(db, "activity");
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
    <ul className="flex w-full flex-col p-2 gap-3">
      {activities.map((activity, index) => {
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
  );
}
