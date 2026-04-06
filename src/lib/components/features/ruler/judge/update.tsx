"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DialogClose } from "@radix-ui/react-dialog";
import { onValue, ref, set } from "firebase/database";
import { PencilIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { db } from "~/lib/api/firebase";
import { Button } from "~/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/lib/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/lib/components/ui/form";
import { Input } from "~/lib/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/lib/components/ui/select";
import { useToast } from "~/lib/components/ui/use-toast";
import { judgeUpdateFormSchema } from "~/lib/schema/judge.schema";

interface IBooth {
  name: string;
  slug: string;
}

interface IProps {
  uid: string;
  name: string;
  booth?: string;
}

export default function JudgeUpdate({ uid, name, booth }: IProps) {
  const { toast } = useToast();

  const dialogCLoseRef = useRef<HTMLButtonElement>(null);
  const [booths, setBooths] = useState<IBooth[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof judgeUpdateFormSchema>>({
    resolver: zodResolver(judgeUpdateFormSchema),
    defaultValues: {
      name,
      booth,
    },
  });

  async function onSubmit(values: z.infer<typeof judgeUpdateFormSchema>) {
    if (!isLoading) {
      setLoading(true);
      set(ref(db, `account/${uid}`), {
        booth: values.booth,
        name: values.name,
        type: "judge",
      });
      form.reset();
      toast({
        variant: "success",
        title: "Success",
        description: "Update judge account successfully",
      });

      setLoading(false);
      dialogCLoseRef.current?.click();
    }
  }

  useEffect(() => {
    const boothRef = ref(db, "booth");
    const unsubscribe = onValue(boothRef, (snapshot) => {
      setBooths(snapshot.val() as IBooth[]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Dialog>
      <DialogTrigger aria-label="EditButton">
        <PencilIcon className="text-primary" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Update Judge</DialogTitle>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: odegaard" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="booth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booth</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {booths?.map(({ name, slug }) => (
                            <SelectItem key={slug} value={slug}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="mt-2"
                variant="default"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Save"}
              </Button>
              <DialogClose ref={dialogCLoseRef} />
            </form>
          </Form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
