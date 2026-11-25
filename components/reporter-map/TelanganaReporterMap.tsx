"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { DistrictProps, MandalProps, Reporter } from "./types";
import s from "./TelanganaReporterMap.module.css";

type DFeature = Feature<Geometry, DistrictProps>;
type MFeature = Feature<Geometry, MandalProps>;

type Props = {
  reporters: Reporter[];
  /** Papers to show as filter chips. Defaults to unique papers in `reporters`. */
  papers?: string[];
  /** Where the GeoJSON files are served from. */
  geoBase?: string;
  title?: string;
};

const W = 760;
const H = 640;
// 0 = coverage gap (warm tint), then 5 steps of blue
const GAP = "#fbe3dc";
const STEPS = ["#d6e6f5", "#9ec5e8", "#5d9fd6", "#2b74b8", "#13467e"];

// distinct colours per district (like the classic Telangana district map)
const DISTRICT_COLORS: Record<string, string> = {
  // exact colours sampled from the reference Telangana district map
  adilabad: "#7bd4ff", "kumuram-bheem-asifabad": "#f8fc6c", nirmal: "#d0fdfa", mancherial: "#0013a5",
  jagitial: "#61990a", nizamabad: "#a15afb", peddapalli: "#00ffaa", "jayashankar-bhupalpally": "#1ffd82",
  "rajanna-sircilla": "#9a9a07", karimnagar: "#c0ff00", kamareddy: "#f46041", mulugu: "#527dd0",
  medak: "#0046a3", siddipet: "#0cc6cd", hanumakonda: "#0072ff", warangal: "#009512",
  sangareddy: "#004903", jangaon: "#f46041", mahabubabad: "#f16bf5", "bhadradri-kothagudem": "#a3fa62",
  "medchal-malkajgiri": "#cb0101", hyderabad: "#ffd8ff", "yadadri-bhuvanagiri": "#45f441", vikarabad: "#0cc6cd",
  "ranga-reddy": "#cbc901", khammam: "#4c88fc", suryapet: "#fb7d28", nalgonda: "#f83b63",
  narayanpet: "#c25700", mahabubnagar: "#3049dc", wanaparthy: "#17bbce", nagarkurnool: "#49e32f",
  "jogulamba-gadwal": "#b5af14",
};
// dark fills need white labels
const DARK = new Set(["mancherial", "medak", "sangareddy", "mahabubnagar", "warangal", "medchal-malkajgiri", "hanumakonda", "narayanpet", "jagitial"]);
const PIN_ON = "#111827";
const PIN_GAP = "#e11d2e";

/** Teardrop map-pin with its tip at (0,0); head centre at (0, -2.2r). */
function pinPath(r: number) {
  const h = r * 2.2;
  return `M0,0 C${-r * 0.55},${-r * 1.15} ${-r},${-r * 1.55} ${-r},${-h} A${r},${r} 0 1 1 ${r},${-h} C${r},${-r * 1.55} ${r * 0.55},${-r * 1.15} 0,0Z`;
}

function colorFor(n: number, max: number) {
  if (n <= 0) return GAP;
  // when max is small, start from a mid shade so 1–2 reporters are still clearly visible
  const offset = Math.max(0, STEPS.length - max);
  const i = Math.min(STEPS.length - 1, offset + Math.floor(((n - 1) / max) * (STEPS.length - offset)));
  return STEPS[i];
}

function pickMarkerImage(reps: Reporter[]): string | null {
  if (!reps.length) return null;
  const sorted = [...reps].sort((a, b) => (b.activityScore ?? 0) - (a.activityScore ?? 0));
  const top = sorted[0];
  if (top.photoUrl) return top.photoUrl;
  if (top.paperLogoUrl) return top.paperLogoUrl;
  for (const r of sorted) {
    if (r.paperLogoUrl) return r.paperLogoUrl;
  }
  return null;
}

type MapAvatarProps = {
  id: string;
  big: boolean;
  count: number;
  src: string | null;
  gap: boolean;
  pinR: number;
};

