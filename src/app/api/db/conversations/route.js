import { NextResponse } from "next/server";
import {
  createConversation,
  deleteAllConversations,
  deleteConversation,
  getConversationThread,
  listConversations,
  updateConversation,
} from "@/lib/db/repositories";
import { getUserId, handleRouteError } from "@/lib/db/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const limit = Number(searchParams.get("limit")) || 200;
      const { conversation, messages } = await getConversationThread(
        id,
        userId,
        limit
      );
      if (!conversation) {
        return NextResponse.json(
          { success: false, error: "Conversation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, conversation, messages });
    }

    const limit = Number(searchParams.get("limit")) || 25;
    const conversations = await listConversations(userId, limit);
    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    return handleRouteError(error, "Failed to load conversations");
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId(request);
    const body = await request.json().catch(() => ({}));
    const title =
      body.title ||
      (typeof body.firstMessage === "string"
        ? body.firstMessage.slice(0, 120)
        : "New conversation");

    const conversation = await createConversation({
      id: body.id,
      userId,
      title,
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    return handleRouteError(error, "Failed to create conversation");
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Conversation id is required" },
        { status: 400 }
      );
    }

    const conversation = await updateConversation(
      body.id,
      { title: body.title },
      userId
    );

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    return handleRouteError(error, "Failed to update conversation");
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (searchParams.get("all") === "true") {
      const deleted = await deleteAllConversations(userId);
      return NextResponse.json({ success: true, deleted });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Conversation id is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteConversation(id, userId);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    return handleRouteError(error, "Failed to delete conversation");
  }
}
