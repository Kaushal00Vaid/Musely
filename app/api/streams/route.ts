import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as YoutubeApi from "youtube-search-api";
import { title } from "process";

const YT_REGEX =
  /^(?:https?:\/\/)?(?:(?:www|music)\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

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
    const isYt = YT_REGEX.test(data.url);
    const match = data.url.match(YT_REGEX);

    if (!isYt) {
      return NextResponse.json(
        {
          message: "Wrong URL format",
        },
        {
          status: 411,
        }
      );
    }

    let extractedId = "";

    if (match && match[1]) {
      extractedId = match[1];
    }

    const res = await YoutubeApi.GetVideoDetails(extractedId);

    const thumbnails = res.thumbnail.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        title: res.title ?? "Cant find video",
        smallImg:
          (thumbnails.length > 1
            ? thumbnails[thumbnails.length - 2].url
            : thumbnails[thumbnails.length - 1].url) ??
          "https://pethelpful.com/.image/w_3840,q_auto:good,c_limit/MTk2NzY3MjA5ODc0MjY5ODI2/top-10-cutest-cat-photos-of-all-time.jpg",
        bigImg:
          thumbnails[thumbnails.length - 1].url ??
          "https://pethelpful.com/.image/w_3840,q_auto:good,c_limit/MTk2NzY3MjA5ODc0MjY5ODI2/top-10-cutest-cat-photos-of-all-time.jpg",
        type: "Youtube",
      },
    });
    return NextResponse.json(
      {
        message: "Stream created successfully",
        id: stream.id,
      },
      {
        status: 201,
      }
    );
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      {
        message: "Error while adding a stream",
        error: e,
      },
      {
        status: 411,
      }
    );
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");
  const streams = await prismaClient.stream.findMany({
    where: {
      userId: creatorId ?? "",
    },
  });

  return NextResponse.json({
    streams,
  });
}
