import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { QUESTIONS, DISCIPLINES, SPECIFIC } from './questions.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const STATS_KEY = 'dataprev-quiz-stats-v1';
const SECONDS_PER_QUESTION = 180; // ~3 min por questão na prova real (70 questões / 4h, descontando o gabarito)

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignora: estatísticas são apenas conveniência */
  }
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Embaralha as alternativas (exceto as numéricas, que ficam em ordem) e remapeia o gabarito
function shuffleOptions(qq) {
  if (qq.opts.every((o) => /^\d/.test(o))) return qq;
  const perm = shuffle([0, 1, 2, 3, 4]);
  const correctIdx = LETTERS.indexOf(qq.ans);
  return { ...qq, opts: perm.map((i) => qq.opts[i]), ans: LETTERS[perm.indexOf(correctIdx)] };
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function App() {
  const [stats, setStats] = useState(loadStats);
  const [screen, setScreen] = useState('home');
  const [session, setSession] = useState(null); // { list, mode, answers, idx, revealed, remaining }

  const recordAnswers = useCallback((pairs) => {
    setStats((prev) => {
      const next = { ...prev };
      for (const [qid, ok] of pairs) {
        const s = next[qid] || { a: 0, c: 0 };
        next[qid] = { a: s.a + 1, c: s.c + (ok ? 1 : 0), last: ok };
      }
      saveStats(next);
      return next;
    });
  }, []);

  const start = (list, mode) => {
    setSession({
      list: list.map(shuffleOptions),
      mode,
      answers: {},
      idx: 0,
      revealed: {},
      remaining: mode === 'simulado' ? list.length * SECONDS_PER_QUESTION : null,
    });
    setScreen('quiz');
  };

  const finish = useCallback(() => {
    if (session?.mode === 'simulado') {
      recordAnswers(session.list.map((qq) => [qq.id, session.answers[qq.id] === qq.ans]));
    }
    setScreen('result');
  }, [session, recordAnswers]);

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Revisão DATAPREV 2026</span>
        <span className="sub">FGV · ATI · Desenvolvimento de Software</span>
        {screen !== 'home' && (
          <button className="ghost" onClick={() => setScreen('home')}>Início</button>
        )}
      </header>
      {screen === 'home' && <Home stats={stats} onStart={start} onReset={() => { saveStats({}); setStats({}); }} />}
      {screen === 'quiz' && session && (
        <Quiz session={session} setSession={setSession} onFinish={finish} recordAnswers={recordAnswers} />
      )}
      {screen === 'result' && session && <Result session={session} onRestart={start} />}
    </div>
  );
}

