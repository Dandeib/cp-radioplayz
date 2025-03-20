'use client'
import { createNews, deleteNews, getAllNews, updateNews } from "@/actions/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

    getNews()

    toast.success('News erfolgreich bearbeitet')
  }

  const handleDeletePost = async (id: string) => {
    await deleteNews(id)
    getNews()
    toast.success('News erfolgreich gelöscht')
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-3xl p-8 rounded-md shadow-lg text-center">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Content"
              required
            />
          </div>
          <div>
            <Input
              type="file"
              onChange={(e) => {
                if (e.target.files) {
                  setImage(e.target.files[0]);
                }
              }}
              accept="image/*"
            />
          </div>
          <Button type="submit">Posten</Button>
        </form>
      </div>


      <div className="rounded-md border w-full max-w-4xl p-8 mt-16">
        <h1 className="text-2xl font-bold mb-4 text-center">Vorherige News</h1>

        <div className="bg-gray-50/2 rounded-lg shadow-lg">
          {news.map((blog: News) => (
            <div key={blog.id} className="shadow-lg rounded-lg bg-gray-100 p-4 mb-4">
              <Textarea onChange={(e) => setEditedPost({ ...blog, content: e.target.value })} defaultValue={blog.content}></Textarea>

              <div className="flex justify-between p-4">
                <div>

                  {editedPost?.id == blog.id && (
                    <div>
                      <Button className="mr-2 bg-red-500 hover:bg-red-400" onClick={() => { setEditedPost(undefined) }}>Abbrechen</Button>
                      <Button onClick={handlePostEdit}>Speichern</Button>
                    </div>
                  )}
                </div>
                <div>
                  <Button className="bg-red-500 hover:bg-red-400" onClick={() => { handleDeletePost(blog.id) }}>Löschen</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}