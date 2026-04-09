"use client";

import { child, get, onValue, ref } from "firebase/database";
import { useCookies } from "next-client-cookies";
import { useEffect, useState } from "react";
import { db } from "~/lib/api/firebase";
import { formatterTime } from "~/lib/helper/formatter.helper";
import { IActivity } from "~/lib/interfaces/activity.interface";
import { MAX_MEMBER } from "~/lib/utils/config";

const getTime = (date: string) => new Date(date).getTime();

export default function LeaderboardPost() {
  const cookies = useCookies();
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
          if (item.booth === cookies.get("booth") && item.status === "done") {
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
  }, [cookies]);

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

const CardTeam = (props: {
  name: string;
  score?: number;
  endDate: string;
  startDate: string;
  index: number;
}) => {
  const { name, score, endDate, startDate, index } = props;
  return (
    <div className="py-5 px-6 rounded-lg shadow-md border flex justify-between items-center">
      <div className="flex flex-row items-center gap-2">
        <p
          className={`order p-3 rounded-full ${
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
      <p className="font-semibold text-end text-sm">
        <span className="text-green-600 text-xl">Score: {score}</span> <br />
        Time: {formatterTime(getTime(endDate) - getTime(startDate)).formatted}
      </p>
    </div>
  );
};
