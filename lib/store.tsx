import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Sheet, getSheets, getDraft, saveSheets, saveDraft, newSheet, demoSheet, uid } from './storage';

type Ctx = {
  ready: boolean;
  sheets: Sheet[];
  draft: Sheet;
  activeId: string;
  active: Sheet;
  openSheet: (id: string) => void;
  createNew: (name?: string) => void;
  updateActive: (patch: Partial<Sheet>) => void;
  saveActive: () => Promise<void>;
  deleteSheet: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [draft, setDraft] = useState<Sheet>(() => newSheet('Sheet Baru'));
  const [activeId, setActiveId] = useState<string>('draft');

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, d] = await Promise.all([getSheets(), getDraft()]);
      if (!alive) return;
      setSheets(Array.isArray(s) ? s : []);
      setDraft(d && d.id ? d : demoSheet());
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) saveSheets(sheets).catch(() => {});
  }, [sheets, ready]);

  useEffect(() => {
    if (ready) saveDraft(draft).catch(() => {});
  }, [draft, ready]);

  const active = useMemo(() => {
    if (activeId === 'draft') return draft;
    const found = sheets.find((s) => s.id === activeId);
    return found || draft;
  }, [activeId, draft, sheets]);

  const updateActive = useCallback(
    (patch: Partial<Sheet>) => {
      const stamp = { updatedAt: Date.now() };
      if (activeId === 'draft') {
        setDraft((d) => ({ ...d, ...patch, ...stamp }));
      } else {
        setSheets((list) => list.map((s) => (s.id === activeId ? { ...s, ...patch, ...stamp } : s)));
      }
    },
    [activeId]
  );

  const saveActive = useCallback(async () => {
    if (activeId === 'draft') {
      const saved: Sheet = { ...draft, id: draft.id || uid(), updatedAt: Date.now() };
      setDraft(saved);
      setSheets((list) => [saved, ...list.filter((s) => s.id !== saved.id)]);
    } else {
      setSheets((list) => list.map((s) => (s.id === activeId ? { ...s, updatedAt: Date.now() } : s)));
    }
  }, [activeId, draft]);

  const deleteSheet = useCallback(async (id: string) => {
    setSheets((list) => list.filter((s) => s.id !== id));
    setActiveId((cur) => (cur === id ? 'draft' : cur));
  }, []);

  const openSheet = useCallback((id: string) => setActiveId(id), []);

  const createNew = useCallback((name?: string) => {
    setDraft(newSheet(name || 'Sheet Baru'));
    setActiveId('draft');
  }, []);

  const reload = useCallback(async () => {
    const s = await getSheets();
    setSheets(Array.isArray(s) ? s : []);
  }, []);

  const value: Ctx = {
    ready,
    sheets,
    draft,
    activeId,
    active,
    openSheet,
    createNew,
    updateActive,
    saveActive,
    deleteSheet,
    reload,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore harus dipakai di dalam StoreProvider');
  return ctx;
}
