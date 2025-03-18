'use client'
import { createNews } from "@/actions/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function NewsPage() {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [base64Image, setBase64Image] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            
            if (image) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setBase64Image(base64String);
                    createNews(content, base64String);
                    toast.success('News erfolgreich erstellt');
                };
                reader.readAsDataURL(image);
            } else {
                createNews(content, null);
                toast.success('News erfolgreich erstellt');
            }
        };
    };

    return (
        <div className="flex items-center justify-center w-full">
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

        </div>
    );
}