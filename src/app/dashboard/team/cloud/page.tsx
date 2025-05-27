"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // CardDescription importiert
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Download, Trash2, Eye, FileText, MoreVertical, KeyRound, AlertTriangle } from 'lucide-react';

interface CloudFile {
  id: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const BACKEND_API_KEY = process.env.NEXT_PUBLIC_BACKEND_API_KEY;

// Hilfsfunktion für Dateigröße
const formatFileSize = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function CloudPage() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalContent, setViewModalContent] = useState<{ type: 'text' | 'json' | 'pdf' | 'image' | 'unsupported', data: any, title: string }>({ type: 'unsupported', data: '', title: '' });
  const objectUrlRef = useRef<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<CloudFile | null>(null);

  const currentUserId = session?.user.id; 

  const apiCall = useCallback(async (endpoint: string, method = 'GET', body: any = null, isFormData = false, onProgress: ((percent: number) => void) | null = null) => {
    if (!API_URL || !BACKEND_API_KEY) {
      const errorMsg = "API-Konfiguration fehlt. Bitte NEXT_PUBLIC_API_URL und NEXT_PUBLIC_BACKEND_API_KEY in .env.local prüfen und Server neustarten.";
      console.error(errorMsg);
      toast.error(errorMsg, {id: "config-error-apicall", duration: 10000});
      throw new Error(errorMsg);
    }

    if (!currentUserId) {
      const errorMsg = "Benutzer-ID nicht verfügbar. Bitte erneut anmelden.";
      console.error(errorMsg, "Session Status:", status, "Session Data:", session);
      toast.error(errorMsg, {id: "userid-error-apicall"});
      throw new Error("Benutzer-ID nicht verfügbar");
    }
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${BACKEND_API_KEY}`,
      'X-User-ID': currentUserId,
    };
    if (body && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = { method, headers };
    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }
    
    const fullApiUrl = `${API_URL}${endpoint}`;
    console.log(`API Call: ${method} ${fullApiUrl} für User ID: ${currentUserId}`);


    try {
      if (method === 'POST' && isFormData && onProgress) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(method, fullApiUrl);
          xhr.setRequestHeader('Authorization', `Bearer ${BACKEND_API_KEY}`);
          xhr.setRequestHeader('X-User-ID', currentUserId);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              onProgress(percentComplete);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(JSON.parse(xhr.responseText)); }
              catch (e) { reject({ message: "Ungültige JSON-Antwort.", status: xhr.status, details: xhr.responseText.substring(0,200), url: fullApiUrl }); }
            } else {
              let errorResponse = { message: xhr.statusText || `Fehler: ${xhr.status}`, status: xhr.status, details: "", url: fullApiUrl };
              try { errorResponse = { ...errorResponse, ...JSON.parse(xhr.responseText) }; }
              catch (e) { errorResponse.details = xhr.responseText.substring(0,200); }
              reject(errorResponse);
            }
          };
          xhr.onerror = () => reject({ message: 'Netzwerkfehler oder CORS-Problem.', status: 0, url: fullApiUrl });
          xhr.send(body);
        });
      } else {
        const response = await fetch(fullApiUrl, config);
        if (!response.ok) {
          let errorData;
          try { 
            errorData = await response.json(); 
            if (typeof errorData !== 'object' || errorData === null) { 
              errorData = { message: "Unerwartetes Fehlerformat vom Server." };
            }
          }
          catch (e) { 
            const errorText = await response.text().catch(() => "Fehlerdetails konnten nicht gelesen werden."); 
            errorData = { 
              message: response.statusText || `HTTP-Fehler ${response.status}`,
              status: response.status, 
              details: errorText.substring(0, 500)
            };
          }
          if (!errorData.message && response.statusText) { errorData.message = response.statusText; }
          else if (!errorData.message) { errorData.message = `HTTP-Fehler ${response.status}`; }
          if (!errorData.status) { errorData.status = response.status; }
          errorData.url = fullApiUrl;
          throw errorData;
        }
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/octet-stream") || 
            contentType?.startsWith("text/") || 
            contentType?.includes("application/pdf") || 
            contentType?.startsWith("image/")) {
          return response;
        }
        try { return await response.json(); }
        catch (e) { 
          const responseText = await response.text().catch(() => "Antwort konnte nicht als Text gelesen werden."); 
          throw { message: "Antwort des Servers ist kein valides JSON.", details: responseText.substring(0, 500), status: response.status, url: fullApiUrl };
        }
      }
    } catch (error: any) {
      console.error(`API Fehler (${method} ${error.url || fullApiUrl}):`, error);
      let displayMessage = 'Ein API-Fehler ist aufgetreten.';
      if (error && typeof error === 'object') {
        if (error.message) { displayMessage = error.message; }
        else if (error.status) { displayMessage = `Fehler ${error.status}`; }
        if (error.details && String(error.details).length > 0 && !displayMessage.includes(String(error.details).substring(0,50))) { 
          displayMessage += ` (Details: ${String(error.details).substring(0,100)}...)`;
        }
      } else if (typeof error === 'string') { displayMessage = error; }
      toast.error(displayMessage, {id: `api-error-${Date.now()}`});
      throw error;
    }
  }, [currentUserId, status, session]);

  const fetchFiles = useCallback(async () => {
    if (!currentUserId || status !== "authenticated") return;
    setIsLoadingFiles(true);
    try {
      const data = await apiCall('/files/list');
      setFiles(data.files || []);
    } catch (error) {
      setFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [apiCall, currentUserId, status]);

  useEffect(() => {
    if (status === 'authenticated' && API_URL && BACKEND_API_KEY) {
      fetchFiles();
    } else {
      setFiles([]);
    }
  }, [status, fetchFiles]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUserId) {
      toast.error("Keine Datei ausgewählt oder Benutzer nicht angemeldet.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await apiCall('/files/upload', 'POST', formData, true, (progress) => {
        setUploadProgress(progress);
      });
      toast.success(`Datei "${selectedFile.name}" erfolgreich hochgeladen!`);
      fetchFiles();
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openDeleteConfirmation = (file: CloudFile) => {
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await apiCall(`/files/${fileToDelete.id}`, 'DELETE'); 
      toast.success(`Datei "${fileToDelete.originalName}" erfolgreich gelöscht!`);
      fetchFiles();
    } catch (error) {
    } finally {
      setDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  const handleView = async (file: CloudFile) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setViewModalContent({ type: 'unsupported', data: '', title: 'Dateiinhalt wird geladen...' });
    setViewModalOpen(true);
    try {
      const response = await apiCall(`/files/${file.id}?view=true`, 'GET') as Response; 
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      if (file.mimetype.startsWith('image/')) {
        setViewModalContent({ type: 'image', data: url, title: file.originalName });
      } else if (file.mimetype === 'application/pdf') {
        setViewModalContent({ type: 'pdf', data: url, title: file.originalName });
      } else if (file.mimetype === 'application/json') {
        const text = await blob.text();
        setViewModalContent({ type: 'json', data: JSON.parse(text), title: file.originalName });
      } else if (file.mimetype.startsWith('text/')) {
        const text = await blob.text();
        setViewModalContent({ type: 'text', data: text, title: file.originalName });
      } else {
        URL.revokeObjectURL(url); 
        objectUrlRef.current = null;
        setViewModalContent({ type: 'unsupported', data: `Dateityp ${file.mimetype} wird nicht für die Vorschau unterstützt. Sie können die Datei herunterladen.`, title: file.originalName });
      }
    } catch (error) {
      if (objectUrlRef.current) { 
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setViewModalContent({ type: 'unsupported', data: 'Fehler beim Laden der Vorschau.', title: file.originalName });
      setViewModalOpen(true);
    }
  };

  const handleDownload = async (file: CloudFile) => {
    try {
      const response = await apiCall(`/files/${file.id}`, 'GET') as Response; 
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Datei "${file.originalName}" wird heruntergeladen.`);
    } catch (error) {
    }
  };
  
  const handleModalClose = () => { 
    setViewModalOpen(false);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };


  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen"><p>Authentifizierung wird geladen...</p></div>;
  }

  if (!API_URL || !BACKEND_API_KEY) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-900 text-red-100 p-8">
        <AlertTriangle className="h-16 w-16 text-red-300 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Konfigurationsfehler</h1>
        <p className="text-lg text-center mb-2">NEXT_PUBLIC_API_URL oder NEXT_PUBLIC_BACKEND_API_KEY fehlt.</p>
        <p className="text-md text-center">Bitte <code className="bg-red-800 px-1 rounded">.env.local</code> prüfen und Server neustarten.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-screen text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <KeyRound className="mr-2 h-6 w-6" /> Zugriff verweigert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Bitte melden Sie sich an, um auf den Cloud Speicher zuzugreifen.</p>
            <p className="text-xs text-muted-foreground mt-2">Sie werden zum Login weitergeleitet oder können einen Token manuell eingeben, falls Ihre Login-Seite dies unterstützt.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => signIn()} className="w-full">Anmelden</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Mein Cloud Speicher</h1>
            {/* Abmelde-Button und UserID-Anzeige entfernt */}
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Datei hochladen</h2>
              <p className="text-muted-foreground">
                Laden Sie neue Dateien in Ihren Cloud Speicher hoch.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Datei auswählen</Label>
                <Input id="file-upload" type="file" onChange={handleFileChange} disabled={isUploading || isLoadingFiles} />
              </div>
              {selectedFile && !isUploading && (
                <p className="text-sm text-muted-foreground">Ausgewählt: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
              )}
              {isUploading && (
                <div className="space-y-2">
                  <Label>Upload Fortschritt</Label>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
                </div>
              )}
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading || isLoadingFiles} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Lädt hoch...' : 'Hochladen'}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Meine Dateien</h2>
              {/* UserID-Anzeige hier ebenfalls entfernt, falls vorhanden */}
              <p className="text-muted-foreground">
                Verwalten Sie Ihre hochgeladenen Dateien.
              </p>
            </div>
            {isLoadingFiles && <p className="text-center text-muted-foreground py-4">Dateien werden geladen...</p>}
            {!isLoadingFiles && files.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Noch keine Dateien hochgeladen.</p>
            )}
            {!isLoadingFiles && files.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Dateiname</TableHead>
                        <TableHead className="w-[20%]">Typ</TableHead>
                        <TableHead className="w-[15%]">Größe</TableHead>
                        <TableHead className="w-[20%]">Hochgeladen am</TableHead>
                        <TableHead className="text-right w-[15%]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium truncate max-w-xs" title={file.originalName}>{file.originalName}</TableCell>
                          <TableCell className="truncate max-w-[150px]" title={file.mimetype}>{file.mimetype}</TableCell>
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          <TableCell>{new Date(file.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })} {new Date(file.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit'})}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Menü öffnen</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(file)}>
                                  <Eye className="mr-2 h-4 w-4" /> Ansicht
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(file)}>
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </DropdownMenuItem>
                                {currentUserId === file.userId && ( 
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => openDeleteConfirmation(file)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                      <Trash2 className="mr-2 h-4 w-4" /> Löschen
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={viewModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[50vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">Vorschau: {viewModalContent.title}</DialogTitle>
            <DialogDescription className="sr-only">Detailansicht der Datei: {viewModalContent.title}</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-auto p-1 border rounded-md flex justify-center items-center">
            {viewModalContent.type === 'image' && <img src={viewModalContent.data} alt={viewModalContent.title} className="max-w-full max-h-full object-contain mx-auto" />}
            {viewModalContent.type === 'pdf' && <iframe src={viewModalContent.data} className="w-full h-full" title={viewModalContent.title} />}
            {viewModalContent.type === 'text' && <pre className="whitespace-pre-wrap break-all p-2 text-sm w-full h-full">{viewModalContent.data}</pre>}
            {viewModalContent.type === 'json' && <pre className="whitespace-pre-wrap break-all p-2 text-sm w-full h-full">{JSON.stringify(viewModalContent.data, null, 2)}</pre>}
            {viewModalContent.type === 'unsupported' && <p className="p-4 text-center text-muted-foreground">{viewModalContent.data}</p>}
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={handleModalClose}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datei löschen bestätigen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie die Datei "{fileToDelete?.originalName}" unwiderruflich löschen möchten?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
