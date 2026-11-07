// Stable IDs are persistence keys, not display positions. Arrays is inserted
// after Complexity without renumbering the existing Hash Maps–Interview modules.
export const foundationModules = {
    1: {
        id: 1,
        title: 'Introduction to Algorithm Complexity',
        concepts:
            'Operation counting, input size, growth functions, O and Omega and Theta, case analysis, time and space',
        checkpoint: [
            'I can explain why linear search is O(n).',
            'I can distinguish input space from auxiliary space.',
            'I can name an edge case before coding.'
        ],
        resources: [
            {
                title: 'MIT 6.006 — Introduction to Algorithms',
                provider: 'MIT OpenCourseWare',
                url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/'
            },
            {
                title: 'Asymptotic analysis',
                provider: 'OpenDSA',
                url: 'https://opendsa.cs.vt.edu/ODSA/Books/CSC3280/html/AnalAsymptotic.html'
            },
            {
                title: 'Mathematical background',
                provider: 'Open Data Structures',
                url: 'https://www.opendatastructures.org/ods-python/1_3_Mathematical_Background.html'
            }
        ]
    },
    17: {
        id: 17,
        title: 'Arrays and Array Operations',
        concepts:
            'Indexing and traversal, linear search, mutation, shallow and deep copies, array methods, two pointers',
        checkpoint: [
            'I can implement bounded traversal, search, and stable array compaction.',
            'I can predict mutation, return values, and reference sharing for array methods.',
            'I can solve an array problem and derive its time and auxiliary space costs.'
        ],
        resources: [
            {
                title: 'Array reference',
                provider: 'MDN',
                url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array'
            },
            {
                title: 'structuredClone',
                provider: 'MDN',
                url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone'
            }
        ]
    }
};
