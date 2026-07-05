"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/src/components/experiences/EnvelopePhaseTwo/Icon";
import styles from "./WorldModelExplainer.module.css";

/**
 * World Model Explainer — visual centerpiece (prototype)
 * Illustration only. This is NOT a real world model.
 *
 * One running example throughout: a thrown ball.
 * Signature motif: the copper "latent dot" — the ball squished into a
 * compressed idea of its state — appears in all three sections.
 *
 * Section 03 calls a live model for the prediction only. The gap note stays
 * hardcoded — that dishonesty check is the whole point of the page.
 */

interface SceneAction {
  id: string;
  label: string;
  gap: string;
}

interface Scene {
  id: string;
  label: string;
  actions: SceneAction[];
}

const SCENES: Scene[] = [
  {
    id: "ball",
    label: "A ball at the edge of a table",
    actions: [
      {
        id: "nudge",
        label: "Nudge it gently",
        gap: "Guessed from words. The model does not know the table's friction or the ball's weight, so it cannot really tell how far it rolls.",
      },
      {
        id: "push",
        label: "Push it off the edge",
        gap: "It knows fall tends to follow edge. It did not work out gravity or how high the bounce would be.",
      },
    ],
  },
  {
    id: "blocks",
    label: "Three blocks stacked in a tower",
    actions: [
      {
        id: "pull",
        label: "Pull out the bottom block",
        gap: "Right answer, wrong reason. It matched a familiar phrase, not the balance of the stack.",
      },
      {
        id: "add",
        label: "Add a fourth block on top",
        gap: "It cannot feel the wobble. It has never balanced anything.",
      },
    ],
  },
  {
    id: "cup",
    label: "A full cup of water beside a laptop",
    actions: [
      {
        id: "tip",
        label: "Tip the cup toward the laptop",
        gap: "It has read spill many times. It never watched water flow, and never learned by experience that it ruins electronics.",
      },
      {
        id: "slide",
        label: "Slide the cup away",
        gap: "A safe guess, but it is matching words, not tracking the water inside the cup.",
      },
    ],
  },
];

type PredictStatus = "idle" | "loading" | "success" | "error";

const PREDICT_ENDPOINT = "/api/beyond-llms/predict";

const SENTENCE = ["The", "ball", "rolls", "off", "the", "table"];
const FRAMES = 8;

