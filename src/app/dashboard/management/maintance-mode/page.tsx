'use client'
import { getMantanceMode, setMantanceMode } from "@/actions/management"
import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@radix-ui/react-label"


export default function MaintanceModePage() {

    const [mode, setMode] = useState(false)

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

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-3xl p-8 rounded-md shadow-lg text-center">
                <h1 className="text-2xl font-bold mb-4 text-center">Wartungsmodus</h1>
                <p>Setze den Wartungsmodus der Hauptwebsite</p>
                <div className="flex items-center justify-center mt-8 space-x-2">
                    <Label htmlFor="maintance-mode">Wartungsmodus</Label>
                    <Switch id="maintance-mode" checked={mode} onCheckedChange={setModeHandler} />
                </div>
            </div>
        </div>
    )
}