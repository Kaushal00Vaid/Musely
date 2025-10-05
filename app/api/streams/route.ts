import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z
    .string()
    .url({ message: "Invalid URL format" })
    .regex(/youtube\.com|spotify\.com/, {
      message: "URL must be a valid link from YouTube or Spotify",
    }),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      {
        message: "Error while adding a stream",
      },
      {
        status: 411,
      }
    );
  }
}
