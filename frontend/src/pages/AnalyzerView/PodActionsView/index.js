// src/views/PodActionsView/index.js
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PodActionTable from "./PodActionTable";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelIcon from "@mui/icons-material/Cancel";

const API_PREFIXES = [
  "/api/pod-actions",
  "/api/podactions"
];

const tryFetch = async (paths, options) => {
  // Try the list of full paths in order until one returns ok
  for (const p of paths) {
    try {
      const res = await fetch(p, options);
      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) return await res.json();
        // If text (logs), return text
        return await res.text();
      }
    } catch (e) {
      // try next
    }
  }
  throw new Error("All endpoints failed");
};

export default function PodActionsView() {
  const [pods, setPods] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [helmReleases, setHelmReleases] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [namespace, setNamespace] = useState("default");
  const [onlyErrors, setOnlyErrors] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNamespaces = useCallback(async () => {
    const candidates = [
      "/api/k8s/namespaces",
      "/api/k8s/namespaces",
    ];
    try {
      const data = await tryFetch(candidates);
      // support different shapes
      const list = Array.isArray(data) ? data : data?.items || [];
      setNamespaces(list.map(ns => typeof ns === "string" ? ns : ns.metadata?.name || ns.name).filter(Boolean));
    } catch (err) {
      console.warn("Namespaces fetch failed:", err.message);
      setNamespaces(["default"]);
    }
  }, []);

  const fetchAll = useCallback(async (ns = namespace) => {
    setLoading(true);
    // Compose candidate endpoints for each resource
    const podPaths = API_PREFIXES.map(p => `${p}/pods?namespace=${ns}`);
    const depPaths = API_PREFIXES.map(p => `${p}/deployments?namespace=${ns}`);
    const helmPaths = [
      ...API_PREFIXES.map(p => `${p}/helm?namespace=${ns}`),
      ...API_PREFIXES.map(p => `${p}/helm-releases?namespace=${ns}`),
      ...API_PREFIXES.map(p => `${p}/helm/releases?namespace=${ns}`)
    ];

    try {
      // Try fetch concurrently but handling fallbacks individually
      const [podsResp, depsResp, helmResp] = await Promise.all([
        (async () => { try { return await tryFetch(podPaths); } catch(e){ return []; } })(),
        (async () => { try { return await tryFetch(depPaths); } catch(e){ return []; } })(),
        (async () => { try { return await tryFetch(helmPaths); } catch(e){ return []; } })(),
      ]);

      // Normalize responses to arrays of objects with minimal fields
      const normalize = (arr, type) => {
        if (!arr) return [];
        // If kube response with items
        if (arr.items && Array.isArray(arr.items)) arr = arr.items;
        if (!Array.isArray(arr)) return [];
        return arr.map(obj => {
          // detect shapes and return { name, namespace, status, replicas, raw }
          if (obj.metadata?.name) {
            return {
              name: obj.metadata.name,
              namespace: obj.metadata.namespace || ns,
              status: obj.status?.phase || obj.status?.conditions?.find(c=>c.type=== 'Ready')?.status || obj.status || (type === 'helm' ? (obj.status || obj.chart?.name) : undefined),
              replicas: obj.spec?.replicas ?? obj.status?.replicas ?? obj.replicas,
              raw: obj
            };
          }
          // helm json release shape ({ name, namespace, status, chart })
          if (obj.name) {
            return {
              name: obj.name,
              namespace: obj.namespace || ns,
              status: obj.status || (obj.info?.status) || "UNKNOWN",
              raw: obj
            };
          }
          // fallback: plain map
          return {
            name: obj.name || obj.metadata?.name || JSON.stringify(obj).slice(0,50),
            namespace: obj.namespace || ns,
            status: obj.status || "UNKNOWN",
            raw: obj
          };
        });
      };

      let normalizedPods = normalize(podsResp, "pods");
      let normalizedDeps = normalize(depsResp, "deployments");
      let normalizedHelm = normalize(helmResp, "helm");

      // If onlyErrors toggle set, filter common error statuses
      if (onlyErrors) {
        const badPodStatuses = ["CrashLoopBackOff", "Error", "Failed", "CrashLoop", "ImagePullBackOff"];
        normalizedPods = normalizedPods.filter(p => badPodStatuses.includes(String(p.status)));
        const badDep = ["Unavailable", "Failed", "Progressing", "Degraded"];
        normalizedDeps = normalizedDeps.filter(d => badDep.includes(String(d.status)));
        normalizedHelm = normalizedHelm.filter(h => /failed|pending/i.test(String(h.status)));
      }

      setPods(normalizedPods);
      setDeployments(normalizedDeps);
      setHelmReleases(normalizedHelm);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching PodActions data:", err);
      setPods([]);
      setDeployments([]);
      setHelmReleases([]);
    } finally {
      setLoading(false);
    }
  }, [namespace, onlyErrors]);

  useEffect(() => {
    fetchNamespaces();
  }, [fetchNamespaces]);

  useEffect(() => {
    fetchAll(namespace);
    const timer = setInterval(() => fetchAll(namespace), 30000); // 30s auto-refresh
    return () => clearInterval(timer);
  }, [fetchAll, namespace]);

  // UI helpers for status color and icon
  const statusMeta = (rawStatus) => {
    const s = String(rawStatus || "").toLowerCase();
    if (!s) return { color: "text.secondary", Icon: null, label: "UNKNOWN" };
    if (/(running|deployed|available|ready)/i.test(s)) return { color: "success.main", Icon: CheckCircleIcon, label: rawStatus };
    if (/(pending|progressing|partial|pendingupgrade|upgrading|progress)/i.test(s)) return { color: "warning.main", Icon: WarningAmberIcon, label: rawStatus };
    return { color: "error.main", Icon: CancelIcon, label: rawStatus };
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Pod Actions
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <FormControlLabel
            control={<Switch checked={onlyErrors} onChange={() => setOnlyErrors(v => !v)} />}
            label="Show only errors"
          />

          <Select
            size="small"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {namespaces.map(ns => <MenuItem key={ns} value={ns}>{ns}</MenuItem>)}
          </Select>

          <Tooltip title="Refresh now">
            <IconButton onClick={() => fetchAll(namespace)} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary">Last updated: {lastUpdated || "—"}</Typography>

      <Divider sx={{ my: 2 }} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 2,
              borderRadius: 2,
              height: "100%",
              boxShadow: 3,
              background: "linear-gradient(135deg, rgba(33,150,243,0.06), rgba(33,150,243,0.02))"
            }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Pods</Typography>
              <PodActionTable
                type="pods"
                namespace={namespace}
                data={pods}
                onActionComplete={() => fetchAll(namespace)}
                statusMeta={statusMeta}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 2,
              borderRadius: 2,
              height: "100%",
              boxShadow: 3,
              background: "linear-gradient(135deg, rgba(76,175,80,0.06), rgba(76,175,80,0.02))"
            }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Deployments</Typography>
              <PodActionTable
                type="deployments"
                namespace={namespace}
                data={deployments}
                onActionComplete={() => fetchAll(namespace)}
                statusMeta={statusMeta}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 2,
              borderRadius: 2,
              height: "100%",
              boxShadow: 3,
              background: "linear-gradient(135deg, rgba(255,193,7,0.06), rgba(255,193,7,0.02))"
            }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Helm Releases</Typography>
              <PodActionTable
                type="helm"
                namespace={namespace}
                data={helmReleases}
                onActionComplete={() => fetchAll(namespace)}
                statusMeta={statusMeta}
              />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
