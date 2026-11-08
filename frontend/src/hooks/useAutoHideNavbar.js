import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useAutoHideNavbar() {
    const [visible, setVisible] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const header = useRef(null);
    const trigger = useRef(null);
    const timer = useRef(null);
    const pointerInside = useRef(false);
    const keyboardInside = useRef(false);
    const pinned = useRef(false);
    const suppressFocus = useRef(false);
    const menu = useRef(false);
    const { pathname } = useLocation();

    const cancelHide = useCallback(() => clearTimeout(timer.current), []);
    const reveal = useCallback(() => {
        cancelHide();
        setVisible(true);
    }, [cancelHide]);
    const scheduleHide = useCallback(() => {
        cancelHide();
        timer.current = setTimeout(() => {
            if (!pointerInside.current && !keyboardInside.current && !menu.current && !pinned.current) {
                setVisible(false);
            }
        }, 250);
    }, [cancelHide]);
    const close = useCallback((restoreFocus = false) => {
        cancelHide();
        pinned.current = false;
        keyboardInside.current = false;
        pointerInside.current = false;
        setVisible(false);
        setMenuOpen(false);
        if (restoreFocus) {
            suppressFocus.current = true;
            trigger.current?.focus({ preventScroll: true });
            suppressFocus.current = false;
        }
    }, [cancelHide]);

    useEffect(() => {
        menu.current = menuOpen;
        if (menuOpen) reveal();
        else scheduleHide();
    }, [menuOpen, reveal, scheduleHide]);
    useEffect(() => {
        close();
    }, [pathname, close]);
    useEffect(() => cancelHide, [cancelHide]);
    useEffect(() => {
        if (!visible) return undefined;
        const dismiss = (event) => {
            if (!header.current?.contains(event.target) && !trigger.current?.contains(event.target)) {
                close();
            }
        };
        const escape = (event) => {
            if (event.key === 'Escape' && !event.defaultPrevented) {
                event.preventDefault();
                close(true);
            }
        };
        document.addEventListener('pointerdown', dismiss);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('pointerdown', dismiss);
            document.removeEventListener('keydown', escape);
        };
    }, [visible, close]);

    const pointerEnter = (event) => {
        if (event.pointerType === 'touch') return;
        pointerInside.current = true;
        reveal();
    };
    const pointerLeave = (event) => {
        if (event.pointerType === 'touch') return;
        pointerInside.current = false;
        scheduleHide();
    };
    return {
        visible,
        menuOpen,
        setMenuOpen,
        header,
        trigger,
        close,
        pointerEnter,
        pointerLeave,
        onPointerDown: () => { keyboardInside.current = false; },
        onFocus: (event) => {
            if (!header.current?.contains(event.target) || !event.target.matches(':focus-visible')) return;
            keyboardInside.current = true;
            reveal();
        },
        onBlur: (event) => {
            if (!header.current?.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) {
                keyboardInside.current = false;
                pinned.current = false;
                setMenuOpen(false);
                scheduleHide();
            }
        },
        onTriggerFocus: (event) => {
            if (!suppressFocus.current && event.target.matches(':focus-visible')) {
                keyboardInside.current = true;
                reveal();
            }
        },
        toggle: () => {
            if (visible) close(true);
            else {
                pinned.current = true;
                reveal();
            }
        }
    };
}
