import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DateRangePreset = "all" | "12m" | "6m" | "3m" | "1m" | "custom";

interface DateRangeFilterProps {
  onRangeChange: (range: DateRangePreset, dates?: { from: Date; to: Date }) => void;
}

export const DateRangeFilter = ({ onRangeChange }: DateRangeFilterProps) => {
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [date, setDate] = useState<{ from: Date; to: Date } | undefined>();

  const handlePresetChange = (value: DateRangePreset) => {
    setPreset(value);
    if (value === "all") {
      onRangeChange("all");
    } else if (value === "12m") {
      const to = new Date();
      const from = subMonths(to, 12);
      onRangeChange("12m", { from, to });
    } else if (value === "6m") {
      const to = new Date();
      const from = subMonths(to, 6);
      onRangeChange("6m", { from, to });
    } else if (value === "3m") {
      const to = new Date();
      const from = subMonths(to, 3);
      onRangeChange("3m", { from, to });
    } else if (value === "1m") {
      const to = new Date();
      const from = subMonths(to, 1);
      onRangeChange("1m", { from, to });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="w-[200px]">
        <Select value={preset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el tiempo</SelectItem>
            <SelectItem value="12m">Últimos 12 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="1m">Último mes</SelectItem>
            <SelectItem value="custom">Rango personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                      {format(date.to, "LLL dd, y", { locale: es })}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y", { locale: es })
                  )
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={{ from: date?.from, to: date?.to } as any}
                onSelect={(range: any) => {
                  setDate(range);
                  if (range?.from && range?.to) {
                    onRangeChange("custom", { from: range.from, to: range.to });
                  }
                }}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};
