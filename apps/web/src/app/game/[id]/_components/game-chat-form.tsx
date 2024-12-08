"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useGameChat } from "@/hooks/use-game-chat";
import { chatSchema } from "@/lib/schemas";
import { createGameChat } from "@/server/db/queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";

export function GameChatForm({
  currentUser,
  gameId,
}: {
  currentUser: {
    id: number;
    name: string;
    username: string;
  };
  gameId: string;
}) {
  const { sendChat } = useGameChat(gameId);

  const form = useForm<z.infer<typeof chatSchema>>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof chatSchema>) {
    try {
      await createGameChat({ ...values, gameId: parseInt(gameId) });
      sendChat({
        name: currentUser.name,
        message: values.message,
        sentAt: new Date().toISOString(),
      });
      form.reset();
      form.clearErrors();
    } catch {
      toast.error("Failed to send message");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full items-center space-x-2"
      >
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  id="message"
                  placeholder="Type your message..."
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button size="icon" variant="ghost" type="submit">
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </Form>
  );
}
