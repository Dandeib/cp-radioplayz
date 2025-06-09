'use client'

import { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
  addDays,
  differenceInDays,
  isSameDay,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { de } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { DayContentProps } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  submitAbsenceRequest,
  getAbsenceRequests as fetchAbsenceRequestsAction, // Renamed to avoid conflict
  updateAbsenceRequestStatus,
  getCurrentUserRole,
  AbsenceRequestFormData, // Added back
} from '@/actions/team';
import { AbsenceRequest as PrismaAbsenceRequest, AbsenceRequestStatus, Roles } from '@prisma/client';

// Client-side type with Date objects
interface AbsenceRequest extends Omit<PrismaAbsenceRequest, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'requestedBy' | 'approvedOrRejectedBy'> {
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  requestedBy: { id: string; name: string | null };
  approvedOrRejectedBy?: { id: string; name: string | null } | null;
}

const getGermanAbsenceStatusText = (status: AbsenceRequestStatus): string => {
  switch (status) {
    case AbsenceRequestStatus.PENDING: return 'Ausstehend';
    case AbsenceRequestStatus.APPROVED: return 'Genehmigt';
    case AbsenceRequestStatus.REJECTED: return 'Abgelehnt';
    default: return status;
  }
};

const getStatusColor = (status: AbsenceRequestStatus): string => {
  switch (status) {
    case AbsenceRequestStatus.PENDING: return 'text-yellow-600';
    case AbsenceRequestStatus.APPROVED: return 'text-green-600';
    case AbsenceRequestStatus.REJECTED: return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export default function AbwesenheitsKalenderPage() {
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<Roles | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(startOfMonth(new Date()));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'view'>('create');
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const roleData = await getCurrentUserRole();
      setCurrentUserRole(roleData.role as Roles | null);
      setCurrentUserId(roleData.userId);

      const result = await fetchAbsenceRequestsAction();
      if (result.requests) {
        const parsedRequests: AbsenceRequest[] = result.requests.map(req => ({
          ...req,
          // Dates from Prisma are already Date objects, no need for parseISO
          startDate: req.startDate as Date,
          endDate: req.endDate as Date,
          createdAt: req.createdAt as Date,
          updatedAt: req.updatedAt as Date,
          requestedBy: req.requestedBy ? { id: req.requestedBy.id, name: req.requestedBy.name } : {id: 'unknown', name: 'Unbekannt'},
          approvedOrRejectedBy: req.approvedOrRejectedBy ? { id: req.approvedOrRejectedBy.id, name: req.approvedOrRejectedBy.name } : null,
        }));
        setAbsenceRequests(parsedRequests);
      } else if (result.error) {
        toast.error(`Fehler beim Laden der Anträge: ${result.error}`);
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten.');
      console.error(error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAndSetData();
  }, [fetchAndSetData]);

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (month: Date) => {
    setCurrentDisplayMonth(month);
  };

  const displayedAbsenceRequests = useMemo(() => {
    let filtered = absenceRequests;

    if (currentUserRole !== Roles.Management && currentUserId) {
      filtered = filtered.filter(req => req.requestedById === currentUserId);
    }

    if (selectedDate) {
      return filtered.filter(req => 
        isWithinInterval(selectedDate, { start: startOfDay(req.startDate), end: endOfDay(req.endDate) })
      ).sort((a,b) => a.startDate.getTime() - b.startDate.getTime());
    } else {
      // Show current and future requests if no date is selected
      const today = startOfDay(new Date());
      return filtered.filter(req => req.endDate >= today)
                     .sort((a,b) => a.startDate.getTime() - b.startDate.getTime());
    }
  }, [absenceRequests, selectedDate, currentUserRole, currentUserId]);

  const absenceDaysModifiers = useMemo(() => {
    const modifiers: { [key: string]: Date[] | ((date: Date) => boolean) } = {
        pending: [],
        approved: [],
        // rejected: [], // Optional: if you want to style rejected days
    };
    absenceRequests.forEach(req => {
        const daysInInterval = eachDayOfInterval({ start: req.startDate, end: req.endDate });
        if (req.status === AbsenceRequestStatus.PENDING) {
            (modifiers.pending as Date[]).push(...daysInInterval);
        }
        if (req.status === AbsenceRequestStatus.APPROVED) {
            (modifiers.approved as Date[]).push(...daysInInterval);
        }
        // if (req.status === AbsenceRequestStatus.REJECTED) {
        //     (modifiers.rejected as Date[]).push(...daysInInterval);
        // }
    });
    return modifiers;
  }, [absenceRequests]);

  const absenceModifiersStyles = {
    pending: { backgroundColor: 'rgba(250, 204, 21, 0.3)', color: '#713f12' }, // Amber-ish
    approved: { backgroundColor: 'rgba(34, 197, 94, 0.3)', color: '#14532d' }, // Green-ish
    // rejected: { backgroundColor: 'rgba(239, 68, 68, 0.2)', textDecoration: 'line-through', color: '#7f1d1d' },
    today: { fontWeight: 'bold' }
  };

  const DayContent = useCallback((props: DayContentProps) => {
    const { date, displayMonth } = props;
    if (!isWithinInterval(date, { start: startOfMonth(displayMonth), end: endOfMonth(displayMonth) })) {
        return <></>;
    }

    const dayAbsences = absenceRequests.filter(req => 
        isWithinInterval(date, { start: startOfDay(req.startDate), end: endOfDay(req.endDate) })
    );

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
            <span>{format(date, 'd')}</span>
            {dayAbsences.length > 0 && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                    {dayAbsences.slice(0, 3).map(a => (
                        <div key={a.id} className={`w-1.5 h-1.5 rounded-full ${ 
                            a.status === AbsenceRequestStatus.APPROVED ? 'bg-green-500' : 
                            a.status === AbsenceRequestStatus.PENDING ? 'bg-yellow-500' : 
                            'bg-red-500'}`}></div>
                    ))}
                </div>
            )}
        </div>
    );
  }, [absenceRequests]);

  const openDialogForCreate = () => {
    setDialogMode('create');
    const todayStr = format(new Date(), "yyyy-MM-dd");
    setFormStartDate(todayStr);
    setFormEndDate(todayStr);
    setFormReason('');
    setSelectedRequest(null);
    setIsDialogOpen(true);
  };

  const openDialogForView = (request: AbsenceRequest) => {
    setSelectedRequest(request);
    setDialogMode('view');
    setFormStartDate(format(request.startDate, "yyyy-MM-dd"));
    setFormEndDate(format(request.endDate, "yyyy-MM-dd"));
    setFormReason(request.reason || '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
    // Optionally reset form fields here if desired when closing view mode too
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formStartDate || !formEndDate) {
      toast.error('Start- und Enddatum sind erforderlich.');
      return;
    }
    if (new Date(formEndDate) < new Date(formStartDate)) {
        toast.error('Das Enddatum darf nicht vor dem Startdatum liegen.');
        return;
    }
    setIsLoading(true);
    const formData: AbsenceRequestFormData = {
      startDate: new Date(formStartDate),
      endDate: new Date(formEndDate),
      reason: formReason,
    };

    const result = await submitAbsenceRequest(formData);
    if (result.success && result.request) {
      toast.success(result.success);
      fetchAndSetData(); // Refresh data
      closeDialog();
    } else if (result.error) {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: AbsenceRequestStatus) => {
    setIsLoading(true);
    const result = await updateAbsenceRequestStatus(requestId, newStatus);
    if (result.success) {
      toast.success(result.success);
      fetchAndSetData(); // Refresh data
      // If the currently viewed request was updated, update its state or close dialog
      if (selectedRequest && selectedRequest.id === requestId) {
        if (dialogMode === 'view') {
            const updatedReq = absenceRequests.find(r => r.id === requestId);
            if (updatedReq) setSelectedRequest(updatedReq); // Update with new status if still in view
            else closeDialog(); // Or close if it's gone for some reason
        }
      }
      if (dialogMode === 'view' && !(newStatus === AbsenceRequestStatus.PENDING && currentUserRole === Roles.Management)) {
        // closeDialog(); // Close if not pending and management (i.e. action taken)
      }
    } else if (result.error) {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4 flex flex-col h-full max-h-screen">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Abwesenheitskalender</CardTitle>
          <CardDescription>Planen und verwalten Sie hier Ihre Abwesenheiten und die Ihres Teams.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
          <div className="md:w-auto flex-grow flex flex-col md:max-w-lg lg:max-w-xl">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              month={currentDisplayMonth}
              onMonthChange={handleMonthChange}
              locale={de}
              className="rounded-md border w-full"
              components={{ DayContent: DayContent }}
              modifiers={absenceDaysModifiers}
              modifiersStyles={absenceModifiersStyles} // Changed from modifiersClassNames
              ISOWeek
            />
             <Button onClick={openDialogForCreate} className="mt-4 w-full md:w-auto" disabled={isLoading}>
                Neue Abwesenheit eintragen
             </Button>
          </div>
          <div className="md:w-2/5 lg:w-1/3 xl:w-1/3 flex flex-col overflow-hidden space-y-3">
            <h3 className="text-lg font-semibold sticky top-0 bg-card py-2 px-1 border-b z-10">
                {selectedDate ? `Anträge am ${format(selectedDate, 'dd.MM.yyyy', { locale: de })}` : 'Kommende/Aktuelle Anträge'}
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-4">
                {isLoading && <p className="p-1">Lade Anträge...</p>}
                {!isLoading && displayedAbsenceRequests.length === 0 && (
                <p className="text-sm text-gray-500 p-1">Keine Anträge für die aktuelle Auswahl vorhanden.</p>
                )}
                {!isLoading && displayedAbsenceRequests.map((request) => (
                <Card key={request.id} className="mb-2 shadow-sm cursor-pointer hover:shadow-md" onClick={() => openDialogForView(request)}>
                    <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className={`text-sm font-semibold ${getStatusColor(request.status)}`}>
                        {request.requestedBy.name} - {getGermanAbsenceStatusText(request.status)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {format(request.startDate, 'dd.MM.yy', { locale: de })} - {format(request.endDate, 'dd.MM.yy', { locale: de })}
                    </CardDescription>
                    {request.reason && <p className="text-xs text-gray-600 pt-1 truncate">Grund: {request.reason}</p>}
                    </CardHeader>
                    {currentUserRole === Roles.Management && request.status === AbsenceRequestStatus.PENDING && (
                    <CardFooter className="flex justify-end gap-2 pt-1 pb-2 px-3">
                        <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 h-7 px-2 py-1 text-xs" onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(request.id, AbsenceRequestStatus.APPROVED)}} disabled={isLoading}>
                        Genehmigen
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 h-7 px-2 py-1 text-xs" onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(request.id, AbsenceRequestStatus.REJECTED)}} disabled={isLoading}>
                        Ablehnen
                        </Button>
                    </CardFooter>
                    )}
                </Card>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {if (!open) closeDialog(); else setIsDialogOpen(true);}}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Abwesenheit beantragen'}
              {dialogMode === 'view' && selectedRequest && `Antrag von ${selectedRequest.requestedBy.name}`}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' && 'Füllen Sie die Details für Ihren Abwesenheitsantrag aus.'}
              {dialogMode === 'view' && selectedRequest && `Details zum Antrag vom ${format(selectedRequest.startDate, 'dd.MM.yyyy', { locale: de })}. Status: ${getGermanAbsenceStatusText(selectedRequest.status)}`}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === 'create' && (
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">Startdatum</Label>
                <Input id="startDate" name="startDate" type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="col-span-3" required disabled={isLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">Enddatum</Label>
                <Input id="endDate" name="endDate" type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className="col-span-3" required disabled={isLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">Grund (optional)</Label>
                <Textarea id="reason" name="reason" value={formReason} onChange={e => setFormReason(e.target.value)} className="col-span-3" disabled={isLoading} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isLoading}>Abbrechen</Button></DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Senden...' : 'Antrag senden'}</Button>
              </DialogFooter>
            </form>
          )}

          {dialogMode === 'view' && selectedRequest && (
            <div className="grid gap-3 py-4">
                <p><strong>Antragsteller:</strong> {selectedRequest.requestedBy.name}</p>
                <p><strong>Zeitraum:</strong> {format(selectedRequest.startDate, 'dd.MM.yyyy', { locale: de })} - {format(selectedRequest.endDate, 'dd.MM.yyyy', { locale: de })}</p>
                {selectedRequest.reason && <p><strong>Grund:</strong> {selectedRequest.reason}</p>}
                <p><strong>Status:</strong> <span className={getStatusColor(selectedRequest.status)}>{getGermanAbsenceStatusText(selectedRequest.status)}</span></p>
                {selectedRequest.approvedOrRejectedBy && (
                    <p><strong>Bearbeitet von:</strong> {selectedRequest.approvedOrRejectedBy.name} am {format(selectedRequest.updatedAt, 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                )}
                <DialogFooter className="mt-4 pt-4 border-t">
                    {currentUserRole === Roles.Management && selectedRequest.status === AbsenceRequestStatus.PENDING && (
                        <>
                            <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleUpdateRequestStatus(selectedRequest.id, AbsenceRequestStatus.REJECTED)} disabled={isLoading}>
                                Ablehnen
                            </Button>
                            <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => handleUpdateRequestStatus(selectedRequest.id, AbsenceRequestStatus.APPROVED)} disabled={isLoading}>
                                Genehmigen
                            </Button>
                        </>
                    )}
                    <DialogClose asChild><Button type="button" variant="outline">Schließen</Button></DialogClose>
                 </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}