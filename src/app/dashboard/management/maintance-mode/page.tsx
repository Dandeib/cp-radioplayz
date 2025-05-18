'use client'
import { getMantanceMode, setMantanceMode, setMantanceModePassword } from "@/actions/management"
import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@radix-ui/react-label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"



export default function MaintanceModePage() {

    const [mode, setMode] = useState(false)
    const [password, setPassword] = useState("")

    useEffect(() => {

        const getMode = async () => {
            const mode = await getMantanceMode()
            setMode(mode)
        }
        getMode()
    }, [])

    const setModeHandler = async (mode: boolean) => {
        await setMantanceMode(mode)
        setMode(mode)
    }

    const setPasswordHandler = async (password: string) => {

        if(password.length < 8) {
            toast.error("Das Passwort muss mindestens 8 Zeichen lang sein")
            return
        }
        if(password.length <= 0) {
            toast.error("Das Passwort darf nicht leer sein")
            return
        }
        await setMantanceModePassword(password)
    }

    return (
        <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
            <div className="max-w-2xl w-full space-y-8">
                {/* Maintenance Mode Section */}
                <div className="rounded-lg border p-8 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Wartungsmodus</h2>
                            <p className="text-muted-foreground">
                                Setze den Wartungsmodus der Hauptwebsite
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <Switch 
                                id="maintance-mode" 
                                checked={mode} 
                                onCheckedChange={setModeHandler}
                            />
                            <Label htmlFor="maintance-mode" className="font-medium">
                                Wartungsmodus {mode ? "aktiviert" : "deaktiviert"}
                            </Label>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {mode ? "Die Website ist im Wartungsmodus." : "Die Website ist online."}
                        </p>
                    </div>
                </div>

                {/* Password Section */}
                <div className="rounded-lg border p-8 shadow-sm">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Wartungsmodus Passwort</h2>
                            <p className="text-muted-foreground">
                                Setze das Passwort für den Wartungsmodus durchgang
                            </p>
                        </div>

                        <div className="max-w-sm space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="maintenance-password">Passwort</Label>
                                <Input 
                                    id="maintenance-password"
                                    type="password"
                                    placeholder="Mindestens 8 Zeichen"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button 
                                onClick={() => setPasswordHandler(password)}
                                className="w-full"
                            >
                                Passwort setzen
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}