function Home({ stats, onStart, onReset }) {
  const [selected, setSelected] = useState(() => new Set(Object.keys(DISCIPLINES)));
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState('treino');

  const byDisc = useMemo(() => {
    const m = {};
    for (const qq of QUESTIONS) {
      const d = (m[qq.disc] ||= { total: 0, seen: 0, correct: 0, attempts: 0 });
      d.total++;
      const s = stats[qq.id];
      if (s) {
        d.seen++;
        d.correct += s.c;
        d.attempts += s.a;
      }
    }
    return m;
  }, [stats]);

  const wrong = QUESTIONS.filter((qq) => stats[qq.id]?.last === false);
  const unseen = QUESTIONS.filter((qq) => !stats[qq.id]);
  const pool = QUESTIONS.filter((qq) => selected.has(qq.disc));

  const toggle = (d) => {
    const s = new Set(selected);
    s.has(d) ? s.delete(d) : s.add(d);
    setSelected(s);
  };

  return (
    <main className="home">
      <section className="card">
        <h2>Novo bloco de questões</h2>
        <div className="disc-head">
          <span>Disciplinas</span>
          <span className="links">
            <button className="link" onClick={() => setSelected(new Set(Object.keys(DISCIPLINES)))}>todas</button>
            <button className="link" onClick={() => setSelected(new Set(SPECIFIC))}>só específicas (peso 2,5)</button>
            <button className="link" onClick={() => setSelected(new Set())}>nenhuma</button>
          </span>
        </div>
        <div className="discs">
          {Object.entries(DISCIPLINES).map(([key, label]) => {
            const d = byDisc[key] || { total: 0, seen: 0, correct: 0, attempts: 0 };
            const pct = d.attempts ? Math.round((100 * d.correct) / d.attempts) : null;
            return (
              <label key={key} className={`disc ${selected.has(key) ? 'on' : ''}`}>
                <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} />
                <span className="disc-name">
                  {label}
                  {SPECIFIC.has(key) && <span className="tag">2,5</span>}
                </span>
                <span className="disc-meta">
                  {d.seen}/{d.total}
                  {pct !== null && <b className={pct >= 70 ? 'good' : pct >= 50 ? 'mid' : 'bad'}> · {pct}%</b>}
                </span>
              </label>
            );
          })}
        </div>

        <div className="row">
          <label className="field">
            Quantidade
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[10, 20, 30, 50].map((v) => <option key={v} value={v}>{v}</option>)}
              <option value={9999}>Todas</option>
            </select>
          </label>
          <div className="field">
            Modo
            <div className="seg">
              <button className={mode === 'treino' ? 'active' : ''} onClick={() => setMode('treino')}>Treino</button>
              <button className={mode === 'simulado' ? 'active' : ''} onClick={() => setMode('simulado')}>Simulado (3 min/q)</button>
            </div>
          </div>
        </div>
        <p className="hint">
          {mode === 'treino'
            ? 'Treino: correção e explicação logo após cada resposta.'
            : 'Simulado: cronômetro e correção apenas no final, como na prova.'}
        </p>
        <button className="primary" disabled={!pool.length} onClick={() => onStart(shuffle(pool).slice(0, count), mode)}>
          Começar ({Math.min(count, pool.length)} questões)
        </button>
      </section>

      <section className="card side">
        <h2>Atalhos</h2>
        <button className="secondary" disabled={!wrong.length} onClick={() => onStart(shuffle(wrong), 'treino')}>
          Refazer as que errei ({wrong.length})
        </button>
        <button className="secondary" disabled={!unseen.length} onClick={() => onStart(shuffle(unseen).slice(0, 20), 'treino')}>
          20 questões inéditas ({unseen.length} restantes)
        </button>
        <button className="secondary" onClick={() => onStart(shuffle(QUESTIONS.filter((qq) => SPECIFIC.has(qq.disc))).slice(0, 30), 'simulado')}>
          Simulado: 30 específicas (90 min)
        </button>
        <div className="kbd-help">
          <b>Teclado:</b> <kbd>A</kbd>–<kbd>E</kbd> ou <kbd>1</kbd>–<kbd>5</kbd> respondem · <kbd>Enter</kbd> avança · <kbd>←</kbd> <kbd>→</kbd> navegam
        </div>
        <div className="totals">
          {QUESTIONS.length} questões no banco · {Object.keys(stats).length} já respondidas
        </div>
        {Object.keys(stats).length > 0 && (
          <button className="link danger" onClick={() => confirm('Apagar todo o histórico de respostas?') && onReset()}>
            zerar histórico
          </button>
        )}
      </section>
    </main>
  );
}

