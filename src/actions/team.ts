"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth"; // Assuming auth setup provides session
import { revalidatePath } from "next/cache";
import { AbsenceRequestStatus, Roles } from "@prisma/client"; // Import enums

// Type for absence request data from the form
export type AbsenceRequestFormData = {
  startDate: Date;
  endDate: Date;
  reason?: string;
};

/**
 * Submits a new absence request for the logged-in user.
 */
export async function submitAbsenceRequest(data: AbsenceRequestFormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert. Bitte melden Sie sich an." };
  }

  if (!data.startDate || !data.endDate) {
    return { error: "Start- und Enddatum sind erforderlich." };
  }

  if (new Date(data.endDate) < new Date(data.startDate)) {
    return { error: "Das Enddatum darf nicht vor dem Startdatum liegen." };
  }

  try {
    const newRequest = await db.absenceRequest.create({
      data: {
        requestedById: session.user.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        status: AbsenceRequestStatus.PENDING, // Default status
      },
    });
    revalidatePath("/dashboard/team/abwesendheit");
    return { success: "Ihr Abwesenheitsantrag wurde erfolgreich eingereicht.", request: newRequest };
  } catch (error) {
    console.error("Fehler beim Einreichen des Abwesenheitsantrags:", error);
    return { error: "Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." };
  }
}

/**
 * Fetches all absence requests. 
 * In a real application, you might want to add pagination or date range filters.
 */
export async function getAbsenceRequests() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert.", requests: [] };
  }
  // No specific role check here, as all users might see the calendar,
  // but approval/rejection is role-restricted.

  try {
    const requests = await db.absenceRequest.findMany({
      include: {
        requestedBy: {
          select: { id: true, name: true },
        },
        approvedOrRejectedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });
    return { requests };
  } catch (error) {
    console.error("Fehler beim Abrufen der Abwesenheitsanträge:", error);
    return { error: "Fehler beim Laden der Abwesenheitsanträge.", requests: [] };
  }
}

/**
 * Updates the status of an absence request (e.g., approve or reject).
 * Only users with the 'Management' role can perform this action.
 */
export async function updateAbsenceRequestStatus(
  requestId: string,
  newStatus: AbsenceRequestStatus
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== Roles.Management) {
    return { error: "Nicht autorisiert. Nur Management-Benutzer können Anträge bearbeiten." };
  }

  if (!requestId || !newStatus) {
    return { error: "Ungültige Anfrageparameter." };
  }

  try {
    const existingRequest = await db.absenceRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return { error: "Antrag nicht gefunden." };
    }

    const updatedRequest = await db.absenceRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        approvedOrRejectedById: session.user.id, // Log who made the change
        updatedAt: new Date(), // Explicitly set updatedAt
      },
    });
    revalidatePath("/dashboard/team/abwesendheit");
    const actionText = newStatus === AbsenceRequestStatus.APPROVED ? "genehmigt" : "abgelehnt";
    return { success: `Der Antrag wurde erfolgreich ${actionText}.`, request: updatedRequest };
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Antragsstatus:", error);
    return { error: "Fehler beim Aktualisieren des Antragsstatus." };
  }
}

/**
 * Gets the role of the current authenticated user.
 */
export async function getCurrentUserRole(): Promise<{ role: string | null; userId: string | null }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) { // check for id as well
    return { role: null, userId: null }; 
  }
  // Ensure role is treated as a string, as Prisma enums might behave differently on client vs server
  return { role: session.user.role as string, userId: session.user.id };
}
