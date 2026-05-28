"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, Send, Trash2, CornerDownRight, Heart } from "lucide-react";
import { addComment, deleteComment } from "@/app/actions/comments";
import { toggleCommentLike } from "@/app/actions/commentLikes";
import { Comment } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import AuthGateModal from "@/components/AuthGateModal";

type CommentSectionProps = {
  plateId: string;
  comments: Comment[];
  currentUserId: string | null;
};

function Avatar({ username, avatarUrl }: { username: string; avatarUrl?: string | null }) {
  return (
    <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 shadow-sm">
      {avatarUrl ? (
        <Image src={avatarUrl} alt={username} width={32} height={32} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{username[0].toUpperCase()}</span>
        </div>
      )}
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
  const MAX = 1000;

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
          maxLength={MAX}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          className="w-full bg-surface-1 border border-app-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-app placeholder-faint"
        />
        <div className="flex items-center justify-between mt-1">
          {error ? <p className="text-red-500 text-xs">{error}</p> : <span />}
          <span className={`text-xs ${body.length > MAX * 0.9 ? "text-orange-400" : "text-faintest"}`}>
            {body.length}/{MAX}
          </span>
        </div>
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
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count ?? 0);

  const isOwn = currentUserId === comment.user_id;
  const username = comment.profiles?.username ?? "User";
  const avatarUrl = comment.profiles?.avatar_url ?? null;

  function handleDelete() {
    startTransition(async () => {
      await deleteComment(comment.id, plateId);
    });
  }

  function handleLike() {
    if (!currentUserId) return;
    startTransition(async () => {
      const result = await toggleCommentLike(comment.id, plateId);
      if (!result?.error && result.liked !== undefined) {
        const isLiked = result.liked;
        setLiked(isLiked);
        setLikeCount((c: number) => isLiked ? c + 1 : Math.max(0, c - 1));
      }
    });
  }

  return (
    <div className={depth > 0 ? "ml-10 mt-3" : "mt-4"}>
      <div className="flex gap-3 group">
        <Link href={`/profile/${comment.user_id}`}>
          <Avatar username={username} avatarUrl={avatarUrl} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-surface-1 rounded-2xl px-4 py-2.5 inline-block max-w-full">
            <Link
              href={`/profile/${comment.user_id}`}
              className="text-sm font-semibold text-app hover:text-orange-400 transition-colors"
            >
              {username}
            </Link>
            <p className="text-sm text-muted mt-0.5 break-words whitespace-pre-wrap">
              {comment.body.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) =>
                /^@[a-zA-Z0-9_]+$/.test(part) ? (
                  <Link
                    key={i}
                    href={`/search?q=${part.slice(1)}`}
                    className="text-orange-500 font-semibold hover:underline"
                  >
                    {part}
                  </Link>
                ) : (
                  part
                )
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 ml-1">
            <span className="text-xs text-faintest">
              {formatDate(comment.created_at)}
            </span>
            {currentUserId && (
              <button
                onClick={handleLike}
                disabled={isPending}
                className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                  liked ? "text-rose-400" : "text-faintest hover:text-rose-400"
                }`}
              >
                <Heart className={`w-3 h-3 ${liked ? "fill-rose-500" : ""}`} />
                {likeCount > 0 && likeCount}
              </button>
            )}
            {currentUserId && depth < 2 && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-xs font-semibold text-faintest hover:text-orange-400 transition-colors flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" />
                Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs font-semibold text-faintest hover:text-red-400 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
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
            <div className="border-l-2 border-app-1 pl-1">
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

function GuestCommentBanner() {
  const [showGate, setShowGate] = useState(false);
  return (
    <>
      {showGate && <AuthGateModal action="comment" onClose={() => setShowGate(false)} />}
      <button
        onClick={() => setShowGate(true)}
        className="w-full bg-surface-1 border border-app-1 rounded-2xl px-4 py-3 text-left text-sm text-faint hover:border-orange-500/30 hover:text-muted transition-all flex items-center gap-3"
      >
        <MessageSquare className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <span>Sign up free to join the conversation…</span>
        <span className="ml-auto text-xs font-bold text-orange-400">Join Free →</span>
      </button>
    </>
  );
}

export default function CommentSection({
  plateId,
  comments: initialComments,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const buildTree = useCallback((flat: Comment[]): Comment[] => {
    const topLevel = flat.filter((c) => !c.parent_id);
    const replies = flat.filter((c) => c.parent_id);
    return topLevel.map((c) => ({
      ...c,
      replies: replies
        .filter((r) => r.parent_id === c.id)
        .map((r) => ({ ...r, replies: replies.filter((rr) => rr.parent_id === r.id) })),
    }));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${plateId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `plate_id=eq.${plateId}` },
        async (payload) => {
          // Fetch the full comment row with profile join
          const { data } = await supabase
            .from("comments")
            .select("*, profiles(id, username, avatar_url)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setComments((prev) => {
              // Avoid duplicates (server action already adds it via revalidatePath sometimes)
              if (prev.some((c) => c.id === data.id)) return prev;
              return [...prev, data as Comment];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments", filter: `plate_id=eq.${plateId}` },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [plateId]);

  const tree = buildTree(comments);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-orange-400" />
        <h2 className="text-lg font-bold text-app">
          Comments ({comments.length})
        </h2>
      </div>

      {currentUserId ? (
        <CommentInput plateId={plateId} placeholder="Write a comment… (Enter to post)" />
      ) : (
        <GuestCommentBanner />
      )}

      <div className="mt-4 divide-y divide-[var(--border-1)]">
        {tree.length === 0 ? (
          <p className="text-sm text-faintest py-6 text-center">
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
