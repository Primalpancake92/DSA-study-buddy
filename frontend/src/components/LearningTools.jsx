import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, NotebookPen, X } from 'lucide-react';
import { SectionNotes } from './SectionNotes.jsx';
import { TutorAssistant } from './TutorAssistant.jsx';

export function LearningTools({ lesson, section }) {
    const [tab, setTab] = useState('tutor');
    const [visible, setVisible] = useState(false);
    const [showNotesIcon, setShowNotesIcon] = useState(false);
    const [compact, setCompact] = useState(true);

    const panel = useRef(null);
    const trigger = useRef(null);
    const sectionId = lesson.lessons?.find((item) => item.sectionId === section.id)?.id ||
        `w${lesson.id}-section-${section.id}`;
    const close = () => {
        setVisible(false);
        trigger.current?.focus();
    };

    useEffect(() => {
        const media = window.matchMedia('(max-width: 767px)');
        const update = () => setCompact(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        let timer;
        const schedule = () => {
            clearTimeout(timer);
            if (visible || media.matches) return;
            timer = setTimeout(() => {
                setShowNotesIcon((value) => !value);
                schedule();
            }, 3000);
        };
        schedule();
        media.addEventListener('change', schedule);
        return () => {
            clearTimeout(timer);
            media.removeEventListener('change', schedule);
        };
    }, [visible]);
    useEffect(() => {
        const element = panel.current;
        element.close();
        if (visible) {
            if (compact) element.showModal();
            else element.show();
        }
        return () => element.close();
    }, [compact, visible]);
    useEffect(() => {
        if (!compact || !visible) return;
        const viewport = window.visualViewport;
        const resize = () => {
            panel.current.style.setProperty('--tools-height', `${viewport?.height ?? window.innerHeight}px`);
            panel.current.style.setProperty('--tools-top', `${viewport?.offsetTop ?? 0}px`);
        };
        resize();
        viewport?.addEventListener('resize', resize);
        viewport?.addEventListener('scroll', resize);
        return () => {
            viewport?.removeEventListener('resize', resize);
            viewport?.removeEventListener('scroll', resize);
        };
    }, [compact, visible]);

    const content = (
        <aside className="learning-tools">
            <button
                ref={trigger}
                className="tutor-launcher learning-tools-trigger"
                type="button"
                aria-expanded={visible}
                aria-controls="learning-tools-panel"
                aria-label={visible ? 'Close notes and AI tutor' : 'Open notes and AI tutor'}
                title="My Notes & AI Tutor"
                onClick={() => visible ? close() : setVisible(true)}
            >
                {visible ? <X size={24} aria-hidden="true" /> : showNotesIcon
                    ? <NotebookPen size={26} aria-hidden="true" />
                    : <MessageCircle size={26} aria-hidden="true" />}
            </button>
            <dialog ref={panel} id="learning-tools-panel" className="learning-tools-panel"
                aria-label="Learning tools"
                onCancel={(event) => { event.preventDefault(); close(); }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        close();
                    }
                }}
            >
                <div className="learning-tools-header">
                    <div className="learning-tools-switch" aria-label="Choose a learning tool">
                        <button type="button" aria-pressed={tab === 'notes'} onClick={() => setTab('notes')}>My Notes</button>
                        <button type="button" aria-pressed={tab === 'tutor'} onClick={() => setTab('tutor')}>AI Tutor</button>
                    </div>
                    <button type="button" aria-label="Close learning tools" onClick={close}>×</button>
                </div>
                <div className="learning-notes-content" hidden={tab !== 'notes'}>
                    <SectionNotes
                        moduleId={lesson.id}
                        sectionId={sectionId}
                        anchor={section.id}
                        title={section.title}
                        embedded
                    />
                </div>
                <div className="learning-tutor-content" hidden={tab !== 'tutor'}>
                    <TutorAssistant lesson={lesson} section={section} embedded
                        active={visible && tab === 'tutor'} onClose={close} />
                </div>
            </dialog>
        </aside>
    );
    return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
