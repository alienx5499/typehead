import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Search Typeahead',
    description:
        'High-performance typeahead with distributed cache, trending decay, and batched writes',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
