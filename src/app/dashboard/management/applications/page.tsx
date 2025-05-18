'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createApplication, getAllApplications, updateApplication, deleteApplication } from "@/actions/management"

interface Application {
  id: string
  title: string
  description: string
  image: string | null
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

  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
      <div className="max-w-2xl w-full space-y-8">
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

            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="rounded-lg border p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{application.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{application.description}</p>
                    {application.image && (
                      <img 
                        src={application.image} 
                        alt={application.title}
                        className="mt-2 rounded-md max-h-40 object-cover"
                      />
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setEditingApplication(application)}
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
                                className="min-h-[150px]"
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
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false)
                                setEditingApplication(null)
                              }}
                            >
                              Abbrechen
                            </Button>
                            <Button onClick={handleEdit}>
                              Speichern
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="destructive"
                        onClick={() => handleDelete(application.id)}
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