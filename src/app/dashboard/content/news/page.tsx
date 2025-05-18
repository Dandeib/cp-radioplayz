'use client'
import { createNews, deleteNews, getAllNews, updateNews } from "@/actions/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { News } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewsPage() {

  interface changedPost {
    id: string
    content: string
    image: string | null
  }

  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [news, setNews] = useState<News[]>([])
  const [editedPost, setEditedPost] = useState<changedPost>()
  // State to store the original content when editing
  const [originalContent, setOriginalContent] = useState<string>('')

  async function getNews() {
    const allNews = await getAllNews()
    setNews(allNews)
  }

  useEffect(() => {
    getNews()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {

    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        createNews(content, base64String);
        toast.success('News erfolgreich erstellt');

        getNews()
      };
      reader.readAsDataURL(image);
    } else {
      createNews(content, null);
      toast.success('News erfolgreich erstellt');

      getNews()
    }

  };

  const handlePostEdit = async () => {

    await updateNews(editedPost!.id, editedPost!.content, editedPost!.image)
    setEditedPost(undefined)
    setOriginalContent('')
    getNews()

    toast.success('News erfolgreich bearbeitet')
  }

  const handleCancelEdit = () => {
    const updatedNews = news.map(item => {
      if (item.id === editedPost?.id) {
        return { ...item, content: originalContent }
      }
      return item
    })
    setNews(updatedNews)
    setEditedPost(undefined)
    setOriginalContent('')
  }

  const handleDeletePost = async (id: string) => {
    await deleteNews(id)
    getNews()
    toast.success('News erfolgreich gelöscht')
  }

  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
      <div className="max-w-2xl w-full space-y-8">
        {/* News Creation Section */}
        <div className="rounded-lg border p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">News erstellen</h2>
              <p className="text-muted-foreground">
                Erstelle einen neuen News-Beitrag
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Inhalt</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Schreibe hier deinen Beitrag..."
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Bild</Label>
                <Input
                  id="image"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImage(e.target.files[0]);
                    }
                  }}
                  accept="image/*"
                />
              </div>
              <Button type="submit" className="w-full">
                News erstellen
              </Button>
            </form>
          </div>
        </div>

        {/* Existing News Section */}
        <div className="rounded-lg border p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Vorherige News</h2>
              <p className="text-muted-foreground">
                Verwalte deine bestehenden News-Beiträge
              </p>
            </div>

            <div className="space-y-4">
              {news.map((blog: News) => (
                <div key={blog.id} className="rounded-lg border p-4">
                  <div className="space-y-4">
                    <Textarea 
                      value={editedPost?.id === blog.id ? editedPost.content : blog.content}
                      onChange={(e) => {
                        if (!editedPost || editedPost.id !== blog.id) {
                          setOriginalContent(blog.content)
                        }
                        setEditedPost({ ...blog, content: e.target.value })
                      }}
                      className="min-h-[100px]"
                    />
                    
                    <div className="flex justify-between items-center">
                      <div>
                        {editedPost?.id === blog.id && (
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancelEdit}>
                              Abbrechen
                            </Button>
                            <Button onClick={handlePostEdit}>
                              Speichern
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={() => handleDeletePost(blog.id)}
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
  );
}