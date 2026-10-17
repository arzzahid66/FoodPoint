"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  ReceiptText,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { logout } from "@/server/actions/admin";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, ownerOnly: true },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText, ownerOnly: false },
  { href: "/admin/products", label: "Products", icon: Package, ownerOnly: true },
  { href: "/admin/categories", label: "Categories", icon: Tags, ownerOnly: true },
  { href: "/admin/tables", label: "Tables & QR", icon: QrCode, ownerOnly: true },
  { href: "/admin/staff", label: "Staff", icon: Users, ownerOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, ownerOnly: true },
];

export function AdminNav({ role, name, shopName }: { role: Role; name: string; shopName: string }) {
  const pathname = usePathname();
  const pending = useNewOrderAlerts();
  const links = LINKS.filter((l) => role === "OWNER" || !l.ownerOnly);

  return (
    <aside className="border-b border-zinc-200 bg-white md:fixed md:inset-y-0 md:left-0 md:w-60 md:border-b-0 md:border-r print:hidden">
      <div className="flex h-14 items-center justify-between px-4 md:h-16">
        <Link href="/admin" className="truncate text-lg font-extrabold text-zinc-900">
          {shopName} <span className="text-brand">Admin</span>
        </Link>
        <form action={logout} className="md:hidden">
          <button className="cursor-pointer rounded-md p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                active ? "bg-brand-soft text-brand-dark" : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {href === "/admin/orders" && pending > 0 && (
                <span className="ml-auto rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{pending}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="hidden px-3 md:absolute md:inset-x-0 md:bottom-0 md:block md:pb-4">
        <SoundToggle />
        <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-800">{name}</p>
            <p className="text-xs text-zinc-500">{role === "OWNER" ? "Owner" : "Staff"}</p>
          </div>
          <form action={logout}>
            <button className="cursor-pointer rounded-md p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

// ── New order polling + sound ────────────────────────────────

const SOUND_KEY = "fp_admin_sound";
let audioCtx: AudioContext | null = null;

function soundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    // Web Audio not available
  }
}

function playChime() {
  if (!audioCtx || !soundEnabled()) return;
  const now = audioCtx.currentTime;
  [880, 1175, 880].forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.18 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.17);
  });
}

/** Polls for pending orders; plays a chime and refreshes the page when a new one arrives. */
function useNewOrderAlerts() {
  const router = useRouter();
  const [pending, setPending] = React.useState(0);
  const lastId = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    // Browsers only allow audio after a user gesture.
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    let stopped = false;

    async function poll() {
      try {
        const res = await fetch("/api/orders/poll", { cache: "no-store" });
        if (!res.ok) return;
        const data: { pending: number; latestPendingId: string | null } = await res.json();
        if (stopped) return;
        setPending(data.pending);
        if (lastId.current !== undefined && data.latestPendingId && data.latestPendingId !== lastId.current) {
          playChime();
          toast.info("New order received!");
          router.refresh();
        }
        lastId.current = data.latestPendingId;
      } catch {
        // network blip: try again next tick
      }
    }

    void poll();
    const id = setInterval(poll, 7000);
    return () => {
      stopped = true;
      clearInterval(id);
      window.removeEventListener("pointerdown", unlockAudio);
    };
  }, [router]);

  return pending;
}

function SoundToggle() {
  const [on, setOn] = React.useState(true);
  React.useEffect(() => setOn(soundEnabled()), []);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setOn(next);
        try {
          localStorage.setItem(SOUND_KEY, next ? "on" : "off");
        } catch {
          // ignore
        }
        unlockAudio();
        if (next) playChime();
      }}
      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
    >
      {on ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      New order sound: {on ? "On" : "Off"}
    </button>
  );
}
