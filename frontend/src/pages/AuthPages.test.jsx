import { beforeEach, expect, it, vi } from 'vitest';
import { ForgotPasswordPage } from './AuthPages.jsx';
import { authApi } from '../services/authApi.js';

// Exercise form handlers without a DOM or a live mail service. Browser rendering
// and React lifecycle behavior are outside this focused handler test harness.
const hooks = vi.hoisted(() => ({ values: [], cursor: 0, pending: { current: false } }));
vi.mock('react', async (original) => ({
    ...(await original()),
    useRef: () => hooks.pending,
    useState(initial) {
        const index = hooks.cursor++;
        if (!(index in hooks.values)) {
            hooks.values[index] = initial;
        }
        return [
            hooks.values[index],
            (value) => {
                hooks.values[index] = value;
            }
        ];
    }
}));
vi.mock('../services/authApi.js', () => ({ authApi: { forgotPassword: vi.fn() } }));
vi.mock('../components/AuthProvider.jsx', () => ({ useAuth: vi.fn() }));

function render() {
    hooks.cursor = 0;
    return ForgotPasswordPage();
}
function find(node, predicate) {
    if (!node || typeof node !== 'object') {
        return undefined;
    }
    if (predicate(node)) {
        return node;
    }
    return [node.props?.children]
        .flat(Infinity)
        .map((child) => find(child, predicate))
        .find(Boolean);
}
const emailField = (tree) => find(tree, (node) => node.props?.name === 'email');
const form = (tree) => find(tree, (node) => node.type === 'form');
const submit = (tree) => form(tree).props.onSubmit({ preventDefault: vi.fn() });

beforeEach(() => {
    hooks.values = [];
    hooks.pending.current = false;
    vi.clearAllMocks();
});

it('rejects empty email inline without calling the recovery API', async () => {
    await submit(render());
    expect(authApi.forgotPassword).not.toHaveBeenCalled();
    expect(emailField(render()).props.error).toBe(
        'No email was entered. Please enter your email address.'
    );
});
it('rejects malformed input and clears the error when corrected', async () => {
    emailField(render()).props.onChange({ target: { value: 'invalid' } });
    await submit(render());
    expect(authApi.forgotPassword).not.toHaveBeenCalled();
    expect(emailField(render()).props.error).toBe(
        'Invalid email address. Please enter a valid email.'
    );
    emailField(render()).props.onChange({ target: { value: 'person@example.com' } });
    expect(emailField(render()).props.error).toBe('');
});
it('trims valid input, blocks duplicate requests and displays generic confirmation', async () => {
    let resolve;
    authApi.forgotPassword.mockReturnValueOnce(
        new Promise((done) => {
            resolve = done;
        })
    );
    emailField(render()).props.onChange({ target: { value: '  person@example.com  ' } });
    const tree = render();
    const request = submit(tree);
    await submit(tree);
    expect(authApi.forgotPassword).toHaveBeenCalledTimes(1);
    expect(authApi.forgotPassword).toHaveBeenCalledWith('person@example.com');
    resolve({ message: 'Generic confirmation' });
    await request;
    expect(
        find(render(), (node) => node.props?.className === 'success-message').props.children
    ).toContain('If an account matches');
    expect(hooks.pending.current).toBe(false);
});
it('shows request failures and releases the pending guard for retry', async () => {
    authApi.forgotPassword.mockRejectedValueOnce(new Error('Please try again shortly.'));
    emailField(render()).props.onChange({ target: { value: 'person@example.com' } });
    await submit(render());
    expect(emailField(render()).props.error).toBe('Please try again shortly.');
    expect(hooks.pending.current).toBe(false);
});
