import React from "react";

/* Filet de sécurité : si un composant plante au render, on affiche un message
   et un bouton « Recharger » au lieu d'une page blanche. */
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("apéruno crash:", err, info); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="apr-root">
        <div className="apr-app">
          <div className="center-col" style={{ minHeight: "70dvh" }}>
            <div style={{ fontSize: 44 }}>🍸</div>
            <h2 className="h-title">Oups, un pépin</h2>
            <p className="muted">Une erreur est survenue. Recharge pour repartir de zéro.</p>
            <pre className="muted dim" style={{ maxWidth: "100%", overflow: "auto", whiteSpace: "pre-wrap" }}>
              {String(this.state.err && (this.state.err.message || this.state.err))}
            </pre>
            <button className="btn btn-primary" style={{ maxWidth: 260 }}
              onClick={() => { try { localStorage.removeItem("aperuno_code"); } catch (e) {} location.reload(); }}>
              Recharger
            </button>
          </div>
        </div>
      </div>
    );
  }
}
