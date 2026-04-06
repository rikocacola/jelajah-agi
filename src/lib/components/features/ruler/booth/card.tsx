import Image from "next/image";
import { Card, CardContent, CardTitle } from "~/lib/components/ui/card";
import BoothUpdate from "./update";
import BoothDelete from "./delete";

interface IProps {
  index: number;
  title: string;
  img: string;
  slug: string;
}

export default function CardBooth({ index, title, img, slug }: IProps) {
  return (
    <li aria-label="CardBooth">
      <Card>
        <CardContent className="py-6 flex flex-row gap-3 items-center">
          <Image
            src={img}
            alt={title}
            width={60}
            height={60}
            objectFit="cover"
            objectPosition="center"
            className="rounded-full"
          />
          <div className="flex-1 flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
          </div>
          <BoothUpdate index={index} name={title} slug={slug} image={img} />
          <BoothDelete index={index} />
        </CardContent>
      </Card>
    </li>
  );
}
