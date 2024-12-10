"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Color = "red" | "green" | "blue" | "yellow";

export function ColorPickerDialog({
  open,
  onColorSelectAction,
  onOpenChange,
}: {
  open: boolean;
  onColorSelectAction: (color: Color) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} modal onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a color</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Button
            className={cn(
              "bg-red-700 hover:bg-red-800",
              "border-none text-white",
              "h-20 text-xl font-bold",
            )}
            variant="ghost"
            onClick={() => onColorSelectAction("red")}
          >
            Red
          </Button>
          <Button
            className={cn(
              "bg-green-700 hover:bg-green-800",
              "border-none text-white",
              "h-20 text-xl font-bold",
            )}
            variant="ghost"
            onClick={() => onColorSelectAction("green")}
          >
            Green
          </Button>
          <Button
            className={cn(
              "bg-blue-700 hover:bg-blue-800",
              "border-none text-white",
              "h-20 text-xl font-bold",
            )}
            variant="ghost"
            onClick={() => onColorSelectAction("blue")}
          >
            Blue
          </Button>
          <Button
            className={cn(
              "bg-yellow-600 hover:bg-yellow-700",
              "border-none text-white",
              "h-20 text-xl font-bold",
            )}
            variant="ghost"
            onClick={() => onColorSelectAction("yellow")}
          >
            Yellow
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
