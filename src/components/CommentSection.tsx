"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageSquare, Send, Trash2, CornerDownRight } from "lucide-react";
import { addComment, deleteComment } from "@/app/actions/comments";
import { Comment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type CommentSectionProps = {
  plateId: string;
  comments: Comment[];
  currentUserId: string | null;
};

function Avatar({ username }: { username: string }) {
  return (
    <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center shadow-sm">
      <span className="text-white text-xs font-bold">
        {username[0].toUpperCase()}
      </span>
    </div>
  );
}

type CommentInputProps = {
  plateId: string;
  parentId?: string | null;
  placeholder?: string;
  onDone?: () => void;
  autoFocus?: boolean;
};

function CommentInput({
  plateId,
  parentId,
  placeholder = "Write a comment…",
  onDone,
  autoFocus,
}: CommentInputProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await addComment(plateId, body, parentId);
      if (result?.error) {
        setError(result.error);
      } else {
        setBody("");
        onDone?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <div className="flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={2}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none bg-gray-50 placeholder-gray-400"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={isPending || !body.trim()}
        className="mt-1 flex-shrink-0 w-9 h-9 flex items-center justify-center bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 shadow-md"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}

type CommentItemProps = {
  comment: Comment;
  plateId: string;
  currentUserId: string | null;
  depth?: number;
};

function CommentItem({
  comment,
  plateId,
  currentUserId,
  depth = 0,
}: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOwn = currentUserId === comment.user_id;
  const username = comment.profiles?.username ?? "User";

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(comment.id, plateId);
    });
  }

  return (
    <div className={depth > 0 ? "ml-10 mt-3" : "mt-4"}>
      <div className="flex gap-3 group">
        <Link href={`/profile/${comment.user_id}`}>
          <Avatar username={username} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-2.5 inline-block max-w-full">
            <Link
              href={`/profile/${comment.user_id}`}
              className="text-sm font-semibold text-gray-900 hover:text-orange-500 transition-colors"
            >
              {username}
            </Link>
            <p className="text-sm text-gray-700 mt-0.5 break-words whitespace-pre-wrap">
              {comment.body}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 ml-1">
            <span className="text-xs text-gray-400">
              {formatDate(comment.created_at)}
            </span>
            {currentUserId && depth < 2 && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-xs font-semibold text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" />
                Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReply && currentUserId && (
            <div className="mt-2">
              <CommentInput
                plateId={plateId}
                parentId={comment.id}
                placeholder={`Reply to ${username}…`}
                autoFocus
                onDone={() => setShowReply(false)}
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="border-l-2 border-gray-100 pl-1">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  plateId={plateId}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({
  plateId,
  comments,
  currentUserId,
}: CommentSectionProps) {
  // Build tree: top-level comments with nested replies
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);

  const tree: Comment[] = topLevel.map((c) => ({
    ...c,
    replies: replies
      .filter((r) => r.parent_id === c.id)
      .map((r) => ({
        ...r,
        replies: replies.filter((rr) => rr.parent_id === r.id),
      })),
  }));

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold text-gray-900">
          Comments ({comments.length})
        </h2>
      </div>

      {currentUserId ? (
        <CommentInput plateId={plateId} placeholder="Write a comment… (Enter to post)" />
      ) : (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center text-sm text-gray-500">
          <Link href="/auth/login" className="font-semibold text-orange-500 hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment
        </div>
      )}

      <div className="mt-4 divide-y divide-gray-50">
        {tree.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            No comments yet. Be the first!
          </p>
        ) : (
          tree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              plateId={plateId}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </section>
  );
}
