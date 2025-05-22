'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createApplication, getAllApplications, updateApplication, deleteApplication, setArchived } from "@/actions/management"

interface Application {
  id: string
  title: string
  description: string
  image: string | null
  archived: boolean
}

export default function ApplicationsPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    const fetchedApplications = await getAllApplications()
    setApplications(fetchedApplications)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !description) {
      toast.error('Bitte fülle alle erforderlichen Felder aus')
      return
    }

    try {
      await createApplication(title, description, imageUrl || undefined)
      await fetchApplications()
      
      // Reset form
      setTitle('')
      setDescription('')
      setImageUrl('')
      
      toast.success('Bewerbung erfolgreich erstellt')
    } catch (error) {
      toast.error('Fehler beim Erstellen der Bewerbung')
    }
  }

  const handleEdit = async () => {
    if (!editingApplication) return

    try {
      await updateApplication(
        editingApplication.id,
        editingApplication.title,
        editingApplication.description,
        editingApplication.image || undefined
      )
      
      await fetchApplications()
      setIsDialogOpen(false)
      setEditingApplication(null)
      toast.success('Bewerbung erfolgreich aktualisiert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Bewerbung')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id)
      await fetchApplications()
      toast.success('Bewerbung erfolgreich gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen der Bewerbung')
    }
  }

  const handleSetArchiveStatus = async (id: string, newArchivedStatus: boolean) => {
    try {
      await setArchived(id, newArchivedStatus)
      await fetchApplications()
      toast.success(`Bewerbung erfolgreich ${newArchivedStatus ? 'archiviert' : 'wiederhergestellt'}`)
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Archivstatus')
    }
  }

  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
      <div className="max-w-6xl w-full space-y-8">
        {/* Application Creation Section */}
        <div className="rounded-lg border p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Bewerbung erstellen</h2>
              <p className="text-muted-foreground">
                Erstelle eine neue Bewerbung
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. DJ Position"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibe deine Erfahrungen und Motivation..."
                  className="min-h-[150px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Bild URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <Button type="submit" className="w-full">
                Bewerbung absenden
              </Button>
            </form>
          </div>
        </div>

        {/* Applications List Section */}
        <div className="rounded-lg border p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Erstellte Bewerbungen</h2>
              <p className="text-muted-foreground">
                Übersicht aller erstellten Bewerbungen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((application) => (
                <div 
                  key={application.id} 
                  className={`rounded-lg border text-card-foreground shadow-sm flex flex-col h-full min-h-[540px] transition-all duration-200 hover:shadow-lg ${application.archived ? 'opacity-70 bg-gray-100' : 'bg-card'}`}
                >
                  <div className="p-6 flex-grow flex flex-col">
                    {application.image ? (
                      <div className="aspect-video w-full rounded-md mb-6">
                        <img
                          src={application.image}
                          alt={application.title}
                          className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-md mb-6">
                        <span className="text-sm text-muted-foreground">Kein Bild</span>
                      </div>
                    )}
                    <div className="space-y-1.5 flex-grow">
                      <h3 className="text-xl font-semibold tracking-tight mb-3">{application.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {application.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-center p-3 mt-auto border-t">
                    <div className="flex justify-end gap-2 w-full">
                      <Dialog open={editingApplication?.id === application.id && isDialogOpen}
                              onOpenChange={(open) => {
                                if (!open && !application.archived) {
                                  setEditingApplication(null);
                                }
                                setIsDialogOpen(open);
                              }}>
                        <DialogTrigger asChild disabled={application.archived}>
                          <Button
                            variant="outline"
                            disabled={application.archived}
                            onClick={() => {
                              if (!application.archived) {
                                setEditingApplication(application);
                                setIsDialogOpen(true);
                              }
                            }}
                          >
                            Bearbeiten
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Bewerbung bearbeiten</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-title">Titel</Label>
                              <Input
                                id="edit-title"
                                value={editingApplication?.title || ''}
                                onChange={(e) => setEditingApplication(prev => prev ? {
                                  ...prev,
                                  title: e.target.value
                                } : null)}
                                placeholder="Titel der Bewerbung"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Beschreibung</Label>
                              <Textarea
                                id="edit-description"
                                value={editingApplication?.description || ''}
                                onChange={(e) => setEditingApplication(prev => prev ? {
                                  ...prev,
                                  description: e.target.value
                                } : null)}
                                placeholder="Beschreibung der Bewerbung"
                                className="min-h-[100px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-imageUrl">Bild URL (Optional)</Label>
                              <Input
                                id="edit-imageUrl"
                                value={editingApplication?.image || ''}
                                onChange={(e) => setEditingApplication(prev => prev ? {
                                  ...prev,
                                  image: e.target.value
                                } : null)}
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                            <Button onClick={handleEdit} className="w-full">
                              Änderungen speichern
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant={application.archived ? "secondary" : "default"}
                        className={!application.archived ? "bg-yellow-500 hover:bg-yellow-400 text-white" : "bg-green-500 hover:bg-green-400 text-white text-xs"}
                        onClick={() => handleSetArchiveStatus(application.id, !application.archived)}
                      >
                        {application.archived ? 'Wiederherstellen' : 'Archivieren'}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(application.id)}
                        disabled={application.archived}
                      >
                        Löschen
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}