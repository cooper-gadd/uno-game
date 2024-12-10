"use client";

import { cn } from "@/lib/utils";
import { type Card } from "@/server/db/schema";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { playCard } from "../actions";
import { ColorPickerDialog } from "./color-picker-dialog";
import { UnoCard } from "./uno-card";

type Color = "red" | "green" | "blue" | "yellow";

const STORAGE_KEY = (cardId: number) => `wild_card_needs_color_${cardId}`;

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
  const [needsColor, setNeedsColor] = useState(false);
  const isPlayerTurn = currentTurn === userId;

  useEffect(() => {
    const storedNeedsColor = localStorage.getItem(STORAGE_KEY(card.id));
    if (storedNeedsColor === "true" && isPlayerTurn) {
      setNeedsColor(true);
      setShowColorPicker(true);
    }
  }, [card.id, isPlayerTurn]);

  useEffect(() => {
    if (needsColor) {
      localStorage.setItem(STORAGE_KEY(card.id), "true");
    } else {
      localStorage.removeItem(STORAGE_KEY(card.id));
    }
  }, [needsColor, card.id]);

  useEffect(() => {
    return () => {
      if (!isPlayerTurn) {
        localStorage.removeItem(STORAGE_KEY(card.id));
      }
    };
  }, [card.id, isPlayerTurn]);

  const handlePlay = async (selectedColor?: Color) => {
    if (!isPlayerTurn) return;

    try {
      if (
        (card.color === "wild" || card.type === "wild_draw_four") &&
        !selectedColor
      ) {
        setShowColorPicker(true);
        setNeedsColor(true);
        return;
      }

      await playCard({
        gameId,
        playerId,
        cardId: card.id,
        selectedColor,
      });

      setNeedsColor(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleColorSelect = async (color: Color) => {
    setShowColorPicker(false);
    setNeedsColor(false);
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
        onOpenChange={(open) => {
          setShowColorPicker(open);
          if (!open && needsColor) {
            setShowColorPicker(true);
          }
        }}
      />
    </>
  );
}
