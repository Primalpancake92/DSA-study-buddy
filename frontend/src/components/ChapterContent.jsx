import { Fragment } from 'react';
import { useAccountSettings } from './AccountSettingsProvider.jsx';

// Lightweight lexical highlighting. Rendering text through React (never innerHTML)
// keeps lesson prose/code inert, including strings containing HTML.
export function JavaScriptCode({ code }) {
  const tokens = code.split(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|of|in|class|new|this|throw|true|false|null|undefined|break|continue|Math|Map|Set|Array)\b|\b\d+(?:\.\d+)?\b)/g);
  return <pre><code>{tokens.map((token, index) => { const kind = /^(\/\/|\/\*)/.test(token) ? 'comment' : /^["'`]/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : /^(const|let|var|function|return|if|else|for|while|of|in|class|new|this|throw|true|false|null|undefined|break|continue|Math|Map|Set|Array)$/.test(token) ? 'keyword' : ''; return <span key={index} className={kind ? `js-${kind}` : undefined}>{token}</span>; })}</code></pre>;
}

export function ChapterContent({ blocks }) {
  const { settings } = useAccountSettings();
  const { showHints, hideSolutions, stepByStep } = settings.learning;
  return <div className="chapter-content">{blocks.map((block, index) => <Fragment key={index}>
    {block.type === 'paragraph' && <p>{block.text}</p>}
    {block.type === 'heading' && <h3>{block.text}</h3>}
    {block.type === 'code' && <JavaScriptCode code={block.code} />}
    {block.type === 'diagram' && (stepByStep ? <pre className="diagram-text" aria-label="Algorithm state walkthrough">{block.text}</pre> : <details><summary>View step-by-step walkthrough</summary><pre className="diagram-text">{block.text}</pre></details>)}
    {block.type === 'exercise' && <div className="chapter-exercise"><h3>Try it yourself</h3><p className="exercise-prompt">{block.prompt}</p>{showHints && block.hints?.map((hint, hintIndex) => <details key={hintIndex}><summary>Hint {hintIndex + 1}</summary><p>{hint}</p></details>)}<details open={!hideSolutions || undefined}><summary>Explanation and solution</summary><p>{block.solution}</p></details></div>}
  </Fragment>)}</div>;
}
