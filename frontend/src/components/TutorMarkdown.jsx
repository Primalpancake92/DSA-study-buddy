import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function HighlightedCode({ children, className }) {
    const [copied, setCopied] = useState(false);
    const source = String(children).replace(/\n$/, '');
    if (!className && !source.includes('\n')) return <code>{children}</code>;
    const tokens = source.split(
        /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|function|return|if|else|for|while|class|new|true|false|null|undefined|async|await|of)\b|\b\d+(?:\.\d+)?\b)/g
    );
    async function copy() {
        try {
            await navigator.clipboard.writeText(source);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    }
    return (
        <>
            <button type="button" className="tutor-copy" onClick={copy}>
                {copied ? 'Copied' : 'Copy code'}
            </button>
            <code className={className}>
                {tokens.map((token, index) => (
                    <span
                        key={index}
                        className={
                            token.startsWith('//')
                                ? 'tutor-comment'
                                : /^["']/.test(token)
                                  ? 'tutor-string'
                                  : /^\d/.test(token)
                                    ? 'tutor-number'
                                    : /^(const|let|function|return|if|else|for|while|class|new|true|false|null|undefined|async|await|of)$/.test(
                                            token
                                        )
                                      ? 'tutor-keyword'
                                      : undefined
                        }
                    >
                        {token}
                    </span>
                ))}
            </code>
        </>
    );
}

export function TutorMarkdown({ content, courseUrl }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            components={{
                code: HighlightedCode,
                img: () => null,
                a: ({ href, children }) =>
                    href === courseUrl ? <a href={href}>{children}</a> : <span>{children}</span>
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