const LOOP_NODES = [
  { icon: "camera", title: "Camera", caption: "A frame comes in from the world." },
  { icon: "compress", title: "Encoder", caption: "Squish the frame into a small idea, the latent state." },
  { icon: "predict", title: "Predictor", caption: "Guess the next latent state after an action." },
  { icon: "plan", title: "Planner", caption: "Try many actions, pick the one that reaches the goal." },
] as const;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function WorldModelExplainer() {
  const [tick, setTick] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    if (mq.matches) {
      setTick(4); // representative frozen state
      return;
    }
    const t = setInterval(() => setTick((v) => v + 1), 850);
    return () => clearInterval(t);
  }, []);

  // ball arc positions (parabola)
  const positions = useMemo(
    () =>
      Array.from({ length: FRAMES }, (_, i) => {
        const t = i / (FRAMES - 1);
        return { x: 34 + t * 232, y: 150 - 400 * t * (1 - t) };
      }),
    []
  );

  const frame = tick % FRAMES;
  const nextFrame = (frame + 1) % FRAMES;
  const revealed = (tick % SENTENCE.length) + 1; // 1..6
  const node = Math.floor(tick / 2) % 4; // changes every ~1.7s

  // widget state
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [actionId, setActionId] = useState<string | null>(null);
  const scene = SCENES.find((s) => s.id === sceneId)!;
  const action = scene.actions.find((a) => a.id === actionId) ?? null;

  const [status, setStatus] = useState<PredictStatus>("idle");
  const [prediction, setPrediction] = useState("");
  const requestId = useRef(0);

  async function requestPrediction(sceneLabel: string, actionLabel: string) {
    const thisRequest = ++requestId.current;
    setStatus("loading");
    try {
      const res = await fetch(PREDICT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene: sceneLabel, action: actionLabel }),
      });
      const data = await res.json();
      if (thisRequest !== requestId.current) return;
      if (!res.ok || typeof data.prediction !== "string") {
        setStatus("error");
        return;
      }
      setPrediction(data.prediction);
      setStatus("success");
    } catch {
      if (thisRequest !== requestId.current) return;
      setStatus("error");
    }
  }

  return (
    <main className={styles.page}>
      {/* hero */}
      <p className={styles.label}>/ RESEARCH ILLUSTRATION</p>
      <h1 className={styles.title}>Words are not the world</h1>
      <p className={styles.lead}>
        Most AI today is trained to guess the next word. A world model is
        trained to guess what happens next in the real world. These are not
        the same thing. Scroll to see the difference, and why it is worth a
        billion dollars of research.
      </p>

      {/* section one — the hook */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>/ THE IDEA</p>
        <h2 className={styles.sectionHeading}>Two kinds of guessing</h2>
        <div className={styles.panels}>
          {/* LLM panel */}
          <div className={styles.panel}>
            <div className={styles.demoCard}>
              <p className={styles.demoCardLabel}>Language model</p>
              <div className={styles.llm}>
                {SENTENCE.map((w, i) => {
                  const shown = i < revealed;
                  const latest = i === revealed - 1;
                  return (
                    <span
                      key={i}
                      className={cx(
                        styles.token,
                        shown && styles.isShown,
                        latest && styles.isLatest
                      )}
                    >
                      {w}
                    </span>
                  );
                })}
                <span className={styles.caret} />
              </div>
            </div>
            <p className={styles.panelNote}>
              Predicts the next <strong>word</strong> from patterns in text.
            </p>
          </div>

          {/* JEPA panel */}
          <div className={styles.panel}>
            <div className={styles.demoCard}>
              <p className={styles.demoCardLabel}>World model</p>
              <svg
                viewBox="0 0 300 180"
                className={styles.svg}
                role="img"
                aria-label="A ball moving along an arc with the next position predicted"
              >
                <line x1="18" y1="162" x2="282" y2="162" className={styles.ground} />
                {/* faint full arc */}
                <polyline
                  points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
                  className={styles.arc}
                />
                {/* predicted next state — the copper latent ring */}
                <circle
                  cx={positions[nextFrame].x}
                  cy={positions[nextFrame].y}
                  r="11"
                  className={styles.latentRing}
                />
                <text
                  x={positions[nextFrame].x}
                  y={positions[nextFrame].y - 18}
                  className={styles.predLabel}
                  textAnchor="middle"
                >
                  next
                </text>
                {/* current ball */}
                <circle
                  cx={positions[frame].x}
                  cy={positions[frame].y}
                  r="8"
                  className={styles.ball}
                />
              </svg>
            </div>
            <p className={styles.panelNote}>
              Predicts the next <strong>state of the world</strong>, as a
              compressed idea rather than exact pixels.
            </p>
          </div>
        </div>
      </section>

      {/* section two — the mechanism */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>/ THE LOOP</p>
        <h2 className={styles.sectionHeading}>The loop inside a world model</h2>
        <p className={styles.sectionIntro}>
          This four step loop is roughly what the research toolkit
          (stable-worldmodel) standardizes, so different labs can be compared
          fairly. Watch it cycle.
        </p>
        <div className={styles.loopRow}>
          {LOOP_NODES.map((n, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className={cx(styles.pill, node === i && styles.isActive)}>
                <Icon name={n.icon} size={16} />
                {n.title}
              </span>
              {i < LOOP_NODES.length - 1 && (
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </div>
        <p className={styles.loopCaption}>{LOOP_NODES[node].caption}</p>
        <p className={styles.loopFoot}>
          Then it repeats. The planner acts, the world changes, a new frame
          comes in, and the loop runs again.
        </p>
      </section>

      {/* section three — the play widget */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>/ TRY IT</p>
        <h2 className={styles.sectionHeading}>Try it yourself</h2>

        <div className={styles.banner}>
          This is a language model pretending to be a world model. It is not a
          real one. I built this first to understand the idea myself, and to
          demo it for anyone curious about what comes next, beyond LLMs.
        </div>

        <div className={styles.widget}>
          <div>
            <p className={styles.pickerLabel}>Pick a scene</p>
            <div className={styles.chips}>
              {SCENES.map((s) => (
                <button
                  key={s.id}
                  className={cx(styles.chip, s.id === sceneId && styles.isOn)}
                  aria-pressed={s.id === sceneId}
                  onClick={() => {
                    setSceneId(s.id);
                    setActionId(null);
                    setStatus("idle");
                    setPrediction("");
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <p className={styles.pickerLabel}>Then do something</p>
            <div className={styles.chips}>
              {scene.actions.map((a) => (
                <button
                  key={a.id}
                  className={cx(styles.chip, a.id === actionId && styles.isOn)}
                  aria-pressed={a.id === actionId}
                  onClick={() => {
                    setActionId(a.id);
                    requestPrediction(scene.label, a.label);
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.result}>
            {!action || status === "idle" ? (
              <p className={styles.resultEmpty}>
                Choose an action to see what the model predicts.
              </p>
            ) : status === "loading" ? (
              <p className={styles.resultEmpty}>Guessing from words...</p>
            ) : status === "error" ? (
              <p className={styles.resultEmpty}>
                The model could not come up with a guess this time. Try again.
              </p>
            ) : (
              <>
                <p className={styles.resultKind}>Predicted next state</p>
                <p className={styles.resultPred}>{prediction}</p>
                <div className={styles.gap}>
                  <span className={styles.gapTag}>the gap</span>
                  <p className={styles.gapText}>{action.gap}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className={styles.foot}>
        <p className={styles.footNote}>
          Illustration built on the JEPA idea from Yann LeCun and the{" "}
          <a
            href="https://arxiv.org/pdf/2605.21800"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--copper-dark)" }}
          >
            stable-worldmodel paper (arXiv 2605.21800)
          </a>
          . No real world model runs on this page. LeCun&apos;s new lab, AMI
          Labs, recently{" "}
          <a
            href="https://techcrunch.com/2026/03/09/yann-lecuns-ami-labs-raises-1-03-billion-to-build-world-models/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--copper-dark)" }}
          >
            raised 1.03 billion dollars
          </a>{" "}
          to work on this idea.
        </p>
        <div className={styles.footLinks}>
          <Link
            href="/projects"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
            style={{ border: "1px solid var(--copper)", color: "var(--copper-dark)", fontFamily: "var(--font-body)" }}
          >
            Back to projects →
          </Link>
          <Link
            href="/blog/words-are-not-the-world"
            className="text-sm hover:underline"
            style={{ fontFamily: "var(--font-mono)", color: "var(--copper-dark)" }}
          >
            Read the write-up →
          </Link>
        </div>
      </footer>
    </main>
  );
}
