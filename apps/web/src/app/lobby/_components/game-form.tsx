"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { gameSchema } from "@/lib/schemas";
import { createGame } from "@/server/db/queries";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

export function GameForm() {
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.infer<typeof gameSchema>>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      name: "",
      maxPlayers: 2,
    },
  });

  async function onSubmit(values: z.infer<typeof gameSchema>) {
    try {
      await createGame(values);
      form.reset();
      form.clearErrors();
      setOpen(false);
    } catch {
      // lol skill issues
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Game</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Game</DialogTitle>
          <DialogDescription>
            Create a new game to play with your friends.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="family game night" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name of the game that will be displayed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPlayers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Players</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : 0,
                        )
                      }
                      min="2"
                      max="10"
                      type="number"
                    />
                  </FormControl>
                  <FormDescription>
                    The maximum number of players that can join the game.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