function MapAvatarMarker({ id, big, count, src, gap, pinR }: MapAvatarProps) {
  const r = big ? 14 : pinR;
  const cy = big ? -r - 4 : -r * 1.05;
  const clipId = `mk-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  if (gap) {
    return (
      <g>
        <circle cy={cy} r={big ? 6 : 3.6} fill={PIN_GAP} stroke="#fff" strokeWidth={1.2} className={s.gapDot} />
      </g>
    );
  }
  if (src) {
    const d = r * 2;
    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <circle cy={cy} r={r - 0.6} />
          </clipPath>
        </defs>
        <circle cy={cy} r={r + 0.8} fill="#fff" stroke="#111827" strokeWidth={big ? 2 : 1.2} className={s.avatarRing} />
        <image
          href={src}
          x={-r}
          y={cy - r}
          width={d}
          height={d}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
          className={s.avatarImg}
        />
        {count > 1 && (
          <text y={cy + r + (big ? 14 : 8)} className={s.pinN}>
            +{count - 1}
          </text>
        )}
      </g>
    );
  }
  return <path d={pinPath(big ? pinR * 1.25 : pinR)} fill={PIN_ON} />;
}

export default function TelanganaReporterMap({
  reporters,
  papers,
  geoBase = "/geo",
  title = "Telangana Reporter Coverage",
}: Props) {
  const [districts, setDistricts] = useState<DFeature[] | null>(null);
  const [mandals, setMandals] = useState<MFeature[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paper, setPaper] = useState<string>("ALL");
  const [level, setLevel] = useState<"district" | "mandal">("district");
  const [mapStyle, setMapStyle] = useState<"color" | "heat">("color");
  const [pinFilter, setPinFilter] = useState<"all" | "covered" | "gaps">("all");
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [mandalId, setMandalId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ id: string; name: string; sub?: string; n: number; x: number; y: number } | null>(null);
  const [tab, setTab] = useState<"rank" | "gaps">("rank");
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${geoBase}/telangana-districts.json`).then((r) => r.json()),
      fetch(`${geoBase}/telangana-mandals.json`).then((r) => r.json()),
    ])
      .then(([d, m]: [FeatureCollection<Geometry, DistrictProps>, FeatureCollection<Geometry, MandalProps>]) => {
        setDistricts(d.features);
        setMandals(m.features);
      })
      .catch(() => setError("Map data load avvaledu — /public/geo files check cheyyandi"));
  }, [geoBase]);

  const paperList = useMemo(
    () => papers ?? Array.from(new Set(reporters.map((r) => r.paper))).sort(),
    [papers, reporters]
  );

  const mandalById = useMemo(() => {
    const m = new Map<string, MandalProps>();
    mandals?.forEach((f) => m.set(f.properties.id, f.properties));
    return m;
  }, [mandals]);

  const filtered = useMemo(
    () => (paper === "ALL" ? reporters : reporters.filter((r) => r.paper === paper)),
    [reporters, paper]
  );

  const unmapped = useMemo(
    () => (mandals ? filtered.filter((r) => !mandalById.has(r.mandalId)) : []),
    [filtered, mandalById, mandals]
  );

  // counts
  const { byMandal, byDistrict } = useMemo(() => {
    const byMandal = new Map<string, number>();
    const byDistrict = new Map<string, number>();
    for (const r of filtered) {
      const m = mandalById.get(r.mandalId);
      if (!m) continue;
      byMandal.set(r.mandalId, (byMandal.get(r.mandalId) ?? 0) + 1);
      byDistrict.set(m.districtId, (byDistrict.get(m.districtId) ?? 0) + 1);
    }
    return { byMandal, byDistrict };
  }, [filtered, mandalById]);

  const reportersByMandal = useMemo(() => {
    const m = new Map<string, Reporter[]>();
    for (const r of filtered) {
      const arr = m.get(r.mandalId) ?? [];
      arr.push(r);
      m.set(r.mandalId, arr);
    }
    return m;
  }, [filtered]);

  // what is drawn as filled shapes
  const colorMode = mapStyle === "color";
  const showMandals = colorMode ? districtId !== null : level === "mandal" || districtId !== null;
  const visibleMandals = useMemo(
    () => (mandals ?? []).filter((f) => !districtId || f.properties.districtId === districtId),
    [mandals, districtId]
  );
  const visibleDistricts = useMemo(
    () => (districts ?? []).filter((f) => !districtId || f.properties.id === districtId),
    [districts, districtId]
  );

  const { path, proj } = useMemo(() => {
    const fit: FeatureCollection = {
      type: "FeatureCollection",
      features: districtId ? visibleDistricts : districts ?? [],
    };
    const proj = geoMercator().fitExtent([[16, districtId ? 40 : 24], [W - 16, H - 16]], fit);
    return { path: geoPath(proj), proj };
  }, [districts, visibleDistricts, districtId]);

  /** Full-state overview (inset) — separate projection */
  const mini = useMemo(() => {
    if (!districts?.length) return null;
    const mw = 156;
    const mh = 118;
    const mp = geoMercator().fitSize([mw, mh], {
      type: "FeatureCollection",
      features: districts,
    } as FeatureCollection);
    return { path: geoPath(mp), w: mw, h: mh };
  }, [districts]);

  const pins = useMemo(() => {
    if (!colorMode) return [];
    return visibleMandals
      .map((f) => {
        const n = byMandal.get(f.properties.id) ?? 0;
        const xy = f.properties.pin ? proj(f.properties.pin) : path.centroid(f);
        return { f, n, x: xy?.[0] ?? 0, y: xy?.[1] ?? 0 };
      })
      .filter((p) => (pinFilter === "covered" ? p.n > 0 : pinFilter === "gaps" ? p.n === 0 : true))
      .sort((a, b) => a.y - b.y); // lower pins drawn on top
  }, [colorMode, visibleMandals, byMandal, proj, path, pinFilter]);

  const max = useMemo(() => {
    if (showMandals) return Math.max(1, ...visibleMandals.map((f) => byMandal.get(f.properties.id) ?? 0));
    return Math.max(1, ...(districts ?? []).map((f) => byDistrict.get(f.properties.id) ?? 0));
  }, [showMandals, visibleMandals, districts, byMandal, byDistrict]);

  // sidebar rows for the current view
  const rows = useMemo(() => {
    const list = showMandals
      ? visibleMandals.map((f) => ({
          id: f.properties.id,
          name: f.properties.name,
          sub: districtId ? undefined : f.properties.district,
          n: byMandal.get(f.properties.id) ?? 0,
          kind: "mandal" as const,
        }))
      : (districts ?? []).map((f) => ({
          id: f.properties.id,
          name: f.properties.name,
          sub: `${(mandals ?? []).filter((m) => m.properties.districtId === f.properties.id).length} mandals`,
          n: byDistrict.get(f.properties.id) ?? 0,
          kind: "district" as const,
        }));
    const q = query.trim().toLowerCase();
    return list
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.sub?.toLowerCase().includes(q))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [showMandals, visibleMandals, districts, mandals, byMandal, byDistrict, districtId, query]);

  const scopeMandals = districtId ? visibleMandals : mandals ?? [];
  const covered = scopeMandals.filter((f) => (byMandal.get(f.properties.id) ?? 0) > 0).length;
  const scopeTotal = districtId ? byDistrict.get(districtId) ?? 0 : filtered.length - unmapped.length;
  const gaps = rows.filter((r) => r.n === 0);
  const gapMandals = scopeMandals
    .filter((f) => (byMandal.get(f.properties.id) ?? 0) === 0)
    .map((f) => f.properties)
    .filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.district.localeCompare(b.district) || a.name.localeCompare(b.name));

  const selectedMandal = mandalId ? mandalById.get(mandalId) : null;
  const mandalReporters = useMemo(() => {
    if (!mandalId) return [];
    return filtered
      .filter((r) => r.mandalId === mandalId)
      .sort((a, b) => (b.activityScore ?? 0) - (a.activityScore ?? 0) || a.name.localeCompare(b.name));
  }, [mandalId, filtered]);
  const paperBreakdown = useMemo(() => {
    const scope = districtId
      ? reporters.filter((r) => mandalById.get(r.mandalId)?.districtId === districtId)
      : reporters;
    const m = new Map<string, number>();
    scope.forEach((r) => m.set(r.paper, (m.get(r.paper) ?? 0) + 1));
    return paperList.map((p) => ({ paper: p, n: m.get(p) ?? 0 }));
  }, [reporters, districtId, mandalById, paperList]);

  function openDistrict(id: string) {
    setDistrictId(id);
    setMandalId(null);
    setQuery("");
    setHover(null);
  }
  function back() {
    setDistrictId(null);
    setMandalId(null);
    setQuery("");
    setHover(null);
  }
  function onMove(e: React.MouseEvent, id: string, name: string, n: number, sub?: string) {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    setHover({ id, name, sub, n, x: e.clientX - box.left, y: e.clientY - box.top });
  }

  const districtName = districtId ? districts?.find((d) => d.properties.id === districtId)?.properties.name : null;

  if (error) return <div className={s.error}>{error}</div>;

  return (
    <div className={s.root}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>{title}</h1>
          <div className={s.crumbs}>
            <button className={s.crumb} onClick={back} disabled={!districtId}>
              Telangana
            </button>
            {districtName && (
              <>
                <span>›</span>
                <button className={s.crumb} onClick={() => setMandalId(null)}>{districtName}</button>
              </>
            )}
            {selectedMandal && (
              <>
                <span>›</span>
                <span className={s.crumbCur}>{selectedMandal.name}</span>
              </>
            )}
          </div>
        </div>
        <div className={s.controls}>
          <div className={s.toggle} role="tablist" aria-label="Map style">
            <button className={colorMode ? s.on : ""} onClick={() => setMapStyle("color")}>Colour + Pins</button>
            <button className={!colorMode ? s.on : ""} onClick={() => setMapStyle("heat")}>Heatmap</button>
          </div>
          {colorMode ? (
            <div className={s.toggle} role="tablist" aria-label="Pins">
              <button className={pinFilter === "all" ? s.on : ""} onClick={() => setPinFilter("all")}>All pins</button>
              <button className={pinFilter === "covered" ? s.on : ""} onClick={() => setPinFilter("covered")}>Reporters unnavi</button>
              <button className={pinFilter === "gaps" ? s.on : ""} onClick={() => setPinFilter("gaps")}>Gaps</button>
            </div>
          ) : (
            !districtId && (
              <div className={s.toggle} role="tablist">
                <button className={level === "district" ? s.on : ""} onClick={() => setLevel("district")}>Districts</button>
                <button className={level === "mandal" ? s.on : ""} onClick={() => setLevel("mandal")}>Mandals</button>
              </div>
            )
          )}
        </div>
      </header>

      <div className={s.chips}>
        {["ALL", ...paperList].map((p) => (
          <button key={p} className={`${s.chip} ${paper === p ? s.chipOn : ""}`} onClick={() => setPaper(p)}>
            {p === "ALL" ? "All papers" : p}
            <span className={s.chipN}>
              {p === "ALL" ? paperBreakdown.reduce((a, b) => a + b.n, 0) : paperBreakdown.find((x) => x.paper === p)?.n ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className={s.stats}>
        <Stat label="Reporters" value={scopeTotal} />
        <Stat label="Mandals covered" value={`${covered} / ${scopeMandals.length}`} />
        <Stat label="Coverage gaps" value={scopeMandals.length - covered} warn />
        <Stat label="Coverage" value={scopeMandals.length ? `${Math.round((covered / scopeMandals.length) * 100)}%` : "–"} />
      </div>

      <div className={s.body}>
        <div className={s.mapWrap} ref={wrapRef} onMouseLeave={() => setHover(null)}>
          {districtId && (
            <button type="button" className={s.mapBack} onClick={back}>
              ← Telangana map
            </button>
          )}
          {!districts || !mandals ? (
            <div className={s.loading}>Map load avutondi…</div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={title}>
              {colorMode ? (
                <>
                  {districtId &&
                    districts.map((f) =>
                      f.properties.id !== districtId ? (
                        <path
                          key={`ghost-d-${f.properties.id}`}
                          d={path(f) ?? ""}
                          className={s.ghostDistrict}
                          pointerEvents="none"
                        />
                      ) : null
                    )}
                  {visibleDistricts.map((f) => {
                    const n = byDistrict.get(f.properties.id) ?? 0;
                    return (
                      <path
                        key={f.properties.id}
                        d={path(f) ?? ""}
                        fill={DISTRICT_COLORS[f.properties.id] ?? "#ddd"}
                        className={`${s.cDistrict} ${!districtId && hover?.id === f.properties.id ? s.cHov : ""}`}
                        onMouseMove={(e) => !districtId && onMove(e, f.properties.id, f.properties.name, n)}
                        onClick={() => !districtId && openDistrict(f.properties.id)}
                      />
                    );
                  })}
                  {districtId &&
                    visibleMandals.map((f) => (
                      <path
                        key={"m" + f.properties.id}
                        d={path(f) ?? ""}
                        className={`${s.cMandal} ${f.properties.id === mandalId ? s.cMandalSel : ""}`}
                        onClick={() => setMandalId(f.properties.id)}
                      />
                    ))}
                  {pins.map(({ f, n, x, y }) => {
                    const big = !!districtId;
                    const r = big ? 9 : 4.2;
                    const sel = f.properties.id === mandalId;
                    const reps = reportersByMandal.get(f.properties.id) ?? [];
                    const markerSrc = n > 0 ? pickMarkerImage(reps) : null;
                    return (
                      <g
                        key={"p" + f.properties.id}
                        transform={`translate(${x},${y})`}
                        className={`${s.pin} ${sel ? s.pinSel : ""}`}
                        onMouseMove={(e) => onMove(e, f.properties.id, f.properties.name, n, f.properties.district)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!districtId) openDistrict(f.properties.districtId);
                          setMandalId(f.properties.id);
                        }}
                      >
                        <MapAvatarMarker
                          id={f.properties.id}
                          big={big}
                          count={n}
                          src={markerSrc}
                          gap={n <= 0}
                          pinR={r}
                        />
                        {big && (
                          <>
                            <text y={big && markerSrc ? -36 : -(r * 2.2)} className={s.pinN}>
                              {n}
                            </text>
                            <text y={12} className={s.pinName}>
                              {f.properties.name}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                  {!districtId &&
                    visibleDistricts.map((f) => {
                      const [x, y] = path.centroid(f);
                      return (
                        <text
                          key={"l" + f.properties.id}
                          x={x}
                          y={y}
                          className={`${s.cLabel} ${DARK.has(f.properties.id) ? s.cLabelLight : ""}`}
                        >
                          {shortName(f.properties.name)}
                        </text>
                      );
                    })}
                </>
              ) : (
              <>
              {districtId &&
                districts.map((f) =>
                  f.properties.id !== districtId ? (
                    <path key={`ghost-h-${f.properties.id}`} d={path(f) ?? ""} className={s.ghostDistrict} pointerEvents="none" />
                  ) : (
                    <path
                      key={`ghost-focus-${f.properties.id}`}
                      d={path(f) ?? ""}
                      fill={DISTRICT_COLORS[f.properties.id] ?? "#ddd"}
                      opacity={0.22}
                      className={s.ghostDistrictFocus}
                      pointerEvents="none"
                    />
                  )
                )}
              {showMandals
                ? visibleMandals.map((f) => {
                    const n = byMandal.get(f.properties.id) ?? 0;
                    const sel = f.properties.id === mandalId;
                    return (
                      <path
                        key={f.properties.id}
                        d={path(f) ?? ""}
                        fill={colorFor(n, max)}
                        className={`${s.mandal} ${sel ? s.sel : ""} ${hover?.id === f.properties.id ? s.hov : ""}`}
                        onMouseMove={(e) => onMove(e, f.properties.id, f.properties.name, n, f.properties.district)}
                        onClick={() => {
                          if (!districtId) openDistrict(f.properties.districtId);
                          setMandalId(f.properties.id);
                        }}
                      />
                    );
                  })
                : visibleDistricts.map((f) => {
                    const n = byDistrict.get(f.properties.id) ?? 0;
                    return (
                      <path
                        key={f.properties.id}
                        d={path(f) ?? ""}
                        fill={colorFor(n, max)}
                        className={`${s.district} ${hover?.id === f.properties.id ? s.hov : ""}`}
                        onMouseMove={(e) => onMove(e, f.properties.id, f.properties.name, n)}
                        onClick={() => openDistrict(f.properties.id)}
                      />
                    );
                  })}

              {/* district outlines on top when showing mandals */}
              {showMandals &&
                visibleDistricts.map((f) => (
                  <path key={"o" + f.properties.id} d={path(f) ?? ""} className={s.outline} />
                ))}

              {/* labels */}
              {!showMandals &&
                visibleDistricts.map((f) => {
                  const [x, y] = path.centroid(f);
                  const n = byDistrict.get(f.properties.id) ?? 0;
                  return (
                    <g key={"l" + f.properties.id} className={s.label} transform={`translate(${x},${y})`}>
                      <text className={n > max * 0.6 ? s.labelLight : ""} y={-2}>{shortName(f.properties.name)}</text>
                      <text className={`${s.labelN} ${n > max * 0.6 ? s.labelLight : ""}`} y={11}>{n}</text>
                    </g>
                  );
                })}
              {districtId &&
                visibleMandals.map((f) => {
                  const [x, y] = path.centroid(f);
                  const n = byMandal.get(f.properties.id) ?? 0;
                  return (
                    <g key={"l" + f.properties.id} className={s.label} transform={`translate(${x},${y})`}>
                      <text className={n > max * 0.6 ? s.labelLight : ""} y={-2}>{f.properties.name}</text>
                      <text className={`${s.labelN} ${n > max * 0.6 ? s.labelLight : ""}`} y={11}>{n}</text>
                    </g>
                  );
                })}
              </>
              )}
            </svg>
          )}

          {mini && districtId && (
            <button type="button" className={s.miniMap} onClick={back} aria-label="Telangana mapku back">
              <span className={s.miniMapLabel}>Telangana</span>
              <svg width={mini.w} height={mini.h} viewBox={`0 0 ${mini.w} ${mini.h}`} className={s.miniSvg}>
                {districts!.map((f) => (
                  <path
                    key={`mini-${f.properties.id}`}
                    d={mini.path(f) ?? ""}
                    className={f.properties.id === districtId ? s.miniSel : s.miniDist}
                  />
                ))}
              </svg>
            </button>
          )}

          {hover && (
            <div className={s.tip} style={{ left: hover.x + 14, top: hover.y + 14 }}>
              <strong>{hover.name}</strong>
              {hover.sub && !districtId && <span className={s.tipSub}>{hover.sub}</span>}
              <span>
                {hover.n === 0 ? <em className={s.gapTxt}>Reporter ledu</em> : `${hover.n} reporter${hover.n > 1 ? "s" : ""}`}
              </span>
            </div>
          )}

          {colorMode ? (
            <div className={s.legend}>
              <div className={s.legRow}>
                <span className={s.legAvatar} />
                <span>Reporter photo / paper logo</span>
              </div>
              <div className={s.legRow}>
                <span className={s.legGapDot} />
                <span>Reporter ledu (gap)</span>
              </div>
            </div>
          ) : (
            <Legend max={max} />
          )}
        </div>

        <aside className={s.side}>
          {selectedMandal ? (
            <div className={s.panel}>
              <div className={s.panelHead}>
                <div>
                  <h2>{selectedMandal.name}</h2>
                  <p className={s.muted}>{selectedMandal.district} district · {paper === "ALL" ? "All papers" : paper}</p>
                </div>
                <button className={s.close} onClick={() => setMandalId(null)} aria-label="Close">×</button>
              </div>
              {mandalReporters.length === 0 ? (
                <p className={s.empty}>Ee mandal lo reporter ledu — recruit cheyyali.</p>
              ) : (
                <ul className={s.repList}>
                  {mandalReporters.map((r) => (
                    <li key={r.id}>
                      {(r.photoUrl || r.paperLogoUrl) && (
                        <img
                          src={r.photoUrl || r.paperLogoUrl}
                          alt=""
                          className={s.repThumb}
                          loading="lazy"
                        />
                      )}
                      <div>
                        <strong>{r.name}</strong>
                        <span className={s.muted}>{r.role ?? "Reporter"} · {r.paper}</span>
                      </div>
                      {r.phone && <a href={`tel:${r.phone}`} className={s.phone}>{r.phone}</a>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className={s.panel}>
              <div className={s.tabs}>
                <button className={tab === "rank" ? s.on : ""} onClick={() => setTab("rank")}>
                  {showMandals ? "Mandals" : "Districts"}
                </button>
                <button className={tab === "gaps" ? s.on : ""} onClick={() => setTab("gaps")}>
                  Gaps <span className={s.badge}>{scopeMandals.length - covered}</span>
                </button>
              </div>
              <input
                className={s.search}
                placeholder={showMandals || tab === "gaps" ? "Mandal search…" : "District search…"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {tab === "rank" ? (
                <ul className={s.rank}>
                  {rows.map((r) => (
                    <li
                      key={r.id}
                      onMouseEnter={() => setHover(null)}
                      onClick={() => (r.kind === "district" ? openDistrict(r.id) : (() => {
                        const m = mandalById.get(r.id)!;
                        if (!districtId) openDistrict(m.districtId);
                        setMandalId(r.id);
                      })())}
                    >
                      <span
                        className={s.swatch}
                        style={{
                          background: colorMode
                            ? r.kind === "district"
                              ? DISTRICT_COLORS[r.id]
                              : r.n > 0 ? PIN_ON : PIN_GAP
                            : colorFor(r.n, max),
                        }}
                      />
                      <span className={s.rankName}>
                        {r.name}
                        {r.sub && <small>{r.sub}</small>}
                      </span>
                      <span className={r.n === 0 ? s.gapTxt : s.rankN}>{r.n}</span>
                    </li>
                  ))}
                  {rows.length === 0 && <li className={s.muted}>Emi dorakaledu</li>}
                </ul>
              ) : (
                <ul className={s.rank}>
                  {gapMandals.map((m) => (
                    <li key={m.id} onClick={() => { if (!districtId) openDistrict(m.districtId); setMandalId(m.id); }}>
                      <span className={s.swatch} style={{ background: colorMode ? PIN_GAP : GAP }} />
                      <span className={s.rankName}>
                        {m.name}
                        {!districtId && <small>{m.district}</small>}
                      </span>
                    </li>
                  ))}
                  {gapMandals.length === 0 && <li className={s.muted}>Anni mandals cover ayyayi 🎉</li>}
                </ul>
              )}
              {unmapped.length > 0 && !districtId && (
                <p className={s.warn}>{unmapped.length} reporters ki valid mandalId ledu — map lo count avvaledu.</p>
              )}
              {gaps.length > 0 && tab === "rank" && !showMandals && (
                <p className={s.muted}>Tip: district click chesi mandal-level gaps chudandi.</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className={`${s.stat} ${warn ? s.statWarn : ""}`}>
      <span className={s.statV}>{value}</span>
      <span className={s.statL}>{label}</span>
    </div>
  );
}

/** Group 1..max into the same buckets colorFor() uses. */
function buckets(max: number) {
  const out: { lo: number; hi: number }[] = [];
  for (let n = 1; n <= max; n++) {
    const last = out[out.length - 1];
    if (last && colorFor(n, max) === colorFor(last.lo, max)) last.hi = n;
    else out.push({ lo: n, hi: n });
  }
  return out;
}

function Legend({ max }: { max: number }) {
  return (
    <div className={s.legend}>
      <div className={s.legRow}>
        <span className={s.legBox} style={{ background: GAP }} />
        <span>0</span>
      </div>
      {buckets(max).map(({ lo, hi }) => (
        <div className={s.legRow} key={lo}>
          <span className={s.legBox} style={{ background: colorFor(lo, max) }} />
          <span>{lo === hi ? lo : `${lo}–${hi}`}</span>
        </div>
      ))}
    </div>
  );
}

function shortName(n: string) {
  const map: Record<string, string> = {
    "Kumuram Bheem Asifabad": "Asifabad",
    "Bhadradri Kothagudem": "Kothagudem",
    "Jayashankar Bhupalpally": "Bhupalpally",
    "Yadadri Bhuvanagiri": "Bhuvanagiri",
    "Medchal Malkajgiri": "Medchal",
    "Jogulamba Gadwal": "Gadwal",
    "Rajanna Sircilla": "Sircilla",
  };
  return map[n] ?? n;
}
