'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function EmailPage() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmails() {
      try {
        const res = await fetch('/api/email');
        if (!res.ok) throw new Error('Fehler beim Laden der E-Mails');
        const data = await res.json();
        setEmails(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">E-Mail-Postfach</h1>
      <ScrollArea className="h-[500px] border rounded-lg p-2">
        {loading ? (
          <Skeleton className="h-16 w-full mb-2" />
        ) : emails.length > 0 ? (
          emails.map((email, index) => (
            <Card key={index} className="mb-2">
              <CardHeader>
                <CardTitle>{(email as { subject: string }).subject || 'Kein Betreff'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Von:</strong> {(email as { from: string }).from || 'Unbekannt'}</p>
                <p>{(email as { text: string }).text || 'Kein Inhalt'}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>Keine E-Mails vorhanden.</p>
        )}
      </ScrollArea>
    </div>
  );
}
