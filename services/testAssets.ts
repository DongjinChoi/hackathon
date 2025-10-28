// Note: These base64 strings are placeholders and not actual audio data.
// In a real application, these would be valid base64 encoded audio files.

export interface TestCase {
    name: string;
    expected: 'DANGER' | 'SAFE';
    data: string;
    mimeType: string;
}

export const testAssets: TestCase[] = [
    {
        name: 'Loud Scream',
        expected: 'DANGER',
        data: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // Placeholder
        mimeType: 'audio/wav',
    },
    {
        name: 'Struggle Sounds',
        expected: 'DANGER',
        data: 'UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // Placeholder
        mimeType: 'audio/wav',
    },
    {
        name: 'Toilet Flushing',
        expected: 'SAFE',
        data: 'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // Placeholder
        mimeType: 'audio/wav',
    },
    {
        name: 'Normal Conversation',
        expected: 'SAFE',
        data: 'UklGRioAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // Placeholder
        mimeType: 'audio/wav',
    },
     {
        name: 'Coughing',
        expected: 'SAFE',
        data: 'UklGRioBBABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // Placeholder
        mimeType: 'audio/wav',
    },
];
