import React from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button, Group, Input, Label, NumberField } from "react-aria-components";

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}

export function NumberInput({ value, onChange, min = 1, max = 60 }: NumberInputProps) {
  return (
    <NumberField
      value={value ? Number(value) : undefined}
      onChange={val => onChange(val?.toString() || '')}
      minValue={min}
      maxValue={max}
    >
      <Group className="relative inline-flex h-9 w-full items-center overflow-hidden whitespace-nowrap rounded-lg border border-gray-300 dark:border-gray-600 text-sm shadow-sm ring-offset-background transition-shadow data-[focus-within]:border-purple-500 data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-2 data-[focus-within]:ring-purple-500/30 data-[focus-within]:ring-offset-2">
        <Input 
          className="flex-1 bg-white dark:bg-gray-700 px-3 py-2 tabular-nums text-gray-900 dark:text-white focus:outline-none" 
        />
        <span className="text-gray-500 dark:text-gray-400 mr-2">min</span>
        <div className="flex h-[calc(100%+2px)] flex-col border-l border-gray-300 dark:border-gray-600">
          <Button
            slot="increment"
            className="flex h-1/2 w-6 flex-1 items-center justify-center bg-white dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronUp size={12} strokeWidth={2} aria-hidden="true" />
          </Button>
          <Button
            slot="decrement"
            className="flex h-1/2 w-6 flex-1 items-center justify-center border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </Group>
    </NumberField>
  );
}