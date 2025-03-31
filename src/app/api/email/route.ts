'use server'
import { NextRequest, NextResponse } from "next/server";
import Imap from "imap-simple";
import dotenv from "dotenv";

dotenv.config();

export async function GET(req: NextRequest) {
  const config = {
    imap: {
      user: 'daniel.deibert633@gmail.com',
      password: 'inuj rttv qaju vvug',
      host: "imap.gmail.com",
      port: 993,
      tls: true,
    },
  };

  try {
    const connection = await Imap.connect(config);
    await connection.openBox("INBOX");
    const searchCriteria = ["UNSEEN"];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    connection.end();

    return NextResponse.json(messages);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
