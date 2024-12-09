"use client";

import { cn } from "@/lib/utils";
import { type Card } from "@/server/db/schema";
import { useState } from "react";
import { toast } from "sonner";
import { playCard } from "../actions";
import { ColorPickerDialog } from "./color-picker-dialog";
import { UnoCard } from "./uno-card";

type Color = "red" | "green" | "blue" | "yellow";

export function Play({
  gameId,
  playerId,
  card,
  currentTurn,
  userId,
}: {
  gameId: number;
  playerId: number;
  card: Card;
  currentTurn: number;
  userId: number;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isPlayerTurn = currentTurn === userId;

  const handlePlay = async (selectedColor?: Color) => {
    if (!isPlayerTurn) return;

    try {
      if (
        (card.color === "wild" || card.type === "wild_draw_four") &&
        !selectedColor
      ) {
        setShowColorPicker(true);
        return;
      }

      await playCard({
        gameId,
        playerId,
        cardId: card.id,
        selectedColor,
      });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleColorSelect = async (color: Color) => {
    setShowColorPicker(false);
    await handlePlay(color);
  };

  return (
    <>
      <div
        onClick={() => handlePlay()}
        className={cn(
          "transition-all",
          isPlayerTurn
            ? "cursor-pointer hover:scale-105"
            : "cursor-not-allowed opacity-50",
        )}
      >
        <UnoCard card={card} />
      </div>

      <ColorPickerDialog
        open={showColorPicker}
        onColorSelectAction={handleColorSelect}
      />
    </>
  );
}