function Quiz({ session, setSession, onFinish, recordAnswers }) {
  const { list, idx, answers, revealed, mode, remaining } = session;
  const cur = list[idx];
  const chosen = answers[cur.id];
  const isRevealed = mode === 'treino' && revealed[cur.id];
  const answeredCount = Object.keys(answers).length;

  // Volta ao topo ao trocar de questão (importante no celular)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [idx]);

  // Cronômetro do simulado
  useEffect(() => {
    if (mode !== 'simulado') return;
    if (remaining <= 0) {
      onFinish();
      return;
    }
    const t = setTimeout(() => setSession((s) => ({ ...s, remaining: s.remaining - 1 })), 1000);
    return () => clearTimeout(t);
  }, [mode, remaining, onFinish, setSession]);

  const choose = useCallback((letter) => {
    if (mode === 'treino' && revealed[cur.id]) return;
    setSession((s) => ({
      ...s,
      answers: { ...s.answers, [cur.id]: letter },
      revealed: mode === 'treino' ? { ...s.revealed, [cur.id]: true } : s.revealed,
    }));
    if (mode === 'treino') recordAnswers([[cur.id, letter === cur.ans]]);
  }, [mode, revealed, cur, setSession, recordAnswers]);

  const go = useCallback((delta) => {
    setSession((s) => ({ ...s, idx: Math.min(Math.max(s.idx + delta, 0), s.list.length - 1) }));
  }, [setSession]);

  const next = useCallback(() => {
    if (idx === list.length - 1) onFinish();
    else go(1);
  }, [idx, list.length, onFinish, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      const li = LETTERS.indexOf(k);
      const ni = ['1', '2', '3', '4', '5'].indexOf(e.key);
      if (li >= 0) choose(LETTERS[li]);
      else if (ni >= 0) choose(LETTERS[ni]);
      else if (e.key === 'Enter' && chosen) next();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, next, go, chosen]);

  return (
    <main className="quiz">
      <div className="quiz-head">
        <span className="badge">{DISCIPLINES[cur.disc]}</span>
        <span className="progress-text">Questão {idx + 1} de {list.length}</span>
        {mode === 'simulado' && (
          <span className={`timer ${remaining < 300 ? 'low' : ''}`}>⏱ {fmtTime(remaining)}</span>
        )}
      </div>
      <div className="bar"><div style={{ width: `${(100 * answeredCount) / list.length}%` }} /></div>

      <article className="card question">
        <p className="stem">{cur.q}</p>
        <ol className="opts">
          {cur.opts.map((text, i) => {
            const L = LETTERS[i];
            let cls = 'opt';
            if (chosen === L) cls += ' chosen';
            if (isRevealed) {
              if (L === cur.ans) cls += ' correct';
              else if (L === chosen) cls += ' wrong';
            }
            return (
              <li key={L}>
                <button className={cls} onClick={() => choose(L)} disabled={isRevealed}>
                  <span className="letter">{L}</span>
                  <span>{text}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {isRevealed && (
          <div className={`feedback ${chosen === cur.ans ? 'ok' : 'ko'}`}>
            <strong>{chosen === cur.ans ? 'Correto!' : `Errado. Gabarito: ${cur.ans}`}</strong>
            <p>{cur.exp}</p>
          </div>
        )}
      </article>

      <div className="nav">
        <button className="secondary" onClick={() => go(-1)} disabled={idx === 0}>← Anterior</button>
        {mode === 'simulado' && (
          <button className="ghost" onClick={() => confirm(`Entregar com ${answeredCount}/${list.length} respondidas?`) && onFinish()}>
            Entregar simulado
          </button>
        )}
        <button className="primary" onClick={next} disabled={mode === 'treino' && !chosen}>
          {idx === list.length - 1 ? 'Finalizar' : 'Próxima →'}
        </button>
      </div>

      {mode === 'simulado' && (
        <div className="grid">
          {list.map((qq, i) => (
            <button
              key={qq.id}
              className={`cell ${answers[qq.id] ? 'done' : ''} ${i === idx ? 'here' : ''}`}
              onClick={() => setSession((s) => ({ ...s, idx: i }))}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

function Result({ session, onRestart }) {
  const { list, answers, mode } = session;
  const results = list.map((qq) => ({ qq, given: answers[qq.id], ok: answers[qq.id] === qq.ans }));
  const correct = results.filter((r) => r.ok).length;
  const pct = Math.round((100 * correct) / list.length);

  // Pontuação no formato da prova: específicas valem 2,5, gerais valem 1
  const pts = results.reduce((s, r) => s + (r.ok ? (SPECIFIC.has(r.qq.disc) ? 2.5 : 1) : 0), 0);
  const maxPts = results.reduce((s, r) => s + (SPECIFIC.has(r.qq.disc) ? 2.5 : 1), 0);

  const byDisc = {};
  for (const r of results) {
    const d = (byDisc[r.qq.disc] ||= { ok: 0, total: 0 });
    d.total++;
    if (r.ok) d.ok++;
  }
  const wrong = results.filter((r) => !r.ok);

  return (
    <main className="result">
      <section className="card score">
        <div className={`big ${pct >= 70 ? 'good' : pct >= 50 ? 'mid' : 'bad'}`}>{pct}%</div>
        <div>
          <p><b>{correct}</b> de {list.length} corretas</p>
          <p className="muted">Pontos com peso da prova: {pts.toLocaleString('pt-BR')} / {maxPts.toLocaleString('pt-BR')} ({Math.round((100 * pts) / maxPts)}%) · Corte do edital: 50% (57,5/115)</p>
        </div>
        <div className="actions">
          {wrong.length > 0 && (
            <button className="primary" onClick={() => onRestart(shuffle(wrong.map((r) => r.qq)), 'treino')}>
              Refazer as {wrong.length} erradas
            </button>
          )}
          <button className="secondary" onClick={() => onRestart(shuffle(list), mode)}>Repetir bloco</button>
        </div>
      </section>

      <section className="card">
        <h2>Por disciplina</h2>
        <div className="bydisc">
          {Object.entries(byDisc).map(([k, d]) => {
            const p = Math.round((100 * d.ok) / d.total);
            return (
              <div key={k} className="bd-row">
                <span>{DISCIPLINES[k]}</span>
                <div className="bar small"><div className={p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad'} style={{ width: `${p}%` }} /></div>
                <span className="num">{d.ok}/{d.total}</span>
              </div>
            );
          })}
        </div>
      </section>

      {wrong.length > 0 && (
        <section className="card">
          <h2>Revisão das erradas</h2>
          {wrong.map(({ qq, given }) => (
            <details key={qq.id} className="review">
              <summary>
                <span className="badge small">{DISCIPLINES[qq.disc]}</span> {qq.q}
              </summary>
              <p>
                Sua resposta: <b className="bad">{given ? `${given}) ${qq.opts[LETTERS.indexOf(given)]}` : 'em branco'}</b>
              </p>
              <p>Gabarito: <b className="good">{qq.ans}) {qq.opts[LETTERS.indexOf(qq.ans)]}</b></p>
              <p className="exp">{qq.exp}</p>
            </details>
          ))}
        </section>
      )}
    </main>
  );
}
