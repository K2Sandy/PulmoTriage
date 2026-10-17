"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CLOUD, URL_UNDUH_BAWAAN } from "../utils";

const Ctx = createContext({ url: URL_UNDUH_BAWAAN, versi: null });

// Versi terbaru dan tautan unduh diambil dari server cloud (GET /versi), sumber yang sama dengan
// pemberitahuan pembaruan di aplikasi Puskesmas.
export function UnduhProvider({ children }) {
  const [info, setInfo] = useState({ url: URL_UNDUH_BAWAAN, versi: null });
  useEffect(() => {
    fetch(`${CLOUD}/versi`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInfo({ url: d.url_unduh || URL_UNDUH_BAWAAN, versi: d.versi_terbaru }))
      .catch(() => {});
  }, []);
  return <Ctx.Provider value={info}>{children}</Ctx.Provider>;
}

export const useUnduh = () => useContext(Ctx);
