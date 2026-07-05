"use client";

import { useState } from "react";
import { usePipeline, type PipelineState } from "./lib/usePipeline";
import PipelinePanel from "./components/PipelinePanel";
import styles from "./page.module.css";

const RAG_ENDPOINT = "/rag-vs-okf/api/rag";
const OKF_ENDPOINT = "/rag-vs-okf/api/okf";

interface DemoQuestion {
  label: string;
  /** null for the freshness question - wording isn't final yet, so it's not clickable */
  question: string | null;
}

const DEMO_QUESTIONS: DemoQuestion[] = [
  { label: "How is revenue calculated?", question: "How is revenue calculated?" },
  { label: "How does churn affect revenue?", question: "How does churn affect revenue?" },
  { label: "What is the support SLA?", question: "What is the support SLA?" },
  { label: "Freshness question (wording TBD)", question: null },
];

function AnswerColumn({ label, pipeline }: { label: string; pipeline: PipelineState }) {
  const { status, answer, error } = pipeline;

  let body = "Ask a question to see this pipeline's answer.";
  let isFail = false;

  if (status === "running") {
    body = "Thinking…";
  } else if (status === "error") {
    body = error ?? "Pipeline failed.";
    isFail = true;
  } else if (status === "done") {
    if (answer && answer.trim()) {
      body = answer;
    } else {
      body = "No answer came back from this pipeline.";
      isFail = true;
    }
  }

  return (
    <div className={styles.answerColumn}>
      <p className={styles.answerColumnLabel}>{label}</p>
      <p className={isFail ? styles.answerColumnEmpty : styles.answerColumnText}>{body}</p>
    </div>
  );
}

export default function RagVsOkfPage() {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(false);
  const rag = usePipeline(RAG_ENDPOINT);
  const okf = usePipeline(OKF_ENDPOINT);

  function submitQuestion(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setAsked(true);
    rag.run(trimmed);
    okf.run(trimmed);
  }

  return (
    <main className={styles.page}>
      <p className={styles.label}>/ PROJECTS / RAG VS OKF</p>
      <h1 className={styles.title}>RAG vs OKF</h1>
      <p className={styles.description}>
        Ask the same question over the same small set of SB Company documents, and watch a classic
        retrieval-augmented pipeline and an Open Knowledge Format pipeline answer it side by side.
      </p>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submitQuestion(question);
        }}
      >
        <input
          className={styles.input}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about SB Company..."
        />
        <button type="submit" className={styles.submitButton}>
          Ask
        </button>
      </form>

      <div className={styles.demoRow}>
        {DEMO_QUESTIONS.map((demo) => (
          <button
            key={demo.label}
            type="button"
            className={styles.demoButton}
            disabled={demo.question === null}
            onClick={() => demo.question && submitQuestion(demo.question)}
          >
            {demo.label}
          </button>
        ))}
      </div>

      <div className={styles.panelGrid}>
        <PipelinePanel title="RAG" kind="rag" pipeline={rag} />
        <PipelinePanel title="OKF" kind="okf" pipeline={okf} />
      </div>

      {asked && (
        <div className={styles.answerGrid}>
          <AnswerColumn label="RAG answer" pipeline={rag} />
          <AnswerColumn label="OKF answer" pipeline={okf} />
        </div>
      )}
    </main>
  );
}
