import React, { useRef, useState } from "react";
import { MYID } from "../me.js";
import { compressPhoto } from "../util.js";
import { createRoom, joinRoom } from "../net/useRoom.js";

function PhotoName({ name, setName, photo, setPhoto }) {
  const fileRef = useRef();
  return (
    <div className="row" style={{ alignItems: "center" }}>
      <label style={{ flex: "0 0 auto" }}>
        <input ref={fileRef} type="file" accept="image/*" capture="user" style={{ display: "none" }}
          onChange={(e) => e.target.files[0] && compressPhoto(e.target.files[0], setPhoto)} />
        {photo
          ? <img className="avatar" style={{ width: 52, height: 52 }} src={photo} alt="" />
          : <div className="avatar" style={{ width: 52, height: 52, fontSize: 22 }}>📷</div>}
      </label>
      <input className="input" placeholder="Ton prénom" value={name} maxLength={14}
        onChange={(e) => setName(e.target.value)} />
    </div>
  );
}

export function CreateForm({ back, onDone, flash }) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [mode, setMode] = useState("chill");
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!name.trim()) return flash("Indique ton prénom 🙂");
    setBusy(true);
    try {
      const code = await createRoom(mode, { id: MYID, name: name.trim(), photo });
      onDone(code);
    } catch (e) { flash(e.message); setBusy(false); }
  }
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Créer une partie</h2>
      <p className="muted mt mb">Mode</p>
      <div className="seg">
        <button className={"chill " + (mode === "chill" ? "on" : "")} onClick={() => setMode("chill")}>😎 Chill</button>
        <button className={"harr " + (mode === "harr" ? "on" : "")} onClick={() => setMode("harr")}>🔥 Harr</button>
      </div>
      <p className="muted mt mb">Ton profil</p>
      <PhotoName name={name} setName={setName} photo={photo} setPhoto={setPhoto} />
      <button className="btn btn-primary" style={{ marginTop: 22 }} disabled={busy} onClick={go}>
        {busy ? "Création…" : "Créer le salon 🎴"}
      </button>
    </div>
  );
}

export function JoinForm({ back, onDone, flash }) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!name.trim()) return flash("Indique ton prénom 🙂");
    if (code.trim().length !== 4) return flash("Le code fait 4 lettres");
    setBusy(true);
    const C = code.trim().toUpperCase();
    try {
      await joinRoom(C, { id: MYID, name: name.trim(), photo });
      onDone(C);
    } catch (e) { flash(e.message); setBusy(false); }
  }
  return (
    <div className="fade">
      <button className="btn btn-ghost btn-sm back" onClick={back}>← Retour</button>
      <h2 className="h-title">Rejoindre une partie</h2>
      <p className="muted mt mb">Code du salon</p>
      <input className="input code-input" placeholder="ABCD" value={code} maxLength={4}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
      <p className="muted mt mb">Ton profil</p>
      <PhotoName name={name} setName={setName} photo={photo} setPhoto={setPhoto} />
      <button className="btn btn-blue" style={{ marginTop: 22 }} disabled={busy} onClick={go}>
        {busy ? "Connexion…" : "Rejoindre 🔗"}
      </button>
    </div>
  );
}
