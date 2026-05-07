import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  BarChart3,
  BrainCircuit,
  Boxes,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
  Layers3,
  Network,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";

const sections = [
  "Introduction",
  "Jeu de données",
  "Règles d’association",
  "Clustering",
  "Interprétation",
  "Cartes mémo",
  "Conclusion",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    if (row.length === 1 && row[0] === "" && rows.length === 0) return;
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      pushField();
      continue;
    }
    if (char === "\n") {
      pushField();
      pushRow();
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }

  pushField();
  if (row.length > 1 || row[0] !== "") pushRow();

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => {
    const obj = {};
    headers.forEach((key, idx) => {
      obj[key] = values[idx] ?? "";
    });
    return obj;
  });
}

function toNumber(value) {
  if (value == null) return null;
  const cleaned = String(value).trim();
  if (cleaned === "") return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function formatRuleSide(text) {
  if (!text) return "";
  return String(text)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" + ");
}

function formatCompact(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("fr-FR").format(num);
}

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(num);
}
function formatSeconds(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${num.toFixed(4)} s`;
}

function formatScore(value, digits = 3) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toFixed(digits);
}

function scaledDuration(value, allValues, min = 2600, max = 6200) {
  const num = Number(value);
  const validValues = allValues.filter((v) => Number.isFinite(Number(v)) && Number(v) > 0);
  const maxValue = Math.max(...validValues, 0);

  if (!Number.isFinite(num) || num <= 0 || maxValue <= 0) return 4200;

  return Math.round(min + (num / maxValue) * (max - min));
}
const clusteringValidation = {
  bestK: 3,
  silhouetteScore: 0.411945,
  silhouetteReading:
    "Score modéré mais exploitable : les groupes existent, sans être parfaitement séparés, ce qui est normal sur des données clients réelles.",
};

// Frames are generated from the real CSV outputs (see ClusteringSection).

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const accents = {
  cyan: {
    ring: "ring-cyan-300/20",
    badge: "bg-cyan-300/10 text-cyan-100 border-cyan-300/20",
    softBg: "bg-cyan-300/10",
    softText: "text-cyan-100",
    icon: "text-cyan-200",
    bar: "bg-cyan-300",
    button: "bg-white text-slate-950 hover:bg-cyan-100",
  },
  violet: {
    ring: "ring-violet-300/20",
    badge: "bg-violet-300/10 text-violet-100 border-violet-300/20",
    softBg: "bg-violet-300/10",
    softText: "text-violet-100",
    icon: "text-violet-200",
    bar: "bg-violet-300",
    button: "bg-white text-slate-950 hover:bg-violet-100",
  },
  emerald: {
    ring: "ring-emerald-300/20",
    badge: "bg-emerald-300/10 text-emerald-100 border-emerald-300/20",
    softBg: "bg-emerald-300/10",
    softText: "text-emerald-100",
    icon: "text-emerald-200",
    bar: "bg-emerald-300",
    button: "bg-white text-slate-950 hover:bg-emerald-100",
  },
  amber: {
    ring: "ring-amber-300/20",
    badge: "bg-amber-300/10 text-amber-100 border-amber-300/20",
    softBg: "bg-amber-300/10",
    softText: "text-amber-100",
    icon: "text-amber-200",
    bar: "bg-amber-300",
    button: "bg-white text-slate-950 hover:bg-amber-100",
  },
};

function GlassCard({ children, className = "" }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className={`rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
        </div>
        <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassCard>
  );
}

