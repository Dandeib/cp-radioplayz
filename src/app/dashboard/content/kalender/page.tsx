'use client'

import { useState, useEffect, FormEvent, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO, isEqual, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner"
import {
    createScheduledPost,
    getScheduledPosts,
    updateScheduledPost,
    deleteScheduledPost,
    ScheduledPostData,
    ScheduledPostStatus
} from '@/actions/content'

interface ScheduledPost extends ScheduledPostData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: ScheduledPostStatus;
}

// Hilfsfunktion, um die Farbe basierend auf dem Status zu bekommen
const getStatusColor = (status: ScheduledPostStatus): string => {
    switch (status) {
        case 'PUBLISHED':
            return 'text-green-600 dark:text-green-400';
        case 'SCHEDULED':
            return 'text-blue-600 dark:text-blue-400';
        case 'DRAFT':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'ARCHIVED':
            return 'text-gray-500 dark:text-gray-400';
        default:
            return 'text-gray-700 dark:text-gray-300';
    }
};

// Hilfsfunktion zur Übersetzung des Status ins Deutsche
const getGermanStatusText = (status: ScheduledPostStatus): string => {
    switch (status) {
        case 'PUBLISHED':
            return 'Veröffentlicht';
        case 'SCHEDULED':
            return 'Geplant';
        case 'DRAFT':
            return 'Entwurf';
        case 'ARCHIVED':
            return 'Archiviert';
        default:
            return status; // Fallback, falls ein unbekannter Status kommt
    }
};

// Hilfsfunktion für Kalender-Tages-Styling (Hintergrund oder Textfarbe)
const getCalendarDayStatusStyle = (status: ScheduledPostStatus): string => {
    switch (status) {
        case 'PUBLISHED':
            return 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 font-semibold';
        case 'SCHEDULED':
            return 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 font-semibold';
        case 'DRAFT':
            return 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 font-semibold';
        // ARCHIVED Tage werden im Kalender nicht speziell hervorgehoben, es sei denn, es ist gewünscht
        default:
            return '';
    }
};

