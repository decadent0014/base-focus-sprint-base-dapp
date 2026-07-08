"use client";

import {
  AlarmClock,
  Flame,
  Loader2,
  Search,
  TimerReset,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  focusSprintAbi,
  focusSprintContractAddress,
  MAX_SPRINT_NOTE_LENGTH,
  MAX_SPRINT_TASK_LENGTH,
  MAX_SPRINT_MINUTES,
  MIN_SPRINT_MINUTES,
} from "@/lib/focus-sprint";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const PRESET_MINUTES = [15, 25, 45, 60];

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function dateLabel(createdAt?: bigint) {
  if (!createdAt) return "--";
  return new Date(Number(createdAt) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FocusSprintApp() {
  const [sprintIdInput, setSprintIdInput] = useState("1");
  const [task, setTask] = useState("Ship the mobile connect flow");
  const [minutes, setMinutes] = useState(25);
  const [note, setNote] = useState(
    "Tighten the first screen, reduce clutter, and make the wallet action obvious in one glance.",
  );
  const [status, setStatus] = useState(
    "Log one focused work sprint on Base so the session has a public start point.",
  );
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }
  const parsedSprintId = BigInt(Math.max(1, Number(sprintIdInput || "1")));

  const sprintQuery = useReadContract({
    abi: focusSprintAbi,
    address: focusSprintContractAddress,
    functionName: "getSprint",
    args: [parsedSprintId],
    query: {
      enabled: Boolean(focusSprintContractAddress),
      refetchInterval: 12000,
    },
  });

  const totalQuery = useReadContract({
    abi: focusSprintAbi,
    address: focusSprintContractAddress,
    functionName: "nextSprintId",
    query: {
      enabled: Boolean(focusSprintContractAddress),
      refetchInterval: 12000,
    },
  });

  const sprintTuple = sprintQuery.data as
    | readonly [Address, string, bigint, string, bigint]
    | undefined;

  const sprint = useMemo(
    () =>
      sprintTuple
        ? {
            author: sprintTuple[0],
            task: sprintTuple[1],
            durationMinutes: sprintTuple[2],
            note: sprintTuple[3],
            createdAt: sprintTuple[4],
          }
        : undefined,
    [sprintTuple],
  );

  const totalLogged = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const canLog =
    Boolean(focusSprintContractAddress) &&
    isConnected &&
    chainId === base.id &&
    task.trim().length > 0 &&
    task.trim().length <= MAX_SPRINT_TASK_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_SPRINT_NOTE_LENGTH &&
    minutes >= MIN_SPRINT_MINUTES &&
    minutes <= MAX_SPRINT_MINUTES;

  const statusText = confirmed
    ? "Sprint confirmed on Base."
    : writeError
      ? writeError.message
      : status;

  function logSprint() {
    if (!focusSprintContractAddress) return;
    setStatus("Confirm the focus sprint in your wallet.");
    writeContract({
      address: focusSprintContractAddress,
      abi: focusSprintAbi,
      functionName: "logSprint",
      args: [task.trim(), BigInt(minutes), note.trim()],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen bg-[#f6eadc] text-[#351d17]">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffd6ab_0%,#f6eadc_32%,#f3ddc8_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between border-b border-[#351d17]/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-[#351d17]/15 bg-white/75 shadow-[0_18px_35px_rgba(107,57,32,0.12)]">
                <AlarmClock className="h-5 w-5 text-[#cf6231]" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#b14f28]">
                  Base Focus Sprint
                </p>
                <h1 className="text-xl font-black sm:text-2xl">
                  Start one sprint. Finish one thing.
                </h1>
              </div>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[#351d17]/10 bg-white/80 px-3 py-2 text-sm font-semibold">
                  {shortAddress(address)}
                </span>
                <button
                  className="rounded-full border border-[#351d17]/10 bg-[#351d17] px-4 py-2 text-sm font-semibold text-white"
                  onClick={disconnectWallet}
                >{disconnecting ? "Disconnecting" : "Disconnect"}</button>
              </div>
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[#351d17]/10 bg-[#351d17] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={availableConnectors.length === 0 || connecting}
                onClick={connectWallet}
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Connect
              </button>
            )}
          {walletStatus ? (
            <p className="w-full text-right text-xs font-semibold opacity-75">
              {walletStatus}
            </p>
          ) : null}
        </header>

          <div className="grid flex-1 gap-4 py-4 xl:grid-cols-[430px_minmax(0,1fr)]">
            <aside className="order-1 flex flex-col gap-4">
              <section className="rounded-[30px] border border-[#351d17]/10 bg-[linear-gradient(180deg,#fff8f1_0%,#fff1e4_100%)] p-5 shadow-[0_30px_80px_rgba(109,60,33,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#ffe0c3] text-[#cf6231]">
                    <TimerReset className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">New sprint</h3>
                    <p className="text-sm text-[#7a5a4d]">
                      Put one focused session onchain.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b14f28]">
                      Task
                    </span>
                    <input
                      value={task}
                      onChange={(event) => setTask(event.target.value)}
                      maxLength={MAX_SPRINT_TASK_LENGTH}
                      className="mt-2 w-full rounded-[18px] border border-[#351d17]/10 bg-white px-4 py-3 text-base font-semibold text-[#351d17] outline-none placeholder:text-[#a68c81]"
                      placeholder="Ship the mobile connect flow"
                    />
                  </label>

                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b14f28]">
                      Minutes
                    </span>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {PRESET_MINUTES.map((value) => {
                        const active = minutes === value;
                        return (
                          <button
                            key={value}
                            className={`rounded-[18px] border px-3 py-3 text-sm font-semibold ${
                              active
                                ? "border-[#cf6231] bg-[#cf6231] text-white"
                                : "border-[#351d17]/10 bg-white text-[#351d17]"
                            }`}
                            onClick={() => setMinutes(value)}
                          >
                            {value}m
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b14f28]">
                      Note
                    </span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      maxLength={MAX_SPRINT_NOTE_LENGTH}
                      rows={5}
                      className="mt-2 w-full rounded-[18px] border border-[#351d17]/10 bg-white px-4 py-3 text-base leading-7 text-[#351d17] outline-none placeholder:text-[#a68c81]"
                      placeholder="Describe the focus of this sprint."
                    />
                  </label>

                  {!isConnected ? (
                    <button
                      className="w-full rounded-[20px] bg-[#351d17] px-4 py-3 text-base font-semibold text-white"
                      onClick={connectWallet}
                    >
                      Connect wallet
                    </button>
                  ) : chainId !== base.id ? (
                    <button
                      className="w-full rounded-[20px] bg-[#cf6231] px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
                      disabled={switching}
                      onClick={() => switchChain({ chainId: base.id })}
                    >
                      {switching ? "Switching..." : "Switch to Base"}
                    </button>
                  ) : (
                    <button
                      className="w-full rounded-[20px] bg-[#cf6231] px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
                      disabled={!canLog || writing || confirming}
                      onClick={logSprint}
                    >
                      {writing || confirming ? "Logging..." : "Log sprint on Base"}
                    </button>
                  )}

                  <p className="text-sm leading-6 text-[#7a5a4d]">{statusText}</p>
                </div>
              </section>

              <section className="rounded-[30px] border border-[#351d17]/10 bg-[linear-gradient(180deg,#fff8f1_0%,#fff4ea_100%)] p-5 shadow-[0_30px_80px_rgba(109,60,33,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#ffe0c3] text-[#cf6231]">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">Lookup sprint</h3>
                    <p className="text-sm text-[#7a5a4d]">
                      Pull one sprint by ID.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b14f28]">
                      Sprint ID
                    </span>
                    <input
                      value={sprintIdInput}
                      onChange={(event) => setSprintIdInput(event.target.value)}
                      inputMode="numeric"
                      className="mt-2 w-full rounded-[18px] border border-[#351d17]/10 bg-white px-4 py-3 text-base font-semibold text-[#351d17] outline-none"
                    />
                  </label>

                  <div className="rounded-[24px] border border-[#351d17]/10 bg-white p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b14f28]">
                      Current sprint
                    </p>
                    <p className="mt-3 text-lg font-semibold">
                      {sprint?.task || "Waiting for first sprint"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#7a5a4d]">
                      {sprint?.note ||
                        "Once a sprint exists onchain, this panel shows the task, duration, and author."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[20px] border border-[#351d17]/10 bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b14f28]">
                        Minutes
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        {sprint?.durationMinutes ? `${sprint.durationMinutes.toString()}m` : "--"}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-[#351d17]/10 bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b14f28]">
                        Date
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        {dateLabel(sprint?.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </aside>

            <section className="order-2 rounded-[34px] border border-[#351d17]/10 bg-[linear-gradient(180deg,#fff7ef_0%,#fff1e4_100%)] p-5 shadow-[0_30px_80px_rgba(109,60,33,0.12)]">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#351d17]/10 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b14f28]">
                    <Flame className="h-3.5 w-3.5" />
                    Focus session log
                  </p>
                  <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl xl:text-6xl">
                    A timer-style sprint board for focused work, quick starts, and visible follow-through.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-[#7a5a4d] sm:text-lg">
                    Pick one task, commit to a short session, and stamp the sprint on Base so
                    there is a public record of what you focused on.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[28px] border border-[#351d17]/10 bg-white p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b14f28]">
                      Total sprints
                    </p>
                    <p className="mt-3 text-5xl font-black">{totalLogged || "00"}</p>
                    <p className="mt-2 text-sm text-[#7a5a4d]">Logged on Base</p>
                  </div>
                  <div className="rounded-[28px] border border-[#351d17]/10 bg-white p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b14f28]">
                      Current session
                    </p>
                    <p className="mt-3 text-3xl font-black">{minutes}m</p>
                    <p className="mt-2 text-sm text-[#7a5a4d]">Short enough to start now</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
                <div className="flex items-center justify-center rounded-[34px] border border-[#351d17]/10 bg-white p-6">
                  <div className="relative flex h-[320px] w-[320px] items-center justify-center rounded-full bg-[radial-gradient(circle,#fff4ea_0%,#ffe8d4_60%,#ffd3ae_100%)]">
                    <div className="absolute inset-[18px] rounded-full border-[18px] border-[#f1b07a]" />
                    <div className="absolute inset-[58px] rounded-full border-[14px] border-[#cf6231]" />
                    <div className="text-center">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b14f28]">
                        Focus sprint
                      </p>
                      <p className="mt-3 text-7xl font-black">{minutes}</p>
                      <p className="text-lg font-semibold text-[#7a5a4d]">minutes</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[28px] border border-[#351d17]/10 bg-white p-5">
                    <div className="flex items-start justify-between gap-3 border-b border-[#351d17]/10 pb-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b14f28]">
                          Latest sprint
                        </p>
                        <h3 className="mt-2 text-3xl font-black">
                          {sprint?.task || "Ship the mobile connect flow"}
                        </h3>
                      </div>
                      <div className="rounded-full border border-[#351d17]/10 bg-[#fff6ed] px-3 py-2 text-sm font-semibold">
                        {sprint?.durationMinutes ? `${sprint.durationMinutes.toString()}m` : `${minutes}m`}
                      </div>
                    </div>

                    <div className="grid gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_250px]">
                      <div className="rounded-[22px] border border-[#351d17]/10 bg-[#fffaf5] p-4">
                        <p className="text-sm leading-7 text-[#4f352c]">
                          {sprint?.note ||
                            "Tighten the first screen, reduce clutter, and make the wallet action obvious in one glance."}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-[20px] border border-[#351d17]/10 bg-[#fffaf5] p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b14f28]">
                            Author
                          </p>
                          <p className="mt-2 text-sm font-semibold">
                            {sprint?.author && sprint.author !== ZERO_ADDRESS
                              ? shortAddress(sprint.author)
                              : "--"}
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-[#351d17]/10 bg-[#fffaf5] p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b14f28]">
                            Date
                          </p>
                          <p className="mt-2 text-sm font-semibold">
                            {dateLabel(sprint?.createdAt)}
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-[#351d17]/10 bg-[#fffaf5] p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b14f28]">
                            Status
                          </p>
                          <p className="mt-2 text-sm font-semibold">Stored on Base</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ["1", "Pick one task", "Narrow enough to finish"],
                      ["2", "Choose the clock", "15m to 60m, no drift"],
                      ["3", "Stamp the sprint", "Public focus log on Base"],
                    ].map(([step, label, sub]) => (
                      <div
                        key={step}
                        className="rounded-[24px] border border-[#351d17]/10 bg-white p-4"
                      >
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#b14f28]">
                          Step {step}
                        </p>
                        <p className="mt-2 text-lg font-semibold">{label}</p>
                        <p className="mt-1 text-sm text-[#7a5a4d]">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
