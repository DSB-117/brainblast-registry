export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", maxWidth: 640 }}>
      <h1>brainblast registry</h1>
      <p>
        Backend for the brainblast rule-pack incentive flywheel. See{" "}
        <a href="https://github.com/DSB-117/brainblast-registry">README</a> for endpoints.
      </p>
      <ul>
        <li>
          <code>POST /api/telemetry</code> — graduation event ingestion
        </li>
        <li>
          <code>GET /api/packs</code> — pack registry listing
        </li>
      </ul>
    </main>
  );
}
