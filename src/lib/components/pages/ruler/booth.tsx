"use client";

import { useEffect, useState } from "react";
import CardBooth from "../../features/ruler/booth/card";
import BoothAdd from "../../features/ruler/booth/add";
import { onValue, ref } from "firebase/database";
import { db } from "~/lib/api/firebase";

interface IBooth {
  image: string;
  name: string;
  slug: string;
}

function Booth() {
  const [booths, setBooths] = useState<IBooth[]>([]);

  useEffect(() => {
    const boothRef = ref(db, "booth");
    const unsubscribe = onValue(boothRef, (snapshot) => {
      setBooths(Object.values(snapshot.val() ?? {}) as IBooth[]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 py-3 px-5">
      <h1 className="text-3xl font-semibold text-center">List pos</h1>
      <BoothAdd />
      <ul className="flex flex-col gap-3">
        {booths?.map(({ image, name, slug }, index: number) => (
          <CardBooth key={index} index={index} title={name} img={image} slug={slug} />
        ))}
      </ul>
    </div>
  );
}

export default Booth;
