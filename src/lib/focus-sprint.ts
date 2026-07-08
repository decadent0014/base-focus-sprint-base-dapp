import type { Address } from "viem";

export const MIN_SPRINT_MINUTES = 5;
export const MAX_SPRINT_MINUTES = 180;
export const MAX_SPRINT_TASK_LENGTH = 56;
export const MAX_SPRINT_NOTE_LENGTH = 180;

export const focusSprintAbi = [
  {
    type: "function",
    name: "logSprint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "task", type: "string" },
      { name: "durationMinutes", type: "uint256" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "sprintId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getSprint",
    stateMutability: "view",
    inputs: [{ name: "sprintId", type: "uint256" }],
    outputs: [
      { name: "author", type: "address" },
      { name: "task", type: "string" },
      { name: "durationMinutes", type: "uint256" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextSprintId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export type FocusSprintData = {
  author: Address;
  task: string;
  durationMinutes: bigint;
  note: string;
  createdAt: bigint;
};

export const focusSprintContractAddress = process.env
  .NEXT_PUBLIC_FOCUS_SPRINT_CONTRACT_ADDRESS as Address | undefined;