function ProgressSteps({ steps, activeStep }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isDone = index < activeStep;
        const isActive = index === activeStep;
        const stepLabel = typeof step === "string" ? step : step.label;
        return (
          <motion.div
            key={stepLabel}
            animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
            className="flex items-center gap-3"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                isDone
                  ? "border-emerald-300 bg-emerald-300/20 text-emerald-200"
                  : isActive
                    ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-500"
              }`}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span className={isActive ? "text-white" : "text-slate-400"}>{stepLabel}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function AlgorithmRunner({
  title,
  subtitle,
  icon: Icon,
  steps,
  rules,
  accent = "cyan",
  duration = 4200,
  metaChips = [],
}) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState([]);
  const timeoutRef = useRef([]);
  const accentTheme = accents[accent] ?? accents.cyan;

  const stopTimers = () => {
    timeoutRef.current.forEach((id) => clearTimeout(id));
    timeoutRef.current = [];
  };

  useEffect(() => {
    return () => stopTimers();
  }, []);

  const start = () => {
    stopTimers();
    setRunning(true);
    setComplete(false);
    setStep(0);
    setLogs([]);
    const interval = Math.max(420, Math.round(duration / Math.max(steps.length, 1)));
    const normalizedSteps = steps.map((s) =>
      typeof s === "string" ? { label: s, detail: s } : { label: s.label, detail: s.detail ?? s.label, revealCount: s.revealCount }
    );

    normalizedSteps.forEach((s, index) => {
      const id = setTimeout(() => {
        setStep(index);
        setLogs((prev) => [
          ...prev,
          {
            id: `${title}-${index}-${Date.now()}`,
            label: s.label,
            detail: s.detail,
          },
        ]);
      }, index * interval);
      timeoutRef.current.push(id);
    });

    const id = setTimeout(() => {
      setStep(normalizedSteps.length);
      setComplete(true);
      setRunning(false);
      setLogs((prev) => [
        ...prev,
        {
          id: `${title}-done-${Date.now()}`,
          label: "Terminé",
          detail: "Les règles les plus significatives sont maintenant prêtes à être interprétées.",
        },
      ]);
    }, normalizedSteps.length * interval + 220);
    timeoutRef.current.push(id);
  };

  const progress = steps.length === 0 ? 0 : Math.min(100, Math.round((step / steps.length) * 100));
  const normalizedSteps = steps.map((s) => (typeof s === "string" ? { label: s, detail: s } : s));
  const revealCountFromStep =
    normalizedSteps[Math.min(step, Math.max(normalizedSteps.length - 1, 0))]?.revealCount ?? null;
  const revealedCount =
    complete ? rules.length : revealCountFromStep != null ? revealCountFromStep : Math.max(0, Math.min(rules.length, Math.floor((step / steps.length) * rules.length)));
  const revealedRules = rules.slice(0, revealedCount);

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className={`mb-4 inline-flex rounded-2xl ${accentTheme.softBg} p-3 ${accentTheme.icon}`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{subtitle}</p>
          {metaChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {metaChips.map((chip) => (
                <span key={chip} className={`rounded-full border px-3 py-1 text-xs ${accentTheme.badge}`}>
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={start}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-medium transition hover:scale-[1.02] ${accentTheme.button}`}
        >
          {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Exécution..." : complete ? "Relancer" : "Lancer"}
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-slate-300">Étapes de l’algorithme</span>
            <span className={accentTheme.icon}>{progress}%</span>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              className={`h-full rounded-full ${accentTheme.bar}`}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-1">
            <ProgressSteps steps={steps} activeStep={step} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span>Suivi de l’analyse</span>
                <span className="tabular-nums">{running ? "LIVE" : complete ? "DONE" : "IDLE"}</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {logs.slice(-4).map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-medium text-white">{log.label}</p>
                        <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${running ? accentTheme.bar : "bg-white/20"}`} />
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400">{log.detail}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {logs.length === 0 && (
                  <p className="text-xs text-slate-500"> Cliquez sur “Lancer” pour parcourir les étapes de l’analyse.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
            <Sparkles className={`h-4 w-4 ${accentTheme.icon}`} />
            Aperçu des règles obtenues ({revealedRules.length}/{rules.length})
          </div>
          <AnimatePresence>
            {revealedRules.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {revealedRules.map((rule, index) => (
                  <motion.div
                    key={`${rule.antecedent}-${rule.consequent}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl bg-white/[0.05] p-4"
                  >
                    <p className="text-sm text-slate-300">
                      <span className="text-white">{rule.antecedent}</span>
                      <span className={`mx-2 ${accentTheme.icon}`}>→</span>
                      <span className="text-white">{rule.consequent}</span>
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <span className="rounded-xl bg-white/5 px-3 py-2 text-slate-300">
                        Support:{" "}
                        {typeof rule.support === "number" ? `${(rule.support * 100).toFixed(2)}%` : "—"}
                      </span>
                      <span className="rounded-xl bg-white/5 px-3 py-2 text-slate-300">
                        Confidence:{" "}
                        {typeof rule.confidence === "number" ? `${(rule.confidence * 100).toFixed(2)}%` : "—"}
                      </span>
                      <span className={`rounded-xl px-3 py-2 ${accentTheme.softBg} ${accentTheme.softText}`}>
                        Lift: {typeof rule.lift === "number" ? rule.lift.toFixed(2) : "—"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm text-slate-500">
                Lancez l’analyse pour afficher un aperçu des règles obtenues.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}

function ClusterSimulation({
  title,
  subtitle,
  icon: Icon,
  accent = "cyan",
  steps,
  frames,
  duration = 3600,
  renderSummary,
  axisX = "X",
  axisY = "Y",
  chartHint = "points · clusters · (centroïdes)",
}) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const timeoutRef = useRef([]);
  const accentTheme = accents[accent] ?? accents.cyan;

  const stopTimers = () => {
    timeoutRef.current.forEach((id) => clearTimeout(id));
    timeoutRef.current = [];
  };

  useEffect(() => {
    return () => stopTimers();
  }, []);

  const start = () => {
    stopTimers();
    setRunning(true);
    setComplete(false);
    setStep(0);
    setFrameIndex(0);
    setLogs([]);

    const interval = Math.max(520, Math.round(duration / Math.max(steps.length, 1)));
    steps.forEach((s, index) => {
      const id = setTimeout(() => {
        setStep(index);
        setFrameIndex(Math.min(frames.length - 1, s.frameIndex ?? index));
        setLogs((prev) => [
          ...prev,
          {
            id: `${title}-${index}-${Date.now()}`,
            label: s.label,
            detail: s.detail ?? s.label,
          },
        ]);
      }, index * interval);
      timeoutRef.current.push(id);
    });

    const id = setTimeout(() => {
      setStep(steps.length);
      setFrameIndex(frames.length - 1);
      setComplete(true);
      setRunning(false);
      setLogs((prev) => [
        ...prev,
        {
          id: `${title}-done-${Date.now()}`,
          label: "Terminé",
          detail: "Les segments sont maintenant prêts pour l’interprétation.",
        },
      ]);
    }, steps.length * interval + 220);
    timeoutRef.current.push(id);
  };

  const progress = steps.length === 0 ? 0 : Math.min(100, Math.round((step / steps.length) * 100));
  const frame = frames[Math.min(frameIndex, frames.length - 1)];
  const points = frame?.points ?? [];
  const centroids = frame?.centroids ?? [];

  const clusterPalette = {
    "Faible valeur": "rgba(34,211,238,0.85)",
    "Clients réguliers": "rgba(168,85,247,0.85)",
    "Forte valeur": "rgba(16,185,129,0.85)",
    "Bruit / atypiques": "rgba(251,191,36,0.85)",
    "Non assigné": "rgba(148,163,184,0.55)",
    "Low value": "rgba(34,211,238,0.85)",
    Regular: "rgba(168,85,247,0.85)",
    "High value": "rgba(16,185,129,0.85)",
    Noise: "rgba(251,191,36,0.85)",
    Unassigned: "rgba(148,163,184,0.55)",
  };

  const paletteByIndex = [
    "rgba(34,211,238,0.85)",
    "rgba(168,85,247,0.85)",
    "rgba(16,185,129,0.85)",
    "rgba(59,130,246,0.85)",
    "rgba(244,63,94,0.85)",
    "rgba(251,146,60,0.85)",
    "rgba(147,51,234,0.85)",
  ];

  const colorForCluster = (name) => {
    if (clusterPalette[name]) return clusterPalette[name];
    const match = String(name).match(/^Cluster\\s+(-?\\d+)$/);
    if (match) {
      const idx = Number(match[1]);
      if (idx === -1) return clusterPalette["Bruit / atypiques"];
      const safe = Number.isFinite(idx) ? Math.abs(idx) : 0;
      return paletteByIndex[safe % paletteByIndex.length];
    }
    return "rgba(148,163,184,0.65)";
  };

  const uniqueClusters = Array.from(new Set(points.map((p) => p.cluster ?? "Non assigné")));

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className={`mb-4 inline-flex rounded-2xl ${accentTheme.softBg} p-3 ${accentTheme.icon}`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
        <button
          onClick={start}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-medium transition hover:scale-[1.02] ${accentTheme.button}`}
        >
          {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Exécution..." : complete ? "Relancer" : "Lancer"}
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-slate-300">Progression</span>
            <span className={accentTheme.icon}>{progress}%</span>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              className={`h-full rounded-full ${accentTheme.bar}`}
            />
          </div>
          <ProgressSteps steps={steps} activeStep={step} />
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>Suivi de l’analyse</span>
              <span className="tabular-nums">{frame?.label ?? "—"}</span>
            </div>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {logs.slice(-3).map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-white">{log.label}</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">{log.detail}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {logs.length === 0 && <p className="text-xs text-slate-500">Cliquez sur “Lancer” pour simuler la segmentation.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-300">Visualisation</span>
            <span className="text-xs text-slate-500">{chartHint}</span>
          </div>
          <div className="h-72 rounded-2xl border border-white/10 bg-black/10 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" dataKey="x" stroke="#94a3b8" name={axisX} />
                <YAxis type="number" dataKey="y" stroke="#94a3b8" name={axisY} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "#fff" }}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.06)" />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />
                {uniqueClusters.map((cluster) => (
                  <Scatter
                    key={cluster}
                    name={cluster}
                    data={points.filter((p) => (p.cluster ?? "Non assigné") === cluster)}
                    fill={colorForCluster(cluster)}
                  />
                ))}
                {centroids.length > 0 && (
                  <Scatter name="Centroïdes" data={centroids} fill="rgba(255,255,255,0.95)" shape="cross" />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <AnimatePresence initial={false}>
            {complete && typeof renderSummary === "function" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                {renderSummary()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}

function SideProgress({ activeIndex }) {
  return (
    <div className="fixed left-6 top-1/2 z-50 hidden -translate-y-1/2 xl:block">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-3 backdrop-blur-xl">
        {sections.map((section, index) => (
          <a
            key={section}
            href={`#section-${index}`}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2 text-xs transition hover:bg-white/10 ${
              activeIndex === index ? "text-white" : "text-slate-500 hover:text-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition ${
                activeIndex === index
                  ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 text-slate-400 group-hover:border-cyan-300/50 group-hover:text-cyan-100"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{section}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="section-0" className="relative flex min-h-screen items-center overflow-hidden px-6 py-24 md:px-12 lg:px-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.2),transparent_35%),radial-gradient(circle_at_80%_50%,rgba(168,85,247,0.18),transparent_30%)]" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-100 backdrop-blur-xl">
          <BrainCircuit className="h-4 w-4" />
          Mini-projet Data Mining · Règles d’association · Clustering
        </div>
        <h1 className="max-w-5xl text-5xl font-bold tracking-tight text-white md:text-7xl">
          Fouille de données retail : règles d’association et segmentation clients.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
          Ce projet explore un jeu de données transactionnel issu du commerce de détail afin
          d’en extraire des connaissances utiles. L’analyse commence par l’étude des paniers
          d’achat pour identifier les produits fréquemment associés, puis se poursuit par une
          segmentation des clients à partir de leurs comportements d’achat. L’objectif est de
          transformer des données brutes en règles, groupes et interprétations capables
          d’aider à mieux comprendre les habitudes d’achat et les profils clients.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a href="#section-1" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]">
            Commencer <ArrowDown className="h-4 w-4" />
          </a>
          <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 text-slate-300">
            <Clock3 className="h-4 w-4" /> Analyse progressive et visualisation interactive
          </span>
        </div>
        <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-300">
          {[
            "Pandas (préparation)",
            "efficient-apriori / mlxtend / pyfpgrowth",
            "Scikit-learn (K-Means, DBSCAN)",
            "Support · Confiance · Lift",
          ].map((chip) => (
            <span key={chip} className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
              {chip}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function DatasetSection({
  datasetSummary,
  topProducts,
  topCountries,
  monthlyRevenue,
  basketDistribution,
}) {
  const summaryMap = useMemo(() => {
    const map = {};
    datasetSummary.forEach((row) => {
      map[row.indicateur] = row.valeur;
    });
    return map;
  }, [datasetSummary]);

  const metricCards = [
    {
      icon: Boxes,
      label: "Lignes nettoyées",
      value: formatCompact(summaryMap["Lignes après nettoyage"]),
      hint: "Lignes conservées après suppression des transactions non exploitables.",
    },
    {
      icon: Database,
      label: "Factures",
      value: formatCompact(summaryMap["Factures distinctes"]),
      hint: "Chaque facture représente un panier d’achat.",
    },
    {
      icon: Users,
      label: "Clients",
      value: formatCompact(summaryMap["Clients distincts"]),
      hint: "Base utilisée pour construire les profils RFM.",
    },
    {
      icon: Target,
      label: "Chiffre d’affaires",
      value: formatCurrency(summaryMap["Chiffre d'affaires total"]),
      hint: "Montant total calculé après nettoyage des ventes.",
    },
  ];

  const cleanedTopProducts = topProducts.slice(0, 10).map((row) => ({
    ...row,
    ProduitCourt:
      row.Produit.length > 26 ? `${row.Produit.slice(0, 26)}…` : row.Produit,
  }));

  const cleanedTopCountries = topCountries.slice(0, 10).map((row) => ({
    ...row,
    PaysCourt: row.Pays.length > 18 ? `${row.Pays.slice(0, 18)}…` : row.Pays,
  }));

  const cleanedBasketDistribution = basketDistribution
    .filter((row) => row.TaillePanier <= 30)
    .slice(0, 30);

  return (
    <section id="section-1" className="px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <SectionLabel icon={Database} label="Jeu de données et préparation" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl"
        >
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Avant les algorithmes, il faut comprendre ce que racontent les données.
          </h2>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-400">
            Le jeu de données utilisé décrit des ventes réalisées dans un contexte de
            commerce en ligne. Chaque ligne correspond à un produit présent dans une
            facture : on y retrouve le numéro de facture, la description du produit, la
            quantité achetée, la date de vente, le prix unitaire, le client concerné et
            le pays. Cette structure est particulièrement intéressante, car elle permet
            d’étudier à la fois les paniers d’achat et les comportements des clients.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => (
            <MetricCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              hint={card.hint}
            />
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <GlassCard>
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-cyan-200" />
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Préparation des données
                </h3>
                <p className="text-sm text-slate-400">
                  Du fichier brut vers deux représentations analytiques.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                {
                  title: "1. Nettoyage",
                  text: "Les transactions annulées, les quantités négatives, les prix invalides et les lignes sans informations essentielles sont retirés afin de conserver une base exploitable.",
                },
                {
                  title: "2. Création du montant total",
                  text: "Pour chaque ligne de vente, le montant est calculé à partir de la quantité et du prix unitaire. Cette variable permet ensuite d’évaluer la valeur des clients.",
                },
                {
                  title: "3. Construction des paniers",
                  text: "Les produits sont regroupés par facture. Une facture devient donc une transaction composée de plusieurs articles achetés ensemble.",
                },
                {
                  title: "4. Construction des profils RFM",
                  text: "Les ventes sont agrégées par client pour obtenir la récence, la fréquence d’achat et le montant total dépensé.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="font-medium text-white">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-cyan-200" />
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Produits les plus vendus
                </h3>
                <p className="text-sm text-slate-400">
                  Première lecture des articles dominants dans les transactions.
                </p>
              </div>
            </div>

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cleanedTopProducts}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="ProduitCourt"
                    stroke="#94a3b8"
                    width={170}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      color: "#fff",
                    }}
                    formatter={(value) => [formatNumber(value), "Quantité vendue"]}
                    labelFormatter={(label) => {
                      const item = cleanedTopProducts.find(
                        (p) => p.ProduitCourt === label
                      );
                      return item?.Produit ?? label;
                    }}
                  />
                  <Bar
                    dataKey="Quantite"
                    fill="rgba(34,211,238,0.85)"
                    radius={[0, 10, 10, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <div className="mb-5 flex items-center gap-3">
              <Target className="h-6 w-6 text-violet-200" />
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Pays générant le plus de chiffre d’affaires
                </h3>
                <p className="text-sm text-slate-400">
                  Une vision géographique de la valeur générée.
                </p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cleanedTopCountries}
                  margin={{ top: 10, right: 20, left: 0, bottom: 45 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis
                    dataKey="PaysCourt"
                    stroke="#94a3b8"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      formatCurrency(value),
                      "Chiffre d’affaires",
                    ]}
                    labelFormatter={(label) => {
                      const item = cleanedTopCountries.find(
                        (p) => p.PaysCourt === label
                      );
                      return item?.Pays ?? label;
                    }}
                  />
                  <Bar
                    dataKey="ChiffreAffaires"
                    fill="rgba(168,85,247,0.85)"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center gap-3">
              <Clock3 className="h-6 w-6 text-emerald-200" />
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Évolution du chiffre d’affaires
                </h3>
                <p className="text-sm text-slate-400">
                  Lecture temporelle des ventes par mois.
                </p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyRevenue}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis
                    dataKey="Mois"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      formatCurrency(value),
                      "Chiffre d’affaires",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="ChiffreAffaires"
                    stroke="rgba(16,185,129,0.95)"
                    fill="rgba(16,185,129,0.18)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard>
            <div className="mb-5 flex items-center gap-3">
              <Boxes className="h-6 w-6 text-amber-200" />
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Distribution de la taille des paniers
                </h3>
                <p className="text-sm text-slate-400">
                  Nombre de produits distincts présents dans une facture.
                </p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cleanedBasketDistribution}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis
                    dataKey="TaillePanier"
                    stroke="#94a3b8"
                    label={{
                      value: "Taille du panier",
                      position: "insideBottom",
                      offset: -10,
                      fill: "#94a3b8",
                    }}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      formatNumber(value),
                      "Nombre de factures",
                    ]}
                  />
                  <Bar
                    dataKey="NombreFactures"
                    fill="rgba(251,191,36,0.85)"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-cyan-200" />
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Passage vers les algorithmes
                </h3>
                <p className="text-sm text-slate-400">
                  La préparation crée deux chemins d’analyse.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                <p className="font-semibold text-cyan-100">
                  Factures → paniers d’achat
                </p>
                <p className="mt-2 text-sm leading-6 text-cyan-100/75">
                  Cette représentation permet d’appliquer Apriori et FP-Growth afin de
                  découvrir les produits fréquemment achetés ensemble.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
                <p className="font-semibold text-emerald-100">
                  Clients → profils RFM
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                  Cette représentation permet d’appliquer K-Means et DBSCAN afin de
                  regrouper les clients selon leurs comportements d’achat.
                </p>
              </div>

              <p className="pt-2 text-sm leading-7 text-slate-400">
                Cette étape joue donc le rôle de pont entre l’exploration descriptive
                et l’application des algorithmes. Les résultats que nous allons obtenir
                ne viennent pas directement du fichier brut, mais de ces représentations
                préparées.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

function ConceptCard({ title, formula, explanation, accent = "cyan" }) {
  const theme = accents[accent] ?? accents.cyan;

  return (
    <GlassCard className="p-5">
      <div className={`mb-4 inline-flex rounded-2xl ${theme.softBg} px-3 py-2 text-sm font-semibold ${theme.softText}`}>
        {title}
      </div>

      <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white">
        {formula}
      </p>

      <p className="mt-4 text-sm leading-6 text-slate-400">
        {explanation}
      </p>
    </GlassCard>
  );
}

function RuleSpotlight({ rule, title = "Règle vedette", accent = "cyan" }) {
  const theme = accents[accent] ?? accents.cyan;

  if (!rule) return null;

  const support = typeof rule.support === "number" ? `${(rule.support * 100).toFixed(2)}%` : "—";
  const confidence =
    typeof rule.confidence === "number" ? `${(rule.confidence * 100).toFixed(2)}%` : "—";
  const lift = typeof rule.lift === "number" ? rule.lift.toFixed(2) : "—";

  return (
    <GlassCard className="overflow-hidden">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <div className={`mb-4 inline-flex rounded-2xl ${theme.softBg} px-4 py-2 text-sm font-semibold ${theme.softText}`}>
            {title}
          </div>

          <h3 className="text-2xl font-semibold text-white">
            Une règle concrète pour comprendre le résultat.
          </h3>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            Au lieu de lire les règles comme de simples lignes de tableau, on peut les
            interpréter comme des signaux de comportement d’achat. La règle ci-contre
            indique que certains produits apparaissent ensemble dans les paniers plus
            souvent que ce que l’on obtiendrait par hasard.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Si le panier contient
          </p>

          <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-medium leading-6 text-white">
            {rule.antecedent}
          </p>

          <div className="my-4 flex items-center justify-center">
            <span className={`rounded-full ${theme.softBg} px-4 py-2 text-sm font-semibold ${theme.softText}`}>
              alors il contient souvent
            </span>
          </div>

          <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-medium leading-6 text-white">
            {rule.consequent}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/[0.05] p-3">
              <p className="text-xs text-slate-500">Support</p>
              <p className="mt-1 text-lg font-semibold text-white">{support}</p>
            </div>

            <div className="rounded-2xl bg-white/[0.05] p-3">
              <p className="text-xs text-slate-500">Confiance</p>
              <p className="mt-1 text-lg font-semibold text-white">{confidence}</p>
            </div>

            <div className={`rounded-2xl ${theme.softBg} p-3`}>
              <p className={`text-xs ${theme.softText}/70`}>Lift</p>
              <p className={`mt-1 text-lg font-semibold ${theme.softText}`}>{lift}</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-400">
            Ici, la confiance indique la probabilité d’obtenir le produit de droite
            lorsque les produits de gauche sont présents. Le lift montre la force de
            l’association : plus il dépasse 1, plus la relation est significative.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function AssociationInterpretation({ aprioriRules, fpRules, comparisonData }) {
  const aprioriBest = aprioriRules?.[0];
  const fpBest = fpRules?.[0];

  const aprioriStats = comparisonData?.find((row) => row.name === "Apriori");
  const fpStats = comparisonData?.find((row) => row.name === "FP-Growth");

  return (
    <GlassCard>
      <div className="mb-6 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-cyan-200" />
        <div>
          <h3 className="text-2xl font-semibold text-white">
            Interprétation des résultats obtenus
          </h3>
          <p className="text-sm text-slate-400">
            Lecture des règles extraites et du comportement réel des algorithmes.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          <h4 className="font-semibold text-cyan-100">Ce que montrent les règles</h4>
          <p className="mt-3 text-sm leading-7 text-cyan-100/75">
            Les règles ayant un lift élevé indiquent que certains produits sont achetés
            ensemble beaucoup plus souvent que par hasard. Ces associations peuvent
            correspondre à des produits complémentaires, à une même gamme, ou à des
            habitudes d’achat récurrentes chez les clients.
          </p>
        </div>

        <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-5">
          <h4 className="font-semibold text-violet-100">Lecture du benchmark</h4>
          <p className="mt-3 text-sm leading-7 text-violet-100/75">
            Dans notre exécution, Apriori est plus rapide que FP-Growth et génère un
            nombre plus élevé de règles. Il serait donc incorrect de dire que FP-Growth
            est meilleur dans ce cas précis. La comparaison doit distinguer le résultat
            observé ici et l’avantage théorique de FP-Growth en montée en volume.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
          <h4 className="font-semibold text-emerald-100">Utilité métier</h4>
          <p className="mt-3 text-sm leading-7 text-emerald-100/75">
            Ces règles peuvent servir à construire des recommandations de produits, à
            proposer des packs promotionnels, à organiser les produits dans une boutique
            en ligne ou à mieux comprendre les combinaisons d’articles qui intéressent
            réellement les clients.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h4 className="text-sm font-semibold text-white">
            Lecture d’Apriori
          </h4>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            Apriori a permis d’extraire{" "}
            <span className="font-semibold text-white">{aprioriStats?.rules ?? "—"}</span>{" "}
            règles en{" "}
            <span className="font-semibold text-cyan-100">
              {formatSeconds(aprioriStats?.timeSeconds)}
            </span>
            . Les meilleures règles sont celles dont le lift est élevé, car elles
            révèlent des associations non triviales entre produits. La meilleure règle
            affichée atteint un lift d’environ{" "}
            <span className="font-semibold text-cyan-100">
              {typeof aprioriBest?.lift === "number" ? aprioriBest.lift.toFixed(2) : "—"}
            </span>
            , ce qui indique une relation forte.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h4 className="text-sm font-semibold text-white">
            Lecture de FP-Growth
          </h4>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            FP-Growth a extrait{" "}
            <span className="font-semibold text-white">{fpStats?.rules ?? "—"}</span>{" "}
            règles en{" "}
            <span className="font-semibold text-violet-100">
              {formatSeconds(fpStats?.timeSeconds)}
            </span>
            . Les règles obtenues restent interprétables et utiles, mais le benchmark
            montre qu’il n’est pas plus rapide dans cette configuration. Son intérêt
            principal est d’illustrer une stratégie différente, basée sur la compression
            des transactions, qui devient pertinente lorsque le problème grandit.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function AssociationSection({ aprioriRules, fpRules, aprioriTotal, fpTotal, params, comparisonData }) {
  const aprioriStats = comparisonData?.find((row) => row.name === "Apriori");
  const fpStats = comparisonData?.find((row) => row.name === "FP-Growth");

  const aprioriDuration = scaledDuration(
    aprioriStats?.timeSeconds,
    [aprioriStats?.timeSeconds, fpStats?.timeSeconds]
  );

  const fpDuration = scaledDuration(
    fpStats?.timeSeconds,
    [aprioriStats?.timeSeconds, fpStats?.timeSeconds]
  );

  return (
    <section id="section-2" className="px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl space-y-8">
        <SectionLabel icon={GitBranch} label="Partie A — Règles d’association" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl"
        >
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Découvrir les produits qui ont tendance à être achetés ensemble.
          </h2>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-400">
            Les règles d’association permettent d’identifier des relations fréquentes
            dans les paniers d’achat. Elles prennent généralement la forme{" "}
            <span className="font-semibold text-white">X → Y</span> : lorsqu’un panier
            contient un ensemble de produits X, il a une certaine probabilité de contenir
            aussi le produit ou l’ensemble de produits Y. Dans notre cas, cette approche
            permet de repérer des associations utiles pour la recommandation, les offres
            groupées ou l’analyse des habitudes d’achat.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          <ConceptCard
            title="Support"
            formula="Fréquence de X et Y dans l’ensemble des paniers"
            explanation="Le support indique si une règle apparaît souvent dans la base. Une règle avec un support très faible peut être intéressante, mais elle concerne peu de transactions."
            accent="cyan"
          />

          <ConceptCard
            title="Confiance"
            formula="Probabilité d’acheter Y sachant que X est acheté"
            explanation="La confiance mesure la fiabilité de la règle. Elle répond à la question : parmi les paniers contenant X, combien contiennent aussi Y ?"
            accent="emerald"
          />

          <ConceptCard
            title="Lift"
            formula="Force de la relation par rapport au hasard"
            explanation="Le lift est particulièrement important : s’il est supérieur à 1, X et Y sont achetés ensemble plus souvent que ce que l’on obtiendrait par simple hasard."
            accent="violet"
          />
        </div>

        <GlassCard>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                <Network className="h-6 w-6" />
              </div>

              <h3 className="text-2xl font-semibold text-white">
                Pourquoi utiliser Apriori ?
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Apriori est un algorithme historique d’extraction de règles
                d’association. Sa logique repose sur une idée simple : si un ensemble de
                produits n’est pas fréquent, alors aucun ensemble plus grand le contenant
                ne pourra être fréquent. Cette propriété permet d’éliminer progressivement
                une partie des combinaisons inutiles.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Dans notre présentation, Apriori est intéressant parce qu’il rend le
                raisonnement très lisible : génération des candidats, filtrage par support,
                puis extraction des règles. Sa limite principale est son coût
                computationnel lorsque le nombre de produits et de combinaisons augmente.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="mb-4 text-sm font-medium text-white">
                Nature de l’algorithme
              </p>

              <div className="space-y-3">
                {[
                  ["Type", "Algorithme de fouille de motifs fréquents"],
                  ["Approche", "Génération de candidats puis élagage"],
                  ["Point fort", "Simple à comprendre et à expliquer"],
                  ["Limite", "Peut devenir coûteux avec beaucoup d’items"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-right text-sm font-medium text-slate-100">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <AlgorithmRunner
          title="Apriori"
          subtitle="L’analyse commence par la construction des paniers, puis l’algorithme génère des combinaisons de produits candidats. Les combinaisons trop rares sont éliminées, et seules les règles suffisamment fréquentes et fiables sont conservées pour l’interprétation."
          icon={Network}
          accent="cyan"
          metaChips={[
            `support minimal = ${params?.minSupport ?? "—"}`,
            `confiance minimale = ${params?.minConf ?? "—"}`,
            `${aprioriTotal ?? aprioriRules.length} règles extraites`,
            `temps = ${formatSeconds(aprioriStats?.timeSeconds)}`,
          ]}
          steps={[
            {
              label: "Préparation des paniers",
              detail: "Chaque facture est transformée en ensemble de produits achetés ensemble.",
              revealCount: 0,
            },
            {
              label: "Génération des candidats",
              detail: "Apriori construit progressivement des combinaisons de produits de taille croissante.",
              revealCount: 1,
            },
            {
              label: "Filtrage par support",
              detail: "Les combinaisons trop rares sont supprimées afin de conserver uniquement les motifs fréquents.",
              revealCount: 1,
            },
            {
              label: "Extraction des règles",
              detail: "Les règles X → Y sont générées à partir des motifs fréquents.",
              revealCount: 2,
            },
            {
              label: "Classement des règles",
              detail: "Les règles les plus intéressantes sont classées selon le lift et la confiance.",
              revealCount: 3,
            },
          ]}
          rules={aprioriRules}
          duration={aprioriDuration}
        />

        <RuleSpotlight
          rule={aprioriRules?.[0]}
          title="Règle vedette — Apriori"
          accent="cyan"
        />
        
        <GlassCard>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-violet-300/10 p-3 text-violet-200">
                <Zap className="h-6 w-6" />
              </div>

              <h3 className="text-2xl font-semibold text-white">
                Pourquoi utiliser FP-Growth ?
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                FP-Growth poursuit le même objectif qu’Apriori : trouver des motifs
                fréquents et en déduire des règles d’association. La différence se trouve
                dans la méthode. Au lieu de générer explicitement un grand nombre de
                candidats, FP-Growth compresse les transactions dans une structure appelée
                FP-tree, puis extrait les motifs fréquents à partir de cette structure.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Dans notre cas, FP-Growth ne doit pas être présenté comme le gagnant du
                benchmark. Les résultats montrent au contraire qu’Apriori est plus rapide
                sur cette configuration réduite. L’intérêt de FP-Growth est donc surtout
                méthodologique : il permet de discuter une autre stratégie d’extraction,
                plus orientée vers la compression des transactions et la montée en volume.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="mb-4 text-sm font-medium text-white">
                Nature de l’algorithme
              </p>

              <div className="space-y-3">
                {[
                  ["Type", "Extraction de motifs fréquents"],
                  ["Approche", "Compression des transactions dans un FP-tree"],
                  ["Point fort", "Réduit la génération massive de candidats"],
                  ["Utilité", "Comparer deux stratégies d’extraction"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-right text-sm font-medium text-slate-100">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <AlgorithmRunner
          title="FP-Growth"
          subtitle="FP-Growth exploite une représentation plus compacte des transactions. Dans notre exécution, il n’est pas plus rapide qu’Apriori, mais il reste intéressant pour expliquer une stratégie conçue pour mieux gérer la montée en volume."
          icon={Zap}
          accent="violet"
          metaChips={[
            `support minimal = ${params?.minSupport ?? "—"}`,
            `confiance minimale = ${params?.minConf ?? "—"}`,
            `${fpTotal ?? fpRules.length} règles extraites`,
            `temps = ${formatSeconds(fpStats?.timeSeconds)}`,
          ]}
          steps={[
            {
              label: "Lecture des paniers",
              detail: "Les transactions sont parcourues afin d’identifier les produits fréquents.",
              revealCount: 1,
            },
            {
              label: "Compression des transactions",
              detail: "Les paniers sont organisés dans une structure compacte qui évite de répéter inutilement les mêmes chemins.",
              revealCount: 2,
            },
            {
              label: "Extraction des motifs fréquents",
              detail: "Les motifs sont extraits à partir de la structure compressée, sans générer tous les candidats comme Apriori.",
              revealCount: 2,
            },
            {
              label: "Génération des règles",
              detail: "Les motifs fréquents sont transformés en règles d’association filtrées par confiance.",
              revealCount: 3,
            },
            {
              label: "Classement des résultats",
              detail: "Les règles sont triées afin de faire ressortir les associations les plus fortes.",
              revealCount: 3,
            },
          ]}
          rules={fpRules}
          duration={fpDuration}
        />

        <RuleSpotlight
          rule={fpRules?.[0]}
          title="Règle vedette — FP-Growth"
          accent="violet"
        />

        <GlassCard>
          <div className="mb-6 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-cyan-200" />
            <div>
              <h3 className="text-2xl font-semibold text-white">
                Comparaison Apriori / FP-Growth
              </h3>
              <p className="text-sm text-slate-400">
                La comparaison ne porte pas seulement sur la qualité des règles, mais aussi
                sur le temps nécessaire pour les produire dans notre exécution.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-300">Qualité et volume des règles</span>
                <span className="text-xs text-slate-500">
                  règles · lift moyen · confiance moyenne
                </span>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "14px",
                        color: "#fff",
                      }}
                      formatter={(value, key, item) => {
                        const payload = item?.payload ?? {};
                        if (key === "rules") return [value, "Nombre de règles"];
                        if (key === "avgLift") return [value, `Lift moyen (max ${payload.maxLift})`];
                        if (key === "avgConf") return [value, "Confiance moyenne"];
                        return [value, key];
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                    <Bar dataKey="rules" name="Nombre de règles" fill="rgba(34,211,238,0.85)" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="avgLift" name="Lift moyen" fill="rgba(168,85,247,0.85)" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="avgConf" name="Confiance moyenne" fill="rgba(16,185,129,0.85)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-300">Temps d’exécution</span>
                <span className="text-xs text-slate-500">secondes</span>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "14px",
                        color: "#fff",
                      }}
                      formatter={(value) => [formatSeconds(value), "Temps mesuré"]}
                    />
                    <Bar dataKey="timeSeconds" name="Temps d’exécution" fill="rgba(251,191,36,0.9)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <h4 className="text-sm font-semibold text-cyan-100">
              Lecture correcte du benchmark
            </h4>

            <p className="mt-3 text-sm leading-7 text-cyan-100/80">
              Dans cette exécution, Apriori est plus rapide et extrait davantage de règles que
              FP-Growth. Cela ne signifie pas que FP-Growth est inutile ou incorrect ; cela
              signifie simplement que, sur notre configuration réduite — 80 produits fréquents
              et 10 000 paniers échantillonnés de manière reproductible — l’implémentation
              utilisée pour Apriori est particulièrement performante. FP-Growth reste pertinent
              pour discuter une approche plus compacte et généralement plus adaptée lorsque le
              volume de transactions ou le nombre de combinaisons augmente.
            </p>
          </div>
        </GlassCard>


      <AssociationInterpretation
        aprioriRules={aprioriRules}
        fpRules={fpRules}
        comparisonData={comparisonData}
      />
      </div>
    </section>
  );
}

function ClusteringSection({ kmeansProfile, dbscanProfile, customers, params, kmeansLabels, algorithmBenchmark }) {
  const logMonetary = (value) => Math.log10(Math.max(0, value) + 1);

  const benchmarkMap = useMemo(() => {
    const map = {};
    (algorithmBenchmark ?? []).forEach((row) => {
      map[row.algorithm] = row;
    });
    return map;
  }, [algorithmBenchmark]);

  const kmeansTime = benchmarkMap["K-Means"]?.seconds;
  const dbscanTime = benchmarkMap.DBSCAN?.seconds;

  const kmeansDuration = scaledDuration(kmeansTime, [kmeansTime, dbscanTime], 2800, 5600);
  const dbscanDuration = scaledDuration(dbscanTime, [kmeansTime, dbscanTime], 2800, 5600);

  const pointsBase = useMemo(() => {
    return (customers ?? []).map((c) => ({
      x: c.frequency,
      y: logMonetary(c.monetary),
      frequency: c.frequency,
      monetary: c.monetary,
      recency: c.recency,
      kmeansCluster: c.kmeansCluster,
      dbscanCluster: c.dbscanCluster,
    }));
  }, [customers]);

  const kmeansFrames = useMemo(() => {
    const assigned = pointsBase.map((p) => ({
      ...p,
      cluster: kmeansLabels?.[p.kmeansCluster] ?? `Cluster ${p.kmeansCluster}`,
    }));

    const centroids = (kmeansProfile ?? []).map((cluster) => ({
      x: cluster.frequency,
      y: logMonetary(cluster.monetary),
      name: cluster.cluster,
    }));

    return [
      { label: "Initialisation", points: pointsBase.map((p) => ({ ...p, cluster: "Non assigné" })), centroids: [] },
      { label: "Assignation", points: assigned, centroids },
      { label: "Stabilisation", points: assigned, centroids },
    ];
  }, [kmeansLabels, kmeansProfile, pointsBase]);

  const dbscanFrames = useMemo(() => {
    const assigned = pointsBase.map((p) => {
      const raw = p.dbscanCluster;
      const cluster =
        raw === -1 ? "Bruit / atypiques" : raw == null ? "Non assigné" : `Cluster ${raw}`;
      return { ...p, cluster };
    });

    return [
      { label: "Voisinage ε", points: pointsBase.map((p) => ({ ...p, cluster: "Non assigné" })) },
      { label: "Densité", points: assigned },
      { label: "Clusters + bruit", points: assigned },
    ];
  }, [pointsBase]);

  const kmeansLargest = useMemo(() => {
    return [...(kmeansProfile ?? [])].sort((a, b) => b.clients - a.clients)[0];
  }, [kmeansProfile]);

  const dbscanNoise = useMemo(() => {
    return (dbscanProfile ?? []).find((row) => row.clusterId === -1 || String(row.cluster).toLowerCase().includes("bruit"));
  }, [dbscanProfile]);

  const totalDbscanClients = useMemo(() => {
    return (dbscanProfile ?? []).reduce((sum, row) => sum + (Number(row.clients) || 0), 0);
  }, [dbscanProfile]);

  const noiseRate =
    dbscanNoise && totalDbscanClients
      ? ((dbscanNoise.clients / totalDbscanClients) * 100).toFixed(2)
      : "—";

  const dbscanClusterCount = useMemo(() => {
    return (dbscanProfile ?? []).filter((row) => row.clusterId !== -1 && !String(row.cluster).toLowerCase().includes("bruit")).length;
  }, [dbscanProfile]);

  const silhouetteScore = params?.silhouetteScore ?? clusteringValidation.silhouetteScore;
  const bestK = params?.bestK ?? clusteringValidation.bestK;

  return (
    <section id="section-3" className="px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl space-y-8">
        <SectionLabel icon={Users} label="Partie B — Clustering" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl"
        >
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Segmenter les clients à partir de leurs comportements d’achat.
          </h2>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-400">
            Après l’analyse des paniers, nous changeons d’échelle : l’unité d’étude n’est
            plus la facture, mais le client. Chaque client est résumé par des indicateurs
            RFM — récence, fréquence et montant — afin de comparer les profils d’achat et
            de détecter des groupes de comportements similaires.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          <ConceptCard
            title="Récence"
            formula="Nombre de jours depuis le dernier achat"
            explanation="Un client avec une récence faible est revenu récemment. C’est souvent un signal d’engagement ou d’activité commerciale récente."
            accent="cyan"
          />
          <ConceptCard
            title="Fréquence"
            formula="Nombre de factures par client"
            explanation="La fréquence indique combien de fois un client a acheté. Elle aide à distinguer les clients occasionnels des clients réguliers."
            accent="emerald"
          />
          <ConceptCard
            title="Montant"
            formula="Somme totale dépensée par le client"
            explanation="Le montant permet d’évaluer la valeur commerciale du client et d’identifier les profils à fort potentiel."
            accent="violet"
          />
        </div>

        <GlassCard>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-emerald-300/10 p-3 text-emerald-200">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Pourquoi utiliser K-Means ?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                K-Means regroupe les clients autour de centres appelés centroïdes. Chaque
                client est affecté au groupe dont le centroïde est le plus proche. Dans
                notre projet, cet algorithme est utile pour obtenir des segments globaux,
                lisibles et facilement interprétables dans une logique marketing.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Le nombre de groupes est choisi à partir d’une évaluation préalable. Dans
                notre notebook, le meilleur choix retenu est <span className="font-semibold text-white">K = {bestK}</span>,
                avec un score de silhouette d’environ <span className="font-semibold text-emerald-100">{formatScore(silhouetteScore)}</span>.
                Ce score indique une segmentation exploitable mais non parfaitement séparée,
                ce qui est cohérent avec des comportements clients réels.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="mb-4 text-sm font-medium text-white">Nature de l’algorithme</p>
              <div className="space-y-3">
                {[
                  ["Type", "Clustering par partitionnement"],
                  ["Paramètre central", "K, le nombre de clusters"],
                  ["K retenu", bestK],
                  ["Score silhouette", formatScore(silhouetteScore)],
                  ["Principe", "Minimiser la distance aux centroïdes"],
                  ["Temps mesuré", formatSeconds(kmeansTime)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-right text-sm font-medium text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <ClusterSimulation
          title="K-Means"
          subtitle="La visualisation montre le principe de l’algorithme : les clients sont d’abord placés dans l’espace RFM, puis affectés à des centroïdes jusqu’à obtenir des groupes stables et interprétables."
          icon={Users}
          accent="emerald"
          axisX="Fréquence"
          axisY="log10(Montant + 1)"
          chartHint="projection 2D : fréquence vs log(montant)"
          steps={[
            { label: "Initialisation", detail: "L’algorithme part de K centroïdes dans l’espace des profils clients.", frameIndex: 0 },
            { label: "Assignation", detail: "Chaque client est affecté au centroïde le plus proche selon ses caractéristiques RFM.", frameIndex: 1 },
            { label: "Mise à jour", detail: "Les centroïdes sont recalculés à partir de la moyenne des clients assignés.", frameIndex: 1 },
            { label: "Stabilisation", detail: "Lorsque les groupes ne changent presque plus, les segments sont prêts à être interprétés.", frameIndex: 2 },
          ]}
          frames={kmeansFrames}
          duration={kmeansDuration}
          renderSummary={() => (
            <div className="grid gap-3">
              {kmeansProfile.map((cluster) => (
                <div key={cluster.cluster} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{cluster.cluster}</span>
                    <span className="text-sm text-emerald-100">{formatNumber(cluster.clients)} clients</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Récence moyenne : {formatNumber(cluster.recency)} · Fréquence moyenne : {cluster.frequency.toFixed?.(2) ?? cluster.frequency} · Montant moyen : {formatCurrency(cluster.monetary)}
                  </p>
                </div>
              ))}
            </div>
          )}
        />

        <GlassCard>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Comment lire le nuage de points ?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Si certains points semblent se chevaucher visuellement, ce n’est pas forcément
                une erreur de segmentation. Le graphique affiché est une projection 2D
                simplifiée, basée sur la fréquence et le montant transformé, alors que le
                clustering est calculé dans l’espace RFM standardisé. La récence, qui peut
                séparer fortement deux clients, n’est donc pas directement visible sur ce plan.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Projection 2D", "Elle sert à comprendre la tendance, pas à prouver seule la séparation."],
                ["RFM standardisé", "Les algorithmes travaillent sur plusieurs variables mises à la même échelle."],
                ["Évaluation", "On juge les clusters avec les profils moyens, la silhouette et la cohérence métier."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-6 flex items-center gap-3">
            <Target className="h-6 w-6 text-emerald-200" />
            <div>
              <h3 className="text-2xl font-semibold text-white">Évaluation de la segmentation</h3>
              <p className="text-sm text-slate-400">Les clusters ne sont pas évalués par une accuracy, mais par leur cohésion, leur séparation et leur interprétation métier.</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
              <p className="text-sm font-semibold text-emerald-100">Silhouette K-Means</p>
              <p className="mt-3 text-4xl font-semibold text-white">{formatScore(silhouetteScore)}</p>
              <p className="mt-3 text-sm leading-7 text-emerald-100/75">
                Le score est positif et autour de 0,41 : les groupes sont donc utilisables,
                mais ils ne sont pas parfaitement isolés. Cela explique pourquoi la projection
                2D peut montrer des zones qui se chevauchent.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <p className="text-sm font-semibold text-cyan-100">Nombre de segments K-Means</p>
              <p className="mt-3 text-4xl font-semibold text-white">{bestK}</p>
              <p className="mt-3 text-sm leading-7 text-cyan-100/75">
                Le choix de trois clusters permet de produire des segments suffisamment
                simples à présenter : clients actifs à forte valeur, clients moyens, et
                clients plus anciens ou moins engagés.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
              <p className="text-sm font-semibold text-amber-100">Lecture DBSCAN</p>
              <p className="mt-3 text-4xl font-semibold text-white">{dbscanClusterCount}</p>
              <p className="mt-3 text-sm leading-7 text-amber-100/75">
                DBSCAN détecte {dbscanClusterCount} groupes hors bruit et environ {noiseRate}%
                de clients atypiques. Il sert donc surtout à repérer les densités et les
                anomalies, pas à remplacer les grands segments de K-Means.
              </p>
            </div>
          </div>

          <p className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-slate-400">
            Pour évaluer la segmentation, nous combinons donc trois lectures : le score de
            silhouette pour la qualité mathématique de K-Means, les profils moyens RFM pour
            l’interprétation métier, et le taux de bruit DBSCAN pour identifier les clients
            atypiques.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-amber-300/10 p-3 text-amber-200">
                <Layers3 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Pourquoi utiliser DBSCAN ?</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                DBSCAN ne demande pas de fixer à l’avance un nombre de clusters. Il cherche
                plutôt des zones où les points sont suffisamment denses. Cette logique est
                utile pour compléter K-Means, car elle peut isoler des clients atypiques que
                l’on ne souhaite pas forcément intégrer dans de grands segments marketing.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Deux paramètres structurent l’algorithme : <span className="font-semibold text-white">eps</span>,
                le rayon du voisinage, et <span className="font-semibold text-white">min_samples</span>,
                le nombre minimum de voisins nécessaires pour former un noyau dense.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="mb-4 text-sm font-medium text-white">Nature de l’algorithme</p>
              <div className="space-y-3">
                {[
                  ["Type", "Clustering basé sur la densité"],
                  ["Paramètres", `eps = ${params?.eps ?? "—"} · min_samples = ${params?.minSamples ?? "—"}`],
                  ["Point fort", "Détecte le bruit et les profils atypiques"],
                  ["Limite", "Très sensible au choix de eps"],
                  ["Temps mesuré", formatSeconds(dbscanTime)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-right text-sm font-medium text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <ClusterSimulation
          title="DBSCAN"
          subtitle="DBSCAN révèle les groupes denses et distingue les points isolés. Dans notre cas, les points marqués comme bruit représentent des clients atypiques à analyser séparément."
          icon={Layers3}
          accent="amber"
          axisX="Fréquence"
          axisY="log10(Montant + 1)"
          chartHint="projection simplifiée ; DBSCAN a été appliqué sur les variables standardisées"
          steps={[
            { label: "Voisinage ε", detail: `Pour chaque client, on cherche les voisins dans un rayon eps = ${params?.eps ?? "—"}.`, frameIndex: 0 },
            { label: "Points noyaux", detail: `Un point devient noyau s’il possède au moins ${params?.minSamples ?? "—"} voisins dans son rayon.`, frameIndex: 1 },
            { label: "Expansion", detail: "Les groupes se forment en reliant les points densément connectés.", frameIndex: 1 },
            { label: "Bruit", detail: "Les points qui ne rejoignent aucun groupe dense sont considérés comme atypiques.", frameIndex: 2 },
          ]}
          frames={dbscanFrames}
          duration={dbscanDuration}
          renderSummary={() => (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {dbscanProfile.map((row) => (
                  <div key={row.cluster} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{row.cluster}</span>
                      <span className="text-sm text-amber-100">{formatNumber(row.clients)} clients</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Récence moyenne : {formatNumber(row.recency)} · Fréquence moyenne : {row.frequency.toFixed?.(2) ?? row.frequency} · Montant moyen : {formatCurrency(row.monetary)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                Le bruit représente environ {noiseRate}% des clients dans cette sortie. Ces profils ne doivent pas être forcés dans un segment classique : ils peuvent correspondre à des comportements très rares, à des montants inhabituels ou à des clients à traiter séparément.
              </div>
            </div>
          )}
        />

        <GlassCard>
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-cyan-200" />
            <div>
              <h3 className="text-2xl font-semibold text-white">Interprétation de la segmentation</h3>
              <p className="text-sm text-slate-400">Lecture synthétique des deux algorithmes appliqués aux profils clients.</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
              <h4 className="font-semibold text-emerald-100">Lecture de K-Means</h4>
              <p className="mt-3 text-sm leading-7 text-emerald-100/75">
                K-Means fournit des segments marketing lisibles. Avec K = {bestK} et une
                silhouette d’environ {formatScore(silhouetteScore)}, la segmentation est
                exploitable sans être parfaitement séparée. Le groupe le plus important
                contient {formatNumber(kmeansLargest?.clients)} clients, ce qui aide à
                identifier le comportement majoritaire et à construire des actions adaptées.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
              <h4 className="font-semibold text-amber-100">Lecture de DBSCAN</h4>
              <p className="mt-3 text-sm leading-7 text-amber-100/75">
                DBSCAN complète K-Means en mettant en évidence la densité et les profils atypiques. Les petits clusters ne sont pas forcément de grands segments commerciaux : ils signalent plutôt des comportements spécifiques.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <h4 className="font-semibold text-cyan-100">Comparaison utile</h4>
              <p className="mt-3 text-sm leading-7 text-cyan-100/75">
                K-Means répond mieux à la question “quels grands segments de clients ?”.
                DBSCAN répond mieux à la question “où sont les zones denses et les anomalies ?”.
                Les deux lectures sont donc complémentaires.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

function InterpretationSection() {
  return (
    <section id="section-4" className="px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <SectionLabel icon={Sparkles} label="Interprétation globale" />

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl text-4xl font-bold text-white md:text-5xl"
        >
          Transformer les résultats techniques en décisions compréhensibles.
        </motion.h2>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-400">
          L’intérêt du projet ne se limite pas à exécuter quatre algorithmes. Le vrai
          objectif est de relier chaque résultat à une décision possible : mieux organiser
          les produits, recommander des combinaisons pertinentes, segmenter les clients et
          repérer les comportements atypiques.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <GlassCard>
            <Target className="h-7 w-7 text-cyan-200" />
            <h3 className="mt-5 text-xl font-semibold text-white">Recommandation de produits</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Les règles à lift élevé peuvent alimenter des suggestions de type “souvent
              achetés ensemble”, des packs promotionnels ou une meilleure organisation des
              produits dans une boutique en ligne.
            </p>
          </GlassCard>

          <GlassCard>
            <Users className="h-7 w-7 text-emerald-200" />
            <h3 className="mt-5 text-xl font-semibold text-white">Segmentation client</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Les profils RFM permettent d’adapter les actions CRM : fidélisation des
              meilleurs clients, réactivation des clients inactifs, ou campagnes ciblées
              pour les clients réguliers.
            </p>
          </GlassCard>

          <GlassCard>
            <BrainCircuit className="h-7 w-7 text-amber-200" />
            <h3 className="mt-5 text-xl font-semibold text-white">Profils atypiques</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              DBSCAN met en évidence des clients qui ne suivent pas les grands comportements
              majoritaires. Ces cas méritent une lecture séparée pour éviter de fausser les
              segments standards.
            </p>
          </GlassCard>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard>
            <h3 className="text-xl font-semibold text-white">Ce que l’on retient méthodologiquement</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Apriori", "Méthode très lisible pour expliquer la génération et le filtrage des motifs fréquents."],
                ["FP-Growth", "Méthode compacte qui illustre une autre stratégie, même si elle n’a pas gagné le benchmark ici."],
                ["K-Means", "Approche claire pour créer de grands segments clients interprétables."],
                ["DBSCAN", "Approche utile pour détecter les zones denses et les clients atypiques."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-xl font-semibold text-white">Limite importante</h3>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Les résultats dépendent du nettoyage, des paramètres et de l’échantillonnage.
              Pour les règles d’association, l’analyse a été contrôlée en gardant les
              produits les plus fréquents et un échantillon reproductible de transactions.
              Pour le clustering, les résultats dépendent fortement de la standardisation
              des variables et des paramètres comme K, eps et min_samples.
            </p>
            <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-7 text-cyan-100/80">
              Le projet doit donc être présenté comme une démarche analytique complète :
              préparation, extraction, visualisation, comparaison et interprétation.
            </p>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

function FlashcardsSection() {
  const baseCards = useMemo(
    () => [
      {
        type: "direct",
        question: "Qu’est-ce qu’une règle d’association ?",
        answer: "C’est une relation de type X → Y : lorsqu’un panier contient X, il a tendance à contenir aussi Y.",
      },
      {
        type: "direct",
        question: "Que mesure le support ?",
        answer: "Le support mesure la fréquence d’apparition d’une règle dans l’ensemble des paniers.",
      },
      {
        type: "direct",
        question: "Que mesure la confiance ?",
        answer: "La confiance mesure la probabilité d’obtenir Y lorsque X est déjà présent dans le panier.",
      },
      {
        type: "direct",
        question: "Comment interpréter un lift supérieur à 1 ?",
        answer: "Cela signifie que X et Y apparaissent ensemble plus souvent que ce que l’on obtiendrait par hasard.",
      },
      {
        type: "direct",
        question: "Que signifie RFM ?",
        answer: "RFM signifie Récence, Fréquence et Montant : trois indicateurs qui résument le comportement d’achat d’un client.",
      },
      {
        type: "direct",
        question: "Comment interpréter le score de silhouette obtenu ?",
        answer: "Un score autour de 0,41 indique une segmentation correcte mais non parfaite : les groupes sont exploitables, mais ils peuvent se chevaucher visuellement dans une projection 2D.",
      },
      {
        type: "direct",
        question: "Que représente le bruit dans DBSCAN ?",
        answer: "Le bruit correspond aux points qui ne rejoignent aucun groupe dense. Dans notre contexte, ce sont des clients atypiques.",
      },
      {
        type: "qcm",
        question: "Dans notre benchmark, quel algorithme d’association a été le plus rapide ?",
        choices: ["FP-Growth", "Apriori", "DBSCAN", "K-Means"],
        correctIndex: 1,
        answer: "Apriori a été plus rapide dans cette configuration réduite. FP-Growth reste intéressant pour discuter la montée en volume, mais il n’a pas gagné ce benchmark précis.",
      },
      {
        type: "qcm",
        question: "Quel paramètre doit être fixé avant d’utiliser K-Means ?",
        choices: ["Le nombre K de clusters", "Le lift minimal", "Le rayon eps", "Le pays du client"],
        correctIndex: 0,
        answer: "K-Means nécessite de choisir K, c’est-à-dire le nombre de clusters à construire.",
      },
      {
        type: "qcm",
        question: "Dans DBSCAN, que contrôlent eps et min_samples ?",
        choices: [
          "La taille du panier et le prix",
          "Le rayon du voisinage et le minimum de voisins",
          "Le support et la confiance",
          "Le nombre de centroïdes",
        ],
        correctIndex: 1,
        answer: "eps définit le rayon du voisinage et min_samples fixe le nombre minimum de voisins nécessaires pour former une zone dense.",
      },
      {
        type: "qcm",
        question: "Pourquoi les clusters peuvent-ils sembler se chevaucher sur le graphique ?",
        choices: [
          "Parce que le modèle n’a pas été exécuté",
          "Parce que le graphique est une projection 2D d’un espace RFM standardisé",
          "Parce que DBSCAN et K-Means donnent toujours les mêmes clusters",
          "Parce que le support est trop faible",
        ],
        correctIndex: 1,
        answer: "Le graphique montre seulement deux dimensions. Le clustering est calculé avec les variables RFM standardisées ; une séparation peut donc exister dans une dimension non visible, comme la récence.",
      },
    ],
    []
  );

  const [order, setOrder] = useState(() => baseCards.map((_, index) => index));
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);

  const card = baseCards[order[current] ?? 0];
  const isQcm = card.type === "qcm";
  const isCorrect = isQcm && selectedChoice === card.correctIndex;

  const resetCardState = () => {
    setFlipped(false);
    setSelectedChoice(null);
  };

  const nextCard = () => {
    resetCardState();
    setCurrent((prev) => (prev + 1) % order.length);
  };

  const previousCard = () => {
    resetCardState();
    setCurrent((prev) => (prev - 1 + order.length) % order.length);
  };

  const shuffleCards = () => {
    resetCardState();
    setOrder((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    setCurrent(0);
  };

  const revealAnswer = () => setFlipped(true);
  const hideAnswer = () => setFlipped(false);

  return (
    <section id="section-5" className="px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <SectionLabel icon={BrainCircuit} label="Cartes mémo de révision" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
        >
          <div>
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              Vérifier ce que l’audience a retenu.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Cette partie transforme la fin de la présentation en mini-révision
              interactive. Les cartes mélangent des questions directes et des QCM afin de
              tester les notions essentielles : règles d’association, métriques, RFM,
              K-Means, DBSCAN et lecture des clusters.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["7", "questions directes"],
                ["4", "QCM ciblés"],
                ["shuffle", "ordre aléatoire"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="relative mx-auto min-h-[420px] max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.16),transparent_30%)]" />

              <AnimatePresence mode="wait">
                {!flipped ? (
                  <motion.div
                    key={`front-${order[current]}`}
                    initial={{ opacity: 0, rotateY: -70, scale: 0.96 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, rotateY: 70, scale: 0.96 }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                    className="relative z-10 flex min-h-[360px] flex-col"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                        Question {current + 1}/{order.length}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
                        {isQcm ? "QCM" : "Question directe"}
                      </span>
                    </div>

                    <div className="mt-8 flex-1">
                      <p className="text-sm uppercase tracking-[0.25em] text-cyan-100/70">
                        À vous de répondre
                      </p>
                      <h3 className="mt-5 text-3xl font-bold leading-tight text-white">
                        {card.question}
                      </h3>

                      {isQcm && (
                        <div className="mt-7 grid gap-3">
                          {card.choices.map((choice, index) => (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => setSelectedChoice(index)}
                              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                selectedChoice === index
                                  ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-100"
                                  : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
                              }`}
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-semibold">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span>{choice}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs leading-5 text-slate-400">
                        {isQcm
                          ? "Choisissez une proposition, puis affichez la correction."
                          : "Réfléchissez à la réponse, puis affichez la correction."}
                      </p>
                      <button
                        type="button"
                        onClick={revealAnswer}
                        className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                      >
                        Afficher la réponse
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`back-${order[current]}`}
                    initial={{ opacity: 0, rotateY: 70, scale: 0.96 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, rotateY: -70, scale: 0.96 }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                    className="relative z-10 flex min-h-[360px] flex-col"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                        Correction
                      </span>
                      <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                    </div>

                    <div className="mt-8 flex-1">
                      {isQcm && (
                        <div className={`mb-5 rounded-2xl border p-4 ${
                          selectedChoice == null
                            ? "border-white/10 bg-white/[0.04] text-slate-300"
                            : isCorrect
                              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                              : "border-amber-300/20 bg-amber-300/10 text-amber-100"
                        }`}>
                          <p className="text-sm font-semibold">
                            {selectedChoice == null
                              ? "Aucune proposition sélectionnée."
                              : isCorrect
                                ? "Bonne réponse."
                                : "La proposition choisie n’était pas la bonne."}
                          </p>
                          <p className="mt-2 text-sm leading-6">
                            Réponse correcte : {String.fromCharCode(65 + card.correctIndex)} — {card.choices[card.correctIndex]}
                          </p>
                        </div>
                      )}

                      <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/70">
                        À retenir
                      </p>
                      <p className="mt-5 text-2xl font-semibold leading-9 text-white">
                        {card.answer}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={hideAnswer}
                        className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Revoir la question
                      </button>
                      <button
                        type="button"
                        onClick={nextCard}
                        className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                      >
                        Question suivante
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={previousCard}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Précédente
              </button>
              <button
                type="button"
                onClick={flipped ? hideAnswer : revealAnswer}
                className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                {flipped ? "Masquer la réponse" : "Afficher la réponse"}
              </button>
              <button
                type="button"
                onClick={nextCard}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Suivante
              </button>
              <button
                type="button"
                onClick={shuffleCards}
                className="inline-flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-300/10 px-5 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-300/20"
              >
                <RefreshCw className="h-4 w-4" />
                Mélanger
              </button>
            </div>

            <div className="mt-5 flex justify-center gap-2">
              {order.map((_, index) => (
                <span
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === current ? "w-8 bg-cyan-300" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ConclusionSection() {
  return (
    <section id="section-6" className="px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-5xl text-center">
        <SectionLabel icon={CheckCircle2} label="Conclusion" />

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-white md:text-6xl"
        >
          Une analyse complète, de la donnée brute à l’interprétation.
        </motion.h2>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">
          Ce projet montre comment des données transactionnelles peuvent être exploitées
          à deux niveaux complémentaires. Les règles d’association mettent en évidence
          les produits qui apparaissent ensemble dans les paniers, tandis que le clustering
          transforme les historiques d’achat en segments clients et en profils atypiques.
        </p>

        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-400">
          La comparaison entre les algorithmes rappelle aussi une idée importante : un
          modèle ne doit pas être jugé uniquement par sa réputation théorique, mais par
          ses résultats dans un contexte donné. Ici, Apriori s’est montré plus rapide que
          FP-Growth sur l’échantillon utilisé, alors que FP-Growth reste intéressant pour
          discuter la montée en volume. De la même manière, K-Means et DBSCAN ne répondent
          pas exactement à la même question, mais offrent deux lectures complémentaires
          du comportement client.
        </p>

        <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
          {[
            ["Règles", "Identifier les associations de produits utiles pour la recommandation."],
            ["Segments", "Comprendre les groupes de clients à partir des indicateurs RFM."],
            ["Décision", "Transformer les résultats techniques en actions marketing possibles."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
              <p className="font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function RetailAIStorytellingApp() {
  const [activeSection, setActiveSection] = useState(0);
  const params = useMemo(
    () => ({
      minSupport: 0.02,
      minConf: 0.3,
      eps: 0.289,
      minSamples: 8,
      bestK: 3,
      silhouetteScore: 0.411945,
      randomState: 42,
    }),
    []
  );

  const [dataState, setDataState] = useState(() => ({
  loading: true,
  error: null,
  aprioriRules: [],
  fpRules: [],
  customers: [],
  customerTotal: 0,
  kmeansProfile: [],
  dbscanProfile: [],
  kmeansLabels: {},
  aprioriTotal: 0,
  fpTotal: 0,
  datasetSummary: [],
  topProducts: [],
  topCountries: [],
  monthlyRevenue: [],
  basketDistribution: [],
  algorithmBenchmark: [],
}));

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const fetchText = async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
          return res.text();
        };

        const [
          aprioriText,
          fpText,
          kmeansText,
          dbscanText,
          customersText,
          datasetSummaryText,
          topProductsText,
          topCountriesText,
          monthlyRevenueText,
          basketDistributionText,
          benchmarkText,
        ] = await Promise.all([
          fetchText("/data/apriori_rules.csv"),
          fetchText("/data/fpgrowth_rules.csv"),
          fetchText("/data/kmeans_profile.csv"),
          fetchText("/data/dbscan_profile.csv"),
          fetchText("/data/customer_clusters.csv"),
          fetchText("/data/dataset_summary.csv"),
          fetchText("/data/top_products.csv"),
          fetchText("/data/top_countries.csv"),
          fetchText("/data/monthly_revenue.csv"),
          fetchText("/data/basket_distribution.csv"),
          fetchText("/data/algorithm_benchmark.csv"),
        ]);

        const aprioriRules = parseCsv(aprioriText)
          .map((row) => ({
            antecedent: formatRuleSide(row.antecedent),
            consequent: formatRuleSide(row.consequent),
            support: toNumber(row.support),
            confidence: toNumber(row.confidence),
            lift: toNumber(row.lift),
          }))
          .filter((r) => r.antecedent && r.consequent)
          .sort((a, b) => (b.lift ?? 0) - (a.lift ?? 0));

        const fpRules = parseCsv(fpText)
          .map((row) => ({
            antecedent: formatRuleSide(row.antecedent),
            consequent: formatRuleSide(row.consequent),
            support: toNumber(row.support),
            confidence: toNumber(row.confidence),
            lift: toNumber(row.lift),
            supportCount: toNumber(row.support_count),
          }))
          .filter((r) => r.antecedent && r.consequent)
          .sort((a, b) => (b.lift ?? 0) - (a.lift ?? 0));

        const kmeansProfileRaw = parseCsv(kmeansText)
          .map((row) => ({
            clusterId: toNumber(row.KMeansCluster),
            clients: toNumber(row.Clients),
            recency: toNumber(row.Recency_mean),
            frequency: toNumber(row.Frequency_mean),
            monetary: toNumber(row.Monetary_mean),
          }))
          .filter((r) => r.clusterId != null);

        const sortedByValue = [...kmeansProfileRaw].sort((a, b) => (a.monetary ?? 0) - (b.monetary ?? 0));
        const kmeansLabels = {};
        if (sortedByValue.length >= 1) kmeansLabels[sortedByValue[0].clusterId] = "Faible valeur";
        if (sortedByValue.length >= 2) kmeansLabels[sortedByValue[1].clusterId] = "Clients réguliers";
        if (sortedByValue.length >= 3) kmeansLabels[sortedByValue[2].clusterId] = "Forte valeur";

        const kmeansProfile = kmeansProfileRaw
          .map((row) => ({
            cluster: kmeansLabels[row.clusterId] ? `${kmeansLabels[row.clusterId]} (Cluster ${row.clusterId})` : `Cluster ${row.clusterId}`,
            clients: row.clients ?? 0,
            recency: row.recency ?? 0,
            frequency: row.frequency ?? 0,
            monetary: row.monetary ?? 0,
          }))
          .sort((a, b) => b.clients - a.clients);

        const dbscanProfile = parseCsv(dbscanText)
          .map((row) => {
            const clusterId = toNumber(row.DBSCANCluster);
            const label = clusterId === -1 ? "Bruit / atypiques" : `Cluster ${clusterId}`;
            return {
              clusterId,
              cluster: label,
              clients: toNumber(row.Clients) ?? 0,
              recency: toNumber(row.Recency_mean) ?? 0,
              frequency: toNumber(row.Frequency_mean) ?? 0,
              monetary: toNumber(row.Monetary_mean) ?? 0,
            };
          })
          .filter((r) => r.clusterId != null)
          .sort((a, b) => b.clients - a.clients);

        const customersAll = parseCsv(customersText)
          .map((row) => ({
            id: row.CustomerID,
            recency: toNumber(row.Recency) ?? 0,
            frequency: toNumber(row.Frequency) ?? 0,
            monetary: toNumber(row.Monetary) ?? 0,
            kmeansCluster: toNumber(row.KMeansCluster),
            dbscanCluster: toNumber(row.DBSCANCluster),
          }))
          .filter((c) => c.id);

        const datasetSummary = parseCsv(datasetSummaryText).map((row) => ({
          indicateur: row.Indicateur,
          valeur: toNumber(row.Valeur),
        }));

        const topProducts = parseCsv(topProductsText)
          .map((row) => ({
            Produit: row.Produit,
            Quantite: toNumber(row.Quantite) ?? 0,
          }))
          .filter((row) => row.Produit);

        const topCountries = parseCsv(topCountriesText)
          .map((row) => ({
            Pays: row.Pays,
            ChiffreAffaires: toNumber(row.ChiffreAffaires) ?? 0,
          }))
          .filter((row) => row.Pays);

        const monthlyRevenue = parseCsv(monthlyRevenueText)
          .map((row) => ({
            Mois: row.Mois,
            ChiffreAffaires: toNumber(row.ChiffreAffaires) ?? 0,
          }))
          .filter((row) => row.Mois);

        const basketDistribution = parseCsv(basketDistributionText)
          .map((row) => ({
            TaillePanier: toNumber(row.TaillePanier) ?? 0,
            NombreFactures: toNumber(row.NombreFactures) ?? 0,
          }))
          .filter((row) => row.TaillePanier > 0);

          const algorithmBenchmark = parseCsv(benchmarkText)
            .map((row) => ({
              algorithm: row.Algorithme,
              seconds: toNumber(row.TempsSecondes),
              task: row.Tache,
              reading: row.Lecture,
            }))
            .filter((row) => row.algorithm && row.seconds != null);

        const maxPoints = 900;
        const stride = Math.max(1, Math.floor(customersAll.length / maxPoints));
        const customers = customersAll.filter((_, idx) => idx % stride === 0).slice(0, maxPoints);

        if (canceled) return;
        setDataState({
          loading: false,
          error: null,
          aprioriRules,
          fpRules,
          customers,
          customerTotal: customersAll.length,
          kmeansProfile,
          dbscanProfile,
          kmeansLabels,
          aprioriTotal: aprioriRules.length,
          fpTotal: fpRules.length,
          datasetSummary,
          topProducts,
          topCountries,
          monthlyRevenue,
          basketDistribution,
          algorithmBenchmark,
        });
      } catch (err) {
        if (canceled) return;
        setDataState((prev) => ({ ...prev, loading: false, error: err?.message ?? String(err) }));
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const updateActiveSection = () => {
      const anchor = window.innerHeight * 0.42;
      let currentIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((_, index) => {
        const section = document.getElementById(`section-${index}`);
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - anchor);

        if (rect.top <= anchor && rect.bottom > 80) {
          currentIndex = index;
          closestDistance = distance;
        } else if (currentIndex === 0 && distance < closestDistance) {
          currentIndex = index;
          closestDistance = distance;
        }
      });

      setActiveSection(currentIndex);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const aprioriTopRules = useMemo(() => dataState.aprioriRules.slice(0, 12), [dataState.aprioriRules]);
  const fpTopRules = useMemo(() => dataState.fpRules.slice(0, 12), [dataState.fpRules]);

  const comparisonData = useMemo(() => {
    const summarizeRules = (name, rules) => {
      const safeRules = rules ?? [];

      const avg = (key) => {
        if (safeRules.length === 0) return 0;
        return Number(
          (
            safeRules.reduce((sum, rule) => sum + (Number(rule[key]) || 0), 0) /
            safeRules.length
          ).toFixed(3)
        );
      };

      const max = (key) => {
        if (safeRules.length === 0) return 0;
        return Number(Math.max(...safeRules.map((rule) => Number(rule[key]) || 0)).toFixed(3));
      };

      const benchmark = dataState.algorithmBenchmark.find(
        (row) => row.algorithm === name
      );

      return {
        name,
        rules: safeRules.length,
        avgLift: avg("lift"),
        maxLift: max("lift"),
        avgConf: avg("confidence"),
        timeSeconds: benchmark?.seconds ?? null,
        reading: benchmark?.reading ?? "",
      };
    };

    return [
      summarizeRules("Apriori", dataState.aprioriRules),
      summarizeRules("FP-Growth", dataState.fpRules),
    ];
  }, [dataState.aprioriRules, dataState.fpRules, dataState.algorithmBenchmark]);

  
  return (
    <div className="min-h-screen scroll-smooth bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:54px_54px]" />
      <SideProgress activeIndex={activeSection} />
      <main className="relative z-10">
        <Hero />
        <DatasetSection
          datasetSummary={dataState.datasetSummary}
          topProducts={dataState.topProducts}
          topCountries={dataState.topCountries}
          monthlyRevenue={dataState.monthlyRevenue}
          basketDistribution={dataState.basketDistribution}
        />
        <AssociationSection
          aprioriRules={aprioriTopRules}
          fpRules={fpTopRules}
          aprioriTotal={dataState.aprioriTotal}
          fpTotal={dataState.fpTotal}
          params={params}
          comparisonData={comparisonData}
        />
        <ClusteringSection
          kmeansProfile={dataState.kmeansProfile}
          dbscanProfile={dataState.dbscanProfile}
          customers={dataState.customers}
          params={params}
          kmeansLabels={dataState.kmeansLabels}
          algorithmBenchmark={dataState.algorithmBenchmark}
        />
        <InterpretationSection />
        <FlashcardsSection />
        <ConclusionSection />
      </main>

      <AnimatePresence>
        {dataState.loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 rounded-3xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-slate-200 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            Chargement des résultats CSV…
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!dataState.loading && dataState.error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 max-w-md rounded-3xl border border-rose-300/20 bg-rose-300/10 px-5 py-4 text-sm text-rose-100 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            <p className="font-semibold">Impossible de charger les fichiers CSV.</p>
            <p className="mt-1 text-xs text-rose-100/80">Erreur: {dataState.error}</p>
            <p className="mt-3 text-xs text-rose-100/80">
              Vérifiez que les fichiers existent dans `public/data/` et que le serveur Vite est relancé.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
