import type { SystemStatus } from "@/lib/api";

type StatusWidgetProps = {
  systemStatus: SystemStatus | null;
};

export function StatusWidget({ systemStatus }: StatusWidgetProps) {
  const isConnected = systemStatus?.database?.includes("Connected");

  return (
    <div className="p-4 m-4 bg-lumen-teal-light rounded-lg border border-lumen-teal/20">
      <p className="text-xs text-lumen-teal/70 mb-1 font-medium uppercase tracking-wide">
        System Status
      </p>
      <div className="flex items-center space-x-2 text-sm font-medium">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
              : "bg-red-400"
          }`}
        />
        <span className="text-foreground/80 truncate">
          {systemStatus?.database || "Connecting..."}
        </span>
      </div>
    </div>
  );
}
