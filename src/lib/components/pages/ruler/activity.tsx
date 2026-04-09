"use client";

import { useEffect, useState } from "react";
import { child, get, onValue, ref } from "firebase/database";
import { db } from "~/lib/api/firebase";
import CardActivity from "../../features/ruler/activity/card";
import { Input } from "../../ui/input";

interface IActivity {
  id: string;
  name: string;
  booth: string;
  score: number;
}

export default function Activity() {
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [activitiesWithFilter, setActivitiesWithFilter] = useState<IActivity[]>(
    []
  );
  const [booths, setBooths] = useState<{ slug: string; name: string }[]>([]);
  const [participants, setParticipants] = useState<
    { name: string; id: string }[]
  >([]);
  const [name, setName] = useState<string>("");
  const [booth, setBooth] = useState<string>("");

  useEffect(() => {
    get(child(ref(db), "booth")).then((snapshot) => {
      const boothTemp: { slug: string; name: string }[] = [];
      const snapshotData = Object?.entries(snapshot.val()).map(
        ([_, booth]) => booth as { slug: string; name: string }
      );
      if (snapshotData) {
        for (const item of snapshotData) {
          boothTemp.push(item);
        }
      }
      setBooths(boothTemp);
    });
  }, []);

  useEffect(() => {
    get(child(ref(db), "account")).then((snapshot) => {
      const participantTemp: { name: string; id: string }[] = [];
      const snapshotData = Object?.entries(snapshot.val()).map(
        ([id, participant]) => ({ id, ...(participant as { name: string }) })
      );
      if (snapshotData) {
        for (const item of snapshotData) {
          participantTemp.push({ name: item.name, id: item.id });
        }
      }
      setParticipants(participantTemp);
    });
  }, []);

  useEffect(() => {
    const activityRef = ref(db, "activity");
    const unsubscribe = onValue(activityRef, (snapshot) => {
      const activityTemp: IActivity[] = [];
      const snapshotData = Object?.entries(snapshot.val()).map(
        ([id, activity]) => ({
          id,
          booth:
            booths.find((b) => b.slug === (activity as { booth: string }).booth)
              ?.name || "",
          name:
            participants.find((p) => p.id === (activity as { uid: string }).uid)
              ?.name || "",
          score: (activity as { score: number }).score,
        })
      );
      if (snapshotData) {
        for (const item of snapshotData) {
          activityTemp.push(item as IActivity);
        }
      }
      setActivities(activityTemp);
    });

    return () => {
      unsubscribe();
    };
  }, [participants, booths]);

  useEffect(() => {
    const filteredActivities = setTimeout(() => {
      const filteredActivities = activities.filter(
        (activity) =>
          activity.name.toLowerCase().includes(name.toLowerCase()) &&
          activity.booth.toLowerCase().includes(booth.toLowerCase())
      );
      setActivitiesWithFilter(filteredActivities);
    }, 300);
    return () => clearTimeout(filteredActivities);
  }, [name, booth, activities]);

  return (
    <div className="flex flex-col gap-4 py-3 px-5">
      <h1 className="text-3xl font-semibold text-center">List Activity</h1>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search by name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Search by booth"
          value={booth}
          onChange={(e) => setBooth(e.target.value)}
        />
      </div>
      <ul className="flex flex-col gap-3">
        {activitiesWithFilter.map(({ name, id, booth, score }) => (
          <CardActivity
            key={id}
            uid={id}
            name={name}
            booth={booth}
            score={score}
          />
        ))}
      </ul>
    </div>
  );
}
