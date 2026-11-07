import { createContext, useContext } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { isModuleId } from '../../../shared/curriculum.js';

const CheckpointContext = createContext(null);

// Comments supply metadata only; raw HTML rendering remains disabled.
function remarkCheckpoints({ weekId }) {
    return (tree) => {
        const seen = new Set();
        const headings = new Map();
        const textOf = (node) =>
            node.type === 'text' || node.type === 'inlineCode'
                ? node.value
                : (node.children || []).map(textOf).join('');
        function visit(node) {
            if (node.type === 'heading') {
                const slug = textOf(node)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                const count = (headings.get(slug) || 0) + 1;
                headings.set(slug, count);
                node.data = {
                    ...node.data,
                    hProperties: { id: count === 1 ? slug : `${slug}-${count}` }
                };
            }
            if (node.type === 'listItem' && typeof node.checked === 'boolean') {
                const markers = [];
                function collect(child) {
                    if (child !== node && child.type === 'listItem') return;
                    if (child.type === 'html') {
                        const match = child.value.match(
                            /^<!--\s*checkpoint:(w\d+-[a-z][a-z0-9-]*)\s*-->$/
                        );
                        if (match) markers.push(match[1]);
                    }
                    child.children?.forEach(collect);
                }
                collect(node);
                const id = markers[0];
                if (
                    markers.length === 1 &&
                    id.startsWith(`w${weekId}-`) &&
                    id.length <= 120 &&
                    !seen.has(id)
                ) {
                    seen.add(id);
                    node.data = { ...node.data, hProperties: { 'data-checkpoint': id } };
                }
            }
            node.children?.forEach(visit);
        }
        visit(tree);
    };
}

export function lessonLink(url) {
    const match = url.match(
        /^(?:(?:\.\.?\/)*|\/)?(?:(?:docs\/)?weekly_content\/)?week-(\d{2})\.md(#[^\s]*)?$/
    );
    if (match && isModuleId(Number(match[1])))
        return `/app/weeks/${Number(match[1])}${match[2] || ''}`;
    // Source citations link to the repository, never a server filesystem endpoint.
    if (
        /^\.\.\/\.\.\/shared\/(?:curriculum\.js|textbook\/(?:index|weeks01to04|weeks05to08|weeks09to12|weeks13to16)\.js)$/.test(
            url
        )
    ) {
        return `https://github.com/Primalpancake92/DSA-study-buddy/blob/main/${url.slice(6)}`;
    }
    return defaultUrlTransform(url);
}

function ChecklistItem({ node, children, ...props }) {
    const id = node.properties['data-checkpoint'];
    return (
        <CheckpointContext.Provider value={id}>
            <li {...props}>{id ? <label>{children}</label> : children}</li>
        </CheckpointContext.Provider>
    );
}

export function MarkdownChapter({ markdown, weekId, progress, onToggle }) {
    function Checkbox() {
        const id = useContext(CheckpointContext);
        return (
            <input
                type="checkbox"
                disabled={!id || !progress.ready || progress.saving}
                checked={Boolean(id && progress.completedCheckpoints.includes(id))}
                onChange={() => onToggle(id)}
                aria-label={id ? undefined : 'Checklist item has no valid checkpoint ID'}
            />
        );
    }
    return (
        <div className="chapter-content markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, [remarkCheckpoints, { weekId }]]}
                skipHtml
                urlTransform={lessonLink}
                components={{
                    li: ChecklistItem,
                    input: Checkbox,
                    a: ({ href, children }) =>
                        href?.startsWith('/app/') ? (
                            <Link to={href}>{children}</Link>
                        ) : (
                            <a href={href} rel="noreferrer">
                                {children}
                            </a>
                        ),
                    table: ({ children }) => (
                        <div
                            className="markdown-table"
                            tabIndex={0}
                            role="region"
                            aria-label="Lesson table"
                        >
                            <table>{children}</table>
                        </div>
                    )
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}
