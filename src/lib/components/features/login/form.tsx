"use client";

import { useCookies } from "next-client-cookies";
import { signInWithEmailAndPassword } from "firebase/auth";
import { get, child, ref } from "firebase/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { loginFormSchema } from "~/lib/schema/login.schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { useState } from "react";
import { auth, db } from "~/lib/api/firebase";
import { useToast } from "../../ui/use-toast";
import { useRouter } from "next/navigation";
import { ToastAction } from "../../ui/toast";
import { fetchLog } from "~/lib/api/log";

export default function LoginForm() {
  const router = useRouter();
  const cookies = useCookies();
  const { toast } = useToast();

  const [isLoading, setLoading] = useState<boolean>();

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    try {
      if (!isLoading) {
        setLoading(true);
        const password = values.password.replaceAll(" ", "");
        const userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          password,
        );
        fetchLog({ state: "login", ...values });
        if (userCredential.user) {
          console.log("Login successful:", userCredential.user);
          const user = await get(
            child(ref(db), `account/${userCredential.user.uid}`),
          );
          console.log("User data:", user.val());
          if (user.val().type === "judge") {
            const boothSlug = user.val().booth as string;
            cookies.set("booth", boothSlug);
            const booths = await get(child(ref(db), "booth"));
            const booth = (booths.val() as any[]).filter(
              (item) => item.slug === boothSlug,
            );
            if (booth.length > 0) {
              cookies.set("boothType", booth[0].type);
            }
          }
          cookies.set("role", user.val().type as string);
          if (user.val().index !== undefined) {
            cookies.set("indexUser", user.val().index);
          }
          cookies.set("uid", userCredential.user.uid);

          setLoading(false);
          toast({
            variant: "success",
            title: "Success",
            description: "Login successfully",
          });
          router.replace(`/${user.val().type as string}`);
        } else {
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Uh oh! Login failed. asd",
            description: "Please check your email and password again.",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Uh oh! Login failed. 123",
        description: "Please check your email and password again.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        aria-label="form-login"
        className="flex flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="example@gmail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="*********" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button variant={isLoading ? "secondary" : "default"} className="my-4">
          {isLoading ? "Loading..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}