export default function KalenderPage() {
    const [date, setDate] = useState<Date | undefined>(new Date()) // Der tatsächlich ausgewählte Tag
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(startOfMonth(new Date())); // Der aktuell im Kalender angezeigte Monat
    const [monthlyPosts, setMonthlyPosts] = useState<ScheduledPost[]>([]) // Alle Posts des currentDisplayMonth
    const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Lade Posts für den aktuellen Anzeigemonat
    const fetchMonthlyPosts = async (month: Date) => {
        setIsLoading(true);
        const startDate = startOfMonth(month);
        const endDate = endOfMonth(month);

        const result = await getScheduledPosts(startDate, endDate)
        if (result.success && result.posts) {
            setMonthlyPosts(result.posts as ScheduledPost[]);
        } else {
            toast.error(result.error || "Posts für den Monat konnten nicht geladen werden.")
            setMonthlyPosts([]);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchMonthlyPosts(currentDisplayMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDisplayMonth]);

    // Filtere Posts für den ausgewählten Tag aus den monatlichen Posts
    const postsForSelectedDay = useMemo(() => {
        if (!date) return [];
        return monthlyPosts.filter(post => 
            isSameDay(post.scheduledAt, date)
        );
    }, [monthlyPosts, date]);

    const handleSelectDate = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate && (startOfMonth(selectedDate).getTime() !== currentDisplayMonth.getTime())) {
            setCurrentDisplayMonth(startOfMonth(selectedDate));
        }
    }

    const handleMonthChange = (month: Date) => {
        setCurrentDisplayMonth(startOfMonth(month));
    };

    const openDialog = (post: ScheduledPost | null = null) => {
        setSelectedPost(post)
        setIsDialogOpen(true)
    }

    const closeDialog = () => {
        setSelectedPost(null)
        setIsDialogOpen(false)
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true);
        const formData = new FormData(event.currentTarget)
        const title = formData.get('title') as string
        const content = formData.get('content') as string
        const scheduledAtString = formData.get('scheduledAt') as string // Kommt als YYYY-MM-DDTHH:mm
        const status = formData.get('status') as ScheduledPostStatus | undefined; // Status vom Formular holen

        if (!title || !content || !scheduledAtString) {
            toast.error("Bitte fülle alle Felder aus.")
            setIsLoading(false);
            return;
        }

        const scheduledAt = new Date(scheduledAtString);

        const postData: ScheduledPostData = { title, content, scheduledAt, status: status || (selectedPost ? selectedPost.status : 'DRAFT') }

        let result;
        if (selectedPost) {
            result = await updateScheduledPost(selectedPost.id, postData)
        } else {
            result = await createScheduledPost(postData)
        }

        if (result.success) {
            toast.success(selectedPost ? "Post aktualisiert" : "Post erstellt")
            closeDialog()
            fetchMonthlyPosts(currentDisplayMonth) // Monatliche Posts neu laden
        } else {
            toast.error(result.error || "Aktion fehlgeschlagen.")
        }
        setIsLoading(false);
    }

    const handleDelete = async (postId: string) => {
        setIsLoading(true);
        const result = await deleteScheduledPost(postId)
        if (result.success) {
            toast.success("Post gelöscht")
            fetchMonthlyPosts(currentDisplayMonth) // Monatliche Posts neu laden
        } else {
            toast.error(result.error || "Post konnte nicht gelöscht werden.")
        }
        setIsLoading(false);
    }

    const daysWithPostsModifiers = useMemo(() => {
        const modifiers: { [key: string]: Date[] } = {
            published: [],
            scheduled: [],
            draft: [],
            // archived: [] // Falls gewünscht
        };
        monthlyPosts.forEach(post => {
            const day = startOfDay(post.scheduledAt);
            switch (post.status) {
                case 'PUBLISHED':
                    if (!modifiers.published.some(d => isSameDay(d, day))) modifiers.published.push(day);
                    break;
                case 'SCHEDULED':
                    if (!modifiers.scheduled.some(d => isSameDay(d, day))) modifiers.scheduled.push(day);
                    break;
                case 'DRAFT':
                    if (!modifiers.draft.some(d => isSameDay(d, day))) modifiers.draft.push(day);
                    break;
                // case 'ARCHIVED':
                //     if (!modifiers.archived.some(d => isSameDay(d, day))) modifiers.archived.push(day);
                //     break;
            }
        });
        return modifiers;
    }, [monthlyPosts]);

    // Priorisierte Kalender-Modifier-Klassen
    // react-day-picker wendet Stile in der Reihenfolge an, wie sie im modifiers-Objekt definiert sind.
    // Um eine Priorisierung zu erreichen (z.B. Published überschreibt Scheduled), müssen wir die Klassen so definieren,
    // dass die letzte passende Klasse die vorherigen überschreibt oder wir benutzen spezifischere CSS-Regeln.
    // Einfacher ist es oft, die Logik in `Day` Komponente zu verlagern, aber für einfache Klassen geht es so:
    const modifierStyles = {
        published: getCalendarDayStatusStyle('PUBLISHED'),
        scheduled: getCalendarDayStatusStyle('SCHEDULED'),
        draft: getCalendarDayStatusStyle('DRAFT'),
        // archived: getCalendarDayStatusStyle('ARCHIVED'),
        // Standard-Markierung für Tage mit Posts (Fallback, falls kein spezifischer Status dominiert oder für einen allgemeinen Punkt)
        hasPosts: 'font-bold text-neutral-500 relative', // Wird jetzt durch spezifischere Status-Stile überschrieben
    };

    // Wir brauchen immer noch eine allgemeine 'hasPosts' für den Fall, dass keine spezifische Statusfarbe gesetzt wird (z.B. nur archivierte Posts)
    const genericDaysWithPosts = useMemo(() => {
        return monthlyPosts.map(post => startOfDay(post.scheduledAt));
    }, [monthlyPosts]);

    const finalModifiers = {
        ...daysWithPostsModifiers,
        hasPosts: genericDaysWithPosts, // Als Fallback oder für generelle Markierung
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Beiträge planen</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datum auswählen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={handleSelectDate}
                                month={currentDisplayMonth}
                                onMonthChange={handleMonthChange}
                                className="rounded-md border"
                                locale={de} // Deutsche Lokalisierung
                                modifiers={finalModifiers} // Verwende die neuen priorisierten Modifier
                                modifiersClassNames={modifierStyles}
                            />
                            <Button onClick={() => openDialog()} className="mt-4 w-full" disabled={isLoading}>
                                Neuen Post erstellen
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Geplante Posts für {date ? format(date, 'PPP', { locale: de }) : 'Bitte Datum wählen'}
                            </CardTitle>
                            <CardDescription>
                                {isLoading && !postsForSelectedDay.length ? 'Posts werden geladen...' : `Es ${postsForSelectedDay.length === 1 ? 'ist' : 'sind'} ${postsForSelectedDay.length} Post${postsForSelectedDay.length === 1 ? '' : 's'} für diesen Tag geplant.`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {postsForSelectedDay.length > 0 ? (
                                postsForSelectedDay.map((post) => (
                                    <Card key={post.id}>
                                        <CardHeader>
                                            <CardTitle className="text-lg">{post.title}</CardTitle>
                                            <CardDescription>
                                                Geplant für: {format(post.scheduledAt, 'Pp', { locale: de })} - 
                                                <span className={`font-semibold ${getStatusColor(post.status)}`}>Status: {getGermanStatusText(post.status)}</span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-end space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => openDialog(post)} disabled={isLoading}>
                                                Bearbeiten
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)} disabled={isLoading}>
                                                Löschen
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <p>{!isLoading && 'Keine Posts für diesen Tag geplant.'}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedPost ? 'Post bearbeiten' : 'Neuen Post erstellen'}</DialogTitle>
                        <DialogDescription>
                            {selectedPost ? 'Ändere die Details deines Posts.' : 'Fülle die Details für deinen neuen Post aus.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Titel
                            </Label>
                            <Input id="title" name="title" defaultValue={selectedPost?.title || ''} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="content" className="text-right">
                                Inhalt
                            </Label>
                            <Textarea id="content" name="content" defaultValue={selectedPost?.content || ''} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="scheduledAt" className="text-right">
                                Planen am
                            </Label>
                            <Input
                                id="scheduledAt"
                                name="scheduledAt"
                                type="datetime-local"
                                defaultValue={selectedPost?.scheduledAt ? format(selectedPost.scheduledAt, "yyyy-MM-dd'T'HH:mm") : format(date || new Date(), "yyyy-MM-dd'T'HH:mm")}
                                className="col-span-3"
                                required
                            />
                        </div>
                        {selectedPost && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">
                                    Status
                                </Label>
                                <select 
                                    id="status" 
                                    name="status" 
                                    defaultValue={selectedPost?.status || 'DRAFT'} 
                                    className={`col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border ${selectedPost ? getStatusColor(selectedPost.status as ScheduledPostStatus) : getStatusColor('DRAFT')}`}
                                >
                                    <option value="DRAFT" className={getStatusColor('DRAFT')}>Entwurf</option>
                                    <option value="SCHEDULED" className={getStatusColor('SCHEDULED')}>Geplant</option>
                                    <option value="PUBLISHED" className={getStatusColor('PUBLISHED')}>Veröffentlicht</option>
                                    <option value="ARCHIVED" className={getStatusColor('ARCHIVED')}>Archiviert</option>
                                </select>
                            </div>
                        )}
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isLoading}>Abbrechen</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isLoading}>{isLoading ? 'Speichern...' : 'Speichern'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}