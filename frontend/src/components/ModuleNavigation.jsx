import { useEffect, useRef, useState } from 'react';

export function ModuleNavigation({ children }) {
    const [mobile, setMobile] = useState(false);
    const [open, setOpen] = useState(false);
    const panel = useRef(null);
    const trigger = useRef(null);
    useEffect(() => {
        const media = window.matchMedia('(max-width: 767px)');
        const update = () => setMobile(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        const element = panel.current;
        element.close();
        if (!mobile) element.show();
        else if (open) element.showModal();
        return () => element.close();
    }, [mobile, open]);
    const close = () => {
        setOpen(false);
        trigger.current?.focus();
    };
    return (
        <aside className="lesson-sidebar">
            <button ref={trigger} type="button" className="button dark" hidden={!mobile}
                aria-expanded={open} aria-controls="module-navigation-panel"
                onClick={() => setOpen(true)}>
                Module navigation
            </button>
            <dialog ref={panel} id="module-navigation-panel" className="module-navigation-panel"
                aria-label="Module navigation"
                onCancel={(event) => { event.preventDefault(); close(); }}
                onClick={(event) => {
                    if (mobile && event.target.closest('a')) close();
                }}>
                <button type="button" className="button dark" hidden={!mobile} onClick={close}>
                    Close navigation
                </button>
                {children}
            </dialog>
        </aside>
    );
}
